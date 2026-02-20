# backend/expenses/views.py
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Group, GroupMember, Expense, ExpenseShare, Settlement
from .serializers import (
    GroupSerializer,
    ExpenseSerializer,
    SettlementSerializer,
    SimpleUserSerializer,
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
        If user doesn't exist, create it.
        """
        group = self.get_object()
        username = request.data.get("username", "").strip()
        if not username:
            return Response(
                {"detail": "username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _created = User.objects.get_or_create(username=username)
        GroupMember.objects.get_or_create(group=group, user=user)

        serializer = SimpleUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def rename_member(self, request, pk=None):
        """
        Rename a member in this group.
        Body: { "old_username": "demo", "new_username": "Praju" }
        """
        group = self.get_object()
        old_username = request.data.get("old_username", "").strip()
        new_username = request.data.get("new_username", "").strip()

        if not old_username or not new_username:
            return Response(
                {"detail": "old_username and new_username are required"},
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
        user.save()

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
