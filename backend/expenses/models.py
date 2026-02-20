from django.db import models
from django.contrib.auth.models import User


class Group(models.Model):
    """Represents a group of people who share expenses."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    """Members of a group."""
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"


class Expense(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    # NEW FIELDS
    category = models.CharField(max_length=50, blank=True)  # e.g. Food, Travel
    date = models.DateField(null=True, blank=True)

    paid_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class ExpenseShare(models.Model):
    """Represents how an expense is shared among users."""
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('expense', 'user')

    def __str__(self):
        return f"{self.user.username} owes ${self.amount} for {self.expense.description}"

class Settlement(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="settlements_from"
    )
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="settlements_to"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.CharField(max_length=200, blank=True)  # <-- ADD THIS
    created_at = models.DateTimeField(auto_now_add=True)