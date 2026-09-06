from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


# Cookie name used throughout all auth views
REFRESH_COOKIE = "refresh_token"


def _set_refresh_cookie(response, refresh_token: str) -> None:
    """Attach the refresh token as an HttpOnly cookie to the response."""
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,   # HTTPS-only in production
        samesite="Lax",
        path="/api/auth/",           # cookie is only sent to auth endpoints
    )


def _clear_refresh_cookie(response) -> None:
    """Remove the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path="/api/auth/",
        samesite="Lax",
    )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    Returns the access token in the JSON body.
    Sets the refresh token as an HttpOnly cookie.
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
        response = Response(
            {
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.get_full_name() or user.username,
                },
            },
            status=status.HTTP_200_OK,
        )
        _set_refresh_cookie(response, str(refresh))
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Reads refresh token from HttpOnly cookie, blacklists it, then clears the cookie.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
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
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response


class RefreshView(APIView):
    """
    POST /api/auth/refresh/
    Reads the refresh token from the HttpOnly cookie.
    Returns a new access token (and rotates the refresh cookie).
    """

    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {"error": "Refresh token não encontrado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(refresh_token)
            # With ROTATE_REFRESH_TOKENS=True, accessing .access_token
            # also generates a new refresh token and blacklists the old one.
            new_access = str(refresh.access_token)
            new_refresh = str(refresh)
        except TokenError:
            return Response(
                {"error": "Token inválido ou expirado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        response = Response({"access": new_access}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, new_refresh)
        return response


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
