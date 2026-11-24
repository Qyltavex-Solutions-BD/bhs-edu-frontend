import { baseApi } from '@/src/lib/api/base-api';
import type {
  AcademicDocumentType,
  AcademicEventType,
  SubjectCategory,
} from '@/src/types/enums';
import type {
  AcademicDocument,
  AcademicEvent,
  AcademicGroup,
  AcademicYear,
  Book,
  ClassRoutine,
  ClassSubject,
  Section,
  SectionClassTeacher,
  Subject,
  SyllabusChapterEntry,
  SyllabusFile,
  TeacherAssignment,
} from '@/src/types/entities';

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    saveAcademicYear: builder.mutation<AcademicYear, Partial<AcademicYear>>({
      query: (body) => ({ url: '/academic/years', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    setActiveAcademicYear: builder.mutation<AcademicYear, { id: string }>({
      query: (body) => ({ url: '/academic/years/set-active', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveAcademicGroup: builder.mutation<AcademicGroup, Partial<AcademicGroup>>({
      query: (body) => ({ url: '/academic/groups', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveSection: builder.mutation<Section, Partial<Section>>({
      query: (body) => ({ url: '/academic/sections', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveMasterSubject: builder.mutation<
      Subject,
      {
        id?: string;
        name: string;
        nameBn: string;
        officialCode?: string | null;
        category: SubjectCategory;
        description?: string | null;
        isActive?: boolean;
      }
    >({
      query: (body) => ({ url: '/academic/subjects', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeMasterSubject: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/subjects/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveClassSubject: builder.mutation<ClassSubject, Partial<ClassSubject>>({
      query: (body) => ({ url: '/academic/class-subjects', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassSubject: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/class-subjects/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    rolloverClassSubjects: builder.mutation<
      { copiedCount: number; skippedCount: number },
      { fromAcademicYearId: string; toAcademicYearId: string }
    >({
      query: (body) => ({ url: '/academic/class-subjects/rollover', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveBook: builder.mutation<Book, Partial<Book> & { academicYearId?: string }>({
      query: (body) => ({ url: '/academic/books', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveClassTeacher: builder.mutation<
      SectionClassTeacher,
      { academicYearId: string; sectionId: string; staffId: string }
    >({
      query: (body) => ({ url: '/academic/class-teachers', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassTeacher: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/class-teachers/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveTeacherAssignment: builder.mutation<
      TeacherAssignment,
      { academicYearId: string; sectionId: string; classSubjectId: string; staffId: string; canEnterMarks?: boolean }
    >({
      query: (body) => ({ url: '/academic/teacher-assignments', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeTeacherAssignment: builder.mutation<{ deletedId: string }, { id: string }>({
      query: (body) => ({ url: '/academic/teacher-assignments/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    addClassRoutine: builder.mutation<ClassRoutine, any>({
      query: (body) => ({ url: '/class-routines', method: 'POST', body }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    moveClassRoutineSlot: builder.mutation<
      any,
      { routineId: string; targetDay: ClassRoutine['day']; targetPeriodNumber: number; startTime?: string; endTime?: string }
    >({
      query: ({ routineId, targetDay, targetPeriodNumber, startTime, endTime }) => ({
        url: `/class-routines/${routineId}`,
        method: 'PATCH',
        body: {
          day: targetDay,
          periodNumber: targetPeriodNumber,
          ...(startTime ? { startTime } : {}),
          ...(endTime ? { endTime } : {}),
        },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    removeClassRoutine: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/class-routines/${id}`, method: 'DELETE' }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ['Academic', 'Bootstrap'],
    }),

    saveSyllabusFile: builder.mutation<
      SyllabusFile,
      Omit<SyllabusFile, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({ url: '/academic/syllabus/files', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    addSyllabusEntry: builder.mutation<
      SyllabusChapterEntry,
      Omit<SyllabusChapterEntry, 'id'>
    >({
      query: (body) => ({ url: '/academic/syllabus/entries', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeSyllabusFile: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/syllabus/files/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeSyllabusEntry: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/syllabus/entries/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveAcademicEvent: builder.mutation<
      AcademicEvent,
      {
        id?: string;
        academicYearId: string;
        title: string;
        description?: string | null;
        eventType: AcademicEventType;
        startDate: string;
        endDate: string;
      }
    >({
      query: (body) => ({ url: '/academic/events', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    saveAcademicDocument: builder.mutation<
      AcademicDocument,
      {
        id?: string;
        type: AcademicDocumentType;
        title: string;
        description?: string | null;
        fileUrl?: string | null;
        isPublished?: boolean;
      }
    >({
      query: (body) => ({ url: '/academic/documents', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeAcademicDocument: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/documents/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

    removeAcademicEvent: builder.mutation<{ id: string }, { id: string }>({
      query: (body) => ({ url: '/academic/events/remove', method: 'POST', body }),
      invalidatesTags: ['Academic', 'Bootstrap', 'Audit'],
    }),

  }),
});

export const {
  useSaveAcademicYearMutation,
  useSetActiveAcademicYearMutation,
  useSaveAcademicGroupMutation,
  useSaveSectionMutation,
  useSaveMasterSubjectMutation,
  useRemoveMasterSubjectMutation,
  useSaveClassSubjectMutation,
  useRemoveClassSubjectMutation,
  useRolloverClassSubjectsMutation,
  useSaveBookMutation,
  useSaveClassTeacherMutation,
  useRemoveClassTeacherMutation,
  useSaveTeacherAssignmentMutation,
  useRemoveTeacherAssignmentMutation,
  useAddClassRoutineMutation,
  useMoveClassRoutineSlotMutation,
  useRemoveClassRoutineMutation,
  useSaveSyllabusFileMutation,
  useRemoveSyllabusFileMutation,
  useAddSyllabusEntryMutation,
  useRemoveSyllabusEntryMutation,
  useSaveAcademicEventMutation,
  useRemoveAcademicEventMutation,
  useSaveAcademicDocumentMutation,
  useRemoveAcademicDocumentMutation,
} = academicApi;

