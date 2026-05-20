# 🗄️ AI StudyFlow — Database Schema ERD

> **Canonical Authority:** This defines the production-ready PostgreSQL schema. All models must implement soft deletes and use UUIDs.

## 1. USERS
**Table:** `users`
- `id` (UUID, PK)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `subscription_tier` (VARCHAR(50), NOT NULL, DEFAULT 'free')
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)
- `deleted_at` (TIMESTAMPTZ, NULL)

## 2. STUDY SESSIONS
**Table:** `study_sessions`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `status` (VARCHAR(50), NOT NULL) -- ACTIVE, PAUSED, COMPLETED
- `duration_seconds` (INTEGER, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)
- `deleted_at` (TIMESTAMPTZ, NULL)
*Constraints:* Only one ACTIVE session per user (partial unique index).

## 3. FLASHCARDS
**Table:** `flashcard_decks`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, NOT NULL)
- `name` (VARCHAR(255), NOT NULL)
- `created_at`, `updated_at`, `deleted_at`

**Table:** `flashcards`
- `id` (UUID, PK)
- `deck_id` (UUID, FK -> `flashcard_decks.id`, NOT NULL)
- `front` (TEXT, NOT NULL)
- `back` (TEXT, NOT NULL)
- `difficulty` (VARCHAR(50), NOT NULL)
- `created_at`, `updated_at`, `deleted_at`

## 4. STUDY LOGS
**Table:** `study_logs`
- `id` (UUID, PK)
- `session_id` (UUID, FK -> `study_sessions.id`, NOT NULL)
- `card_id` (UUID, FK -> `flashcards.id`, NULL)
- `action_type` (VARCHAR(50), NOT NULL) -- e.g., CARD_REVIEWED, SESSION_PAUSED
- `score` (INTEGER, NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL)

## 5. TASKS
**Table:** `tasks`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `is_completed` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `due_date` (TIMESTAMPTZ, NULL)
- `created_at`, `updated_at`, `deleted_at`

## 6. AI INTERACTIONS
**Table:** `ai_interactions`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, NOT NULL)
- `task_type` (VARCHAR(100), NOT NULL) -- e.g., FLASHCARD_GEN
- `prompt_tokens` (INTEGER, NOT NULL)
- `completion_tokens` (INTEGER, NOT NULL)
- `model_used` (VARCHAR(100), NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL)
