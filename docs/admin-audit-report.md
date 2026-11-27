# অ্যাডমিন সাইট — পূর্ণাঙ্গ ও নির্ভুল অডিট রিপোর্ট (Frontend + Backend)

এই ডকুমেন্টে **অ্যাডমিন প্যানেল (`/admin`)**-এর প্রতিটি রুট (`app/admin/**`), ফ্রন্টএন্ড কম্পোনেন্ট (`src/features/**`, `src/services/**`) এবং ব্যাকএন্ড মডিউল (`edu-backend/src/modules/**`) সরাসরি কোড যাচাই করে **কোনটি ১০০% লাইভ**, **কোনটি লাইভ হয়েও মক বুটস্ট্র্যাপের ওপর আটকে আছে**, **কোনটি আংশিক মক**, এবং **কোনটির ব্যাকএন্ডই নেই**—তার নির্ভুল তালিকা দেওয়া হয়েছে।

---

## ১. মূল আর্কিটেকচারাল সমস্যা (মক ফলব্যাক ও `/bootstrap` নির্ভরতা)

1. **`GET /bootstrap` ব্যাকএন্ডে নেই:**
   [bootstrap.api.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/bootstrap/api/bootstrap.api.ts) এর `useGetBootstrapQuery()` কল করা মানেই [hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L169) হয়ে `src/mocks/seed.ts`-এর ইন-মেমরি মক ডাটা লোড হওয়া।
2. **`requireLiveApi` গার্ড অসম্পূর্ণ:**
   [hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L167)-তে বর্তমানে শুধুমাত্র নিচের ৫টি রুট প্রোটেক্টেড:
   `/^\/(?:notices|auth|academic|staff|attendance)(?:[/?]|$)/`
   অর্থাৎ **`/examination`**, **`/class-routines`**, **`/users`**, **`/roles`**, **`/permissions`**, **`/audit-logs`**, **`/quick-links`**, **`/notifications`**-এ ৪0৪ বা নেটওয়ার্ক এরর হলে ফ্রন্টএন্ড নীরবে মক ডাটায় (`handleMockRequest`) ফলব্যাক করে।

---

## ২. এক নজরে প্রতিটি অ্যাডমিন মডিউলের প্রকৃত অবস্থা

| মডিউল | প্রকৃত অবস্থা | আসল চিত্র (Verified) |
| :--- | :--- | :--- |
| **হাজিরা ও SMS** (`/admin/attendance/*`) | **১০০% লাইভ** | ৪টি সাব-পেজ (`daily`, `reports`, `sms-logs`, `settings`) সম্পূর্ণ ব্যাকএন্ড-চালিত, কোনো `useGetBootstrapQuery` নেই। |
| **শিক্ষক ও কর্মচারী** (`/admin/staff`) | **১০০% লাইভ** | `StaffModule` + `staff.api.ts` সম্পূর্ণ লাইভ, সার্ভার প্যাজিনেশনসহ। |
| **অভিভাবক** (`/admin/parents/*`) | **১০০% লাইভ** | `ParentModule` (`/academic/parents`) + `parents.api.ts` সম্পূর্ণ লাইভ। |
| **একাডেমিক ও রুটিন** (`/admin/academic/*`) | **সাব-প্যানেল লাইভ, কিন্তু পেজ-শেল মক-আটকা** | ভেতরের ৭টি প্যানেল (`years`, `groups`, `classes`, `sections`, `subjects/catalog/books`, `class-teachers/assignments`, `class-routines`, `events`, `documents`/Syllabus) **লাইভ API** ব্যবহার করে; কিন্তু **প্যারেন্ট পেজ `AdminAcademicPage.tsx`** এখনো শীর্ষে `useGetBootstrapQuery()`-এর জন্য অপেক্ষা করে (`!db` হলে লোডিং দেখায়), এবং **`policies`** ট্যাব সম্পূর্ণ মক (ব্যাকএন্ড API নেই)। |
| **শিক্ষার্থী** (`/admin/students/*`) | **আংশিক লাইভ (৮/১০)** | ৮টি লাইভ (`directory`, `create`, `admissions`, `enrollments`, `transfers`, `testimonials`, `rfid-cards`, `[id]`); **প্রমোশন** ও **CSV আমদানি** এখনো মক। |
| **পরীক্ষা ও ফলাফল** (`/admin/examinations/*`, `/admin/results/*`) | **আংশিক লাইভ (৪/৯ + ১টি হাইব্রিড)** | ৪টি লাইভ (`exams/subjects`, `routines`, `marks-entry`, `publication`); ১টি হাইব্রিড (`merit-list` — মূল ডাটা লাইভ, শুধু `SchoolProfile` মক); ৪টি সম্পূর্ণ মক (`admit-cards`, `seat-plan`, `grading-scales`, `consolidated`)। |
| **নোটিশ, নিউজ, ইভেন্ট, ক্যারিয়ার** (`/admin/notices`, `/news`, `/events`, `/careers`) | **আংশিক লাইভ (১/৪)** | **নোটিশ** ১০০% লাইভ (`/notices`); **নিউজ, ইভেন্ট, ক্যারিয়ার** এখনো মক (ব্যাকএন্ড API নেই)। |
| **অ্যাডমিন ড্যাশবোর্ড** (`/admin`) | **প্রায় সম্পূর্ণ মক** | শুধু সাম্প্রতিক ৫টি নোটিশ লাইভ; বাকি সব KPI, চার্ট ও `todayDate = '2026-11-19'` মক। |
| **ব্যবহারকারী, রোল, পারমিশন ও অডিট** (`/admin/users`, `/roles`, `/permissions`, `/audit-logs`) | **ফ্রন্টএন্ড মক** | ব্যাকএন্ডে `/users`, `/roles`, `/permissions`, `/audit-logs` আছে, কিন্তু `AdminUsersPage.tsx` এখনো `useGetBootstrapQuery()` চালায়। |
| **প্রতিষ্ঠান ও ওয়েবসাইট CMS** (`/admin/institution/*`, `/admin/website/*`) | **ফ্রন্টএন্ড মক** | ব্যাকএন্ডে শুধু `QuickLinkModule` (`/quick-links`) আছে; ফ্রন্টএন্ড (`AdminInstitutionPage`, `AdminWebsite*Page`) সম্পূর্ণ `useGetBootstrapQuery()` মক চালায়। |
| **গ্রন্থাগার** (`/admin/library`) | **১০০% মক** | Prisma স্কিমায় মডেল থাকলেও ব্যাকএন্ডে কোনো `LibraryModule` নেই। |
| **ডিজিটাল শিক্ষা** (`/admin/digital-education/*`) | **১০০% মক** | Prisma স্কিমায় মডেল থাকলেও ব্যাকএন্ডে কোনো `DigitalEducationModule` নেই। |
| **রিপোর্ট ও অডিট** (`/admin/reports`) | **১০০% মক** | ফ্রন্টএন্ড `AdminReportsPage.tsx` সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটা দেখায়। |
| **সেটিংস ও প্রোফাইল** (`/admin/settings`) | **১০০% মক** | ফ্রন্টএন্ড `AdminSettingsPage.tsx` সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটা দেখায়। |

---

## ৩. বিস্তারিত পেজ-ভিত্তিক গ্যাপ তালিকা

### ৩.১ একাডেমিক ও রুটিন (`/admin/academic/*`) — গুরুত্বপূর্ণ সংশোধন
- **যা ইতিমধ্যেই লাইভ (`src/features/academic/components/admin/` ও `src/services/academic/`):**
  - শিক্ষাবর্ষ (`/years`), বিভাগ (`/groups`), শ্রেণি (`/classes`), শাখা (`/sections`) — `AcademicFoundation` -> `/academic/years`, `/academic/groups`, `/academic/classes`, `/academic/sections`
  - বিষয়, পাঠ্যক্রম ও পাঠ্যবই (`/subjects`, `/class-subjects`, `/books`) — `AcademicCurriculum` -> `/academic/subjects`, `/academic/class-subjects`, `/academic/books`
  - শ্রেণি শিক্ষক ও শিক্ষক বণ্টন (`/class-teachers`, `/teacher-assignments`) — `AcademicStaffing` -> `/academic/class-teachers`, `/academic/teacher-assignments`
  - ক্লাস রুটিন (`/class-routines`) — `AcademicRoutine` -> `/class-routines`
  - একাডেমিক ক্যালেন্ডার (`/events`) — `AcademicCalendar` -> `/academic/events`
  - সিলেবাস (`/documents`) — `SyllabusPanel` -> `/academic/syllabi`
- **যা অসম্পূর্ণ / মক:**
  1. [AdminAcademicPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminAcademicPage.tsx#L182-L227) এখনো অপ্রয়োজনীয়ভাবে `useGetBootstrapQuery()` কল করে (`!db` থাকলে পুরো পেজ ব্লক হয়) এবং লাইন ১৯১–৩৭৬-এ পুরোনো মক সিলেবাস কোড রয়ে গেছে।
  2. **নীতিমালা (`/admin/academic/policies`):** [AcademicPolicies.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/academic/components/admin/AcademicPolicies.tsx) এখনো `db.academicDocuments` মক ডাটা ব্যবহার করে; ব্যাকএন্ডে কোনো `AcademicDocument` / `Policy` API নেই।

### ৩.২ শিক্ষার্থী (`/admin/students/*`)
- **লাইভ (৮টি):** `directory`, `create`, `admissions`, `enrollments`, `transfers`, `testimonials`, `rfid-cards`, `[id]`।
- **মক / অসম্পূর্ণ (২টি):**
  1. **প্রমোশন (`/admin/students/promotions`):** [StudentPromotions.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/students/components/admin/StudentPromotions.tsx) এখনো `MockDatabase` ও মক `usePromoteStudentsMutation()` ব্যবহার করে (যদিও ব্যাকএন্ডে `/academic/promotions` এবং ফ্রন্টএন্ডে `promotions.api.ts` তৈরি আছে)।
  2. **CSV আমদানি (`/admin/students/import`):** [StudentImporter.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/students/components/StudentImporter.tsx) এখনো মক; ব্যাকএন্ডে বাল্ক CSV স্টুডেন্ট ইম্পোর্ট API নেই।

### ৩.৩ পরীক্ষা ও ফলাফল (`/admin/examinations/*` ও `/admin/results/*`)
- **লাইভ (৪টি):**
  - `ExamsAndSubjectsView` (`/examinations`, `/subjects`, `/create`, `/[id]`) -> `/examination/exams`, `/examination/exams/:examId/subjects`
  - `ExamRoutinesView` (`/examinations/routines`) -> `/examination/routines`
  - `MarksEntryView` (`/examinations/marks-entry`) -> `/examination/marks`
  - `ResultPublicationView` (`/results/publication`) -> `/examination/results`
- **হাইব্রিড (১টি):**
  - `MeritAndMarksheetsView` (`/results/merit-list`, `/mark-sheets`): পরীক্ষার তালিকা ও ট্যাবুলেশন লাইভ API থেকে নেয়, কিন্তু **শুধুমাত্র `SchoolProfile`-এর জন্য এখনো `useGetBootstrapQuery()`** ব্যবহার করে (সাথে `FALLBACK_SCHOOL_PROFILE` হার্ডকোড করা)।
- **সম্পূর্ণ মক (৪টি):**
  - `ExamAdmitCardsView` (`/examinations/admit-cards`): ব্যাকএন্ডে Admit Card API নেই।
  - `ExamSeatPlanView` (`/examinations/seat-plan`): ব্যাকএন্ডে `ExamHallRoom` মডেল ও সিট-প্ল্যান API নেই।
  - `GradingScalesView` (`/examinations/grading-scales`): ফ্রন্টএন্ড এখনো `useGetBootstrapQuery()` মক ডাটা দেখায়, যদিও ব্যাকএন্ডে `GradingScaleController` (`/examination/grading-scales`) তৈরি আছে।
  - `ConsolidatedResultsView` (`/examinations/consolidated`, `/results/consolidated`): ফ্রন্টএন্ড `useGetBootstrapQuery()` মক ডাটা দেখায় (ব্যাকএন্ডে `/examination/results` থেকে কনসলিডেটেড কানেকশন সম্পূর্ণ করা হয়নি)।

### ৩.৪ অন্যান্য মডিউল (ফ্রন্টএন্ড মক বনাম ব্যাকএন্ড অবস্থা)
- **অ্যাডমিন ড্যাশবোর্ড (`/admin`):** [AdminDashboardPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-dashboard/components/AdminDashboardPage.tsx) — শুধু `recentNotices` লাইভ; বাকি সব KPI/চার্ট মক (`todayDate = '2026-11-19'`) এবং ব্যাকএন্ডে কোনো `/dashboard` সামারি API নেই।
- **নোটিশ, নিউজ, ইভেন্ট, ক্যারিয়ার:** [AdminNoticesAndEventsPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-content/components/AdminNoticesAndEventsPage.tsx) — `notices` লাইভ (`/notices`); `news`, `events`, `careers` মক (ব্যাকএন্ডে `News`, `Event`, `Career` Controller নেই)।
- **ব্যবহারকারী, রোল ও অডিট (`/admin/users`, `/roles`, `/permissions`, `/audit-logs`):** [AdminUsersPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminUsersPage.tsx) — ব্যাকএন্ডে `/users`, `/roles`, `/permissions`, `/audit-logs` আছে, কিন্তু ফ্রন্টএন্ড এখনো `useGetBootstrapQuery()` মক ডাটায় চলছে।
- **প্রতিষ্ঠান ও ওয়েবসাইট CMS (`/admin/institution/*`, `/admin/website/*`):** ব্যাকএন্ডে শুধু `/quick-links` আছে; বাকি সব (`SchoolProfile`, `Administrator`, `ManagingCommitteeMember`, `WebsiteBanner`, `Gallery`, `LeadershipMessage`, `AdmissionContent`, `ContactInformation`, `Publication`, `Achievement`) ব্যাকএন্ড API-বিহীন এবং ফ্রন্টএন্ডে মক।
- **গ্রন্থাগার (`/admin/library`), ডিজিটাল শিক্ষা (`/admin/digital-education/*`), রিপোর্ট (`/admin/reports`), সেটিংস (`/admin/settings`):** সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে; ব্যাকএন্ডে কোনো API মডিউল নেই।

---

## ৪. দ্রুত করণীয় চেকলিস্ট (প্রায়োরিটি অনুযায়ী)

1. **ব্যাকএন্ড রেডি আছে — শুধু ফ্রন্টএন্ড কানেক্ট করলেই লাইভ হবে:**
   - [AdminAcademicPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminAcademicPage.tsx) থেকে `useGetBootstrapQuery()` ও পুরোনো মক সিলেবাস কোড সরানো।
   - `StudentPromotions.tsx` -> `/academic/promotions` (`promotions.api.ts`) কানেক্ট করা।
   - `GradingScalesView.tsx` -> `/examination/grading-scales` কানেক্ট করা।
   - `AdminUsersPage.tsx` -> `/users`, `/roles`, `/permissions`, `/audit-logs` কানেক্ট করা।
   - [hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L167)-এ `examination|class-routines|users|roles|permissions|audit-logs|quick-links` যোগ করা।
2. **ব্যাকএন্ড + ফ্রন্টএন্ড নতুন করে বানাতে হবে:**
   - `/admin/dashboard` সামারি API, `/students/import` (CSV), `/examinations/admit-cards` ও `seat-plan`, `AcademicPolicies`, `News/Event/Career`, `Library`, `DigitalEducation`, `Website CMS` ও `Institution Settings`।
