from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_write_session
from ..infrastructure.repository import TaskRepository, SubjectRepository
from ..application.service import TaskService, SubjectService

def get_task_repository(session: AsyncSession = Depends(get_write_session)) -> TaskRepository:
    return TaskRepository(session=session)

def get_subject_repository(session: AsyncSession = Depends(get_write_session)) -> SubjectRepository:
    return SubjectRepository(session=session)

def get_task_service(repository: TaskRepository = Depends(get_task_repository)) -> TaskService:
    return TaskService(repository=repository)

def get_subject_service(
    repository: SubjectRepository = Depends(get_subject_repository),
    task_repository: TaskRepository = Depends(get_task_repository)
) -> SubjectService:
    return SubjectService(repository=repository, task_repository=task_repository)
