"""
Seed script: populates `skills` and `ilms` collections from kidsbot.questions data.
Run once: python seed_db.py
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "pal2")

SKILLS = [
    {
        "_id": "skill-fe",
        "code": "FE",
        "name": "Finance & Entrepreneurship",
        "description": "Business, Money & Entrepreneurial Thinking",
        "icon_url": None,
        "theme_code": "amber",
        "is_global": True,
        "active": True,
        "sort_order": 1,
    },
]

# L2 FE ILMs sourced from kidsbot.questions theme codes
ILMS = [
    {
        "_id": "L2FE15",
        "ilm_id": "L2FE15",
        "ilm_code": "FE-215",
        "skill_id": "skill-fe",
        "title": "Budgeting & Saving",
        "topic": "Budgeting, Needs vs Wants, Saving Money",
        "learning_outcome": "Understand how to plan spending, distinguish needs from wants, and develop saving habits",
        "project_detail": "Create a personal budget plan and identify saving opportunities",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 1,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 1,
    },
    {
        "_id": "L2FE16",
        "ilm_id": "L2FE16",
        "ilm_code": "FE-216",
        "skill_id": "skill-fe",
        "title": "Entrepreneurship Basics",
        "topic": "Entrepreneurship, Business Ideas, Starting a Business",
        "learning_outcome": "Explore entrepreneurial thinking, identify business opportunities, and understand how businesses start",
        "project_detail": "Pitch a simple business idea and identify target customers",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 2,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 2,
    },
    {
        "_id": "L2FE17",
        "ilm_id": "L2FE17",
        "ilm_code": "FE-217",
        "skill_id": "skill-fe",
        "title": "Money Management",
        "topic": "Money Management, Financial Planning, Spending Wisely",
        "learning_outcome": "Learn to manage money responsibly through planning and mindful spending decisions",
        "project_detail": "Analyse a spending scenario and suggest improvements",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 3,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 3,
    },
    {
        "_id": "L2FE18",
        "ilm_id": "L2FE18",
        "ilm_code": "FE-218",
        "skill_id": "skill-fe",
        "title": "Growing Money",
        "topic": "Growing Money, Investment Basics, Financial Goals",
        "learning_outcome": "Understand basic investment concepts and how setting financial goals leads to wealth growth",
        "project_detail": "Set a financial goal and map out steps to achieve it",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 4,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 4,
    },
    {
        "_id": "L2FE19",
        "ilm_id": "L2FE19",
        "ilm_code": "FE-219",
        "skill_id": "skill-fe",
        "title": "Banking & Accounts",
        "topic": "Banking, Accounts, Financial Services",
        "learning_outcome": "Discover how banks work, the types of accounts available, and the range of financial services they offer",
        "project_detail": "Compare savings and current accounts and explain when to use each",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 5,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 5,
    },
    {
        "_id": "L2FE20",
        "ilm_id": "L2FE20",
        "ilm_code": "FE-220",
        "skill_id": "skill-fe",
        "title": "Markets & Economics",
        "topic": "Markets, Economics Basics, Supply and Demand",
        "learning_outcome": "Understand how markets work, the law of supply and demand, and the basics of economics",
        "project_detail": "Observe a real market and explain how supply/demand affects prices",
        "program_name": "PAL",
        "yol": 1,
        "level": 2,
        "ilm_number": 6,
        "theme_code": "amber",
        "is_global": True,
        "sort_order": 6,
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]

    # Skills
    for skill in SKILLS:
        await db.skills.replace_one({"_id": skill["_id"]}, skill, upsert=True)
        print(f"  Upserted skill: {skill['_id']}")

    # ILMs
    for ilm in ILMS:
        await db.ilms.replace_one({"_id": ilm["_id"]}, ilm, upsert=True)
        print(f"  Upserted ILM:   {ilm['_id']} — {ilm['title']}")

    # Verify question counts per theme
    print("\n  kidsbot.questions counts per FE theme:")
    for ilm in ILMS:
        theme = ilm["_id"]
        count = await db["kidsbot.questions"].count_documents({"theme": theme})
        tf = await db["kidsbot.questions"].count_documents({"theme": theme, "type": "true_false"})
        mcq = await db["kidsbot.questions"].count_documents({"theme": theme, "type": "mcq"})
        print(f"    {theme}: {count} total  (true_false={tf}, mcq={mcq})")

    client.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(seed())
