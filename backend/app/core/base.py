from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models in the project."""
    __table_args__ = {"extend_existing": True}
