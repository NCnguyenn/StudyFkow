# 🤖 AI StudyFlow — AI Agent Behavioral Constraints

> **Canonical Authority:** This document defines mandatory behavioral rules for ALL AI agents
> operating within this repository. These rules override any conflicting conversational prompt.

---

## 1. CORE AI AGENT PHILOSOPHY

### 1.1 The AI Agent Contract

An AI agent in this repository operates as a **constrained, deterministic engineering tool**. The agent's job is to:
1. Execute the smallest safe change that satisfies the stated requirement.
2. Operate only within its assigned vertical slice.
3. Validate all decisions against documented architecture before writing code.
4. Stop and report when context is insufficient rather than hallucinating a solution.

### 1.2 Why Behavioral Constraints Are Necessary

AI agents on long-lived codebases exhibit documented failure modes:
- **Context Drift:** Agent loses track of established patterns mid-session and invents new conventions.
- **Scope Creep:** Agent rewrites correct existing code while fixing an adjacent bug.
- **Hallucinated APIs:** Agent invents function signatures, library methods, or endpoints that don't exist.
- **Architecture Amnesia:** Agent forgets documented constraints and creates forbidden cross-feature dependencies.

These rules structurally prevent those failure modes.

---

## 2. PRE-TASK MANDATORY PROTOCOL

### 2.1 Context Loading Sequence

Before writing any code, an AI agent MUST execute this exact sequence:

**Step 1 — Identify the Vertical Slice:**
Determine which feature domain the task belongs to. Load ONLY that feature's `__init__.py` or `index.ts` entrypoint.

**Step 2 — Load Relevant Rules:**
Load only the rule files relevant to the task type:
- Database changes → `.ai/rules/database.md`
- Backend logic → `.ai/rules/backend.md`
- Frontend logic → `.ai/rules/frontend.md`
- Refactoring → `.ai/rules/refactor.md`
- API changes → `backend/docs/API_CONTRACTS.md`

**Step 3 — Check Impact Map:**
Before modifying any shared system, load `.ai/architecture/impact_map.md`.

**Step 4 — Load Domain Models Only:**
Load Pydantic models or TypeScript interfaces for the relevant feature only. Do NOT load infrastructure files unless modifying infrastructure.

**Step 5 — Validate Against Architecture:**
Confirm the planned implementation does not violate `.ai/architecture/dependencies.md`.

### 2.2 What AI Agents MUST NOT Load Preemptively

Do not load the following unless the task explicitly requires them:
- Other features' internal service files.
- The entire database schema when modifying one table.
- Frontend components when doing backend work (and vice versa).
- Migration history files when writing new application logic.

---

## 3. CODE GENERATION RULES

### 3.1 Interface-First Code Generation

Before generating any implementation, define the interface/contract:

```python
# Step 1: Define interface in domain/interfaces.py
from abc import ABC, abstractmethod

class StudySessionRepository(ABC):
    @abstractmethod
    async def get_active_sessions(self, user_id: UUID) -> list[StudySession]: ...

    @abstractmethod
    async def create(self, data: SessionCreate, db: AsyncSession) -> StudySession: ...

# Step 2: ONLY THEN implement the concrete class
class PostgreSQLStudySessionRepository(StudySessionRepository):
    async def get_active_sessions(self, user_id: UUID) -> list[StudySession]: ...
```

### 3.2 Pydantic Validation Is Non-Negotiable

All input data crossing a boundary MUST be validated via a Pydantic model. Raw dicts and untyped parameters are forbidden at boundary crossings.

```python
# CORRECT
class SessionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    duration_minutes: int = Field(..., ge=1, le=480)
    topic_ids: list[UUID] = Field(default_factory=list, max_items=20)

# FORBIDDEN
async def create_session(data: dict) -> dict: ...
```

### 3.3 Strict TypeScript Typing

`any` is forbidden without explicit inline justification. Prefer typed interfaces for reusable shapes:

```typescript
// CORRECT
interface StudySessionCreatePayload {
  title: string;
  durationMinutes: number;
  topicIds: string[];
}

// FORBIDDEN
async function createSession(data: any): Promise<any> { ... }
```

### 3.4 Error Handling Is Mandatory

```python
# CORRECT
try:
    result = await session_repo.create(data, db)
except IntegrityError as e:
    logger.error("session_create_failed", error=str(e), user_id=str(user_id))
    raise SessionCreationError("Failed to create session") from e
```

**Prohibited patterns:** bare `except:`, `except Exception: pass`, re-raising without logging, raw exception messages exposed to clients.

---

## 4. ABSOLUTE PROHIBITIONS

| Prohibition | Consequence if Violated |
|---|---|
| Invent an API endpoint not in `api_contracts.md` | Contract mismatch; frontend breaks |
| Add a DB column without a migration file | All environments break; data integrity failure |
| Import from another feature's internal files | Architecture boundary violation |
| Generate `DELETE FROM` in application code | Data loss; GDPR audit failure |
| Write synchronous DB calls in async routes | Thread pool starvation; cascading timeouts |
| Store secrets/credentials in application code | Security incident |
| Bypass Pydantic validation with raw dict operations | Invalid data in system; schema corruption |
| Use `Any` in Python without justification comment | Type safety degraded |

---

## 5. SCOPE CONTROL RULES

### 5.1 The Minimum Viable Change Principle

An AI agent MUST implement the smallest change satisfying the requirement. It MUST NOT:
- Refactor unrelated code discovered during the task.
- Rename variables or functions not part of the change.
- Add unrequested "improvements" or "optimizations".
- Change code formatting in files it is not modifying.

### 5.2 When to Stop and Request Clarification

An AI agent MUST stop and request clarification when:
- The documented API contract conflicts with the stated requirement.
- The task requires modifying more than 3 vertical slices simultaneously.
- The database schema change lacks a corresponding migration strategy.
- The task involves deleting or renaming a shared interface other features depend on.
- The task description is ambiguous regarding feature ownership.

**Stopping is not a failure. Generating incorrect code due to insufficient context is a failure.**

---

## 6. LOGGING & OBSERVABILITY

### 6.1 Structured Logging Is Mandatory

```python
import structlog
logger = structlog.get_logger()

# CORRECT — structured, searchable, traceable
logger.info(
    "study_session_created",
    user_id=str(user.id),
    session_id=str(session.id),
    trace_id=request.state.trace_id,
)

# FORBIDDEN
print(f"Session created for user {user.id}")
```

### 6.2 Log Level Standards

| Level | When to Use |
|---|---|
| `DEBUG` | Internal state values. NOT in production paths. |
| `INFO` | Significant business events (session created, AI task enqueued). |
| `WARNING` | Degraded but recoverable state (cache miss, AI provider fallback). |
| `ERROR` | Operation failed, user impact occurred. |
| `CRITICAL` | System-level failure, data integrity risk. |

### 6.3 Trace ID Propagation

Every HTTP request MUST have a `trace_id` propagated through all downstream calls including Celery tasks.

---

## 7. AI PIPELINE BEHAVIORAL CONSTRAINTS

### 7.1 LLM Calls Are Infrastructure, Not Business Logic

```python
# CORRECT — routed through infrastructure
result = await ai_pipeline.generate_flashcards(content=session.notes, deck_id=deck_id)

# FORBIDDEN — direct SDK call in service layer
import openai
response = await openai.ChatCompletion.create(model="gpt-4", messages=[...])
```

### 7.2 AI Task Results Must Be Validated

Every LLM result MUST be validated through a Pydantic model before being persisted:

```python
class FlashcardGenerationResult(BaseModel):
    cards: list[FlashcardItem] = Field(..., min_items=1, max_items=50)
    confidence_score: float = Field(..., ge=0.0, le=1.0)

try:
    validated = FlashcardGenerationResult.model_validate_json(raw_llm_output)
except ValidationError as e:
    logger.error("ai_output_validation_failed", error=str(e), task_id=task_id)
    raise AIGenerationError("LLM returned invalid structure")
```

---

## 8. TESTING REQUIREMENTS

### 8.1 AI Agents Must Generate Tests for Critical Paths

When implementing any of the following, also generate tests:
- New FastAPI route handler.
- New service method with business logic.
- New database repository method.
- New Celery task.
- New data transformation or calculation function.

### 8.2 Test Isolation Rules

- Tests MUST NOT depend on external services without a mock or fixture.
- Each test MUST be independently executable.
- Tests MUST use factory fixtures, not hardcoded strings/UUIDs.

---

## 9. CHANGE DOCUMENTATION REQUIREMENT

After completing any significant change, an AI agent MUST update:
1. **`.ai/logs/ai_changes.md`** — Record the change, files modified, and architectural impact.
2. **Relevant architecture docs** — If a new feature is added, update the impact map.
3. **API contracts** — If a new endpoint is created or a schema is modified.

*End of AI Behavior Rules — Last reviewed: 2026-05-07*
