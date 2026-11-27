# অ্যাডমিন সাইট — পূর্ণাঙ্গ ও হালনাগাদ অডিট রিপোর্ট (Frontend + Backend)

এই ডকুমেন্টে **অ্যাডমিন প্যানেল (`/admin`)**-এর সর্বশেষ বাস্তব অবস্থা (কোড ও লাইভ ভেরিফিকেশন অনুযায়ী) তুলে ধরা হয়েছে—কোন কোন মডিউল **১০০% লাইভ ও সম্পন্ন**, কোনগুলো **আংশিক লাইভ / মক-আটকা**, এবং কোনগুলোতে **ব্যাকএন্ড ও ফ্রন্টএন্ড উভয়ই বাকি**—যাতে ধাপে ধাপে পরবর্তী কাজগুলো করা যায়।

---

## ১. মূল আর্কিটেকচারাল অবস্থা (`hybrid-base-query.ts` ও `/bootstrap`)

1. **`requireLiveApi` গার্ড ([hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L167)):**
   - বর্তমানে যেসব রুট মক ফলব্যাক থেকে সম্পূর্ণ ব্লক করা আছে:
     `/^\/(?:notices|auth|academic|staff|attendance|admin)(?:[/?]|$)/`
   - এখনো প্রোটেক্টেড **নয়**: `/examination`, `/class-routines`, `/users`, `/roles`, `/permissions`, `/audit-logs`, `/quick-links`, `/notifications` (এগুলোতে ৪0৪ বা নেটওয়ার্ক এরর হলে ফ্রন্টএন্ড নীরবে মক অ্যাডাপ্টারে ফলব্যাক করতে পারে)।
2. **`useGetBootstrapQuery()`:**
   - ব্যাকএন্ডে `GET /bootstrap` নেই; তাই যেসব কম্পোনেন্ট এখনো `useGetBootstrapQuery()` কল করে, সেগুলো ইন-মেমরি মক ডাটা (`src/mocks/seed.ts`) ব্যবহার করে।

---

## ২. এক নজরে অ্যাডমিন মডিউলসমূহের বর্তমান স্ট্যাটাস

| ক্রম | মডিউল | বর্তমান অবস্থা | বিস্তারিত |
| :--- | :--- | :--- | :--- |
| ১ | **অ্যাডমিন ড্যাশবোর্ড** (`/admin`) | **১০০% লাইভ (সম্পন্ন)** | `AdminDashboardModule` (`/admin/dashboard/overview`, `attendance-trend`, `attendance-insights`, `exam-performance`, `operations`) + `notices/admin`। কোনো মক বা স্ট্যাটিক ডাটা নেই। |
| ২ | **হাজিরা ও SMS** (`/admin/attendance/*`) | **১০০% লাইভ (সম্পন্ন)** | `daily`, `reports`, `sms-logs`, `settings` — `AttendanceModule` (`/attendance/*`), সার্ভার-সাইড প্যাজিনেশন/সার্চ/ফিল্টারসহ। |
| ৩ | **শিক্ষক ও কর্মচারী** (`/admin/staff`) | **১০০% লাইভ (সম্পন্ন)** | `StaffModule` (`/staff/*`) + সার্ভার প্যাজিনেশন। |
| ৪ | **অভিভাবক** (`/admin/parents/*`) | **১০০% লাইভ (সম্পন্ন)** | `ParentModule` (`/academic/parents/*`), কোনো মক নেই। |
| ৫ | **শিক্ষার্থী** (`/admin/students/*`) | **আংশিক লাইভ (৮/১০)** | ৮টি সাব-পেজ লাইভ; **প্রমোশন** ও **CSV আমদানি** এখনো মক। |
| ৬ | **একাডেমিক ও রুটিন** (`/admin/academic/*`) | **সাব-প্যানেল লাইভ, শেল মক-আটকা** | ভেতরের লাইভ প্যানেলগুলো (`/years`, `/groups`, `/classes`, `/sections`, `/subjects`, `/class-subjects`, `/books`, `/class-teachers`, `/teacher-assignments`, `/class-routines`, `/events`, `/documents`) লাইভ API ব্যবহার করে; কিন্তু প্যারেন্ট [AdminAcademicPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminAcademicPage.tsx) এখনো শীর্ষে `useGetBootstrapQuery()`-তে আটকে আছে, আর **`policies`** ট্যাব সম্পূর্ণ মক। |
| ৭ | **পরীক্ষা ও ফলাফল** (`/admin/examinations/*`, `/admin/results/*`) | **আংশিক লাইভ (৪/৯ + ১ হাইব্রিড)** | ৪টি লাইভ (`exams`, `routines`, `marks-entry`, `publication`); ১টি হাইব্রিড (`merit-list` — শুধু `SchoolProfile` মক); ৪টি সম্পূর্ণ মক (`admit-cards`, `seat-plan`, `grading-scales`, `consolidated`)। |
| ৮ | **নোটিশ, নিউজ, ইভেন্ট, ক্যারিয়ার** (`/admin/notices`, `/news`, `/events`, `/careers`) | **আংশিক লাইভ (১/৪)** | **নোটিশ** ১০০% লাইভ (`/notices`); **নিউজ, ইভেন্ট, ক্যারিয়ার** এখনো মক (ব্যাকএন্ড API নেই)। |
| ৯ | **ব্যবহারকারী, রোল, পারমিশন ও অডিট** (`/admin/users`, `/roles`, `/permissions`, `/audit-logs`) | **ফ্রন্টএন্ড মক** | ব্যাকএন্ডে `/users`, `/roles`, `/permissions`, `/audit-logs` আছে, কিন্তু [AdminUsersPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminUsersPage.tsx) এখনো `useGetBootstrapQuery()` চালায়। |
| ১০ | **প্রতিষ্ঠান ও ওয়েবসাইট CMS** (`/admin/institution/*`, `/admin/website/*`) | **ফ্রন্টএন্ড মক** | ব্যাকএন্ডে শুধু `QuickLinkModule` (`/quick-links`) আছে; বাকি সব (`SchoolProfile`, `Administrator`, `Committee`, `Banner`, `Gallery`, `LeadershipMessage`, `AdmissionContent`, `Contact`, `Publication`, `Achievement`) ব্যাকএন্ড API-বিহীন ও মক। |
| ১১ | **গ্রন্থাগার** (`/admin/library`) | **১০০% মক** | Prisma-এ মডেল থাকলেও ব্যাকএন্ডে `LibraryModule` নেই। |
| ১২ | **ডিজিটাল শিক্ষা** (`/admin/digital-education/*`) | **১০০% মক** | Prisma-এ মডেল থাকলেও ব্যাকএন্ডে `DigitalEducationModule` নেই। |
| ১৩ | **রিপোর্ট ও অডিট** (`/admin/reports`) | **১০০% মক** | [AdminReportsPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-content/components/AdminReportsPage.tsx) সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। |
| ১৪ | **সেটিংস ও প্রোফাইল** (`/admin/settings`) | **১০০% মক** | [AdminSettingsPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-content/components/AdminSettingsPage.tsx) সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। |

---

## ৩. স্টেপ-বাই-স্টেপ পরবর্তী কাজের রোডম্যাপ (অগ্রাধিকার অনুযায়ী)

### ধাপ ১: ব্যাকএন্ড আগে থেকেই রেডি — শুধু ফ্রন্টএন্ড কানেক্ট করলেই হবে
1. **ব্যবহারকারী, রোল ও অডিট লগ (`/admin/users`, `/roles`, `/permissions`, `/audit-logs`):**
   - ড্যাশবোর্ডের `সম্পূর্ণ লগ` লিংকটিও এখানে আসে; ব্যাকএন্ডের `/users`, `/roles`, `/permissions`, `/audit-logs`-এর সাথে [AdminUsersPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminUsersPage.tsx) কানেক্ট করা।
2. **একাডেমিক প্যারেন্ট শেল পরিষ্কার করা (`/admin/academic/*`):**
   - [AdminAcademicPage.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/admin-core/components/AdminAcademicPage.tsx) থেকে `useGetBootstrapQuery()` ও পুরোনো মক সিলেবাস কোড সরিয়ে ফেলা।
3. **শিক্ষার্থী প্রমোশন (`/admin/students/promotions`):**
   - [StudentPromotions.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/students/components/admin/StudentPromotions.tsx)-কে ব্যাকএন্ড `/academic/promotions` (`promotions.api.ts`)-এর সাথে কানেক্ট করা।
4. **গ্রেডিং স্কেল (`/admin/examinations/grading-scales`) ও মেধাতালিকা (`merit-list`):**
   - [GradingScalesView.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/examinations/components/GradingScalesView.tsx)-কে `/examination/grading-scales`-এ কানেক্ট করা।
   - [MeritAndMarksheetsView.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/examinations/components/MeritAndMarksheetsView.tsx) থেকে `useGetBootstrapQuery()` সরানো।
5. **`requireLiveApi` গার্ড আপডেট:**
   - [hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L167)-এ `examination|class-routines|users|roles|permissions|audit-logs|quick-links` যুক্ত করা।

### ধাপ ২: ব্যাকএন্ড API + ফ্রন্টএন্ড উভয়ই বানাতে হবে
1. **শিক্ষার্থী CSV বাল্ক ইম্পোর্ট** (`/admin/students/import`)
2. **পরীক্ষার বাকি ৩টি মডিউল:** প্রবেশপত্র (`admit-cards`), আসন ও হল হাজিরা (`seat-plan`), সমন্বিত ফলাফল (`consolidated`)
3. **নিউজ, ইভেন্ট ও ক্যারিয়ার** (`/admin/news`, `/admin/events`, `/admin/careers`)
4. **প্রতিষ্ঠান সেটিংস ও ওয়েবসাইট CMS** (`/admin/institution/*`, `/admin/website/*`, `/admin/settings`)
5. **গ্রন্থাগার ও ডিজিটাল শিক্ষা** (`/admin/library`, `/admin/digital-education/*`)
6. **একাডেমিক নীতিমালা (`/admin/academic/policies`) ও রিপোর্ট (`/admin/reports`)**
