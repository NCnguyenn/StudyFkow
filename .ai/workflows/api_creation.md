# 🔌 AI StudyFlow — API Creation Workflow

> **Canonical Authority:** This document defines the exact sequence for creating a new API
> endpoint in AI StudyFlow. Every new endpoint MUST follow this workflow.
> Endpoints created outside this workflow are architecture violations.

---

## 1. PRE-CREATION CHECKLIST

- [ ] The endpoint belongs to a clearly identified feature domain.
- [ ] The endpoint follows a pattern that does NOT already exist (no duplicate endpoints).
- [ ] The HTTP method and path are consistent with REST conventions in `api_contracts.md`.
- [ ] Authentication requirement is determined (protected or public).
- [ ] Rate limiting tier is determined (per `api_contracts.md` §8).

---

## 2. MANDATORY EXECUTION SEQUENCE

### Step 1 — Contract-First Design

**Before writing any code**, document the endpoint in `backend/docs/API_CONTRACTS.md` with `[DRAFT]` status:

```markdown
### `POST /decks/{deck_id}/quiz` [DRAFT]
**Purpose:** Generate a quiz from deck flashcards.
**Auth:** Required.
**Request:**
{
  "question_count": 10,
  "difficulty": "adaptive"
}
**Response 202:** { "task_id": "...", "status": "queued" }
**Errors:** 400 validation, 403 not owner, 422 deck has fewer than question_count cards
```

**WHY first:** The contract drives the Pydantic models. The Pydantic models drive the service interface. The implementation is last. Reversing this order creates contracts that are retrofitted to implementations — they are always wrong.

---

### Step 2 — Pydantic Request/Response Models

Create the models in `features/<slug>/domain/models.py`:

```python
# Request — validates incoming payload
class QuizGenerateRequest(BaseModel):
    question_count: int = Field(..., ge=1, le=50)
    difficulty: Literal["easy", "medium", "hard", "adaptive"] = "adaptive"

# Response — defines what the API returns
class QuizGenerateResponse(BaseModel):
    task_id: str
    status: Literal["queued"] = "queued"
    estimated_completion_seconds: int = 15
    poll_url: str

# Internal domain model — used between service and repository
class QuizGenerateCommand(BaseModel):
    deck_id: UUID
    user_id: UUID
    question_count: int
    difficulty: str
```

**Rule:** Request models validate user input. Response models define the API contract. Internal command models carry data between layers. These are three distinct types and MUST NOT be conflated.

---

### Step 3 — Service Method

Add the service method in `features/<slug>/application/service.py`:

```python
async def enqueue_quiz_generation(
    self,
    deck_id: UUID,
    user_id: UUID,
    request: QuizGenerateRequest,
) -> QuizGenerateResponse:
    """
    Validates quota, verifies deck ownership, enqueues AI task.
    Returns task_id for client polling.
    
    Raises:
        DeckNotFoundError: If deck does not exist or user does not own it.
        InsufficientCardsError: If deck has fewer cards than question_count.
        QuotaExceededError: If user has exceeded monthly AI generation limit.
    """
    deck = await self._deck_repo.get_by_id(deck_id, user_id=user_id)
    if deck is None:
        raise DeckNotFoundError(deck_id)

    card_count = await self._card_repo.count_active(deck_id, user_id=user_id)
    if card_count < request.question_count:
        raise InsufficientCardsError(
            f"Deck has {card_count} cards but {request.question_count} requested"
        )

    await self._quota_service.validate_ai_quota(user_id)

    task_id = await self._ai_pipeline.enqueue_quiz_generation(
        deck_id=deck_id, user_id=user_id, config=request.model_dump()
    )

    return QuizGenerateResponse(
        task_id=task_id,
        poll_url=f"/api/v1/tasks/{task_id}/status"
    )
```

---

### Step 4 — Unit Tests for Service Method

Before writing the router, write unit tests for the service method:

```python
async def test_enqueue_quiz_generation_raises_when_deck_not_found(mock_deck_repo, ...):
    mock_deck_repo.get_by_id.return_value = None
    with pytest.raises(DeckNotFoundError):
        await service.enqueue_quiz_generation(deck_id=uuid4(), user_id=uuid4(), request=...)

async def test_enqueue_quiz_generation_raises_when_insufficient_cards(...):
    ...

async def test_enqueue_quiz_generation_raises_when_quota_exceeded(...):
    ...

async def test_enqueue_quiz_generation_returns_task_id_on_success(...):
    ...
```

---

### Step 5 — FastAPI Router

Add the route handler in `features/<slug>/api/router.py`:

```python
@router.post(
    "/{deck_id}/quiz",
    response_model=APIResponse[QuizGenerateResponse],
    status_code=202,
    summary="Enqueue AI quiz generation from deck",
)
async def generate_quiz(
    deck_id: UUID,
    body: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    service: FlashcardService = Depends(get_flashcard_service),
    request: Request = None,
):
    try:
        result = await service.enqueue_quiz_generation(
            deck_id=deck_id, user_id=current_user.id, request=body
        )
        return APIResponse(
            success=True,
            data=result,
            meta=build_meta(request)
        )
    except DeckNotFoundError:
        raise HTTPException(status_code=404, detail="Deck not found")
    except InsufficientCardsError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except QuotaExceededError:
        raise HTTPException(status_code=422, detail="Monthly AI generation limit reached")
```

**Router rules:**
- Maps domain exceptions to HTTP exceptions. Never raises `HTTPException` from service layer.
- Returns `APIResponse[T]` wrapper — never raw Pydantic models.
- Always passes `current_user.id` to service — never trusts body `user_id`.

---

### Step 6 — Integration Test

```python
async def test_generate_quiz_returns_202_and_task_id(authenticated_client, db_session):
    deck = await FlashcardDeckFactory.create(db=db_session, user_id=authenticated_client._test_user.id)
    await FlashcardFactory.create_batch(db=db_session, deck_id=deck.id, count=15)

    response = await authenticated_client.post(
        f"/api/v1/decks/{deck.id}/quiz",
        json={"question_count": 10, "difficulty": "medium"}
    )

    assert response.status_code == 202
    body = response.json()
    assert body["success"] is True
    assert "task_id" in body["data"]
    assert body["data"]["status"] == "queued"
    assert "/tasks/" in body["data"]["poll_url"]
```

---

### Step 7 — Frontend API Function

```typescript
// frontend/features/flashcards/api/flashcardApi.ts
import { syncEngine } from 'features/sync';
import type { QuizGeneratePayload, QuizGenerateResponse } from '../domain/types';

export async function requestQuizGeneration(
  deckId: string,
  payload: QuizGeneratePayload
): Promise<QuizGenerateResponse> {
  const response = await fetch(`/api/v1/decks/${deckId}/quiz`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error.error.code, error.error.message);
  }
  const { data } = await response.json();
  return data;
}
```

---

### Step 8 — Mark Contract as Active

Update `backend/docs/API_CONTRACTS.md`: change `[DRAFT]` to `[ACTIVE]`.

### Step 9 — Update Completion Log

Log in `.ai/logs/ai_changes.md`:
```markdown
## 2026-05-07 — Added POST /decks/{deck_id}/quiz
- Files: router.py, service.py, domain/models.py
- New tests: test_quiz_generation_service.py, test_quiz_api_integration.py
- API contract: Updated from [DRAFT] to [ACTIVE]
```

---

## 3. NAMING CONVENTIONS FOR ENDPOINTS

| HTTP Method | Pattern | Semantics |
|---|---|---|
| GET | `/resource` | List (paginated) |
| GET | `/resource/{id}` | Single item |
| POST | `/resource` | Create |
| PATCH | `/resource/{id}` | Partial update |
| DELETE | `/resource/{id}` | Soft delete |
| POST | `/resource/{id}/action` | State transition or async action |

**`/action` endpoints** (e.g., `/sessions/{id}/complete`, `/decks/{id}/quiz`) are used for:
- State machine transitions.
- Async task enqueuing.
- Operations that are not pure CRUD.

---

## 4. FORBIDDEN API PATTERNS

| Pattern | Reason Forbidden |
|---|---|
| `GET /sessions?action=complete` | HTTP verbs and query params replace semantics; not REST |
| `POST /sessions/{id}` to update | POST should create, not update; use PATCH |
| Returning raw 200 with `{"error": "..."}` | Misleads HTTP clients; use correct 4xx codes |
| Returning nested user PII in response fields not needed by the client | Data minimization; GDPR |
| Accepting `user_id` in request body for ownership | IDOR vulnerability |

---

*End of API Creation Workflow — Last reviewed: 2026-05-07*
