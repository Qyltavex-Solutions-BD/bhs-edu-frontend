# অ্যাকাউন্ট্যান্ট প্যানেল (`/accountant`) — পূর্ণাঙ্গ স্ট্যাটাস ও অডিট রিপোর্ট

এই ডকুমেন্টে **অ্যাকাউন্ট্যান্ট প্যানেলের (`/accountant`)** বর্তমান বাস্তব অবস্থা সহজ ও নির্ভুলভাবে তুলে ধরা হয়েছে। অ্যাকাউন্ট্যান্ট পোর্টালের **সমস্ত ১৩টি মডিউল এবং লগইন ও অডিট লগ ইন্টিগ্রেশন এখন ১০০% লাইভ ব্যাকএন্ড API-তে চলছে** এবং লাইভ Chrome-এ এন্ড-টু-এন্ড ভেরিফাইড—কোনো `useGetBootstrapQuery()` বা মক ডাটা নেই।

---

## ১. সারসংক্ষেপ (এক নজরে বর্তমান অবস্থা)

- **সম্পূর্ণ লাইভ ও ভেরিফাইড (১৩টি মডিউল + লগইন গেট):**
  1. অ্যাকাউন্ট্যান্ট লগইন (`/accountant/login` — OTP প্রথম লগইন + পাসওয়ার্ড)
  2. ড্যাশবোর্ড (`/accountant/dashboard`)
  3. ফি কালেকশন ডেস্ক (`/accountant/collect-fee`)
  4. রসিদ ও লেনদেন (`/accountant/transactions`)
  5. বকেয়া তালিকা (`/accountant/dues`)
  6. ছাড় ও বৃত্তি (`/accountant/waivers`)
  7. ফি কাঠামো সেটআপ (`/accountant/fee-setup`)
  8. অন্যান্য আয় (`/accountant/other-income`)
  9. ব্যয় ভাউচার (`/accountant/expenses`)
  10. বেতন-ভাতা রেজিস্টার (`/accountant/payroll`)
  11. দৈনিক ক্যাশবুক (`/accountant/cashbook`)
  12. মাসিক ও বাৎসরিক রিপোর্ট (`/accountant/reports`)
  13. নোটিশ ও প্রোফাইল (`/accountant/notices`, `/accountant/profile`)
- **মক বা ফেক ডাটা যাচাই:** `hybrid-base-query.ts`-এ `finance` রুট `requireLiveApi` গার্ড দ্বারা প্রোটেক্টেড। কোনো পেজে `useGetBootstrapQuery()` বা ডামি ডাটা নেই; সব ডাটা সরাসরি PostgreSQL ও NestJS `FinanceModule` থেকে আসে।
- **ঐচ্ছিক ভবিষ্যৎ উন্নতি (২টি):** অ্যাডমিন সাইডবারে আলাদা ফিন্যান্স সামারি পেজ এবং ভর্তি এনরোলমেন্টের `admissionFeePaid`-এর সাথে অটো-সিঙ্ক।

---

## ২. মডিউলভিত্তিক বর্তমান স্ট্যাটাস

| ক্রম | মডিউল / রুট | বর্তমান অবস্থা | ব্যবহৃত লাইভ API ও বিবরণ |
| :--- | :--- | :--- | :--- |
| ১ | **অ্যাকাউন্ট্যান্ট লগইন** (`/accountant/login`) | **১০০% লাইভ (ভেরিফাইড)** | `usePortalInitiateMutation()`, `usePortalSetupPasswordMutation()` ও `useLoginUserMutation()` দিয়ে ৩-ধাপের লগইন (`IDENTIFY` → `SET_PASSWORD` OTP / `ENTER_PASSWORD`) ও `ACCOUNTANT` রোল গার্ডসহ চলে। |
| ২ | **ড্যাশবোর্ড** (`/accountant/dashboard`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetFinanceContextQuery()` ও `useGetFinanceOverviewQuery()` (`GET /finance/overview`) দিয়ে আজকের আদায়, চলতি মাসের আয়-ব্যয়, নিট ব্যালেন্স, মোট বকেয়া, ৬ মাসের আয়-ব্যয় চার্ট ও সাম্প্রতিক রসিদ দেখায়। |
| ৩ | **ফি কালেকশন ডেস্ক** (`/accountant/collect-fee`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetEnrollmentsQuery()`, `useGetFeeHeadsQuery()`, `useGetStudentLedgerQuery()` ও `useCollectFeeMutation()` (`POST /finance/collect`) দিয়ে একাধিক খাতে ফি গ্রহণ (`CASH`/`BKASH`/`NAGAD`/`ROCKET`/`BANK`) এবং প্রিন্টেবল মানি রসিদ (`MoneyReceiptModal`) তৈরি করে। |
| ৪ | **রসিদ ও লেনদেন** (`/accountant/transactions`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetTransactionsQuery()` (`GET /finance/transactions`) ও `useVoidTransactionMutation()` (`POST /finance/transactions/:id/void`) দিয়ে সার্চ, ফিল্টার, রসিদ প্রিন্ট এবং কারণসহ বাতিল (`VOID`) সাপোর্ট করে। |
| ৫ | **বকেয়া তালিকা** (`/accountant/dues`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetDuesQuery()` (`GET /finance/dues`) দিয়ে শ্রেণিভিত্তিক বকেয়া তালিকা, রোল, চালান সংখ্যা, অভিভাবকের ফোন, `/accountant/collect-fee?enrollmentId=...` ডিপ-লিংক ও CSV ডাউনলোড দেয়। |
| ৬ | **ছাড় ও বৃত্তি** (`/accountant/waivers`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetWaiversQuery()`, `useSaveWaiverMutation()` ও `useDeleteWaiverMutation()` (`/finance/waivers`) দিয়ে শতাংশ (%) বা নির্দিষ্ট টাকা (`PERCENTAGE`/`FIXED`) ছাড় পরিচালনা করে। |
| ৭ | **ফি কাঠামো সেটআপ** (`/accountant/fee-setup`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetFeeHeadsQuery()`, `useSaveFeeHeadMutation()`, `useGetFeeStructuresQuery()`, `useSaveFeeStructureMutation()` (`PER_EXAM` খাতে `examId` লিংকসহ), ও `useGenerateInvoicesMutation()` (`/finance/invoices/generate`) দিয়ে চলে। |
| ৮ | **অন্যান্য আয়** (`/accountant/other-income`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetMiscIncomesQuery()`, `useCreateMiscIncomeMutation()` ও `useDeleteMiscIncomeMutation()` (`/finance/misc-incomes`) দিয়ে চলে। |
| ৯ | **ব্যয় ভাউচার** (`/accountant/expenses`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetExpensesQuery()`, `useCreateExpenseMutation()` ও `useDeleteExpenseMutation()` (`/finance/expenses`) দিয়ে চলে। |
| ১০ | **বেতন-ভাতা রেজিস্টার** (`/accountant/payroll`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetFinanceContextQuery()` (`staffList`), `useGetSalariesQuery()`, `useCreateSalaryMutation()` ও `useDeleteSalaryMutation()` (`/finance/salaries`) দিয়ে চলে। |
| ১১ | **দৈনিক ক্যাশবুক ও রিপোর্ট** (`/accountant/cashbook`, `/accountant/reports`) | **১০০% লাইভ (ভেরিফাইড)** | `useGetCashbookQuery()` (`GET /finance/cashbook`) ও `useGetFinanceOverviewQuery()` দিয়ে তারিখের রেঞ্জে নগদ ও ব্যাংক/MFS আয়-ব্যয়, CSV এক্সপোর্ট ও A4 প্রিন্ট দেয়। |
| ১২ | **নোটিশ ও প্রোফাইল** (`/accountant/notices`, `/accountant/profile`) | **১০০% লাইভ (ভেরিফাইড)** | `<PortalNoticesView />` (`/notices/portal`) এবং `<CommonProfilePanel />` (`/auth/me`, `/auth/sessions`) দিয়ে চলে। |
| ১৩ | **অডিট লগ ইন্টিগ্রেশন** (`AuditLogInterceptor`) | **১০০% লাইভ (সম্পন্ন)** | প্রতিটি ফিন্যান্স অ্যাকশন (`FEE_COLLECTED`, `RECEIPT_VOIDED`, `INVOICES_GENERATED`, `FEE_HEAD_*`, `FEE_STRUCTURE_*`, `WAIVER_*`, `MISC_INCOME_*`, `EXPENSE_*`, `SALARY_PAID`) ব্যবহারকারীর আইডি, IP ঠিকানা ও ডিভাইসের নামসহ `AuditLog`-এ রেকর্ড হয়। |

---

## ৩. ঐচ্ছিক / ভবিষ্যৎ উন্নতি

1. **অ্যাডমিন প্যানেলে ফিন্যান্স সামারি পেজ:** ব্যাকএন্ডে `ADMIN` রোল `/finance/*` API অ্যাক্সেস করতে পারে; প্রয়োজনে অ্যাডমিন সাইডবারে রিড-অনলি ফিন্যান্স রিপোর্ট পেজ যুক্ত করা যাবে।
2. **ভর্তি ফি অটো-সিঙ্ক:** শিক্ষার্থী ভর্তি এনরোলমেন্টের `admissionFeePaid` / `receiptNo`-এর সাথে `FinanceModule`-এর সরাসরি সিঙ্ক করা।
