# backend/expenses/views.py
import os
import json
from datetime import date

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Sum
from django.db.models.functions import TruncMonth

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from openai import OpenAI

from .models import Group, GroupMember, Expense, ExpenseShare, Settlement
from .serializers import (
    GroupSerializer,
    ExpenseSerializer,
    SettlementSerializer,
    SimpleUserSerializer,
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@api_view(["POST"])
@permission_classes([AllowAny])  # you can switch to IsAuthenticated later
def parse_expense_text(request):
    """
    POST /api/parse-expense-text/
    Body:
    {
      "text": "Prashant paid 1500 for dinner yesterday split between all",
      "group_id": 1,
      "members": ["Prashant", "Prajwal", "Amit"]
    }

    Returns:
    {
      "payer_name": "Prashant",
      "amount": 1500,
      "description": "dinner",
      "date": "2026-02-26",
      "participants": ["Prashant", "Prajwal", "Amit"],
      "split_type": "equal"
    }
    """
    text = request.data.get("text", "").strip()
    group_id = request.data.get("group_id")
    members = request.data.get("members") or []

    if not text or not group_id:
        return Response(
            {"detail": "text and group_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return Response(
            {"detail": "Group not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Optional: derive members from DB instead of trusting client
    if not members:
        members = list(
            GroupMember.objects.filter(group=group)
            .select_related("user")
            .values_list("user__username", flat=True)
        )

    today_str = date.today().isoformat()

    system_prompt = (
        "You extract ONE group expense from natural language text.\n"
        "You MUST return valid JSON only, no comments or extra text.\n"
        "Fields:\n"
        "- payer_name: name of the person who paid (string, must be one of group members if possible).\n"
        "- amount: total amount paid (number).\n"
        "- description: short description (string).\n"
        "- date: ISO date YYYY-MM-DD (string). "
        f"If user says 'yesterday', 'today', etc, resolve relative to today: {today_str}.\n"
        "- participants: array of names from group members that share this expense. "
        "If user says 'all', use all members.\n"
        "- split_type: 'equal' or 'exact'. Assume 'equal' unless user specifies exact shares.\n"
        "If something is missing, make a reasonable guess.\n"
        "Group members: " + ", ".join(members)
    )

    user_content = f'Text: "{text}"'

    try:
        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "expense",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "payer_name": {"type": "string"},
                            "amount": {"type": "number"},
                            "description": {"type": "string"},
                            "date": {"type": "string"},
                            "participants": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "split_type": {
                                "type": "string",
                                "enum": ["equal", "exact"],
                            },
                        },
                        "required": [
                            "payer_name",
                            "amount",
                            "description",
                            "date",
                            "participants",
                            "split_type",
                        ],
                        "additionalProperties": False,
                    },
                    "strict": True,
                },
            },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )

        raw = completion.choices[0].message.content
        parsed = json.loads(raw)
    except Exception as e:
        print("OpenAI error:", e)
        return Response(
            {"detail": "Failed to parse text with AI."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        payer_name = str(parsed.get("payer_name", "")).strip()
        amount = float(parsed.get("amount", 0))
        description = str(parsed.get("description", "")).strip()
        parsed_date = str(parsed.get("date", today_str)).strip()
        participants = parsed.get("participants") or []
        split_type = parsed.get("split_type", "equal")

        if not payer_name or amount <= 0 or not description:
            raise ValueError("Missing required fields")

        result = {
            "payer_name": payer_name,
            "amount": amount,
            "description": description,
            "date": parsed_date,
            "participants": participants,
            "split_type": split_type,
        }

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        print("Parsing error:", e)
        return Response(
            {"detail": "AI returned invalid data."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("-created_at")
    serializer_class = GroupSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # For now, just use the first user as creator (later: real auth)
        try:
            print(">>> FRONTEND SENT (GROUP):", self.request.data)

            user = User.objects.first()
            if user is None:
                user = User.objects.create_user(username="demo")

            group = serializer.save(created_by=user)
            GroupMember.objects.create(group=group, user=user)

            print(">>> CREATED GROUP:", group.id, group.name)
        except Exception as e:
            print(f"Error creating group: {e}")
            raise

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """
        Return the list of users who are members of this group.
        Used by frontend to show friend names and balances.
        """
        group = self.get_object()
        members = GroupMember.objects.filter(group=group).select_related("user")
        users = [gm.user for gm in members]
        serializer = SimpleUserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """
        Add a friend (user) to this group by username.
        - If user doesn't exist, create it.
        - If user exists, just link to this group.
        - If already in this group, return 400 with message.
        """
        group = self.get_object()
        username = request.data.get("username", "").strip()

        if not username:
            return Response(
                {"detail": "username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = User.objects.get_or_create(username=username)

        gm_exists = GroupMember.objects.filter(group=group, user=user).exists()
        if gm_exists:
            return Response(
                {"detail": "This member is already in the group."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        GroupMember.objects.create(group=group, user=user)

        serializer = SimpleUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def rename_member(self, request, pk=None):
        """
        Rename a member in this group.

        Body:
        {
          "old_username": "demo",
          "new_username": "Praju"
        }

        Rules:
        - Both fields required
        - If new_username is already taken by another user -> 400
        - If member not in this group -> 404
        """
        group = self.get_object()
        old_username = request.data.get("old_username", "").strip()
        new_username = request.data.get("new_username", "").strip()

        if not old_username or not new_username:
            return Response(
                {"detail": "old_username and new_username are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if old_username == new_username:
            return Response(
                {"detail": "New name is the same as the old name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if another user already has this username
        if User.objects.filter(username=new_username).exclude(
            username=old_username
        ).exists():
            return Response(
                {"detail": "That name is already used. Choose a different name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            gm = GroupMember.objects.select_related("user").get(
                group=group, user__username=old_username
            )
        except GroupMember.DoesNotExist:
            return Response(
                {"detail": "Member not found in this group"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = gm.user
        user.username = new_username
        try:
            user.save()
        except IntegrityError:
            # Safety net in case of race condition
            return Response(
                {"detail": "That name is already used. Choose a different name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SimpleUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-created_at")
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Frontend sends:
        {
          group: <group_id>,
          description: "...",
          amount: 1200,
          category: "Food",
          date: "2026-02-19",
          paid_by_name: "Pars"
        }
        """
        try:
            print(">>> FRONTEND SENT (EXPENSE):", self.request.data)

            paid_by_name = self.request.data.get("paid_by_name") or "demo"
            paid_by_user, _ = User.objects.get_or_create(username=paid_by_name)

            # Save with correct payer; category/date come from serializer data
            expense = serializer.save(paid_by=paid_by_user)

            # Simple equal split among all group members
            members = GroupMember.objects.filter(group=expense.group)
            count = members.count() or 1
            share = expense.amount / count

            for gm in members:
                ExpenseShare.objects.create(
                    expense=expense,
                    user=gm.user,
                    amount=share,
                )

            print(
                ">>> CREATED EXPENSE:",
                expense.id,
                expense.description,
                "amount=",
                expense.amount,
                "category=",
                expense.category,
                "date=",
                expense.date,
                "paid_by=",
                expense.paid_by.username,
            )
        except Exception as e:
            print(f"Error creating expense: {e}")
            raise

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        """
        GET /api/expenses/analytics/?group=<group_id>

        Returns:
        {
          "per_member": [{ "name": "...", "total": 123 }, ...],
          "per_category": [{ "category": "...", "total": 123 }, ...],
          "per_month": [{ "month": "2026-02", "total": 123 }, ...]
        }
        """
        group_id = request.query_params.get("group")
        if not group_id:
            return Response(
                {"detail": "group query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Expense.objects.filter(group_id=group_id)

        # 1) total spent per member (payer)
        per_member = (
            qs.values("paid_by__username")
            .annotate(total=Sum("amount"))
            .order_by("paid_by__username")
        )
        per_member_data = [
            {"name": row["paid_by__username"] or "Unknown", "total": row["total"]}
            for row in per_member
        ]

        # 2) category breakdown
        per_category = (
            qs.values("category")
            .annotate(total=Sum("amount"))
            .order_by("category")
        )
        per_category_data = [
            {"category": row["category"] or "Uncategorized", "total": row["total"]}
            for row in per_category
        ]

        # 3) monthly spend (based on date field; fallback to created_at)
        date_field = "date"
        if not qs.exclude(date__isnull=True).exists():
            date_field = "created_at"

        per_month = (
            qs.annotate(month=TruncMonth(date_field))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )
        per_month_data = [
            {"month": row["month"].strftime("%Y-%m"), "total": row["total"]}
            for row in per_month
            if row["month"] is not None
        ]

        return Response(
            {
                "per_member": per_member_data,
                "per_category": per_category_data,
                "per_month": per_month_data,
            },
            status=status.HTTP_200_OK,
        )


class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all().order_by("-created_at")
    serializer_class = SettlementSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Create a settlement between two real users based on from_name / to_name
        sent by the frontend.
        """
        try:
            print(">>> FRONTEND SENT (SETTLEMENT):", self.request.data)

            from_name = self.request.data.get("from_name", "").strip()
            to_name = self.request.data.get("to_name", "").strip()

            if not from_name or not to_name:
                raise ValueError("from_name and to_name are required")

            from_user, _ = User.objects.get_or_create(username=from_name)
            to_user, _ = User.objects.get_or_create(username=to_name)

            settlement = serializer.save(from_user=from_user, to_user=to_user)

            print(
                ">>> CREATED SETTLEMENT:",
                settlement.id,
                settlement.from_user.username,
                "paid",
                settlement.to_user.username,
                "amount=",
                settlement.amount,
            )
        except Exception as e:
            print(f"Error creating settlement: {e}")
            raise
