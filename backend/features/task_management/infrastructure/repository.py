from uuid import UUID
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from .orm import TaskModel, SubjectModel
from ..domain.models import TaskCreate, SubjectCreate

class SubjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_subject(self, user_id: UUID, subject_data: SubjectCreate) -> SubjectModel:
        subject = SubjectModel(user_id=user_id, **subject_data.model_dump())
        self.session.add(subject)
        await self.session.commit()
        await self.session.refresh(subject)
        return subject

    async def get_subjects(self, user_id: UUID) -> List[SubjectModel]:
        stmt = select(SubjectModel).where(SubjectModel.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_subject_by_id(self, subject_id: UUID, user_id: UUID) -> Optional[SubjectModel]:
        stmt = select(SubjectModel).where(SubjectModel.id == subject_id, SubjectModel.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def delete_subject(self, subject: SubjectModel) -> None:
        await self.session.delete(subject)
        await self.session.commit()


class TaskRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_task(self, user_id: UUID, task_data: TaskCreate) -> TaskModel:
        task = TaskModel(user_id=user_id, **task_data.model_dump())
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def get_tasks(
        self, 
        user_id: UUID, 
        start_date: Optional[datetime] = None, 
        end_date: Optional[datetime] = None
    ) -> List[TaskModel]:
        stmt = select(TaskModel).where(
            TaskModel.user_id == user_id,
            TaskModel.is_deleted == False
        ).options(selectinload(TaskModel.category), selectinload(TaskModel.subject))
        
        # Calendar View filtering: task overlaps with the requested date range
        if start_date and end_date:
            stmt = stmt.where(
                and_(
                    TaskModel.planned_start < end_date,
                    TaskModel.planned_end > start_date
                )
            )
            
        stmt = stmt.order_by(TaskModel.planned_start)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_task_by_id(self, task_id: UUID, user_id: UUID) -> Optional[TaskModel]:
        stmt = select(TaskModel).where(
            TaskModel.id == task_id, 
            TaskModel.user_id == user_id,
            TaskModel.is_deleted == False
        ).options(selectinload(TaskModel.category), selectinload(TaskModel.subject))
        
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_tasks_by_subject(self, subject_id: UUID, user_id: UUID) -> List[TaskModel]:
        stmt = select(TaskModel).where(
            TaskModel.subject_id == subject_id,
            TaskModel.user_id == user_id,
            TaskModel.is_deleted == False
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_task(self, task: TaskModel, update_data: dict) -> TaskModel:
        for key, value in update_data.items():
            setattr(task, key, value)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def soft_delete_task(self, task: TaskModel) -> None:
        task.is_deleted = True
        await self.session.commit()
