"""study_sessions — public contract surface.

Only `router` is exported. Internal domain models and services are NOT
part of the public API of this slice and must NOT be imported directly
by other features. Go through the router or the service interface.
"""
from .api.router import router

__all__ = ["router"]
