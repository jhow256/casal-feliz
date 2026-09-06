from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }
    Returns access + refresh tokens or HTTP 401.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "Usuário e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"error": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.get_full_name() or user.username,
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { "refresh": "<refresh_token>" }
    Blacklists the refresh token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "O refresh token é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Token inválido ou já expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class RefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Thin wrapper around SimpleJWT's built-in refresh view.
    """


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns basic info about the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "name": user.get_full_name() or user.username,
            }
        )


class UsersView(APIView):
    """
    GET /api/auth/users/
    Returns all users — used to find the partner's name.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.contrib.auth.models import User
        users = User.objects.filter(is_active=True).values("id", "username", "first_name", "last_name")
        result = []
        for u in users:
            name = f"{u['first_name']} {u['last_name']}".strip() or u["username"]
            result.append({"id": u["id"], "username": u["username"], "name": name})
        return Response(result)
