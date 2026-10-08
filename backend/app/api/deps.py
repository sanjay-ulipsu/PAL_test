from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.core.security import decode_token
from app.db.client import get_db

_bearer = HTTPBearer()

_DEMO_USER = {
    "_id": "demo-user",
    "display_name": "Demo Student",
    "email": "demo@pal.app",
    "yol": 1,
}


async def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    token = credentials.credentials

    # POC demo shortcut — no DB lookup required
    if token == "demo-jwt-token":
        return _DEMO_USER

    try:
        user_id = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    db = get_db()
    user = await db.student_profiles.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
