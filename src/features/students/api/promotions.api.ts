import { baseApi } from '@/src/lib/api/base-api';
import type { PromotionType } from '@/src/types/enums';

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    promoteStudents: builder.mutation<
      { promoted: number; retained: number; graduated: number },
      {
        toAcademicYearId: string;
        items: Array<{
          studentId: string;
          fromEnrollmentId: string;
          toClassId?: string;
          toSectionId?: string;
          toGroupId?: string | null;
          roll?: number;
          resultSummaryId?: string | null;
          remarks?: string | null;
          promotionType: PromotionType | 'GRADUATED';
        }>;
      }
    >({
      query: (body) => ({ url: '/students/promote', method: 'POST', body }),
      invalidatesTags: ['Students', 'Audit'],
    }),
  }),
});

export const { usePromoteStudentsMutation } = promotionsApi;

