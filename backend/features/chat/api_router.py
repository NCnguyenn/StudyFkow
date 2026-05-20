"""
Chat feature — API router.

POST /chat/ask — Query the Second Brain RAG pipeline.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.features.user_auth.api.dependencies import get_current_user
from .rag_service import ask_second_brain

router = APIRouter(prefix="/chat", tags=["Chat"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatAskRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="The question to ask the Second Brain.")


class ChatAskResponse(BaseModel):
    answer: str
    success: bool = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/ask", response_model=ChatAskResponse)
async def ask_chat(
    body: ChatAskRequest,
    current_user=Depends(get_current_user),
) -> ChatAskResponse:
    """
    Query the Second Brain. The RAG pipeline retrieves relevant note
    chunks scoped to the authenticated user and generates a grounded answer.
    """
    answer = await ask_second_brain(
        user_id=str(current_user.user_id),
        query=body.query,
    )
    return ChatAskResponse(answer=answer)
