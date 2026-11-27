# শিক্ষক প্যানেল (`/teacher`) — পূর্ণাঙ্গ স্ট্যাটাস ও অডিট রিপোর্ট

এই ডকুমেন্টে **শিক্ষক প্যানেলের (`/teacher`)** বর্তমান বাস্তব অবস্থা সহজ ও নির্ভুলভাবে তুলে ধরা হয়েছে—কোন মডিউলগুলো **১০০% লাইভ ও সম্পন্ন**, কোনগুলো **হাইব্রিড (মূল কাজ লাইভ, শুধু `schoolProfile` মক)**, কোনগুলো **আংশিক লাইভ**, এবং কোনগুলো **এখনো সম্পূর্ণ মক ডাটায় চলছে**—যাতে ধাপে ধাপে পরবর্তী কাজগুলো সম্পন্ন করা যায়।

---

## ১. সারসংক্ষেপ (এক নজরে বর্তমান অবস্থা)

- **সম্পূর্ণ লাইভ ও সম্পন্ন (৪টি মডিউল):** নির্ধারিত শ্রেণি (`/teacher/classes` ও `/teacher/classes/[id]`), শিক্ষার্থী তালিকা (`/teacher/students`), নম্বর এন্ট্রি (`/teacher/marks-entry`), এবং নোটিশ (`/teacher/notices`)।
- **মূল কাজ লাইভ, শুধু `schoolProfile` মক (হাইব্রিড — ৩টি মডিউল):** ক্লাস রুটিন (`/teacher/routines`), পরীক্ষা ও রুটিন (`/teacher/examinations`), এবং ফলাফল (`/teacher/results`)।
- **আংশিক লাইভ (১টি মডিউল):** আমার প্রোফাইল (`/teacher/profile`) — ভেতরের অ্যাকাউন্ট ও সেশন প্যানেল (`CommonProfilePanel`) লাইভ API-তে চলে, তবে উপরের পরিচিতি কার্ড ও নিচের বিষয় অ্যাসাইনমেন্ট টেবিল এখনো `useGetBootstrapQuery()` মক থেকে আসে।
- **সম্পূর্ণ মক (`useGetBootstrapQuery()` নির্ভর — ৪টি মডিউল):** ড্যাশবোর্ড, হাজিরা গ্রহণ, শিক্ষা রিসোর্স, এবং নোটিফিকেশন।
- **কারিগরি সারসংক্ষেপ:** যে মডিউলগুলোর ব্যাকএন্ড API ইতিমধ্যেই আছে (যেমন: হাজিরা গ্রহণ, নোটিফিকেশন, প্রোফাইল), সেগুলোর টিচার প্যানেল পেজগুলো এখনো পুরোনো `useGetBootstrapQuery()` ও মক মিউটেশন ব্যবহার করছে; হাইব্রিড ৩টি পেজ শুধু প্রিন্ট/হেডারের `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রেখেছে; এবং `TeacherNoticesPage.tsx`-এ `<PortalNoticesView />` লাইভ চললেও ফাইলের উপরে অব্যবহৃত `useGetBootstrapQuery` ইম্পোর্ট/হেল্পার পড়ে আছে।

---

## ২. মডিউলভিত্তিক বর্তমান স্ট্যাটাস

| ক্রম | মডিউল / রুট | বর্তমান অবস্থা | কী করা হয়েছে ও কী বাকি আছে |
| :--- | :--- | :--- | :--- |
| ১ | **ড্যাশবোর্ড** (`/teacher/dashboard`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` থেকে মক ডাটা লোড করে। শিক্ষকের লাইভ ক্লাস, রুটিন, হাজিরা ও অপেক্ষমাণ কাজের API-এর সাথে কানেক্ট করা বাকি। |
| ২ | **নির্ধারিত শ্রেণি** (`/teacher/classes`, `/teacher/classes/[id]`) | **১০০% লাইভ (সম্পন্ন)** | `useGetMyTeacherAssignmentsQuery()`, `useGetSchoolClassesQuery()`, `useGetClassTeachersQuery()`, `useGetEnrollmentsQuery()`, `useGetSectionByIdQuery()`, `useGetExamsQuery()` ও `useGetTabulationSheetQuery()` দিয়ে সম্পূর্ণ লাইভ চলে। কোনো মক ডাটা নেই। |
| ৩ | **শিক্ষার্থী তালিকা** (`/teacher/students`) | **১০০% লাইভ (সম্পন্ন)** | `useGetMyTeacherAssignmentsQuery()`, `useGetSchoolClassesQuery()`, `useGetEnrollmentsQuery()` ও `useGetStudentByIdQuery()` দিয়ে সম্পূর্ণ লাইভ API-তে চলে। কোনো মক ডাটা নেই। |
| ৪ | **হাজিরা গ্রহণ** (`/teacher/attendance`) | **১০০% মক** | এখনো `useGetBootstrapQuery()` ও মক `useSaveAttendanceBatchMutation()` ব্যবহার করে। ব্যাকএন্ডের লাইভ হাজিরা API-এর সাথে কানেক্ট করা বাকি। |
| ৫ | **ক্লাস রুটিন** (`/teacher/routines`) | **হাইব্রিড (মূল কাজ লাইভ)** | শিক্ষকের সাপ্তাহিক রুটিন (`useGetTeacherWeeklyRoutineQuery`), অ্যাসাইনমেন্ট ও শ্রেণি তথ্য সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৬ | **পরীক্ষা ও রুটিন** (`/teacher/examinations`) | **হাইব্রিড (মূল কাজ লাইভ)** | শিক্ষাবর্ষ, অ্যাসাইনমেন্ট, পরীক্ষা (`useGetExamsQuery`) ও পরীক্ষার রুটিন (`useGetExamRoutinesByExamQuery`) সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৭ | **নম্বর এন্ট্রি** (`/teacher/marks-entry`) | **১০০% লাইভ (সম্পন্ন)** | `useGetMyTeacherAssignmentsQuery()`, `useGetExamsQuery()`, `useGetExamSubjectsQuery()`, `useGetGradeSheetQuery()`, `useGetGradingScalesQuery()` ও `useSaveBulkMarksMutation()` দিয়ে সম্পূর্ণ লাইভ API-তে চলে। কোনো মক ডাটা নেই। |
| ৮ | **ফলাফল** (`/teacher/results`) | **হাইব্রিড (মূল কাজ লাইভ)** | পরীক্ষা, শাখা ও ট্যাবুলেশন শিট (`useGetTabulationSheetQuery`) সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৯ | **শিক্ষা রিসোর্স** (`/teacher/academic-resources`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। ডিজিটাল শিক্ষা/রিসোর্স ব্যাকএন্ড API তৈরি ও কানেক্ট করা বাকি। |
| ১০ | **নোটিশ** (`/teacher/notices`) | **১০০% লাইভ (ক্লিনআপ বাকি)** | `<PortalNoticesView />` ব্যবহার করে লাইভ নোটিশ API-তে চলে। শুধু `TeacherNoticesPage.tsx`-এর উপরের অব্যবহৃত `useGetBootstrapQuery` ইম্পোর্ট ও মক হেল্পার কোড মুছে ফেলা বাকি। |
| ১১ | **নোটিফিকেশন** (`/teacher/notifications`) | **১০০% মক** | `useGetBootstrapQuery()` ও মক `useMarkNotificationReadMutation()` ব্যবহার করে। লাইভ নোটিফিকেশন API-তে কানেক্ট করা বাকি। |
| ১২ | **আমার প্রোফাইল** (`/teacher/profile`) | **আংশিক লাইভ** | ভেতরের `CommonProfilePanel` লাইভ `/auth/me` ও `/auth/sessions` API ব্যবহার করে। তবে উপরের শিক্ষক পরিচিতি কার্ড ও নিচের বিষয় অ্যাসাইনমেন্ট টেবিল এখনো `useGetBootstrapQuery()` মক থেকে আসে—এগুলো লাইভ Auth/Staff ও `my-assignments` API-তে নেওয়া বাকি। |

---

## ৩. ধাপে ধাপে পরবর্তী কাজের পরিকল্পনা

### ধাপ ১: ব্যাকএন্ড API প্রস্তুত আছে — ফ্রন্টএন্ডে লাইভ কানেক্ট ও ক্লিনআপ করা
1. **হাইব্রিড ৩টি পেজ ও নোটিশ পেজ ক্লিনআপ:** `TeacherRoutinesPage`, `TeacherExaminationsPage`, ও `TeacherResultsPage` থেকে `schoolProfile`-এর জন্য থাকা `useGetBootstrapQuery()` ফলব্যাক সরানো এবং `TeacherNoticesPage` থেকে অব্যবহৃত মক ইম্পোর্ট/হেল্পার মুছে ফেলা।
2. **হাজিরা গ্রহণ লাইভ করা:** `TeacherAttendancePage`-কে `useGetBootstrapQuery()` ও মক `useSaveAttendanceBatchMutation()` থেকে সরিয়ে ব্যাকএন্ডের লাইভ দৈনিক হাজিরা API-তে যুক্ত করা।
3. **নোটিফিকেশন লাইভ করা:** `TeacherNotificationsPage`-কে লাইভ নোটিফিকেশন API-তে কানেক্ট করা।
4. **প্রোফাইল ও ড্যাশবোর্ড লাইভ করা:** `TeacherProfilePage`-এর উপরের অংশ ও অ্যাসাইনমেন্ট টেবিল এবং `TeacherDashboardPage`-কে লাইভ Auth/Staff প্রোফাইল ও লাইভ সামারি ডাটায় স্থানান্তর করা।

### ধাপ ২: ব্যাকএন্ড API ও ফ্রন্টএন্ড উভয়ই তৈরি/সম্পন্ন করা
1. **শিক্ষা রিসোর্স (`/teacher/academic-resources`):** ডিজিটাল শিক্ষা ও রিসোর্স মডিউলের ব্যাকএন্ড API তৈরি করে টিচার প্যানেলে লাইভ করা।
