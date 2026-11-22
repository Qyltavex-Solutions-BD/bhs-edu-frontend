# ফলাফল ও মার্কশিট (Results & Marksheets) — মডিউল স্পেসিফিকেশন ও ব্যাকএন্ড ইমপ্লিমেন্টেশন গাইডলাইন

এই ডকুমেন্টটি **ভোজেশ্বর উচ্চ বিদ্যালয় (Bhojeshwar High School — BHS)** প্ল্যাটফর্মের অ্যাডমিন প্যানেলের **"ফলাফল ও মার্কশিট" (Results & Marksheets)** সেকশনের ৩টি সাব-পেজের কাজের ধারাবাহিকতা (ধাপ ১ → ধাপ ২ → ধাপ ৩), বিজনেস লজিক, ভ্যালিডেশন নিয়মাবলী এবং নেক্সট-ফেজ ব্যাকএন্ড (NestJS + PostgreSQL/Prisma) তৈরির উপযোগী পূর্ণাঙ্গ স্পেসিফিকেশন।

---

## সূচিপত্র (Table of Contents)
1. [মডিউল পরিচিতি ও কাজের স্বাভাবিক প্রবাহ](#১-মডিউল-পরিচিতি-ও-কাজের-স্বাভাবিক-প্রবাহ)
2. [ধাপ ১: প্রক্রিয়াকরণ ও প্রকাশ (`/admin/results/publication`)](#২-ধাপ-১-প্রক্রিয়াকরণ-ও-প্রকাশ-adminresultspublication)
3. [ধাপ ২: মেধাতালিকা ও মার্কশিট (`/admin/results/merit-list`)](#৩-ধাপ-২-মেধাতালিকা-ও-মার্কশিট-adminresultsmerit-list)
4. [ধাপ ৩: সমন্বিত ফলাফল (`/admin/results/consolidated`)](#৪-ধাপ-৩-সমন্বিত-ফলাফল-adminresultsconsolidated)
5. [ফলাফল ও জিপিএ গণনার পূর্ণাঙ্গ অ্যালগরিদম (Calculation Engine)](#৫-ফলাফল-ও-জিপিএ-গণনার-পূর্ণাঙ্গ-অ্যালগরিদম-calculation-engine)
6. [সমন্বিত ফলাফল (Consolidated) গণনার অ্যালগরিদম](#৬-সমন্বিত-ফলাফল-consolidated-গণনার-অ্যালগরিদম)
7. [অফিসিয়াল প্রিন্ট ও এক্সপোর্ট ইঞ্জিন স্পেসিফিকেশন](#৭-অফিসিয়াল-প্রিন্ট-ও-এক্সপোর্ট-ইঞ্জিন-স্পেসিফিকেশন)
8. [এসএমএস গেটওয়ে ও নোটিফিকেশন নীতিমালা](#৮-এসএমএস-গেটওয়ে-ও-নোটিফিকেশন-নীতিমালা)
9. [ডেটাবেস স্কিমা ও সম্পর্ক (ERD Reference)](#৯-ডেটাবেস-স্কিমা-ও-সম্পর্ক-erd-reference)
10. [নিরাপত্তা, রোল পারমিশন (RBAC) ও অডিট ট্রেইল](#১০-নিরাপত্তা-রোল-পারমিশন-rbac-ও-অডিট-ট্রেইল)

---

## ১. মডিউল পরিচিতি ও কাজের স্বাভাবিক প্রবাহ

```
┌────────────────────────────────────────────────────────────────────────┐
│                      পরীক্ষা ও নম্বর এন্ট্রি সম্পন্ন                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  ধাপ ১: প্রক্রিয়াকরণ ও প্রকাশ (/admin/results/publication)             │
│  • নম্বর এন্ট্রি অগ্রগতি যাচাই                                         │
│  • নম্বর লক / আনলক ও ডেডলাইন বৃদ্ধি                                   │
│  • জিপিএ ও মেধাক্রম গণনা (CALCULATE)                                   │
│  • ফলাফল প্রকাশ (PUBLISH) / স্থগিত (WITHHOLD) + SMS প্রেরণ              │
│  • খাতা পুনঃনিরীক্ষণ (Scrutiny) আবেদন ও তাৎক্ষণিক পুনর্গণনা             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  ধাপ ২: মেধাতালিকা ও মার্কশিট (/admin/results/merit-list)              │
│  • শ্রেণি ও শাখা মেধার তালিকা দেখা ও ফিল্টার                           │
│  • শ্রেণি শিক্ষকের মন্তব্য (Remarks) সংরক্ষণ                            │
│  • একক একাডেমিক ট্রান্সক্রিপ্ট ও বাল্ক মার্কশিট প্রিন্ট                 │
│  • ক্লাস ট্যাবুলেশন শিট (Tabulation Sheet - Landscape A4) প্রিন্ট      │
│  • পূর্ণাঙ্গ ফলাফল CSV / Excel ডাউনলোড                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  ধাপ ৩: সমন্বিত ফলাফল (/admin/results/consolidated)                   │
│  • একাধিক টার্ম পরীক্ষা (যেমন: ১ম + ২য় + বার্ষিক) নির্বাচন              │
│  • শতকরা ওয়েটেজ (Weightage % - মোট ১০০%) কনফিগার                       │
│  • চূড়ান্ত বাৎসরিক জিপিএ ও মেধাক্রম অটো-ক্যালকুলেশন                    │
│  • বার্ষিক সমন্বিত রেজিস্টার শিট (Landscape A4) প্রিন্ট ও CSV ডাউনলোড  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ২. ধাপ ১: প্রক্রিয়াকরণ ও প্রকাশ (`/admin/results/publication`)
* **ইউআরএল:** `/admin/results/publication` (অথবা `/admin/results`)
* **সংশ্লিষ্ট ফ্রন্টএন্ড ভিউ:** `ResultPublicationView` (`src/views/admin/examinations/ResultPublicationView.tsx`)
* **মূল উদ্দেশ্য:** নম্বর এন্ট্রি যাচাই করা, স্বয়ংক্রিয়ভাবে GPA ও ক্লাস/শাখা মেধা হিসাব করা, ফলাফল লাইভ করা বা প্রয়োজনে স্থগিত করা এবং খাতা চ্যালেঞ্জ নিষ্পত্তি করা।

### কী কী কাজ করা যাবে (Allowed Actions)
1. **নম্বর এন্ট্রি অগ্রগতি মনিটরিং:**
   - নির্বাচিত পরীক্ষার সকল বিষয়ে কত শতাংশ নম্বর এন্ট্রি হয়েছে তা প্রগ্রেস বার ও পরিসংখ্যান কার্ডে দেখা।
   - কোনো নির্দিষ্ট বিষয়ের নম্বর বাকি থাকলে সেই বিষয়ের কার্ডে ক্লিক করে সরাসরি নম্বর এন্ট্রি পেজে (`/admin/examinations/marks-entry?examId=...&subjectId=...`) যাওয়া।
2. **নম্বর লক ও আনলক (Lock / Unlock):**
   - শিক্ষকদের নম্বর এন্ট্রি ফ্রিজ করার জন্য পরীক্ষাটি তাৎক্ষণিকভাবে **লক** (`isLocked: true`) করা।
   - বিশেষ প্রয়োজনে আবার **আনলক** (`isLocked: false`) করে নতুন বর্ধিত ডেডলাইন (`extendDeadline`) নির্ধারণ করা।
3. **জিপিএ ও মেধাক্রম গণনা (`action: 'CALCULATE'`):**
   - জাতীয় শিক্ষাক্রম (NCTB) নিয়ম অনুসারে লিখিত, নৈর্ব্যক্তিক ও ব্যবহারিক পৃথক পাস এবং ৪র্থ ঐচ্ছিক বিষয়ের বোনাস হিসাব করে এক ক্লিকে সকল শিক্ষার্থীর জিপিএ ও ক্লাস/শাখা মেধাক্রম জেনারেট করা।
4. **ফলাফল প্রকাশ ও স্থগিত (`action: 'PUBLISH' | 'WITHHOLD'`):**
   - ফলাফল প্রকাশ করা (`ResultPublicationStatus.PUBLISHED`), যার সাথে সাথে পাবলিক রেজাল্ট পোর্টাল (`/results`), অভিভাবক পোর্টাল এবং স্টুডেন্ট পোর্টালে ফলাফল লাইভ দৃশ্যমান হয়।
   - প্রকাশের সময় চাইলে এক ক্লিকে অভিভাবকদের কাছে রেজাল্ট এসএমএস পাঠানোর অপশন (`sendSms: true`) অন/অফ করা।
   - ফলাফল প্রকাশের সাথে সাথে পরীক্ষাটি স্বয়ংক্রিয়ভাবে লক (`isLocked: true`) হয়ে যায়।
   - কোনো প্রশাসনিক অসঙ্গতি দেখা দিলে প্রকাশিত ফলাফল তাৎক্ষণিকভাবে **স্থগিত** (`ResultPublicationStatus.WITHHOLD`) করে রাখা।
5. **ফলাফল ড্যাশবোর্ড ও বিশ্লেষণ (Analytics Strip):**
   - বিষয়ভিত্তিক পাসের হার, গড় নম্বর, সর্বোচ্চ ও সর্বনিম্ন নম্বর দেখা।
   - গ্রেড ডিস্ট্রিবিউশন চার্ট (A+, A, A-, B, C, D, F-এর সংখ্যা ও শতাংশ) দেখা।
6. **খাতা পুনঃনিরীক্ষণ (Scrutiny / Challenge Management):**
   - শিক্ষার্থীর খাতা চ্যালেঞ্জের নতুন আবেদন যুক্ত করা (`PENDING`, `UNDER_REVIEW`)।
   - পুনঃনিরীক্ষণের সিদ্ধান্ত ও সংশোধিত নম্বর ইনপুট দেওয়া (`NO_CHANGE` অথবা `UPDATED`)।
   - নম্বর আপডেট হলে সিস্টেম স্বয়ংক্রিয়ভাবে ওই পরীক্ষার সামগ্রিক জিপিএ ও মেধাতালিকা রিক্যালকুলেট (Recalculate) করে নেয়।

### কী কী কাজ করা যাবে না বা সীমাবদ্ধতা (Prohibited Actions & Validation Constraints)
* ❌ **নম্বর অপূর্ণ অবস্থায় প্রকাশ নিষিদ্ধ:** কোনো বিষয়ে নম্বর এন্ট্রি অসম্পূর্ণ থাকলে ফলাফল প্রকাশের চেষ্টা করলে সিস্টেম ব্লকিং ওয়ার্নিং দেবে।
* ❌ **অননুমোদিত নম্বর এডিটিং নয়:** এখানে সরাসরি বাল্ক নম্বর টাইপ করা যাবে না; নম্বর পরিবর্তনের জন্য খাতা পুনঃনিরীক্ষণ মডাল ব্যবহার করতে হবে অথবা আনলক করে নম্বর এন্ট্রি পেজে যেতে হবে।
* ❌ **মার্কশিট প্রিন্ট ও শ্রেণি শিক্ষকের মন্তব্য এই পেজে নয়:** এটি ফলাফল প্রকাশ ও গণনার পেজ; মার্কশিট প্রিন্ট ও মন্তব্য লিখতে হবে ধাপ ২-এ।

### ব্যাকএন্ড API এন্ডপয়েন্ট ও পে-লোড (Endpoints & Payloads)
```http
POST /api/v1/exams/process-results
Content-Type: application/json

Body:
{
  "examId": "exam-ann-10",
  "action": "CALCULATE" | "PUBLISH" | "WITHHOLD" | "LOCK" | "UNLOCK",
  "extendDeadline": "2026-12-25", // optional, only when UNLOCK
  "sendSms": true                 // optional, only when PUBLISH
}

Response (200 OK):
{
  "exam": {
    "id": "exam-ann-10",
    "resultStatus": "PUBLISHED",
    "isLocked": true,
    "publishedAt": "2026-11-22T19:45:00Z"
  },
  "processedCount": 128,
  "smsSentCount": 128
}
```

```http
POST /api/v1/exams/scrutiny/upsert
Content-Type: application/json

Body:
{
  "examId": "exam-ann-10",
  "studentEnrollmentId": "enr-001",
  "examSubjectId": "es-bangla-1",
  "status": "UPDATED",
  "previousMarks": { "written": 55, "mcq": 22, "practical": 0, "continuousAssessment": 0 },
  "updatedMarks": { "written": 60, "mcq": 22, "practical": 0, "continuousAssessment": 0 },
  "resolutionNotes": "পুনঃগণনায় লিখিত অংশে ৫ নম্বর যোগ হয়েছে।"
}

Response (200 OK):
{
  "scrutiny": { "id": "scr-901", "status": "UPDATED" },
  "recalculated": true
}
```

---

## ৩. ধাপ ২: মেধাতালিকা ও মার্কশিট (`/admin/results/merit-list`)
* **ইউআরএল:** `/admin/results/merit-list`
* **সংশ্লিষ্ট ফ্রন্টএন্ড ভিউ:** `MeritAndMarksheetsView` (`src/views/admin/examinations/MeritAndMarksheetsView.tsx`)
* **মূল উদ্দেশ্য:** ধাপ ১-এ গণনাকৃত ফলাফল থেকে মেধাতালিকা দেখা, শিক্ষার্থীদের বিষয়ে শ্রেণি শিক্ষকের মূল্যায়ন মন্তব্য সংরক্ষণ করা এবং অফিসিয়াল মার্কশিট ও ট্যাবুলেশন শিট প্রিন্ট ও ডাউনলোড করা।

### কী কী কাজ করা যাবে (Allowed Actions)
1. **মেধাতালিকা পর্যবেক্ষণ ও মাল্টি-লেভেল ফিল্টারিং:**
   - যেকোনো সাধারণ পরীক্ষা (Non-consolidated) নির্বাচন করা।
   - শাখা (Section), বিভাগ/গ্রুপ (Science, Humanities, Business Studies), ফলাফল অবস্থা (সকল, শুধুমাত্র উত্তীর্ণ, শুধুমাত্র অনুত্তীর্ণ) এবং নাম/রোল/আইডি দিয়ে ফিল্টার ও সার্চ করা।
2. **সারসংক্ষেপ পরিসংখ্যান (KPIs):**
   - মোট পরীক্ষার্থী, উত্তীর্ণ সংখ্যা ও সামগ্রিক পাসের হার (%), GPA 5.00 (A+) প্রাপ্তির সংখ্যা এবং অনুত্তীর্ণ সংখ্যা একনজরে প্রদর্শন।
3. **র‌্যাঙ্কিং ও বিস্তারিত ডেটা টেবিলে প্রদর্শন:**
   - শ্রেণি মেধা (Class Merit), শাখা মেধা (Section Merit), রোল, নাম, পিতা-মাতার নাম।
   - মোট নম্বর (শতাংশসহ), জিপিএ (৪র্থ বিষয়সহ এবং ৪র্থ বিষয় ছাড়া), সামগ্রিক লেটার গ্রেড এবং কয়টি বিষয়ে ফেল করেছে তা স্পষ্ট দেখা।
4. **শ্রেণি শিক্ষকের মূল্যায়ন মন্তব্য (Teacher Remarks) সংরক্ষণ:**
   - প্রতিটি শিক্ষার্থীর জন্য পৃথক মূল্যায়ন মন্তব্য ইনপুট দেওয়া ও সংরক্ষণ করা।
   - দ্রুত মন্তব্য যুক্ত করার জন্য রেডিমেড টেমপ্লেট ড্রপডাউন (যেমন: *"অসাধারণ ফলাফল। তোমার মেধা ও অধ্যবসায় প্রশংসনীয়..."*, *"সন্তোষজনক অগ্রগতি..."*, *"অনুত্তীর্ণ বিষয়ে বিশেষ প্রস্তুতি প্রয়োজন..."*)।
   - এই মন্তব্যটি সরাসরি শিক্ষার্থীর অফিসিয়াল প্রিন্ট মার্কশিটে স্থান পায়।
5. **একক একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট প্রিন্ট ও PDF:**
   - যেকোনো শিক্ষার্থীর নামের পাশের মার্কশিট বাটনে ক্লিক করে BHS-এর প্রাতিষ্ঠানিক লোগো, ওয়াটারমার্ক, বিষয়ভিত্তিক লেটার গ্রেড, গ্রেড পয়েন্ট, উপস্থিতি ও স্বাক্ষরসহ অফিসিয়াল ট্রান্সক্রিপ্ট প্রিভিউ এবং প্রিন্ট/PDF করা।
6. **বাল্ক মার্কশিট প্রিন্ট (Bulk Marksheets):**
   - ফিল্টারকৃত পুরো ক্লাস বা শাখার সকল শিক্ষার্থীর মার্কশিট একসাথে সিলেক্ট করে এক ক্লিকে পেজ-ব্রেক সহ ব্যাচ প্রিন্ট করা।
7. **ক্লাস ট্যাবুলেশন শিট (Tabulation Sheet - Landscape A4):**
   - পুরো শ্রেণি/শাখার সকল শিক্ষার্থীর সকল বিষয়ের পূর্ণমান, পাস নম্বর, প্রাপ্ত নম্বর (লিখিত+MCQ+ব্যবহারিক) এবং গ্রেড সমন্বিত ব্রডশিট ল্যান্ডস্কেপ A4 ফরম্যাটে প্রিভিউ ও প্রিন্ট করা।
8. **পূর্ণাঙ্গ CSV / Excel এক্সপোর্ট:**
   - রোল, নাম, প্রতিটি বিষয়ের নম্বর, মোট নম্বর, GPA, গ্রেড, মেধা ও শিক্ষকের মন্তব্যসহ পূর্ণাঙ্গ ডেটাসেট এক ক্লিকে CSV আকারে ডাউনলোড করা।

### কী কী কাজ করা যাবে না বা সীমাবদ্ধতা (Prohibited Actions & Validation Constraints)
* ❌ **ফলাফল গণনা বা প্রকাশ এই পেজে নয়:** ফলাফল রিক্যালকুলেট বা স্ট্যাটাস পরিবর্তন করতে হলে ধাপ ১-এ যেতে হবে।
* ❌ **সরাসরি নম্বর পরিবর্তন নিষিদ্ধ:** এই পেজে কোনো শিক্ষার্থীর প্রাপ্ত নম্বর সরাসরি এডিট করা যায় না (নম্বর সুরক্ষিত থাকে)।
* ❌ **সমন্বিত বাৎসরিক পরীক্ষা এখানে নির্বাচন নয়:** এখানে একক পরীক্ষা নির্বাচন করতে হবে; একাধিক পরীক্ষা মিলিয়ে বাৎসরিক ফলাফল তৈরি করতে হবে ধাপ ৩-এ।

### ব্যাকএন্ড API এন্ডপয়েন্ট ও পে-লোড (Endpoints & Payloads)
```http
POST /api/v1/exams/remarks/save
Content-Type: application/json

Body:
{
  "resultSummaryId": "rs-1001",
  "teacherRemarks": "অসাধারণ ফলাফল। তোমার মেধা ও অধ্যবসায় প্রশংসনীয়; এই ধারাবাহিকতা বজায় রাখো।"
}

Response (200 OK):
{
  "id": "rs-1001",
  "teacherRemarks": "...",
  "updatedAt": "2026-11-22T19:50:00Z"
}
```

```http
GET /api/v1/exams/:examId/merit-list?sectionId=sec-a&groupId=grp-sci&status=PASSED&search=রাকিব
Response (200 OK):
{
  "summary": {
    "totalStudents": 45,
    "passedCount": 42,
    "failedCount": 3,
    "passPercentage": 93.33,
    "gpa5Count": 12
  },
  "results": [
    {
      "resultSummaryId": "rs-1001",
      "studentEnrollmentId": "enr-001",
      "studentId": "BHS-2026-1001",
      "roll": 1,
      "nameBn": "মোঃ রাকিবুল হাসান",
      "meritPosition": 1,
      "sectionMeritPosition": 1,
      "totalMarks": 845,
      "totalFullMarks": 900,
      "gpa": 5.00,
      "gpaWithoutOptional": 5.00,
      "letterGrade": "A+",
      "failedSubjectCount": 0,
      "teacherRemarks": "অসাধারণ ফলাফল..."
    }
  ]
}
```

---

## ৪. ধাপ ৩: সমন্বিত ফলাফল (`/admin/results/consolidated`)
* **ইউআরএল:** `/admin/results/consolidated`
* **সংশ্লিষ্ট ফ্রন্টএন্ড ভিউ:** `ConsolidatedResultsView` (`src/views/admin/examinations/ConsolidatedResultsView.tsx`)
* **মূল উদ্দেশ্য:** একই শ্রেণির একাধিক সাধারণ টার্ম পরীক্ষা (যেমন: ১ম সাময়িক + ২য় সাময়িক + বার্ষিক অথবা অর্ধবার্ষিক + বার্ষিক) নির্দিষ্ট শতকরা অনুপাতে (Weightage %) সমন্বয় করে চূড়ান্ত বাৎসরিক ফলাফল ও সমন্বিত মেধাতালিকা প্রস্তুত করা।

### কী কী কাজ করা যাবে (Allowed Actions)
1. **নতুন সমন্বিত পরীক্ষা তৈরি (Create Consolidated Exam):**
   - পরীক্ষার নাম (যেমন: *"বার্ষিক সমন্বিত চূড়ান্ত ফলাফল ২০২৬"*), শ্রেণি ও শিক্ষাবর্ষ দিয়ে নতুন সমন্বিত পরীক্ষার কাঠামো তৈরি করা (`examType: ExamType.CONSOLIDATED`)।
2. **উৎস পরীক্ষা ও ওয়েটেজ কনফিগারেশন (`ConsolidatedExamConfig`):**
   - সংশ্লিষ্ট শ্রেণির কমপক্ষে ২টি বা ততোধিক সাধারণ পরীক্ষা নির্বাচন করা।
   - প্রতিটি নির্বাচিত পরীক্ষার জন্য শতকরা হার (Weightage %) নির্ধারণ করা।
   - দ্রুত নির্ধারণের জন্য প্রিসেট বাটন:
     - `50% + 50%` (অর্ধবার্ষিক ৫০% + বার্ষিক ৫০%)
     - `30% + 70%` (অর্ধবার্ষিক ৩০% + বার্ষিক ৭০%)
     - `20% + 30%` (১ম সাময়িক ২০% + ২য় সাময়িক ৩০% + বার্ষিক ৫০%)
   - সিস্টেম নিশ্চিত করে যে সকল নির্বাচিত পরীক্ষার ওয়েটেজের যোগফল **ঠিক ১০০%** হয়েছে।
3. **স্বয়ংক্রিয় সমন্বিত হিসাব ও মেধাক্রম (Automated Weighted GPA):**
   - প্রতিটি শিক্ষার্থীর প্রতিটি উৎস পরীক্ষার জিপিএ এবং নম্বরের ওয়েটেড গড় বের করে চূড়ান্ত সমন্বিত জিপিএ, লেটার গ্রেড, অবস্থা (`PASSED`, `FAILED`, বা অনুপস্থিতির কারণে `INCOMPLETE`) এবং সমন্বিত মেধাক্রম টেবিলটিতে স্বয়ংক্রিয়ভাবে সাজানো।
4. **সমন্বিত রেজিস্টার শিট প্রিন্ট (Landscape A4):**
   - প্রাতিষ্ঠানিক ফরম্যাটে প্রতিটি উৎস পরীক্ষার প্রাপ্ত নম্বর/GPA এবং চূড়ান্ত সমন্বিত ফলাফল ও মেধা সংবলিত ব্রডশিট ল্যান্ডস্কেপ A4 পেপারে প্রিন্ট (`PrintableConsolidatedResultSheet`) করা।
5. **সমন্বিত CSV এক্সপোর্ট:**
   - সকল উৎস পরীক্ষার নম্বর কলাম ও সমন্বিত ফলাফল কলামসহ পূর্ণাঙ্গ ডেটা এক্সেল/CSV আকারে ডাউনলোড করা।

### কী কী কাজ করা যাবে না বা সীমাবদ্ধতা (Prohibited Actions & Validation Constraints)
* ❌ **১০০% এর কম বা বেশি ওয়েটেজ নিষিদ্ধ:** নির্বাচিত উৎস পরীক্ষাগুলোর ওয়েটেজ যোগ করে যদি ৯৯% বা ১০১% হয়, তবে সিস্টেম কনফিগারেশন সেভ করতে দেবে না (অবশ্যই হুবহু `sum === 100` হতে হবে)।
* ❌ **উৎস পরীক্ষা অপ্রকাশিত থাকলে অসম্পূর্ণ দেখাবে:** কোনো উৎস পরীক্ষার ফলাফল যদি ধাপ ১ থেকে পূর্বে গণনা ও প্রকাশ করা না থাকে, তবে সেই শিক্ষার্থীর ঘরে সমন্বিত ফলাফল হিসাব না হয়ে 'অসম্পূর্ণ' (`INCOMPLETE`) স্ট্যাটাস দেখাবে।
* ❌ **একক মার্কশিট এই পেজে নয়:** সমন্বিত পেজে পুরো ক্লাসের সমন্বিত ব্রডশিট/রেজিস্টার প্রিন্ট করা যায়; আলাদা একক ট্রান্সক্রিপ্টের বদলে এটি প্রমোশন রেজিস্টার হিসেবে ব্যবহৃত হয়।
* ❌ **সরাসরি ক্লাস প্রমোশন এখান থেকে হয় না:** চূড়ান্ত ফলাফল প্রস্তুতের পর পরবর্তী ক্লাসে শিক্ষার্থীদের উত্তীর্ণ করার কাজ করতে হবে স্টুডেন্ট প্রমোশন মডিউল (`/admin/students/promotions`) থেকে।

### ব্যাকএন্ড API এন্ডপয়েন্ট ও পে-লোড (Endpoints & Payloads)
```http
POST /api/v1/exams/consolidated/save
Content-Type: application/json

Body:
{
  "consolidatedExamId": "exam-cons-10",
  "items": [
    { "sourceExamId": "exam-hy-10", "weightagePercentage": 40 },
    { "sourceExamId": "exam-ann-10", "weightagePercentage": 60 }
  ]
}

Response (200 OK):
[
  { "id": "cfg-1", "sourceExamId": "exam-hy-10", "weightagePercentage": 40 },
  { "id": "cfg-2", "sourceExamId": "exam-ann-10", "weightagePercentage": 60 }
]
```

---

## ৫. ফলাফল ও জিপিএ গণনার পূর্ণাঙ্গ অ্যালগরিদম (Calculation Engine)

ব্যাকএন্ডে `POST /api/v1/exams/process-results` কল হলে সার্ভিস লেয়ারে নিচের গাণিতিক ধাপগুলো ক্রমানুসারে এক্সিকিউট করতে হবে:

```typescript
// ১. প্রতিটি বিষয়ের জন্য শিক্ষার্থীর উপাদান পাস ও জিপিএ নির্ধারণ
for (const subject of examSubjects) {
  const mark = getStudentMark(studentId, subject.id);
  
  if (mark.isAbsent) {
    subjectResult.isPassed = false;
    subjectResult.gradePoint = 0.0;
    subjectResult.letterGrade = 'F';
    continue;
  }

  // কম্পোনেন্ট পাস যাচাই (লিখিত, MCQ, ব্যবহারিক)
  let componentFail = false;
  if (subject.hasWritten && mark.writtenMarks < (subject.writtenPassMarks ?? 0)) componentFail = true;
  if (subject.hasMcq && mark.mcqMarks < (subject.mcqPassMarks ?? 0)) componentFail = true;
  if (subject.hasPractical && mark.practicalMarks < (subject.practicalPassMarks ?? 0)) componentFail = true;
  if (mark.totalMarks < subject.passMarks) componentFail = true;

  if (componentFail) {
    subjectResult.isPassed = false;
    subjectResult.gradePoint = 0.0;
    subjectResult.letterGrade = 'F';
  } else {
    subjectResult.isPassed = true;
    subjectResult.gradePoint = resolveGradePoint(mark.totalMarks, subject.fullMarks);
    subjectResult.letterGrade = resolveLetterGrade(mark.totalMarks, subject.fullMarks);
  }
}

// ২. ৪র্থ বিষয় ও সামগ্রিক জিপিএ হিসাব
const compulsoryResults = studentResults.filter(r => !r.isOptional);
const optionalResult = studentResults.find(r => r.isOptional);

const hasFailedCompulsory = compulsoryResults.some(r => !r.isPassed);

let gpa = 0.0;
let letterGrade = 'F';

if (hasFailedCompulsory) {
  gpa = 0.0;
  letterGrade = 'F';
} else {
  let bonusPoint = 0.0;
  if (optionalResult && optionalResult.isPassed && optionalResult.gradePoint > 2.0) {
    bonusPoint = optionalResult.gradePoint - 2.0;
  }
  
  const sumCompulsoryGP = compulsoryResults.reduce((acc, r) => acc + r.gradePoint, 0);
  const calculatedGpa = (sumCompulsoryGP + bonusPoint) / compulsoryResults.length;
  
  // জিপিএ কোনোভাবেই ৫.০০ এর বেশি হতে পারবে না
  gpa = Math.min(5.00, Number(calculatedGpa.toFixed(2)));
  letterGrade = resolveLetterFromGpa(gpa, true);
}

// ৩. মেধাক্রম নির্ধারণ (Merit Ranking Tie-Breaker Logic)
// অগ্রাধিকার ক্রম: ১. পাস স্ট্যাটাস > ২. GPA > ৩. সর্বমোট নম্বর > ৪. আবশ্যিক বিষয়ের নম্বর > ৫. রোল
```

---

## ৬. সমন্বিত ফলাফল (Consolidated) গণনার অ্যালগরিদম

সমন্বিত পরীক্ষায় প্রতিটি শিক্ষার্থীর মোট ওয়েটেড নম্বর ও জিপিএ নিচের সূত্রে বের হবে:

$$\text{Final Weighted Marks} = \sum_{i=1}^{n} \left( \text{TotalMarks}_{i} \times \frac{\text{Weightage}_{i}}{100} \right)$$

$$\text{Final Weighted GPA} = \sum_{i=1}^{n} \left( \text{GPA}_{i} \times \frac{\text{Weightage}_{i}}{100} \right)$$

* **পাস-ফেল শর্ত:** কোনো শিক্ষার্থী যদি উৎস পরীক্ষাগুলোর কোনোটিতে অনুত্তীর্ণ (`FAILED`) থাকে বা অনুপস্থিতির কারণে নম্বর অনুপস্থিত থাকে, তবে সমন্বিত নীতি অনুসারে অ্যাডমিন কনফিগারেশন অনুযায়ী তার সামগ্রিক ফলাফল মূল্যায়িত হবে।

---

## ৭. অফিসিয়াল প্রিন্ট ও এক্সপোর্ট ইঞ্জিন স্পেসিফিকেশন

| প্রিন্ট ডকুমেন্ট | কম্পোনেন্ট নেম | পেজ ওরিয়েন্টেশন | পেজ সাইজ | মূল উপাদানসমূহ |
| :--- | :--- | :---: | :---: | :--- |
| **অ্যাকাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট** | `PrintableMarksheet` | Portrait | A4 | মনোগ্রাম, শিক্ষার্থীর ছবি ও বিবরণ, বিষয়ভিত্তিক পূর্ণমান, পাস নম্বর, প্রাপ্ত নম্বর, লেটার গ্রেড, জিপিএ, শিক্ষকের মন্তব্য ও প্রধান শিক্ষকের স্বাক্ষর। |
| **বাল্ক মার্কশিট** | `PrintableBulkMarksheets` | Portrait | A4 | প্রতিটি শিক্ষার্থীর মার্কশিটের পর অটোমেটিক CSS `page-break-after: always` সহ ব্যাচ প্রিন্ট। |
| **ক্লাস ট্যাবুলেশন শিট** | `PrintableTabulationSheet` | Landscape | A4 | সকল শিক্ষার্থীর রোল, নাম, প্রতিটি বিষয়ের উপ-উপাদান নম্বর, মোট নম্বর, জিপিএ, গ্রেড ও মেধার সমন্বিত শিট। |
| **সমন্বিত রেজিস্টার শিট** | `PrintableConsolidatedResultSheet` | Landscape | A4 | প্রতিটি টার্ম পরীক্ষার ওয়েটেড নম্বর, চূড়ান্ত জিপিএ ও বাৎসরিক মেধা সংবলিত অফিসিয়াল প্রিন্ট। |

---

## ৮. এসএমএস গেটওয়ে ও নোটিফিকেশন নীতিমালা

ফলাফল প্রকাশের সময় যখন অ্যাডমিন `sendSms: true` নির্বাচন করবেন, তখন ব্যাকএন্ডে একটি অ্যাসিনক্রোনাস কিউ (`BullMQ` বা `NestJS EventEmitter`) ট্রিগার হবে:

### এসএমএস টেমপ্লেট ফরম্যাট (Bangla Unicode)
```
ভোজেশ্বর উচ্চ বিদ্যালয়
পরীক্ষা: অর্ধবার্ষিক পরীক্ষা ২০২৬
নাম: মোঃ রাকিবুল হাসান (রোল: ১)
শ্রেণি: ১০ম, শাখা: ক
জিপিএ: ৫.০০ (A+)
মেধাক্রম: ১ম (শ্রেণি), ১ম (শাখা)
বিস্তারিত ফলাফল দেখতে ভিজিট করুন: https://bhs.edu.bd/results
```
* **রেজিস্ট্রেশন মোবাইল নম্বর:** শিক্ষার্থীর প্রোফাইলে থাকা অভিভাবকের ভেরিফায়েড মোবাইল নম্বরে (`guardianPhone`) এসএমএস পৌঁছাবে।
* **লগ সংরক্ষণ:** প্রেরিত প্রতিটি এসএমএস `AttendanceSmsLog` বা `NotificationLog` টেবিলে ডেলিভারি স্ট্যাটাস সহ লগ হিসেবে সংরক্ষিত হবে।

---

## ৯. ডেটাবেস স্কিমা ও সম্পর্ক (ERD Reference)

```
[Exam] (id, academicYearId, classId, examType, resultStatus, isLocked, publishedAt)
  │
  ├── 1 : N ──> [ExamSubject] (id, subjectId, fullMarks, passMarks, isOptional)
  │               │
  │               └── 1 : N ──> [Mark] (id, studentEnrollmentId, written, mcq, practical, total, isAbsent, isLocked)
  │
  ├── 1 : N ──> [ResultSummary] (id, studentEnrollmentId, totalMarks, gpa, letterGrade, meritPosition, teacherRemarks)
  │
  ├── 1 : N ──> [StudentSubjectResult] (id, studentEnrollmentId, examSubjectId, gradePoint, letterGrade, isPassed)
  │
  ├── 1 : N ──> [ResultScrutinyRequest] (id, studentEnrollmentId, examSubjectId, status, previousMarks, updatedMarks)
  │
  └── 1 : N ──> [ConsolidatedExamConfig] (id, consolidatedExamId, sourceExamId, weightagePercentage)
```

---

## ১০. নিরাপত্তা, রোল পারমিশন (RBAC) ও অডিট ট্রেইল

| অ্যাকশন | SUPER_ADMIN | TEACHER | PARENT / STUDENT |
| :--- | :---: | :---: | :---: |
| **জিপিএ হিসাব ও ফলাফল প্রকাশ** | ✅ পূর্ণ এক্সেস | ❌ অনুমতি নেই | ❌ অনুমতি নেই |
| **পরীক্ষা লক ও আনলক করা** | ✅ পূর্ণ এক্সেস | ❌ অনুমতি নেই | ❌ অনুমতি নেই |
| **শ্রেণি শিক্ষকের মন্তব্য প্রদান** | ✅ পূর্ণ এক্সেস | ✅ নিজের ক্লাসের জন্য | ❌ অনুমতি নেই |
| **খাতা পুনঃনিরীক্ষণ আবেদন ও আপডেট** | ✅ পূর্ণ এক্সেস | ❌ অনুমতি নেই | 👁️ শুধুমাত্র স্ট্যাটাস ট্র্যাকিং |
| **মার্কশিট ও ট্যাবুলেশন শিট প্রিন্ট** | ✅ পূর্ণ এক্সেস | ✅ অনুমোদিত ক্লাসের জন্য | 👁️ শুধুমাত্র নিজের মার্কশিট |
| **সমন্বিত বাৎসরিক ফলাফল তৈরি** | ✅ পূর্ণ এক্সেস | ❌ অনুমতি নেই | ❌ অনুমতি নেই |

### অডিট লগ সংরক্ষণ
ফলাফল প্রকাশ, স্থগিত, নম্বর আনলক বা খাতা পুনঃনিরীক্ষণে নম্বর সংশোধনের প্রতিটি ঘটনার জন্য `AuditLog` টেবিলে স্বয়ংক্রিয়ভাবে `userId`, `action`, `entityId`, `oldValue`, `newValue` এবং `ipAddress` সংরক্ষিত হবে।
