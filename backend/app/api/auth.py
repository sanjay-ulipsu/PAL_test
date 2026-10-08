"""
Auth API — register, login, logout, onboard, profile
"""
from __future__ import annotations

import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.client import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import current_user
from app.models.schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    OnboardRequest, ProfileResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ─── POST /auth/register ──────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest):
    db = get_db()
    existing = await db.student_profiles.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())
    await db.student_profiles.insert_one({
        "_id": user_id,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "display_name": body.display_name or body.email.split("@")[0],
        "handle": None,
        "yol": 1,
        "content_focus": "global",
        "avatar_url": None,
        "selected_skill_ids": [],
        "onboarded": False,
    })

    token = create_access_token(subject=user_id)
    return TokenResponse(access_token=token, token_type="bearer")


# ─── POST /auth/login ─────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db.student_profiles.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=user["_id"])
    return TokenResponse(access_token=token, token_type="bearer")


# ─── POST /auth/logout ────────────────────────────────────────────────────────

@router.post("/logout", status_code=204)
async def logout():
    # JWT is stateless — client discards the token
    return None


# ─── POST /auth/onboard ───────────────────────────────────────────────────────

@router.post("/onboard", response_model=ProfileResponse)
async def onboard(body: OnboardRequest, user: dict = Depends(current_user)):
    db = get_db()

    if body.handle:
        conflict = await db.student_profiles.find_one({"handle": body.handle, "_id": {"$ne": user["_id"]}})
        if conflict:
            raise HTTPException(status_code=409, detail="Handle already taken")

    update: dict = {"onboarded": True}
    if body.handle:
        update["handle"] = body.handle
    if body.display_name:
        update["display_name"] = body.display_name
    if body.selected_skill_ids is not None:
        update["selected_skill_ids"] = body.selected_skill_ids[:1]  # max 1 in POC

    await db.student_profiles.update_one({"_id": user["_id"]}, {"$set": update})
    updated = await db.student_profiles.find_one({"_id": user["_id"]})
    return _to_profile_response(updated)


# ─── GET /profile/me ──────────────────────────────────────────────────────────

profile_router = APIRouter(prefix="/profile", tags=["profile"])


@profile_router.get("/me", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(current_user)):
    return _to_profile_response(user)


# ─── GET /profile/rank-progress ───────────────────────────────────────────────

@profile_router.get("/rank-progress")
async def get_rank_progress(
    ilm_ids: Optional[str] = Query(None, description="Comma-separated ILM IDs to filter"),
    user: dict = Depends(current_user),
):
    """
    Return rank progress for the authenticated student.
    Response: { ilm_id: [unlocked_rank, ...] }
    """
    db = get_db()
    query: dict = {"student_id": user["_id"], "unlocked": True}
    if ilm_ids:
        ids = [i.strip() for i in ilm_ids.split(",") if i.strip()]
        if ids:
            query["ilm_id"] = {"$in": ids}

    cursor = db.rank_progress.find(query, {"ilm_id": 1, "rank": 1, "best_score": 1, "_id": 0})
    docs = await cursor.to_list(None)

    result: dict[str, list[str]] = {}
    for doc in docs:
        ilm_id = doc["ilm_id"]
        if ilm_id not in result:
            result[ilm_id] = []
        result[ilm_id].append(doc["rank"])
    return result


# ─── Helper ───────────────────────────────────────────────────────────────────

def _to_profile_response(user: dict) -> ProfileResponse:
    return ProfileResponse(
        id=user["_id"],
        email=user.get("email", ""),
        display_name=user.get("display_name", ""),
        handle=user.get("handle"),
        yol=user.get("yol", 1),
        content_focus=user.get("content_focus", "global"),
        avatar_url=user.get("avatar_url"),
        selected_skill_ids=user.get("selected_skill_ids", []),
        onboarded=user.get("onboarded", False),
    )
