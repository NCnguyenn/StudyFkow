# Product

## Register

AI StudyFlow — AI-powered study productivity web app

## Users

Students, self-learners, and professionals who need a quiet, cozy digital space to focus, study, plan tasks, and take notes. They value aesthetics (such as lo-fi room environments) and need an interface that promotes calm concentration rather than stress or overstimulation.

## Product Purpose

AI StudyFlow is an AI-powered study space that combines a pomodoro-style focus timer, task planner, note-taking canvas (Tiptap-based), and analytics insights into an illustrated lo-fi study room environment. Success looks like users staying engaged, focusing deeply without distractions, and managing their learning workflow seamlessly.

## Brand Personality

Cozy, Focused, Aesthetic. Warm and inviting like a lo-fi study room (wood browns, plant greens, lamp amber) that brings a feeling of calm, focus, and productivity.

## Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| **Dashboard** | Landing page with greeting, quick stats, recent activity | ✅ Active |
| **Focus Timer** | Pomodoro timer with session tracking, break reminders | ✅ Active |
| **Planner** | Kanban-style task management with drag-and-drop | ✅ Active |
| **Notes** | Block-based editor (Tiptap) with subject tagging | ✅ Active |
| **Insights** | Study analytics, streak tracking, productivity trends | ✅ Active |
| **AI Chat** | LLM-powered study assistant (Gemini/Ollama) | ⚠️ LLM mocked |
| **Study Room** | Illustrated SVG room scene with day/night, weather | 🔨 Building (R5.0) |

### Planned Modules

| Module | Description | Status |
|--------|-------------|--------|
| **Flashcard Engine** | Creation and management of flashcard sets | 🗓️ Planned (B5) |
| **Spaced Repetition** | SM-2 algorithm based review scheduling | 🗓️ Planned (B6) |

## User Stories & JTBD

- **Dashboard:** As a user, I want to see my study stats and recent activity at a glance so I know where I left off and feel motivated.
- **Focus Timer:** As a student, I want to use a Pomodoro timer so I can maintain deep focus without burning out.
- **Planner:** As a learner, I need a Kanban board to organize my tasks so I can prioritize what to study today.
- **Notes:** As a self-learner, I want a block-based editor to capture and organize my thoughts seamlessly.
- **Insights:** As a user, I want to track my streaks and productivity trends so I can build consistent study habits.
- **AI Chat:** As a student, I want an AI assistant to clarify complex topics without leaving the study space.
- **Study Room:** As a user who values aesthetics, I want a customizable lo-fi environment so I can feel calm and immersed.
- **Flashcard Engine & Spaced Repetition:** As a learner preparing for exams, I want to create flashcards and review them using spaced repetition to retain information long-term.

## Feature Priority Matrix

| Feature / Module | User Impact | Development Effort | Priority |
|------------------|-------------|--------------------|----------|
| Focus Timer & Study Room | ⭐⭐⭐⭐⭐ (High) | Medium | P0 |
| Notes & Planner | ⭐⭐⭐⭐⭐ (High) | High | P1 |
| Dashboard & Insights | ⭐⭐⭐ (Medium) | Medium | P1 |
| AI Chat | ⭐⭐⭐⭐ (High) | High | P2 |
| Flashcard Engine (B5) | ⭐⭐⭐⭐⭐ (High) | High | P3 |
| Spaced Repetition (B6) | ⭐⭐⭐⭐⭐ (High) | High | P3 |

## Anti-references

Flat SaaS dashboards, dull monochrome dark voids, generic purple-to-blue gradients, and over-engineered, clinical corporate templates.

## Design Principles

1. **Atmospheric Focus (Cozy Sanctuary):** Create a visual environment that feels like a physical sanctuary (warm desk lamp glow, plants, bookshelf) rather than a sterile software tool.
2. **Glassmorphic Spatial Depth:** Use multi-layered glass panels and shadows to give the user a sense of depth and touch without heavy WebGL.
3. **Content-First Simplicity:** While the ambient room background is rich and illustrated, it must remain secondary; user tasks, notes, and timers must be crisp, legible, and easy to interact with.
4. **Mindful Interaction:** Avoid loud, sudden animations or distractions. Visual feedback (mascot messages, animations) must be gentle and respectful of the user's active focus time.

## Accessibility & Inclusion

Maintain high color contrast on typography (≥ 4.5:1), support reduced motion options, and ensure a clear semantic layout for keyboard navigation.

## Data & Privacy

We are committed to user privacy and data ownership.
- **Data Export:** Users have full control over their data. A GDPR-compliant data export endpoint allows users to download all their notes, tasks, and study history in a machine-readable format.
- **AI Privacy:** User data sent to LLMs (for AI Chat) is not used for model training without explicit consent.

## Related Documentation

- `DESIGN.md` — Visual design system tokens and room palette
- `TEAM_BOUNDARIES.md` — Agent role assignment
- `.ai/ROADMAP.md` — Frontend roadmap (R5.0 → R9)
- `backend/docs/JULES_ONBOARDING.md` — Backend roadmap (B1 → B6)

*Last updated: 2026-06-28*
