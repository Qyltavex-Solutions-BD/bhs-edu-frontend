/**
 * Bhojeshwar High School (BHS) Frontend Offline/Demo Hybrid Mock Adapter
 *
 * Dispatches API requests across domain handlers while preserving full in-memory
 * state transitions, conflict checks, and audit logging.
 */

import {
  handlePublicMock,
  handleInstitutionMock,
  handleAcademicMock,
  handleExamsMock,
  handleAttendanceMock,
  handleStudentsMock,
  handleParentsMock,
  handleStaffMock,
  handleContentMock,
  type MockHandler,
} from './handlers';

export { getDbSnapshot, resetMockDb } from './state';
export type { MockDatabase } from './seed';

const handlers: MockHandler[] = [
  handlePublicMock,
  handleInstitutionMock,
  handleAcademicMock,
  handleExamsMock,
  handleAttendanceMock,
  handleStudentsMock,
  handleParentsMock,
  handleStaffMock,
  handleContentMock,
];

export async function handleMockRequest(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<{ data?: unknown; error?: { status: number; message: string } }> {
  // Subtle realistic latency without slowing down interactions
  await new Promise((r) => setTimeout(r, 45));

  try {
    for (const handler of handlers) {
      const result = await handler(endpoint, method, body);
      if (result !== null && result !== undefined) {
        return result;
      }
    }

    return {
      error: {
        status: 404,
        message: `Mock API route ${method} ${endpoint} not found.`,
      },
    };
  } catch (err) {
    return {
      error: {
        status: 500,
        message: err instanceof Error ? err.message : 'Mock server error',
      },
    };
  }
}
