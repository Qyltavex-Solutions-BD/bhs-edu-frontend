/**
 * Compatibility facade for the legacy API import path.
 *
 * New code should import hooks from the owning feature module. Existing screens
 * may continue importing from this file while they are migrated incrementally.
 */
export { baseApi as schoolApi } from '@/src/lib/api/base-api';

export { useGetBootstrapQuery } from '@/src/features/bootstrap/api/bootstrap.api';
export { useSearchPublicResultMutation } from '@/src/features/results/api/public-results.api';
export { useCreateNoticeMutation } from '@/src/features/notices/api/notices.api';
export { useUpdateSchoolProfileMutation } from '@/src/features/institution/api/institution.api';
export { useMarkNotificationReadMutation } from '@/src/features/notifications/api/notifications.api';
export {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useResetUserPasswordMutation,
  useGetAuditLogsQuery,
  useGetAuditModulesQuery,
} from '@/src/features/access-control/api/access-control.api';
export { useToggleArchiveMutation } from '@/src/features/admin-operations/api/admin-operations.api';
export {
  usePreviewPromotionQuery,
  useExecuteBulkPromotionMutation,
  useGetPromotionHistoryQuery,
  useRollbackBatchPromotionMutation,
} from '@/src/features/students/api/promotions.api';
export { useCreateExamMutation } from '@/src/features/examinations/api/exam-creation.api';

export {
  useToggleCmsItemMutation,
  useUpsertCmsItemMutation,
  useDeleteCmsItemMutation,
  useUpdateContactInfoMutation,
  useUpdateAdmissionContentMutation,
  useReorderCmsItemsMutation,
} from '@/src/features/content/api/content.api';

export {
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
} from '@/src/features/academic/api/academic.api';

export {
  useGetParentsQuery,
  useGetParentByIdQuery,
  useGetParentCoverageQuery,
  useUpdateParentMutation,
  useRemoveParentMutation,
  useUpdateParentLinkMutation,
  useCreateParentPortalAccountMutation,
} from '@/src/features/parents/api/parents.api';

export {
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSaveDepartmentMutation,
  useRemoveDepartmentMutation,
  useSaveStaffStructureMutation,
} from '@/src/features/staff/api/staff.api';

export {
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateEnrollmentMutation,
  useImportStudentsMutation,
  useIssueRfidCardMutation,
  useUpdateRfidCardStatusMutation,
  useReplaceRfidCardMutation,
  useIssueTransferCertificateMutation,
  useIssueTestimonialMutation,
} from '@/src/features/students/api/students.api';

export {
  useSaveAttendanceBatchMutation,
  useRetryAttendanceSmsMutation,
  useRetryAllAttendanceSmsMutation,
  useUpdateAttendanceConfigMutation,
  useSimulateRfidScanMutation,
} from '@/src/features/attendance/api/attendance.api';

export {
  useGetExamsQuery,
  useGetExamByIdQuery,
  useDeleteExamMutation,
  useGetGradingScalesQuery,
  useGetExamSubjectsQuery,
  useCreateExamSubjectMutation,
  useUpdateExamSubjectMutation,
  useRemoveExamSubjectMutation,
  useGetExamRoutinesByExamQuery,
  useGetExamRoutinesQuery,
  useCreateExamRoutineMutation,
  useUpdateExamRoutineMutation,
  useRemoveExamRoutineMutation,
  useSaveMarksBatchMutation,
  useProcessExamResultsMutation,
  useUpdateExamMutation,
  useUpsertExamSubjectMutation,
  useDeleteExamSubjectMutation,
  useUpsertGradingScaleMutation,
  useUpsertGradeRangeMutation,
  useDeleteGradeRangeMutation,
  useSaveConsolidatedConfigMutation,
  useUpsertExamHallRoomMutation,
  useDeleteExamHallRoomMutation,
  useUpsertResultScrutinyMutation,
  useSaveResultRemarkMutation,
} from '@/src/features/examinations/api/examinations.api';

export {
  useSubmitAdmissionApplicationMutation,
  useUpdateAdmissionStatusMutation,
} from '@/src/features/admission/api/admission.api';
