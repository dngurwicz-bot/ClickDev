from dataclasses import dataclass
from typing import Optional

import httpx
from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from app.core.config import settings


@dataclass(frozen=True)
class AuthedUser:
    user_id: str
    email: Optional[str]
    claims: dict


def _bearer_token(req: Request) -> str:
    auth = req.headers.get("authorization") or ""
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return auth.split(" ", 1)[1].strip()


def verify_jwt(req: Request) -> AuthedUser:
    token = _bearer_token(req)
    if settings.supabase_jwt_secret:
        try:
            claims = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
        except JWTError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from e

        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (missing sub)")

        return AuthedUser(user_id=user_id, email=claims.get("email"), claims=claims)

    # Fallback: verify token by calling Supabase Auth API (works without local JWT secret).
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server auth is not configured (set SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY)",
        )

    url = f"{settings.supabase_url}/auth/v1/user"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "authorization": f"Bearer {token}",
    }
    try:
        r = httpx.get(url, headers=headers, timeout=10.0)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Auth verification failed") from e

    if r.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    data = r.json()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    claims = {"sub": user_id, "email": data.get("email"), "verified_via": "supabase_auth_api"}
    return AuthedUser(user_id=user_id, email=data.get("email"), claims=claims)
