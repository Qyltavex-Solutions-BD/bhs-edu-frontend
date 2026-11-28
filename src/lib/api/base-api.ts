import { createApi } from '@reduxjs/toolkit/query/react';
import { hybridBaseQuery } from './hybrid-base-query';

export const apiTagTypes = [
  'Bootstrap',
  'AuthProfile',
  'AuthSessions',
  'Institution',
  'Students',
  'Staff',
  'Academic',
  'Attendance',
  'Exams',
  'Results',
  'Notices',
  'Admissions',
  'Notifications',
  'Audit',
  'Finance',
] as const;

/** Shared client-side API cache. Feature modules inject their own endpoints. */
export const baseApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery: hybridBaseQuery,
  tagTypes: apiTagTypes,
  endpoints: () => ({}),
});

