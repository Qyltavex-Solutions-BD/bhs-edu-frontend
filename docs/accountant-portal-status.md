# অ্যাকাউন্ট্যান্ট পোর্টাল (`/accountant`) — বাস্তবায়ন, অডিট ও অগ্রগতি রিপোর্ট

এই ডকুমেন্টে [accountant-portal-plan.md](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/docs/accountant-portal-plan.md)-এর বিপরীতে বর্তমান কোডবেস ও লাইভ ব্রাউজার অডিটের বাস্তব অবস্থা সহজ ও স্পষ্টভাবে তুলে ধরা হয়েছে।

---

## ১. সারসংক্ষেপ (এক নজরে বর্তমান অবস্থা)

| ধাপ | বিবরণ | বর্তমান অবস্থা | মন্তব্য |
| :--- | :--- | :--- | :--- |
| **ধাপ ১** | অথেনটিকেশন, `/accountant/login`, পোর্টাল শেল ও সাইডবার | **সম্পন্ন** | ১৩টি সাইডবার রুট, রোল গার্ড ও আলাদা লগইন পেজ কাজ করছে। |
| **ধাপ ২** | Prisma স্কিমা (`finance.prisma`) ও ব্যাকএন্ড `FinanceModule` API | **কোডে সম্পন্ন (সার্ভার রিস্টার্ট বাকি)** | কোডে ইমপ্লিমেন্ট করা আছে, কিন্তু চলমান `localhost:4000` সার্ভারে `/api/v1/finance/*` `404` দিচ্ছে (রিস্টার্ট/রিবিল্ড প্রয়োজন)। |
| **ধাপ ৩** | ফ্রন্টএন্ড অ্যাকাউন্ট্যান্ট পোর্টাল পেজসমূহ (জিরো মক) | **সম্পন্ন (ছোট UI ফিক্স বাকি)** | কোনো মক/`useGetBootstrapQuery()` নেই; তবে ২টি পেজে এরর স্টেট ও কিছু বাংলা সংখ্যার ফিক্স বাকি। |
| **ধাপ ৪** | লাইভ ব্রাউজার এন্ড-টু-এন্ড টেস্টিং ও ভেরিফিকেশন | **আংশিক সম্পন্ন** | লগইন, নোটিশ ও প্রোফাইল লাইভ টেস্টে পাস; ফিন্যান্স ১১টি পেজ ব্যাকএন্ড রিস্টার্টের পর ফুল ফাংশনাল টেস্ট বাকি। |

---

## ২. সম্পন্ন হওয়া অংশের বিস্তারিত

### ক) অথেনটিকেশন, ডেমো সিড ও নেভিগেশন
- **আলাদা লগইন গেট:** [app/accountant/login/page.tsx](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/app/accountant/login/page.tsx) (`AccountantLoginPage`) — লগইন ছাড়া `/accountant` বা `/accountant/dashboard`-এ গেলে সঠিকভাবে এখানে রিডাইরেক্ট করে।
- **ডেমো ইউজার সিড:** [demo-users.seed.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/School-Management-System/prisma/seeds/demo-users.seed.ts)-এ অ্যাকাউন্ট্যান্ট ইউজার সিড যুক্ত ও ডাটাবেসে রান করা হয়েছে:
  - ইমেইল: `accountant@example.com` · পাসওয়ার্ড: `accountantpassword` · রোল: `ACCOUNTANT` (`ACC-101`)
- **পোর্টাল নেভিগেশন:** [portal-nav.data.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/components/layout/portal/portal-nav.data.ts)-এ `ACCOUNTANT_NAV_GROUPS`-এর ১৩টি রুটই যুক্ত আছে।
- **লাইভ API গার্ড:** [hybrid-base-query.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/lib/api/hybrid-base-query.ts)-এ `finance` পাথ `requireLiveApi` দ্বারা প্রোটেক্টেড (কোনো পেজেই `/bootstrap` কল হয় না)।

### খ) ডাটাবেজ স্কিমা ও ব্যাকএন্ড API (`School-Management-System`)
- **স্কিমা:** [finance.prisma](file:///e:/LEVEL-2/Vojesshor%20High%20School/School-Management-System/prisma/schema/finance.prisma)-এ `FeeHead`, `FeeStructure`, `StudentFeeWaiver`, `StudentFeeInvoice`, `FeePaymentTransaction`, `FeePaymentItem`, `MiscIncome`, `ExpenseVoucher`, ও `StaffSalaryPayment` মডেল তৈরি আছে।
- **কন্ট্রোলার ও মডিউল:** [finance.controller.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/School-Management-System/src/modules/finance/finance.controller.ts)-এ `@Roles('ACCOUNTANT', 'ADMIN')` সহ সব API তৈরি আছে এবং [modules.module.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/School-Management-System/src/modules/modules.module.ts)-এ `FinanceModule` ইমপোর্ট করা আছে।

### গ) ফ্রন্টএন্ড পেজসমূহ (`bhs-edu-frontend`)
[app/accountant](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/app/accountant) ও [src/features/accountant](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/features/accountant)-এ সব ১৩টি পেজ লাইভ API-তে তৈরি আছে:
- **লাইভ টেস্টে পাস (`200 OK`):** `/accountant/notices`, `/accountant/profile` ([AccountantSharedViews.tsx](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/features/accountant/components/AccountantSharedViews.tsx))
- **তৈরি আছে (ব্যাকএন্ড রিস্টার্টের পর ফুল টেস্ট বাকি):** `/accountant/dashboard`, `/accountant/collect-fee`, `/accountant/transactions`, `/accountant/dues`, `/accountant/waivers`, `/accountant/fee-setup`, `/accountant/other-income`, `/accountant/expenses`, `/accountant/payroll`, `/accountant/cashbook`, `/accountant/reports`

---

## ৩. ব্রাউজার অডিটে পাওয়া সমস্যা ও বাকি কাজ (করণীয় তালিকা)

### ক) জরুরি / ব্লকার সমস্যা
1. **ব্যাকএন্ড সার্ভারে `/api/v1/finance/*` সব `404 Not Found` দিচ্ছে:**
   - চলমান `localhost:4000` ব্যাকএন্ড সার্ভারটি পুরোনো বিল্ডে চালু থাকায় ফিন্যান্সের ১১টি রুটেই (`finance/context`, `finance/overview`, `finance/fee-heads`, `finance/fee-structures`, `finance/transactions`, `finance/dues`, `finance/waivers`, `finance/misc-incomes`, `finance/expenses`, `finance/salaries`, `finance/cashbook`) `404` আসছে।
   - **সমাধান:** ব্যাকএন্ড সার্ভার (`School-Management-System`) বন্ধ করে পুনরায় `npm run start:dev` দিয়ে চালু/রিবিল্ড করা।

### খ) ফ্রন্টএন্ড UI ও এরর হ্যান্ডলিং বাগ
2. **২টি পেজে API ফেইল করলে পুরো বডি ফাঁকা (Blank Body Bug):**
   - `/accountant/collect-fee` ([CollectFeePage.tsx](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/features/accountant/components/CollectFeePage.tsx)) এবং `/accountant/reports` ([CashbookReportsPage.tsx](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/features/accountant/components/CashbookReportsPage.tsx))-এ API এরর হলে শুধু হেডিং দেখায়—নিচে কোনো এরর কার্ড বা `পুনরায় চেষ্টা করুন` বাটন দেখায় না।
3. **সাইডবার রোল সাবটাইটেল ভুল:**
   - অ্যাকাউন্ট্যান্ট পোর্টালে লগইন থাকা অবস্থাতেও বাম পাশের সাইডবারে ব্র্যান্ডের নিচে `EIIN: 113587 · Admin` লেখা দেখায় (`Accountant` বা শুধু `EIIN` হওয়া উচিত)।
4. **বাংলা/ইংরেজি সংখ্যার অমিল (Minor Polish):**
   - `/accountant/other-income`, `/accountant/expenses`, ও `/accountant/payroll` ([IncomeExpensePayrollPages.tsx](file:///e:/LEVEL-2/Vojesshor%20High%20School/bhs-edu-frontend/src/features/accountant/components/IncomeExpensePayrollPages.tsx))-এ `0টি আয় ভাউচার`, `0টি ব্যয় ভাউচার`, `0টি বেতন ভাউচার`, এবং `জানুয়ারি 2026`-এ ইংরেজি সংখ্যা দেখাচ্ছে (`formatNumber(..., 'bn')` ব্যবহার করা উচিত)।

### গ) পরবর্তী পূর্ণাঙ্গ কাজসমূহ
5. **ধাপ ৪ — পূর্ণাঙ্গ এন্ড-টু-এন্ড ব্রাউজার টেস্টিং:**
   - ব্যাকএন্ড রিস্টার্টের পর `/accountant/login` দিয়ে ঢুকে ফি খাত তৈরি, শ্রেণিভিত্তিক ফি সেটআপ, ইনভয়েস জেনারেশন, ফি কালেকশন ও মানি রিসিপ্ট প্রিন্ট/ভয়েড, বকেয়া তালিকা, আয়-ব্যয় ভাউচার, বেতন রেজিস্টার, ক্যাশবুক ও রিপোর্ট পেজ আসল ডেটা দিয়ে লাইভ টেস্ট করা।
6. **অডিট লগ অ্যাকশন ম্যাপিং:**
   - [audit-log.utils.ts](file:///e:/LEVEL-2/Vojesshor%20High%20School/School-Management-System/src/modules/audit-log/audit-log.utils.ts)-এ `/finance/*` রুটের জন্য স্পেসিফিক অ্যাকশন নাম (`FEE_COLLECTED`, `RECEIPT_VOIDED`, `EXPENSE_CREATED`, `SALARY_PAID` ইত্যাদি) যোগ করা।
7. **অ্যাডমিন প্যানেল আর্থিক সামারি পেজ (প্ল্যানের ঐচ্ছিক অংশ):**
   - ব্যাকএন্ডে `ADMIN` রোল `/finance/*` অ্যাক্সেস করতে পারলেও অ্যাডমিন সাইডবারে আলাদা আর্থিক সামারি পেজ এখনো যুক্ত করা হয়নি।
