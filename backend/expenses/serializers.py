# backend/expenses/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, GroupMember, Expense, ExpenseShare, Settlement


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class GroupSerializer(serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "description", "created_by", "created_at"]


class GroupMemberSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = GroupMember
        fields = ["id", "group", "user", "joined_at"]


class ExpenseShareSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = ExpenseShare
        fields = ["id", "expense", "user", "amount"]


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = SimpleUserSerializer(read_only=True)
    shares = ExpenseShareSerializer(many=True, read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "group",
            "description",
            "amount",
            "category",
            "date",
            "paid_by",
            "created_at",
            "shares",
        ]
        read_only_fields = ["id", "paid_by", "created_at", "shares"]


class SettlementSerializer(serializers.ModelSerializer):
    from_user = SimpleUserSerializer(read_only=True)
    to_user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = [
            "id",
            "group",
            "from_user",
            "to_user",
            "amount",
            "created_at",   # ONLY fields that really exist
        ]
        read_only_fields = ["id", "from_user", "to_user", "created_at"]
