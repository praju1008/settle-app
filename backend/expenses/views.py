# backend/expenses/views.py
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Group, GroupMember, Expense, ExpenseShare, Settlement
from .serializers import (
    GroupSerializer,
    ExpenseSerializer,
    SettlementSerializer,
)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("-created_at")
    serializer_class = GroupSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # For now, just use the first user as creator (later: real auth)
        try:
            user = User.objects.first()
            if user is None:
                user = User.objects.create_user(username="demo")
            group = serializer.save(created_by=user)
            GroupMember.objects.create(group=group, user=user)
        except Exception as e:
            print(f"Error creating group: {e}")
            raise


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-created_at")
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        try:
            user = User.objects.first()
            if user is None:
                user = User.objects.create_user(username="demo")
            expense = serializer.save(paid_by=user)
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
        except Exception as e:
            print(f"Error creating expense: {e}")
            raise


class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all().order_by("-created_at")
    serializer_class = SettlementSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        try:
            user = User.objects.first()
            if user is None:
                user = User.objects.create_user(username="demo")
            # For now, demo user is "from_user"
            serializer.save(from_user=user)
        except Exception as e:
            print(f"Error creating settlement: {e}")
            raise
