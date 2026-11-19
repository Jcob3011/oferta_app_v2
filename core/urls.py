from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from offers import views, api_views

# Router automatycznie generujący ścieżki REST API dla naszych ViewSetów
router = DefaultRouter()
router.register(r'companies', api_views.CompanyViewSet, basename='api-company')
router.register(r'clients', api_views.ClientViewSet, basename='api-client')
router.register(r'sellers', api_views.SellerViewSet, basename='api-seller')
router.register(r'offers', api_views.OfferViewSet, basename='api-offer')
router.register(r'offer-items', api_views.OfferItemViewSet, basename='api-offeritem')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),

    # --- WIDOKI KLASYCZNE (HTML / Wersja 1.0) ---
    path('', views.home, name='root'),
    path('home/', views.home, name='home'),
    path('offers/', views.offer_list, name='offer_list'),
    path('offers/create/', views.offer_create, name='offer_create'),
    path('offers/<int:pk>/', views.offer_detail, name='offer_detail'),
    path('offers/<int:pk>/pdf/', views.offer_pdf, name='offer_pdf'),
    path('offers/<int:pk>/edit/', views.offer_edit, name='offer_edit'),
    path('offer/<int:pk>/status/<str:action>/', views.offer_change_status, name='offer_change_status'),
    path('offer/<int:pk>/reject/', views.offer_reject, name='offer_reject'),

    # --- REST API & JWT & SWAGGER (Wersja 2.0) ---
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
