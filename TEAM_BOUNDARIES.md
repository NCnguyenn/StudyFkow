# TEAM_BOUNDARIES.md — Quy ước phân công Agent Team

> **Mục đích:** File này là "hợp đồng" giữa 3 AI agents cùng làm việc trên dự án AI StudyFlow.
> Tất cả agents PHẢI đọc file này trước khi bắt đầu bất kỳ task nào.
>
> **Cập nhật lần cuối:** 2026-07-02

---

## 1. Phân công vai trò

| | **Antigravity 2.0** | **Antigravity IDE** | **Jules** |
|---|---|---|---|
| **Vai trò** | Project Orchestrator | Frontend Lead | Backend Lead |
| **Công nghệ** | Prompt Engineering, Project Management | Next.js, TypeScript, React, CSS, GSAP, Canvas 2D | FastAPI, Python, SQLAlchemy, PostgreSQL, Redis, Celery |
| **Nhiệm vụ chính** | Tạo prompt, giám sát tiến độ, kiểm tra alignment | Pixel Art Room Engine, Module UI, Animation, Layout, UX | API endpoints, Database, Business logic, Background jobs, Tests |
| **Lộ trình** | Giám sát cả 2 roadmap | `.ai/ROADMAP.md` (R5.5 → R10-NEW) | `backend/docs/JULES_ONBOARDING.md` (B1 → B6) |
| **Cách vận hành** | Tạo prompt → gửi executor → đọc kết quả → tạo follow-up | Real-time chat trong IDE | Async qua GitHub Issue → PR |
| **Prompt file** | `ANTIGRAVITY_2.0_PROMPT.md` | `ANTIGRAVITY_PROMPT.md` | `JULES_PROMPT.md` |

---

## 2. Quyền sở hữu thư mục (File Ownership)

### Antigravity sở hữu (Jules KHÔNG ĐƯỢC chạm)

```
frontend/                    ← Toàn bộ frontend code
.ai/                         ← AI architecture docs
.cursorrules                 ← Agent rules cho Antigravity
DESIGN.md                    ← Visual design system
PRODUCT.md                   ← Product vision (read-only cho cả 2)
```

### Jules sở hữu (Antigravity KHÔNG ĐƯỢC chạm)

```
backend/                     ← Toàn bộ backend code
backend/docs/                ← Backend documentation
backend/features/            ← Feature modules
backend/app/                 ← Core infrastructure
backend/alembic/             ← Database migrations
backend/tests/               ← Backend tests
```

### Shared (cả 2 có thể đọc, nhưng cần phối hợp khi sửa)

```
TEAM_BOUNDARIES.md           ← File này (phối hợp qua user)
docker-compose.yml           ← Infra config (phối hợp qua user)
.env / .env.example          ← Environment vars (phối hợp qua user)
.gitignore                   ← Git config (phối hợp qua user)
```

> **Quy tắc:** Nếu cần sửa file shared, agent PHẢI thông báo cho user trước.
> User sẽ quyết định ai sửa và khi nào.

---

## 3. Quy tắc vàng (Golden Rules)

### Rule 1: Không chạm file của agent khác
- Antigravity KHÔNG sửa bất kỳ file nào trong `backend/`
- Jules KHÔNG sửa bất kỳ file nào trong `frontend/`, `.ai/`, `DESIGN.md`, `.cursorrules`

### Rule 2: Không phá API Contract
- Jules KHÔNG ĐƯỢC thay đổi response shape của API endpoints hiện có
- Chỉ được **thêm** field mới (additive changes), KHÔNG xoá hoặc đổi tên field cũ
- Nếu cần breaking change → ghi vào `API_CONTRACTS.md` section "Breaking Changes" → chờ user duyệt

### Rule 3: API Contract là điểm phối hợp duy nhất
- Khi Antigravity cần endpoint mới → ghi request vào `backend/docs/API_CONTRACTS.md` section "Requested Endpoints"
- Jules implement endpoint → update status trong contract
- Antigravity consume endpoint mới → update frontend code

### Rule 4: Mỗi agent có roadmap riêng
- Antigravity theo `.ai/ROADMAP.md` (R5.0 → R9)
- Jules theo `backend/docs/JULES_ONBOARDING.md` (B1 → B6)
- 2 roadmap chạy SONG SONG, không phụ thuộc lẫn nhau (trừ B5, B6 cần API contract)

### Rule 5: Database migrations thuộc về Jules
- Chỉ Jules được tạo Alembic migration files
- Nếu Antigravity phát hiện cần thay đổi schema → ghi request vào `API_CONTRACTS.md`

---

## 4. Quy trình phối hợp

### 4.1 Antigravity cần API mới

```
1. Antigravity ghi vào API_CONTRACTS.md → section "Requested Endpoints":
   | Priority | Method | Path | Request Body | Response Body | Notes |
   
2. User review và approve request

3. Jules đọc request → implement endpoint → viết test → tạo PR

4. User merge PR

5. Antigravity consume endpoint mới trong frontend code
```

### 4.2 Jules cần thay đổi API hiện có (Breaking Change)

```
1. Jules ghi vào API_CONTRACTS.md → section "Breaking Changes":
   | Endpoint | Current Shape | Proposed Shape | Reason | Impact |

2. User thông báo cho Antigravity

3. Antigravity đánh giá impact → confirm OK hoặc suggest alternative

4. Jules implement → Antigravity update frontend → cả 2 tạo PR

5. User merge cả 2 PR cùng lúc
```

### 4.3 Cả 2 cần sửa file shared

```
1. Agent ghi yêu cầu sửa đổi vào comment/message cho user
2. User quyết định ai sửa
3. Agent được chỉ định sửa file
4. Agent còn lại pull changes trước khi tiếp tục
```

---

## 5. Tài liệu tham chiếu

### Antigravity đọc
| File | Mục đích |
|------|----------|
| `.ai/CONTEXT_MANIFEST.md` | Context routing & manifest |
| `.ai/architecture/ui_architecture.md` | Kiến trúc UI v5.0 |
| `.ai/ROADMAP.md` | Lộ trình frontend R5.0 → R9 |
| `DESIGN.md` | Visual design system |
| `.cursorrules` | Code rules cho frontend |
| `TEAM_BOUNDARIES.md` | File này |
| `backend/docs/API_CONTRACTS.md` | Xem API endpoints có sẵn (READ ONLY) |

### Jules đọc
| File | Mục đích |
|------|----------|
| `backend/docs/JULES_ONBOARDING.md` | Vai trò, ranh giới, roadmap |
| `backend/docs/BACKEND_ARCHITECTURE.md` | Kiến trúc backend |
| `backend/docs/API_CONTRACTS.md` | API contracts (READ + WRITE) |
| `backend/docs/DATABASE_SCHEMA.md` | Database schema |
| `backend/docs/TESTING_GUIDE.md` | Hướng dẫn viết test |
| `TEAM_BOUNDARIES.md` | File này |
| `PRODUCT.md` | Product vision (READ ONLY) |

---

## 6. Lộ trình song song (Parallel Roadmap)

```
Timeline →  Tuần 1          Tuần 2          Tuần 3          Tuần 4
            ─────────────── ─────────────── ─────────────── ───────────────
Anti. 2.0   │ Audit + Plan  │ Monitor P2-P3 │ Monitor P4-P5 │ Plan R6
            │ Create prompts│ Quality gate  │ Quality gate  │ Next sprint
            ─────────────── ─────────────── ─────────────── ───────────────
Anti. IDE   │ R5.5-P1       │ R5.5-P2,P3    │ R5.5-P4,P5    │ R6 (Weather)
            │ Sprite Assets │ PNG Render +   │ Animations    │ Store + UI
            │               │ Lighting       │ + GSAP Zoom   │
            ─────────────── ─────────────── ─────────────── ───────────────
Jules       │ B3 Notes API  │ B3 continued  │ B4 Chat LLM   │ B4 continued
            │ Expansion     │               │ Integration   │
            ─────────────── ─────────────── ─────────────── ───────────────
            
      Antigravity 2.0 ↕ monitors both via docs + codebase verification
                       ↕ API_CONTRACTS.md (coordination point)
```

> **Lưu ý:** B5 (Flashcard Engine) và B6 (Spaced Repetition) chỉ bắt đầu sau khi Antigravity IDE ghi API contract cho các module này.
