/**
 * Shared Form Validation Schemas and Re-exports
 *
 * Re-exports feature-owned schemas while preserving backward compatibility.
 */

export { bdPhoneRegex } from './regex';
export * from '@/src/features/admission/schemas';
export * from '@/src/features/auth/schemas';
export * from '@/src/features/examinations/schemas';
export * from '@/src/features/notices/schemas';
export * from '@/src/features/staff/schemas';
export * from '@/src/features/students/schemas';
