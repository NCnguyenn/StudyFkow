# 🐛 AI StudyFlow — Known Bugs Registry

> **Format:** Append-only log. NEVER delete entries. Mark resolved bugs with `[RESOLVED]`.
> AI agents discovering bugs during development MUST log them here immediately.
> P0 and P1 bugs MUST be logged before any fix attempt.

---

## REGISTRY FORMAT

Each entry follows this exact format:

```markdown
### BUG-<ID> [STATUS] — <Short Title>
**Reported:** YYYY-MM-DD
**Severity:** P0 / P1 / P2 / P3
**Environment:** development / staging / production
**Symptom:** What the user or system observes.
**Root Cause:** The actual code defect (fill in after diagnosis).
**Reproduction Steps:**
1. Step one
2. Step two
**Fix:** Description of fix applied.
**Test Added:** test function name
**Files Modified:** list of files
**Resolved:** YYYY-MM-DD (or leave blank if open)
```

---

## OPEN BUGS

> No open bugs at project initialization. All bugs discovered during implementation
> must be appended below this section before the RESOLVED BUGS section.

---

## RESOLVED BUGS

> No resolved bugs at project initialization. Entries are moved here from OPEN BUGS
> once the fix is verified in staging.

---

## KNOWN ARCHITECTURAL RISKS (Not Bugs — Pre-emptive Documentation)

The following are not current bugs but are documented risks that may become bugs
under specific conditions. They must be tracked to prevent future incidents.

### RISK-001 — Celery Queue Buildup During LLM Provider Outage

**Risk:** If the primary LLM provider (OpenAI) has a multi-hour outage and the
local Ollama fallback is also unavailable, AI tasks accumulate in the Redis queue
indefinitely. If the queue grows large enough, Redis memory may be exhausted.

**Mitigation Strategy (not yet implemented):**
- Implement queue depth monitoring with alerts at 1,000 tasks.
- Implement dead-letter queue for tasks exceeding `max_attempts`.
- Configure Redis `maxmemory-policy` to `allkeys-lru` as a safety net.

**Priority:** P2 — Implement before first production deployment.

---

### RISK-002 — Sync Conflict Escalation on Clock Skew

**Risk:** The offline-first sync engine uses `client_timestamp` for Last-Write-Wins
conflict resolution. If a client device has a significantly skewed clock (e.g., 30+
minutes ahead), it will always win conflicts even when the server data is actually newer.

**Mitigation Strategy (not yet implemented):**
- Implement clock skew detection: if `client_timestamp > server_time + 5 minutes`,
  reject the mutation with a `CLOCK_SKEW_DETECTED` error.
- Return `server_timestamp` in all sync responses so clients can self-correct.

**Priority:** P2 — Implement in sync engine before offline-first testing begins.

---

### RISK-003 — N+1 Queries in Flashcard Review Loading

**Risk:** The spaced repetition review session must load cards due for review along
with their deck metadata. Without explicit eager loading configuration, this will
generate one query per card to fetch deck info.

**Mitigation Strategy (not yet implemented):**
- Use `selectinload(Flashcard.deck)` in the review query.
- Add a test that asserts the query count for loading 20 review cards is ≤ 3.

**Priority:** P3 — Address during `spaced_repetition` feature implementation.

---

### RISK-004 — Redis Connection Pool Starvation Under High Celery Worker Count

**Risk:** If Celery workers are scaled to 20+ instances and each maintains its own
Redis connection pool, the total connection count may exceed Redis's configured limit
(`maxclients` default: 10,000 in Redis 7).

**Mitigation Strategy (not yet implemented):**
- Configure Celery workers with `CELERY_REDIS_MAX_CONNECTIONS = 5` per worker.
- Monitor Redis connection count metric.
- Consider Redis Cluster for horizontal scaling.

**Priority:** P3 — Address at scale, not during initial development.

---

## LOGGING INSTRUCTIONS FOR AI AGENTS

When discovering a bug during implementation:

1. Determine severity (P0–P3).
2. Immediately append an entry to the **OPEN BUGS** section using the exact format above.
3. Set `Root Cause` and `Reproduction Steps` even if incomplete — fill in what is known.
4. Proceed with the bug fixing workflow (`.ai/workflows/bug_fixing.md`).
5. Update the entry with fix details and move to **RESOLVED BUGS** after verification.

**Do NOT** fix a bug without logging it first. Unlogged fixes create invisible history that future AI agents cannot reason about.

---

*Registry initialized: 2026-05-07 | Append only — never delete entries*
