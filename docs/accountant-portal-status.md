# অ্যাকাউন্ট্যান্ট পোর্টাল (`/accountant`) — বাস্তবায়ন ও অগ্রগতি রিপোর্ট

এই ডকুমেন্টে [accountant-portal-plan.md](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/docs/accountant-portal-plan.md)-এর বিপরীতে বর্তমান কোডবেসের বাস্তব অবস্থা তুলে ধরা হয়েছে।

---

## ১. সারসংক্ষেপ

| ধাপ | বিবরণ | বর্তমান অবস্থা |
| :--- | :--- | :--- |
| **ধাপ ১** | অথেনটিকেশন, `/accountant/login`, পোর্টাল শেল ও সাইডবার | **সম্পন্ন** |
| **ধাপ ২** | Prisma স্কিমা (`finance.prisma`) ও ব্যাকএন্ড `FinanceModule` API | **সম্পন্ন** |
| **ধাপ ৩** | ফ্রন্টএন্ড অ্যাকাউন্ট্যান্ট পোর্টাল পেজসমূহ (জিরো মক) | **সম্পন্ন** |
| **ধাপ ৪** | লাইভ ব্রাউজার এন্ড-টু-এন্ড টেস্টিং ও ভেরিফিকেশন | **বাকি** |

---

## ২. সম্পন্ন হওয়া অংশের বিস্তারিত

### ক) অথেনটিকেশন, রোল ও নেভিগেশন
- **আলাদা লগইন গেট:** [app/accountant/login/page.tsx](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/app/accountant/login/page.tsx) (`AccountantLoginPage`)।
- **পোর্টাল নেভিগেশন:** [portal-nav.data.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/components/layout/portal/portal-nav.data.ts#L188-L237)-এ `ACCOUNTANT_NAV_GROUPS` যুক্ত আছে।
- **লাইভ API গার্ড:** [hybrid-base-query.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/lib/api/hybrid-base-query.ts#L167)-এ `finance` পাথ `requireLiveApi` দ্বারা প্রোটেক্টেড (কোনো মক ফলব্যাক নেই)।
- **ব্যাকএন্ড রোল গার্ড:** [finance.controller.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/edu-backend/src/modules/finance/finance.controller.ts#L34-L36)-এ `JwtAuthGuard`, `RolesGuard` ও `@Roles('ACCOUNTANT', 'ADMIN')` সেট করা আছে।

### খ) ডাটাবেজ স্কিমা (`edu-backend`)
[finance.prisma](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/edu-backend/prisma/schema/finance.prisma)-এ প্ল্যানের সবগুলো মডেল ও Enum তৈরি আছে:
- **Enums:** `FeeFrequency`, `FeePaymentMethod`, `InvoiceStatus`, `ReceiptStatus`, `WaiverType`
- **Models:** `FeeHead`, `FeeStructure`, `StudentFeeWaiver`, `StudentFeeInvoice`, `FeePaymentTransaction`, `FeePaymentItem`, `MiscIncome`, `ExpenseVoucher`, `StaffSalaryPayment`

### গ) ব্যাকএন্ড API (`FinanceModule`)
[finance.controller.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/edu-backend/src/modules/finance/finance.controller.ts) ও `finance.service.ts`-এ নিচের এন্ডপয়েন্টসমূহ ইমপ্লিমেন্ট করা আছে:
- `GET /finance/context`, `GET /finance/overview`
- `GET / POST /finance/fee-heads`
- `GET / POST / PATCH / DELETE /finance/fee-structures`
- `GET / POST / DELETE /finance/waivers`
- `POST /finance/invoices/generate`, `GET /finance/ledger/:enrollmentId`
- `POST /finance/collect`, `GET /finance/transactions`, `POST /finance/transactions/:id/void`
- `GET /finance/dues`
- `GET / POST / DELETE /finance/misc-incomes`
- `GET / POST / DELETE /finance/expenses`
- `GET / POST / DELETE /finance/salaries`
- `GET /finance/cashbook`

### ঘ) ফ্রন্টএন্ড পেজসমূহ (`bhs-frontend`)
[app/accountant](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/app/accountant) ও [src/features/accountant](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/bhs-frontend/src/features/accountant)-এ সবগুলো পেজ লাইভ `finance.api.ts`-এর মাধ্যমে তৈরি আছে (কোনো `useGetBootstrapQuery` বা মক ডাটা নেই):
- `/accountant/dashboard` (`AccountantDashboardPage.tsx`)
- `/accountant/collect-fee` (`CollectFeePage.tsx`)
- `/accountant/transactions` (`TransactionsPage.tsx`)
- `/accountant/dues` (`DuesPage.tsx`)
- `/accountant/waivers` (`WaiversPage.tsx`)
- `/accountant/fee-setup` (`FeeSetupPage.tsx`)
- `/accountant/other-income`, `/accountant/expenses`, `/accountant/payroll` (`IncomeExpensePayrollPages.tsx`)
- `/accountant/cashbook`, `/accountant/reports` (`CashbookReportsPage.tsx`)
- `/accountant/notices`, `/accountant/profile` (`AccountantSharedViews.tsx`)

---

## ৩. যা এখনো বাকি / করণীয়

1. **ধাপ ৪ — এন্ড-টু-এন্ড ব্রাউজার টেস্টিং (বাকি):**
   - `/accountant/login` দিয়ে লগইন করে ফি সেটআপ, ইনভয়েস জেনারেশন, ফি কালেকশন, রসিদ প্রিন্ট/ভয়েড, বকেয়া তালিকা, আয়-ব্যয় ভাউচার, বেতন রেজিস্টার, ক্যাশবুক ও রিপোর্ট পেজ লাইভ Chrome-এ যাচাই করা।
2. **অডিট লগ অ্যাকশন ম্যাপিং (উন্নতি):**
   - [audit-log.utils.ts](file:///c:/Users/Md.%20Masud%20Rana/Desktop/Workspace/bhs/edu-backend/src/modules/audit-log/audit-log.utils.ts)-এ `/finance/*` রুটের জন্য স্পেসিফিক অ্যাকশন নাম (`FEE_COLLECTED`, `RECEIPT_VOIDED`, `EXPENSE_CREATED`, `SALARY_PAID` ইত্যাদি) যোগ করা।
3. **অ্যাডমিন প্যানেল আর্থিক সামারি পেজ (প্ল্যানের ঐচ্ছিক অংশ):**
   - ব্যাকএন্ডে `ADMIN` রোল `/finance/*` অ্যাক্সেস করতে পারলেও, অ্যাডমিন সাইডবারে আলাদা আর্থিক সামারি পেজ এখনো যুক্ত করা হয়নি।
