# অভিভাবক প্যানেল (`/parent`) — পূর্ণাঙ্গ স্ট্যাটাস ও অডিট রিপোর্ট

এই ডকুমেন্টে **অভিভাবক প্যানেলের (`/parent`)** বর্তমান বাস্তব অবস্থা তুলে ধরা হয়েছে। **নোটিফিকেশন** ও **শিক্ষা রিসোর্স** বাদে প্যারেন্ট প্যানেলের **বাকি সমস্ত ৯টি মডিউল এখন ১০০% লাইভ ব্যাকএন্ড API-তে চলছে**—কোনো `useGetBootstrapQuery()` বা মক ডাটা নেই।

---

## ১. সারসংক্ষেপ (এক নজরে বর্তমান অবস্থা)

- **সম্পূর্ণ লাইভ ও সম্পন্ন (৯টি মডিউল):**
  1. ড্যাশবোর্ড (`/parent/dashboard`)
  2. আমার সন্তান (`/parent/children` ও `/parent/children/[id]`)
  3. হাজিরা ক্যালেন্ডার (`/parent/attendance`)
  4. ফলাফল ও মার্কশিট (`/parent/results`)
  5. ক্লাস রুটিন (`/parent/routines`)
  6. পরীক্ষার সূচি (`/parent/examinations`)
  7. SMS ইতিহাস (`/parent/sms-history`)
  8. নোটিশ (`/parent/notices`)
  9. প্রোফাইল (`/parent/profile`)
- **ইচ্ছাকৃতভাবে স্থগিত / বাকি (২টি মডিউল):** নোটিফিকেশন (`/parent/notifications`) এবং শিক্ষা রিসোর্স (`/parent/academic-resources`)।

---

## ২. মডিউলভিত্তিক বর্তমান স্ট্যাটাস

| ক্রম | মডিউল / রুট | বর্তমান অবস্থা | ব্যবহৃত লাইভ API ও বিবরণ |
| :--- | :--- | :--- | :--- |
| ১ | **ড্যাশবোর্ড** (`/parent/dashboard`) | **১০০% লাইভ (সম্পন্ন)** | `useGetAuthProfileQuery()`, `useGetParentByIdQuery()`, `useGetParentChildAttendanceQuery()`, `useGetParentSmsLogsQuery()`, `useGetExamsQuery()`, ও `useGetStudentTranscriptQuery()` দিয়ে চলে। কোনো মক ডাটা নেই। |
| ২ | **আমার সন্তান** (`/parent/children`, `/parent/children/[id]`) | **১০০% লাইভ (সম্পন্ন)** | `useGetAuthProfileQuery()`, `useGetParentByIdQuery()`, `useGetSchoolClassesQuery()` ও `useGetStudentByIdQuery()` দিয়ে চলে। কোনো মক ডাটা নেই। |
| ৩ | **হাজিরা ক্যালেন্ডার** (`/parent/attendance`) | **১০০% লাইভ (সম্পন্ন)** | `useGetParentChildAttendanceQuery()` (`GET /attendance/parent/child-monthly`) দিয়ে মাসিক হাজিরা গ্রিড, শতাংশ ও দৈনিক লগ দেখায়। কোনো মক ডাটা নেই। |
| ৪ | **ফলাফল ও মার্কশিট** (`/parent/results`) | **১০০% লাইভ (সম্পন্ন)** | `useGetExamsQuery()` ও `useGetStudentTranscriptQuery()` দিয়ে চলে। `useGetBootstrapQuery()` সম্পূর্ণ অপসারণ করা হয়েছে। |
| ৫ | **ক্লাস রুটিন** (`/parent/routines`) | **১০০% লাইভ (সম্পন্ন)** | `useGetSectionWeeklyRoutineQuery()` দিয়ে গ্রুপভিত্তিক ফিল্টারিং, টিফিন কলাম ও A4 প্রিন্টসহ চলে। `useGetBootstrapQuery()` সম্পূর্ণ অপসারণ করা হয়েছে। |
| ৬ | **পরীক্ষার সূচি** (`/parent/examinations`) | **১০০% লাইভ (সম্পন্ন)** | `useGetExamsQuery()` ও `useGetExamRoutinesByExamQuery()` দিয়ে চলে। `useGetBootstrapQuery()` সম্পূর্ণ অপসারণ করা হয়েছে। |
| ৭ | **SMS ইতিহাস** (`/parent/sms-history`) | **১০০% লাইভ (সম্পন্ন)** | `useGetParentSmsLogsQuery()` (`GET /attendance/parent/sms-logs`) দিয়ে অভিভাবকের নম্বরে পাঠানো SMS ইতিহাস দেখায়। কোনো মক ডাটা নেই। |
| ৮ | **শিক্ষা রিসোর্স** (`/parent/academic-resources`) | **বাকি (স্থগিত)** | ডিজিটাল শিক্ষা ও রিসোর্স মডিউলের ব্যাকএন্ড API তৈরি ও কানেক্ট করা বাকি। |
| ৯ | **নোটিশ** (`/parent/notices`) | **১০০% লাইভ (সম্পন্ন)** | `<PortalNoticesView />` ব্যবহার করে লাইভ `/notices/portal` API-তে চলে। পুরোনো অব্যবহৃত মক ইম্পোর্ট ও কোড মুছে ফেলা হয়েছে। |
| ১০ | **নোটিফিকেশন** (`/parent/notifications`) | **বাকি (স্থগিত)** | লাইভ নোটিফিকেশন API-তে কানেক্ট করা বাকি *(সাইডবারে সরাসরি নেই, হেডার/বেল থেকে অ্যাক্সেসযোগ্য)*। |
| ১১ | **প্রোফাইল** (`/parent/profile`) | **১০০% লাইভ (সম্পন্ন)** | `useGetAuthProfileQuery()`, `useGetParentByIdQuery()`, `useGetSchoolClassesQuery()` ও `CommonProfilePanel` দিয়ে অভিভাবকের আসল তথ্য, অ্যাক্টিভ সেশন ও সন্তানের তালিকা দেখায়। কোনো মক ডাটা নেই। |
