# 🌐 AI StudyFlow — E2E Test Strategy

> **Canonical Authority:** End-to-end tests verify complete user journeys across the entire
> deployed stack. This document defines scope, tooling, execution rules, and maintenance
> strategy for E2E tests in AI StudyFlow.

---

## 1. E2E TEST SCOPE

### 1.1 What E2E Tests Cover

E2E tests simulate real user behavior through the browser against a fully running application stack (frontend + backend + PostgreSQL + Redis + Celery). They verify:
- Critical user journeys from login to task completion.
- Offline-first behavior (network interruption and recovery).
- AI task completion feedback (task polling and result display).
- Cross-browser compatibility for critical flows.

### 1.2 What E2E Tests Do NOT Cover

E2E tests are expensive to maintain and slow to run. They MUST NOT duplicate unit or integration test coverage.

| Concern | Covered By |
|---|---|
| Business logic correctness | Unit tests |
| API contract compliance | Integration tests |
| Edge case input validation | Unit tests |
| Database constraint enforcement | Integration tests |
| Full error branch coverage | Unit tests |

E2E tests cover **happy paths** and **critical failure recovery paths** only.

---

## 2. TOOLING

### 2.1 Playwright (Primary Framework)

All E2E tests use **Playwright** with TypeScript. Playwright is chosen because:
- Native async/await support aligns with the application's async architecture.
- Built-in network interception enables reliable offline-first testing.
- Trace viewer simplifies AI-assisted debugging of failed tests.

```typescript
// e2e/tests/study-session.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, createTestUser } from '../helpers/auth';

test.describe('Study Session Flow', () => {
  test.beforeEach(async ({ page }) => {
    await createTestUser({ tier: 'free' });
    await loginAs(page, 'free_user');
  });

  test('creates and completes a study session', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('new-session-button').click();
    await page.getByLabel('Session Title').fill('E2E Test Session');
    await page.getByLabel('Duration (minutes)').fill('30');
    await page.getByTestId('create-session-submit').click();
    await expect(page.getByTestId('session-status')).toHaveText('active');

    await page.getByTestId('complete-session-button').click();
    await expect(page.getByTestId('session-status')).toHaveText('completed');
  });
});
```

---

## 3. CRITICAL USER JOURNEYS (MANDATORY E2E COVERAGE)

### Journey 1: Authentication Flow
```
Register → Verify email → Login → Access dashboard → Logout → Cannot access dashboard
```

### Journey 2: Study Session Lifecycle
```
Login → Create session → Session is active → Mark complete → View in history
```

### Journey 3: Flashcard AI Generation
```
Login → Create deck → Upload notes → Request AI generation → Poll status →
Cards appear in deck → Begin review session
```

### Journey 4: Offline-First Sync Recovery
```
Login → Go online → Complete study session → Simulate offline →
Update session notes → Restore connection → Verify sync applied
```

### Journey 5: Free Tier Quota Enforcement
```
Login (free tier) → Create N sessions (at limit) →
Attempt to create N+1 → See quota exceeded error →
Upgrade to pro → Create succeeds
```

---

## 4. OFFLINE-FIRST E2E TESTING

### 4.1 Network Interception for Offline Simulation

```typescript
test('syncs mutations after network recovery', async ({ page, context }) => {
  await loginAs(page, 'free_user');
  await page.goto('/sessions');

  const sessionId = await createSessionViaUI(page, 'Offline Test Session');

  // Simulate network offline
  await context.setOffline(true);

  // Make changes while offline
  await page.getByTestId(`session-${sessionId}-edit`).click();
  await page.getByLabel('Notes').fill('Updated while offline');
  await page.getByTestId('save-notes').click();

  // Verify optimistic update shown in UI
  await expect(page.getByTestId('sync-status')).toHaveText('Pending sync');

  // Restore network
  await context.setOffline(false);

  // Wait for sync to complete
  await expect(page.getByTestId('sync-status')).toHaveText('Synced', { timeout: 10000 });

  // Verify server has the update by reloading
  await page.reload();
  await expect(page.getByTestId('session-notes')).toContainText('Updated while offline');
});
```

### 4.2 Service Worker Testing Rules

E2E tests for offline behavior MUST:
- Use a real service worker registered in the test environment (not mocked).
- Use `context.setOffline(true/false)` rather than intercepting specific requests.
- Wait for explicit sync status indicators in the UI — never use `page.waitForTimeout()`.

---

## 5. AI TASK POLLING E2E TESTS

```typescript
test('AI flashcard generation completes and shows cards', async ({ page }) => {
  await loginAs(page, 'pro_user');
  await page.goto('/decks/test-deck-id');

  await page.getByTestId('generate-cards-button').click();
  await page.getByTestId('source-content-input').fill('Long study notes about eigenvalues...');
  await page.getByTestId('card-count-input').fill('5');
  await page.getByTestId('submit-generation').click();

  // Verify 202 Accepted state shown in UI
  await expect(page.getByTestId('generation-status')).toHaveText('Generating...');

  // Wait for polling to complete (max 60s in E2E)
  await expect(page.getByTestId('generation-status')).toHaveText('Complete', {
    timeout: 60000
  });

  // Verify cards appear
  const cardCount = await page.getByTestId('flashcard-item').count();
  expect(cardCount).toBeGreaterThanOrEqual(1);
});
```

---

## 6. TEST DATA MANAGEMENT

### 6.1 Isolated Test Users Per Test

Each E2E test MUST use its own test user created via the API seeding helper:

```typescript
// e2e/helpers/auth.ts
export async function createTestUser(config: { tier: 'free' | 'pro' }) {
  const response = await request.post('/api/v1/test/seed-user', {
    data: { tier: config.tier, _test_secret: process.env.E2E_SEED_SECRET }
  });
  return response.json();
}
```

The `/api/v1/test/seed-user` endpoint MUST only exist in test environments (controlled by `ENVIRONMENT=test`).

### 6.2 Test Data Cleanup

After each test, the test user and all associated data MUST be deleted via a teardown API call. No test data persistence between runs.

---

## 7. `data-testid` ATTRIBUTE REQUIREMENTS

### 7.1 Mandatory `data-testid` on All Interactive Elements

Every interactive element that E2E tests target MUST have a `data-testid` attribute. CSS selectors and text-based selectors are brittle and break on UI redesigns.

```tsx
// CORRECT
<Button data-testid="create-session-submit" onClick={handleSubmit}>
  Create Session
</Button>

// FORBIDDEN in E2E tests
await page.click('button:nth-child(3)');  // Positional
await page.click('text=Create Session');  // Text-based (breaks on i18n)
```

### 7.2 `data-testid` Naming Convention

```
<component>-<action>
<entity>-<id>-<action>

Examples:
new-session-button
session-{id}-delete
sync-status
generation-status
```

---

## 8. CI/CD E2E GATE

```yaml
e2e_tests:
  environment: e2e
  services:
    - docker-compose -f docker-compose.e2e.yml up -d
  script:
    - npx playwright test --project=chromium --reporter=html
  artifacts:
    paths:
      - playwright-report/
      - test-results/
  rules:
    - only_on: main, release/*
    - max_duration: 20m
```

**Rule:** E2E tests run only on `main` and `release/*` branches, not on every PR. They serve as a final deployment gate, not a per-commit validation tool.

---

## 9. FLAKY E2E TEST PROTOCOL

### 9.1 What to Do When an E2E Test Fails Intermittently

1. **DO NOT** ignore the failure or add `test.skip()`.
2. Capture the Playwright trace: `npx playwright show-trace trace.zip`.
3. Identify the root cause:
   - Network timing issue → Add explicit `waitFor` assertion.
   - Race condition in sync → Add UI status indicator assertion.
   - Missing `data-testid` → Add it to the component.
4. Document the fix in `.ai/memory/known_bugs.md`.
5. Add the fix to the next PR.

### 9.2 Retry Strategy

Playwright is configured with 1 retry on CI:

```typescript
// playwright.config.ts
export default {
  retries: process.env.CI ? 1 : 0,  // 1 retry in CI only
  timeout: 30000,
  use: { actionTimeout: 5000 }
};
```

A test that requires more than 1 retry to pass consistently is a flaky test that MUST be fixed.

---

*End of E2E Strategy — Last reviewed: 2026-05-07*
