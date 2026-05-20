# global.md
# 🌍 AI StudyFlow — Global Engineering Rules

## PURPOSE

This document defines the universal engineering rules that apply across the entire repository.

These rules are mandatory for:
- AI agents
- backend systems
- frontend systems
- infrastructure
- testing
- documentation
- refactoring workflows

Violation of these rules is considered an architecture violation.

---

# 1. CORE ENGINEERING PRINCIPLES

The repository must prioritize:

1. maintainability
2. architecture consistency
3. modularity
4. scalability
5. backend authority
6. auditability
7. isolated feature contexts
8. token-efficient AI workflows

Short-term implementation speed must NEVER compromise long-term architecture quality.

---

# 2. BACKEND AUTHORITY RULE

The backend is the single source of truth.

The frontend MUST NEVER:
- calculate authoritative durations
- generate trusted timestamps
- bypass backend validation
- modify analytics directly
- assume backend state correctness

Critical business logic belongs to the backend.

---

# 3. TIME & TIMEZONE LAW (CRITICAL)

All systems MUST follow these rules:

- all timestamps use UTC
- PostgreSQL must use TIMESTAMPTZ
- backend calculates all authoritative durations
- client clocks are never trusted
- frontend timezone conversion is presentation-only
- API communication uses ISO 8601 format

Timezone values must use valid IANA timezone strings.

Examples:
- Asia/Ho_Chi_Minh
- America/New_York

---

# 4. FEATURE ISOLATION RULE

Each feature must behave as an isolated bounded context.

Features MUST NOT:
- directly manipulate unrelated feature internals
- create hidden dependencies
- bypass contracts
- share undocumented logic

Cross-feature communication must happen through:
- documented APIs
- shared contracts
- approved architecture layers

---

# 5. NAMING CONVENTIONS

## Files

Use:
- kebab-case
- lowercase only

Examples:
- session-engine.ts
- auth-service.py
- task-timeline.tsx

Avoid:
- spaces
- vague names
- inconsistent casing

---

## TypeScript / Frontend

Use:
- camelCase for variables/functions
- PascalCase for React components/types/interfaces

Examples:

```ts
const sessionDuration = 10;

function calculateFocusScore() {}

export function TaskTimeline() {}
```

---

## Python / Backend

Use:
- snake_case for variables/functions/files
- PascalCase for classes and Pydantic models

Examples:

```python
session_duration = 10

def calculate_focus_score():
    pass

class SessionCreateRequest(BaseModel):
    pass
```

---

## PostgreSQL

Use:
- snake_case for tables
- snake_case for columns
- singular or plural naming consistently

Examples:
- users
- study_sessions
- user_stats

---

# 6. API CONSISTENCY RULE

APIs must follow consistent response structures.

Avoid:
- raw top-level arrays
- inconsistent payload structures
- undocumented fields

Standard response structure:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Detailed API contracts belong to:
- `.ai/architecture/api_contracts.md`

---

# 7. DATABASE SAFETY RULE

Database operations are HIGH RISK.

Never:
- generate destructive migrations casually
- remove production-critical columns blindly
- rename tables without migration planning
- bypass migration workflows

Database modifications MUST follow:
- `.ai/rules/database.md`
- `.ai/workflows/database_safety.md`

---

# 8. REFACTOR SAFETY RULE

Before refactoring:

MANDATORY:
1. inspect impact map
2. analyze dependencies
3. identify blast radius
4. preserve contracts
5. verify backward compatibility

Large uncontrolled rewrites are prohibited.

Reference:
- `.ai/rules/refactor.md`

---

# 9. TOKEN OPTIMIZATION RULE

AI agents MUST minimize context usage.

Avoid:
- loading entire repositories
- scanning unrelated directories
- repeatedly reloading unchanged files
- unnecessary architecture loading

Preferred workflow:

minimal context
→ isolated execution
→ targeted modification

---

# 10. DOCUMENTATION DISCIPLINE

Documentation is part of the architecture.

After major changes, update relevant:
- architecture docs
- ADR files
- dependency maps
- impact maps
- change logs
- completed tasks

Undocumented architecture changes are prohibited.

---

# 11. TESTING REQUIREMENT RULE

Critical systems MUST include tests.

High-priority areas:
- session engine
- synchronization
- authentication
- analytics
- database logic

Testing must include:
- unit tests
- integration tests
- edge-case validation

---

# 12. OFFLINE-FIRST RULE

The system must tolerate:
- unstable internet
- reconnect events
- browser refresh
- temporary API failure

Frontend local state is temporary.

Backend remains authoritative.

---

# 13. AI ENGINEERING SAFETY RULE

AI agents MUST NEVER:
- invent undocumented APIs
- invent database fields
- hallucinate libraries
- assume undocumented architecture
- bypass documented workflows

If context is insufficient:
STOP and request clarification.

---

# 14. CHANGE TRACKING RULE

Significant AI-generated changes MUST be logged.

Required tracking:
- modified files
- affected systems
- migration impact
- rollback considerations
- architecture impact

Reference:
- `.ai/logs/ai_changes.md`

---

# 15. FINAL ENGINEERING PRINCIPLE

The repository must remain:

- modular
- maintainable
- scalable
- explainable
- AI-readable
- token-efficient
- safe to extend
- safe to refactor

All implementation decisions must support these goals.