# অভিভাবক প্যানেল (`/parent`) — পূর্ণাঙ্গ স্ট্যাটাস ও অডিট রিপোর্ট

এই ডকুমেন্টে **অভিভাবক প্যানেলের (`/parent`)** বর্তমান বাস্তব অবস্থা সহজ ও নির্ভুলভাবে তুলে ধরা হয়েছে—কোন মডিউলগুলো **১০০% লাইভ ও সম্পন্ন**, কোনগুলো **হাইব্রিড (মূল কাজ লাইভ, শুধু `schoolProfile` মক)**, এবং কোনগুলো **এখনো সম্পূর্ণ মক ডাটায় চলছে**—যাতে ধাপে ধাপে পরবর্তী কাজগুলো সম্পন্ন করা যায়।

---

## ১. সারসংক্ষেপ (এক নজরে বর্তমান অবস্থা)

- **সম্পূর্ণ লাইভ ও সম্পন্ন:** আমার সন্তান (`/parent/children` ও `/parent/children/[id]`)।
- **মূল কাজ লাইভ, শুধু `schoolProfile` মক (হাইব্রিড):** ফলাফল ও মার্কশিট, ক্লাস রুটিন, এবং পরীক্ষার সূচি।
- **সম্পূর্ণ মক (`useGetBootstrapQuery()` নির্ভর):** ড্যাশবোর্ড, হাজিরা ক্যালেন্ডার, SMS ইতিহাস, শিক্ষা রিসোর্স, নোটিশ, নোটিফিকেশন, এবং প্রোফাইল।
- **কারিগরি সারসংক্ষেপ:** যে মডিউলগুলোর ব্যাকএন্ড API ইতিমধ্যেই আছে (যেমন: হাজিরা, SMS লগ, নোটিশ, নোটিফিকেশন, প্রোফাইল), সেগুলোর প্যারেন্ট প্যানেল পেজগুলো এখনো পুরোনো `useGetBootstrapQuery()` থেকে মক ডাটা লোড করছে; আর হাইব্রিড ৩টি পেজ শুধু প্রিন্ট/হেডারের `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ধরে রেখেছে।

---

## ২. মডিউলভিত্তিক বর্তমান স্ট্যাটাস

| ক্রম | মডিউল / রুট | বর্তমান অবস্থা | কী করা হয়েছে ও কী বাকি আছে |
| :--- | :--- | :--- | :--- |
| ১ | **ড্যাশবোর্ড** (`/parent/dashboard`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` থেকে মক ডাটা লোড করে। সন্তানের লাইভ হাজিরা, ফলাফল, রুটিন ও নোটিশ API-এর সাথে কানেক্ট করা বাকি। |
| ২ | **আমার সন্তান** (`/parent/children`, `/parent/children/[id]`) | **১০০% লাইভ (সম্পন্ন)** | `useGetAuthProfileQuery()`, `useGetParentByIdQuery()`, `useGetSchoolClassesQuery()` ও `useGetStudentByIdQuery()` দিয়ে সম্পূর্ণ লাইভ API-তে চলে। কোনো মক ডাটা নেই। |
| ৩ | **হাজিরা ক্যালেন্ডার** (`/parent/attendance`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। ব্যাকএন্ডের লাইভ হাজিরা API-এর সাথে কানেক্ট করা বাকি। |
| ৪ | **ফলাফল ও মার্কশিট** (`/parent/results`) | **হাইব্রিড (মূল কাজ লাইভ)** | পরীক্ষা (`useGetExamsQuery`), শিক্ষার্থীর ট্রান্সক্রিপ্ট (`useGetStudentTranscriptQuery`) ও সন্তান তথ্য সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৫ | **ক্লাস রুটিন** (`/parent/routines`) | **হাইব্রিড (মূল কাজ লাইভ)** | সাপ্তাহিক ক্লাস রুটিন (`useGetSectionWeeklyRoutineQuery`), শ্রেণি ও সন্তান তথ্য সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৬ | **পরীক্ষার সূচি** (`/parent/examinations`) | **হাইব্রিড (মূল কাজ লাইভ)** | শিক্ষাবর্ষ, পরীক্ষা (`useGetExamsQuery`) ও পরীক্ষার রুটিন (`useGetExamRoutinesByExamQuery`) সব লাইভ API থেকে আসে। শুধু `schoolProfile`-এর জন্য `useGetBootstrapQuery()` ফলব্যাক রাখা আছে। |
| ৭ | **SMS ইতিহাস** (`/parent/sms-history`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। লাইভ SMS লগ API-এর সাথে কানেক্ট করা বাকি। |
| ৮ | **শিক্ষা রিসোর্স** (`/parent/academic-resources`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। ডিজিটাল শিক্ষা/রিসোর্স ব্যাকএন্ড API তৈরি ও কানেক্ট করা বাকি। |
| ৯ | **নোটিশ** (`/parent/notices`) | **১০০% মক** | ব্যাকএন্ডে নোটিশ API লাইভ থাকা সত্ত্বেও প্যারেন্ট নোটিশ পেজ এখনো `useGetBootstrapQuery()` মক ডাটা ব্যবহার করে। লাইভ নোটিশ API-তে সুইচ করা বাকি। |
| ১০ | **নোটিফিকেশন** (`/parent/notifications`) | **১০০% মক** | `useGetBootstrapQuery()` ও মক `useMarkNotificationReadMutation()` ব্যবহার করে। লাইভ নোটিফিকেশন API-তে কানেক্ট করা বাকি *(সাইডবারে সরাসরি নেই, হেডার/বেল থেকে অ্যাক্সেসযোগ্য)*। |
| ১১ | **প্রোফাইল** (`/parent/profile`) | **১০০% মক** | সম্পূর্ণ `useGetBootstrapQuery()` মক ডাটায় চলছে। লাইভ প্রোফাইল/অভিভাবক API (`useGetAuthProfileQuery`, `useGetParentByIdQuery`) দিয়ে কানেক্ট করা বাকি। |

---

## ৩. ধাপে ধাপে পরবর্তী কাজের পরিকল্পনা

### ধাপ ১: ব্যাকএন্ড API প্রস্তুত আছে — ফ্রন্টএন্ডে লাইভ কানেক্ট ও ক্লিনআপ করা
1. **হাইব্রিড ৩টি পেজ থেকে `useGetBootstrapQuery()` সরানো:** `ParentResultsPage`, `ParentRoutinesPage`, ও `ParentExaminationsPage` থেকে `schoolProfile`-এর জন্য থাকা `useGetBootstrapQuery()` ফলব্যাক সরিয়ে নেওয়া।
2. **নোটিশ ও নোটিফিকেশন লাইভ করা:** `ParentNoticesPage` ও `ParentNotificationsPage`-কে `useGetBootstrapQuery()` থেকে সরিয়ে লাইভ API-তে কানেক্ট করা।
3. **হাজিরা ও SMS ইতিহাস লাইভ করা:** `ParentAttendancePage` ও `ParentSmsHistoryPage`-কে ব্যাকএন্ডের লাইভ হাজিরা ও SMS লগ API-এর সাথে যুক্ত করা।
4. **প্রোফাইল ও ড্যাশবোর্ড লাইভ করা:** `ParentProfilePage` ও `ParentDashboardPage`-কে লাইভ Auth/Parent প্রোফাইল ও লাইভ সামারি ডাটায় স্থানান্তর করা।

### ধাপ ২: ব্যাকএন্ড API ও ফ্রন্টএন্ড উভয়ই তৈরি/সম্পন্ন করা
1. **শিক্ষা রিসোর্স (`/parent/academic-resources`):** ডিজিটাল শিক্ষা ও রিসোর্স মডিউলের ব্যাকএন্ড API তৈরি করে প্যারেন্ট প্যানেলে লাইভ করা।
