from fastapi import APIRouter, HTTPException
from app.db.client import get_db

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("")
async def list_skills():
    db = get_db()
    cursor = db.skills.find({})
    docs = await cursor.sort("sort_order", 1).to_list(None)
    return [_normalise(d) for d in docs]


@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    db = get_db()
    doc = await db.skills.find_one({"_id": skill_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Skill not found")
    return _normalise(doc)


@router.get("/{skill_id}/classes")
async def list_classes(skill_id: str):
    db = get_db()
    cursor = db.ilms.find({"skill_id": skill_id})
    docs = await cursor.sort("sort_order", 1).to_list(None)
    return [_normalise(d) for d in docs]


@router.get("/{skill_id}/classes/{ilm_id}")
async def get_class(skill_id: str, ilm_id: str):
    db = get_db()
    doc = await db.ilms.find_one({"_id": ilm_id, "skill_id": skill_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Class not found")
    return _normalise(doc)


def _normalise(doc: dict) -> dict:
    """Expose _id as id so callers don't need to know about MongoDB internals."""
    if "_id" in doc:
        doc = {**doc, "id": str(doc.pop("_id"))}
    return doc
