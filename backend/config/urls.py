# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from expenses.views import GroupViewSet, ExpenseViewSet, SettlementViewSet

router = DefaultRouter()
router.register(r"groups", GroupViewSet, basename="group")
router.register(r"expenses", ExpenseViewSet, basename="expense")
router.register(r"settlements", SettlementViewSet, basename="settlement")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
]
