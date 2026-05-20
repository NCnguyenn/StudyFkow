import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from backend.app.core.base import Base
from backend.features.notes.infrastructure.models import NoteFolderModel, NoteModel, NoteLinkModel 

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/studyflow")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async def run_hotfix():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Executing schema hotfix: Syncing tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(run_hotfix())
