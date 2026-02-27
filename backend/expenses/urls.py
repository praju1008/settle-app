# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("expenses.urls")),  # exposes:
    # /api/groups/
    # /api/expenses/
    # /api/settlements/
    # /api/parse-expense-text/
]
