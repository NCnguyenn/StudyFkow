from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .orm import UserModel

class UserRepository:
    @staticmethod
    async def get_by_email(email: str, db: AsyncSession) -> Optional[UserModel]:
        stmt = select(UserModel).where(UserModel.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(user: UserModel, db: AsyncSession) -> UserModel:
        db.add(user)
        await db.flush()
        return user
