from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict
from fastapi import HTTPException, status
from ..domain.models import TaskCreate, TaskUpdate, TaskRead, SubjectCreate, SubjectRead
from ..infrastructure.repository import TaskRepository, SubjectRepository

class SubjectService:
    def __init__(self, repository: SubjectRepository, task_repository: TaskRepository):
        self.repository = repository
        self.task_repository = task_repository

    async def create_subject(self, user_id: UUID, subject_create: SubjectCreate) -> SubjectRead:
        subject = await self.repository.create_subject(user_id, subject_create)
        return SubjectRead.model_validate(subject)

    async def list_subjects(self, user_id: UUID) -> List[SubjectRead]:
        subjects = await self.repository.get_subjects(user_id)
        return [SubjectRead.model_validate(s) for s in subjects]

    async def delete_subject(self, subject_id: UUID, user_id: UUID) -> None:
        subject = await self.repository.get_subject_by_id(subject_id, user_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        await self.repository.delete_subject(subject)

    async def get_subject_analytics(self, subject_id: UUID, user_id: UUID) -> dict:
        subject = await self.repository.get_subject_by_id(subject_id, user_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
            
        tasks = await self.task_repository.get_tasks_by_subject(subject_id, user_id)
        
        total_actual_minutes = 0
        completed_tasks_count = 0
        on_time_tasks_count = 0
        
        for task in tasks:
            if task.task_status == 'COMPLETED':
                completed_tasks_count += 1
                if task.completion_status == 'ON_TIME':
                    on_time_tasks_count += 1
                
                # Calculate duration in minutes (ensure datetimes are naive/aware appropriately)
                duration = (task.planned_end - task.planned_start).total_seconds() / 60
                overtime = task.overtime_buffer_minutes or 0
                total_actual_minutes += (duration + overtime)
                
        on_time_rate = (on_time_tasks_count / completed_tasks_count * 100) if completed_tasks_count > 0 else 0
        
        return {
            "total_actual_minutes": int(total_actual_minutes),
            "on_time_completion_rate": round(on_time_rate, 2),
            "total_closed_tasks": completed_tasks_count
        }

class TaskService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    async def create_task(self, user_id: UUID, task_create: TaskCreate) -> TaskRead:
        task = await self.repository.create_task(user_id, task_create)
        return TaskRead.model_validate(task)

    async def list_tasks(
        self, 
        user_id: UUID, 
        start_date: Optional[datetime] = None, 
        end_date: Optional[datetime] = None
    ) -> List[TaskRead]:
        if start_date and end_date and start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="start_date must be strictly before end_date"
            )
            
        tasks = await self.repository.get_tasks(user_id, start_date, end_date)
        return [TaskRead.model_validate(task) for task in tasks]

    async def get_task(self, task_id: UUID, user_id: UUID) -> TaskRead:
        task = await self.repository.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return TaskRead.model_validate(task)

    async def update_task(self, task_id: UUID, user_id: UUID, task_update: TaskUpdate) -> TaskRead:
        task = await self.repository.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        update_data = task_update.model_dump(exclude_unset=True)
        
        planned_start = update_data.get("planned_start", task.planned_start)
        planned_end = update_data.get("planned_end", task.planned_end)
        
        if planned_end <= planned_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="planned_end must be strictly greater than planned_start"
            )
            
        updated_task = await self.repository.update_task(task, update_data)
        return TaskRead.model_validate(updated_task)

    async def update_task_state(self, task_id: UUID, user_id: UUID, new_status: str, failed_reason: Optional[str] = None) -> TaskRead:
        task = await self.repository.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        allowed_transitions = {
            'PENDING': ['IN_PROGRESS'],
            'IN_PROGRESS': ['USING_OVERTIME', 'COMPLETED', 'FAILED'],
            'USING_OVERTIME': ['COMPLETED', 'FAILED'],
            'FAILED': [],
            'COMPLETED': []
        }
        
        if new_status not in allowed_transitions.get(task.task_status, []) and task.task_status != new_status:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot transition from {task.task_status} to {new_status}")
            
        update_data = {"task_status": new_status}
        if new_status == 'FAILED' and failed_reason:
            update_data["failed_reason"] = failed_reason
            
        updated_task = await self.repository.update_task(task, update_data)
        return TaskRead.model_validate(updated_task)

    async def rollover_failed_task(self, task_id: UUID, target_date: datetime, user_id: UUID) -> TaskRead:
        task = await self.repository.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        if task.task_status != 'FAILED':
            # Mark it failed implicitly if doing a rollover
            await self.repository.update_task(task, {"task_status": "FAILED", "failed_reason": "Rolled over to new date"})
            
        # Extract unfinished subtasks
        subtasks = task.subtasks or []
        unfinished_subtasks = [st for st in subtasks if not st.get('is_completed', False)]
        
        # Calculate new time bounds maintaining original duration
        duration = task.planned_end - task.planned_start
        new_start = target_date
        new_end = target_date + duration
        
        # Create new task
        new_task_create = TaskCreate(
            title=f"{task.title} (Rollover)",
            description=task.description,
            category_id=task.category_id,
            subject_id=task.subject_id,
            subtasks=unfinished_subtasks,
            recurrence_rule=None,  # Reset recurrence for rollover
            overtime_buffer_minutes=task.overtime_buffer_minutes,
            color_code=task.color_code,
            planned_start=new_start,
            planned_end=new_end,
            priority=task.priority,
            status="PENDING",
            task_status="PENDING"
        )
        
        new_task = await self.repository.create_task(user_id, new_task_create)
        return TaskRead.model_validate(new_task)

    async def delete_task(self, task_id: UUID, user_id: UUID) -> None:
        task = await self.repository.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        await self.repository.soft_delete_task(task)
