import { baseApi } from '@/src/lib/api/base-api';

type Envelope<T> = { data: T };

export type FeeFrequency = 'MONTHLY' | 'ONE_TIME' | 'ANNUAL' | 'PER_EXAM';
export type FeePaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';
export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';
export type ReceiptStatus = 'ACTIVE' | 'VOID';
export type WaiverType = 'PERCENTAGE' | 'FIXED';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FeeHeadItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  frequency: FeeFrequency;
  isActive: boolean;
}

export interface FinanceContextResponse {
  academicYears: Array<{ id: string; name: string; isActive: boolean }>;
  activeAcademicYear: { id: string; name: string; isActive: boolean } | null;
  classes: Array<{
    id: string;
    name: string;
    nameBn: string;
    numericLevel: number;
    sections: Array<{ id: string; name: string; nameBn: string }>;
  }>;
  schoolProfile: {
    id: string;
    name: string;
    nameBn?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    eiin?: string | null;
    logoUrl?: string | null;
  } | null;
  staffList: Array<{
    id: string;
    name: string;
    designation: string;
    employeeId?: string | null;
  }>;
}

export interface FeeStructureItem {
  id: string;
  academicYearId: string;
  classId: string;
  feeHeadId: string;
  amount: number;
  dueDay?: number | null;
  isActive: boolean;
  schoolClass?: { id: string; name: string; nameBn: string; numericValue?: number };
  feeHead?: FeeHeadItem;
}

export interface StudentWaiverItem {
  id: string;
  academicYearId: string;
  studentEnrollmentId: string;
  feeHeadId?: string | null;
  waiverType: WaiverType;
  value: number;
  reason?: string | null;
  isActive: boolean;
  feeHead?: FeeHeadItem | null;
  enrollment?: {
    id: string;
    roll: number;
    student: { id: string; studentId: string; nameEn: string; nameBn?: string | null };
    schoolClass: { id: string; name: string; nameBn: string };
    section?: { id: string; name: string; nameBn?: string | null } | null;
  };
}

export interface StudentInvoiceItem {
  id: string;
  academicYearId: string;
  studentEnrollmentId: string;
  feeHeadId: string;
  title: string;
  month?: string | null;
  dueDate?: string | null;
  grossAmount: number;
  waiverAmount: number;
  netAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  feeHead?: FeeHeadItem;
}

export interface FeePaymentItemDetail {
  id: string;
  transactionId: string;
  invoiceId?: string | null;
  feeHeadId: string;
  title: string;
  amount: number;
  discount: number;
  netPaid: number;
  feeHead?: FeeHeadItem;
}

export interface FeePaymentTransactionItem {
  id: string;
  receiptNo: string;
  academicYearId: string;
  studentEnrollmentId: string;
  totalGross: number;
  totalDiscount: number;
  totalPaid: number;
  paymentMethod: FeePaymentMethod;
  referenceNo?: string | null;
  remarks?: string | null;
  status: ReceiptStatus;
  voidReason?: string | null;
  paidAt: string;
  collectedBy?: { id: string; name: string; email?: string | null } | null;
  enrollment?: {
    id: string;
    roll: number;
    student: {
      id: string;
      studentId: string;
      nameEn: string;
      nameBn?: string | null;
      fatherName?: string | null;
      guardianPhone?: string | null;
    };
    schoolClass: { id: string; name: string; nameBn: string };
    section?: { id: string; name: string; nameBn?: string | null } | null;
  };
  items?: FeePaymentItemDetail[];
}

export interface FinanceOverviewResponse {
  todayCollection: number;
  monthCollection: number;
  monthOutflow: number;
  totalIncome: number;
  totalOutflow: number;
  netBalance: number;
  totalDue: number;
  receiptCount: number;
  monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  recentTransactions: FeePaymentTransactionItem[];
}

export interface StudentLedgerResponse {
  enrollment: {
    id: string;
    roll: number;
    student: {
      id: string;
      studentId: string;
      nameEn: string;
      nameBn?: string | null;
      fatherName?: string | null;
      guardianPhone?: string | null;
    };
    schoolClass: { id: string; name: string; nameBn: string };
    section?: { id: string; name: string; nameBn?: string | null } | null;
  };
  invoices: StudentInvoiceItem[];
  transactions: FeePaymentTransactionItem[];
  waivers: StudentWaiverItem[];
}

export interface DuesRowItem {
  enrollmentId: string;
  studentIdCode: string;
  studentName: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  guardianPhone: string;
  invoiceCount: number;
  totalNet: number;
  totalPaid: number;
  totalDue: number;
  invoices: Array<{ id: string; title: string; due: number; dueDate?: string | null }>;
}

export interface MiscIncomeItem {
  id: string;
  voucherNo: string;
  academicYearId: string;
  category: string;
  title: string;
  receivedFrom?: string | null;
  amount: number;
  paymentMethod: FeePaymentMethod;
  referenceNo?: string | null;
  incomeDate: string;
  remarks?: string | null;
  recordedBy?: { id: string; name: string } | null;
}

export interface ExpenseVoucherItem {
  id: string;
  voucherNo: string;
  academicYearId: string;
  category: string;
  title: string;
  paidTo?: string | null;
  amount: number;
  paymentMethod: FeePaymentMethod;
  referenceNo?: string | null;
  expenseDate: string;
  remarks?: string | null;
  recordedBy?: { id: string; name: string } | null;
}

export interface StaffSalaryPaymentItem {
  id: string;
  voucherNo: string;
  academicYearId: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  deduction: number;
  netPaid: number;
  paymentMethod: FeePaymentMethod;
  referenceNo?: string | null;
  paidDate: string;
  remarks?: string | null;
  staff?: { id: string; name: string; designation: string; employeeId?: string | null };
  recordedBy?: { id: string; name: string } | null;
}

export interface CashbookEntryItem {
  id: string;
  date: string;
  ref: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  method: FeePaymentMethod;
  amount: number;
}

export interface CashbookResponse {
  entries: CashbookEntryItem[];
  totalIn: number;
  totalOut: number;
  net: number;
}

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceContext: builder.query<FinanceContextResponse, void>({
      query: () => ({ url: '/finance/context', method: 'GET' }),
      transformResponse: (res: Envelope<FinanceContextResponse>) => res.data,
      providesTags: ['Finance', 'Academic'],
    }),

    getFinanceOverview: builder.query<
      FinanceOverviewResponse,
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/overview',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<FinanceOverviewResponse>) => res.data,
      providesTags: ['Finance'],
    }),

    getFeeHeads: builder.query<FeeHeadItem[], void>({
      query: () => ({ url: '/finance/fee-heads', method: 'GET' }),
      transformResponse: (res: Envelope<FeeHeadItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    saveFeeHead: builder.mutation<
      FeeHeadItem,
      {
        id?: string;
        code: string;
        name: string;
        description?: string;
        frequency?: FeeFrequency;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/finance/fee-heads', method: 'POST', body }),
      transformResponse: (res: Envelope<FeeHeadItem>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    getFeeStructures: builder.query<
      FeeStructureItem[],
      { academicYearId?: string; classId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/fee-structures',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<FeeStructureItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    saveFeeStructure: builder.mutation<
      FeeStructureItem,
      {
        academicYearId?: string;
        classId: string;
        feeHeadId: string;
        amount: number;
        dueDay?: number;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/finance/fee-structures', method: 'POST', body }),
      transformResponse: (res: Envelope<FeeStructureItem>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    updateFeeStructure: builder.mutation<
      FeeStructureItem,
      { id: string; amount?: number; dueDay?: number; isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/fee-structures/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: Envelope<FeeStructureItem>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    deleteFeeStructure: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/finance/fee-structures/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    getWaivers: builder.query<
      StudentWaiverItem[],
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/waivers',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<StudentWaiverItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    saveWaiver: builder.mutation<
      StudentWaiverItem,
      {
        academicYearId?: string;
        studentEnrollmentId: string;
        feeHeadId?: string;
        waiverType?: WaiverType;
        value: number;
        reason?: string;
      }
    >({
      query: (body) => ({ url: '/finance/waivers', method: 'POST', body }),
      transformResponse: (res: Envelope<StudentWaiverItem>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    deleteWaiver: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/finance/waivers/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    generateInvoices: builder.mutation<
      { createdCount: number; skippedCount: number },
      {
        academicYearId?: string;
        classId?: string;
        feeStructureId: string;
        month?: number;
        title?: string;
        dueDate?: string;
      }
    >({
      query: (body) => ({ url: '/finance/invoices/generate', method: 'POST', body }),
      transformResponse: (res: Envelope<{ createdCount: number; skippedCount: number }>) =>
        res.data,
      invalidatesTags: ['Finance'],
    }),

    getStudentLedger: builder.query<StudentLedgerResponse, string>({
      query: (enrollmentId) => ({
        url: `/finance/ledger/${enrollmentId}`,
        method: 'GET',
      }),
      transformResponse: (res: Envelope<StudentLedgerResponse>) => res.data,
      providesTags: ['Finance'],
    }),

    collectFee: builder.mutation<
      FeePaymentTransactionItem,
      {
        academicYearId?: string;
        studentEnrollmentId: string;
        paymentMethod?: FeePaymentMethod;
        referenceNo?: string;
        remarks?: string;
        items: Array<{
          invoiceId?: string;
          feeHeadId: string;
          title: string;
          amount: number;
          discount?: number;
          netPaid: number;
        }>;
      }
    >({
      query: (body) => ({ url: '/finance/collect', method: 'POST', body }),
      transformResponse: (res: Envelope<FeePaymentTransactionItem>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    getTransactions: builder.query<
      { items: FeePaymentTransactionItem[]; meta: PaginationMeta },
      {
        academicYearId?: string;
        search?: string;
        paymentMethod?: string;
        status?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: '/finance/transactions',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: {
        data: FeePaymentTransactionItem[];
        meta: PaginationMeta;
      }) => ({
        items: res.data ?? [],
        meta: res.meta,
      }),
      providesTags: ['Finance'],
    }),

    voidTransaction: builder.mutation<
      { id: string; status: ReceiptStatus },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/finance/transactions/${id}/void`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (res: Envelope<{ id: string; status: ReceiptStatus }>) =>
        res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    getDues: builder.query<
      DuesRowItem[],
      { academicYearId?: string; classId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/dues',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<DuesRowItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    getMiscIncomes: builder.query<
      MiscIncomeItem[],
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/misc-incomes',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<MiscIncomeItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    createMiscIncome: builder.mutation<
      MiscIncomeItem,
      {
        academicYearId?: string;
        category: string;
        title: string;
        receivedFrom?: string;
        amount: number;
        paymentMethod?: FeePaymentMethod;
        referenceNo?: string;
        incomeDate: string;
        remarks?: string;
      }
    >({
      query: (body) => ({ url: '/finance/misc-incomes', method: 'POST', body }),
      transformResponse: (res: Envelope<MiscIncomeItem>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    deleteMiscIncome: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/finance/misc-incomes/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    getExpenses: builder.query<
      ExpenseVoucherItem[],
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/expenses',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<ExpenseVoucherItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    createExpense: builder.mutation<
      ExpenseVoucherItem,
      {
        academicYearId?: string;
        category: string;
        title: string;
        paidTo?: string;
        amount: number;
        paymentMethod?: FeePaymentMethod;
        referenceNo?: string;
        expenseDate: string;
        remarks?: string;
      }
    >({
      query: (body) => ({ url: '/finance/expenses', method: 'POST', body }),
      transformResponse: (res: Envelope<ExpenseVoucherItem>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    deleteExpense: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/finance/expenses/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    getSalaries: builder.query<
      StaffSalaryPaymentItem[],
      { academicYearId?: string } | void
    >({
      query: (params) => ({
        url: '/finance/salaries',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<StaffSalaryPaymentItem[]>) => res.data,
      providesTags: ['Finance'],
    }),

    createSalary: builder.mutation<
      StaffSalaryPaymentItem,
      {
        academicYearId?: string;
        staffId: string;
        month: number;
        year: number;
        basicSalary: number;
        bonus?: number;
        deduction?: number;
        paymentMethod?: FeePaymentMethod;
        referenceNo?: string;
        paidDate: string;
        remarks?: string;
      }
    >({
      query: (body) => ({ url: '/finance/salaries', method: 'POST', body }),
      transformResponse: (res: Envelope<StaffSalaryPaymentItem>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    deleteSalary: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/finance/salaries/${id}`, method: 'DELETE' }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance', 'Audit'],
    }),

    getCashbook: builder.query<
      CashbookResponse,
      { academicYearId?: string; from?: string; to?: string } | void
    >({
      query: (params) => ({
        url: '/finance/cashbook',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (res: Envelope<CashbookResponse>) => res.data,
      providesTags: ['Finance'],
    }),
  }),
});

export const {
  useGetFinanceContextQuery,
  useGetFinanceOverviewQuery,
  useGetFeeHeadsQuery,
  useSaveFeeHeadMutation,
  useGetFeeStructuresQuery,
  useSaveFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useGetWaiversQuery,
  useSaveWaiverMutation,
  useDeleteWaiverMutation,
  useGenerateInvoicesMutation,
  useGetStudentLedgerQuery,
  useCollectFeeMutation,
  useGetTransactionsQuery,
  useVoidTransactionMutation,
  useGetDuesQuery,
  useGetMiscIncomesQuery,
  useCreateMiscIncomeMutation,
  useDeleteMiscIncomeMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetSalariesQuery,
  useCreateSalaryMutation,
  useDeleteSalaryMutation,
  useGetCashbookQuery,
} = financeApi;
