# ভোজেশ্বর উচ্চ বিদ্যালয় (Bhojeshwar High School — BHS)
### Digital Education Platform & School Management System (Frontend Architecture)

**Institution Details (Configurable via SchoolProfile)**
- **Name:** ভোজেশ্বর উচ্চ বিদ্যালয় (Bhojeshwar High School)
- **Location:** Bhojeshwar, Noria, Shariatpur, Bangladesh
- **Established:** 1978 · **EIIN:** `113587` · **Monogram:** `BHS`
- **Motto:** *"শিক্ষাই আলো, জ্ঞানই শক্তি"* ("Education is Light, Knowledge is Power")
- **Academic Scope:** Secondary School — Classes 6 to 10 (Classes 9–10 streams: Science, Humanities, Business Studies)

---

## Architecture & Tech Stack

This is a **100% frontend-only** TypeScript application powered by **Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + Redux Toolkit / RTK Query + Motion + Recharts + Zod**. There is no Next.js API route, database, or custom server. The UI is Bengali only.

### Key Architectural Layers
- **64-Table DBML Domain Types (`src/types/`)**:
  - `src/types/enums.ts` — All 36 database enums with Bangla/English display labels (`src/lib/constants/enums.ts`).
  - `src/types/entities.ts` — Full TypeScript interfaces matching all 64 DBML tables.
  - `src/types/proposed/future.ts` — Strongly separated proposed/future-phase schemas (`OnlineAdmissionApplication`, `ClassAttendanceMethodConfig`, Fees, Homework, Leave, Library Loans).
- **Redux Toolkit & Hybrid RTK Query Adapter (`src/store/api.ts`, `src/mocks/mockAdapter.ts`)**:
  - Runs seamlessly in **Demo / Mock Mode** (`NEXT_PUBLIC_USE_MOCK_API=true` by default) with stateful in-memory workflows (marks entry, GPA & 4th-subject bonus calculation, result publication, RFID + Manual attendance, SMS logs, promotions, TC issuance, CMS drag-and-drop ordering, and routine conflict checks).
  - **Switching to Real NestJS Backend**: Set `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_URL=https://your-nestjs-api.edu.bd/api/v1` in `.env`. RTK Query automatically switches to `fetchBaseQuery` with `credentials: 'include'` and Bearer token injection.
- **Bengali UI & Dual Theme (`src/lib/i18n/`, `src/index.css`)**:
  - The interface renders Bangla only, with Bangla numeral/date/BDT formatting.
  - Light & Dark themes tuned to the **Bhojeshwar High School (BHS)** emblem palette (`#0B7A34` Heritage Emerald Green, `#124B96` BHS Royal Academic Blue, `#D32229` Ceremonial Crest Crimson).
- **Official A4 Print Engine (`src/components/print/PrintDocuments.tsx`)**:
  - Marksheet / Academic Transcript (portrait)
  - Class Tabulation Sheet (landscape A4)
  - Examination Seat Plan
  - Batch Student & Staff ID Cards
  - Admission Admit Card
  - Transfer Certificate (TC)

---

## Portals & Demo Accounts

Open `/login` and click any 1-click demo credential chip (or sign in manually):

| Portal | Role | Demo Login |
| :--- | :--- | :--- |
| **Admin Dashboard** (`/admin`) | `SUPER_ADMIN` | `admin@bhs.edu.bd` |
| **Teacher Portal** (`/teacher/dashboard`) | `TEACHER` | `kamrul@bhs.edu.bd` |
| **Parent Portal** (`/parent/dashboard`) | `PARENT` | `parent@bhs.edu.bd` |
| **Student Portal** (`/student/dashboard`) | `STUDENT` *(Feature-flagged OFF by default)* | `student@bhs.edu.bd` |

### Feature Flags (Environment & Admin Settings)
- `NEXT_PUBLIC_ENABLE_STUDENT_PORTAL=false` (default off; toggleable at runtime in `/admin/settings`)
- `NEXT_PUBLIC_ENABLE_FUTURE_MODULES=false` (default off; unlocks clearly badged `BACKEND-PENDING` preview screens for Fees/bKash, Homework, Leave, and Library Issue/Return)
- `NEXT_PUBLIC_USE_MOCK_API=true` (switches between local mock adapter and live NestJS API)

---

## Security & Privacy Notice

- **Client-Side RBAC Disclaimer:** All frontend route guards and permission checks (`src/lib/permissions/`) exist strictly to tailor the UI experience. Authoritative authentication, role enforcement, result publication visibility, and PII protection **must always be enforced server-side** by the NestJS backend API.
- **Zero PII on Public Pages:** Public result lookup (`/results`) strictly returns `PUBLISHED` results only (displaying a polite notice for `WITHHELD` or `DRAFT` exams) and never exposes student addresses, guardian phone numbers, or birth certificate IDs.
- **No Secrets in Storage:** No API keys, SMS gateway secrets, or database credentials are stored in client code or `localStorage`.

---

## Verification & Unit Tests

```bash
# Run core formatter, GPA calculator, and Zod validation unit tests
npx tsx src/lib/__tests__/core.test.ts

# Typecheck & lint
npm run lint

# Production build
npm run build
```
