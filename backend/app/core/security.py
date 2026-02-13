from dataclasses import dataclass
from typing import Optional

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
    try:
        claims = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from e

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (missing sub)")

    return AuthedUser(user_id=user_id, email=claims.get("email"), claims=claims)
