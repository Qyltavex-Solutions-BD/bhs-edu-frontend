import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMockRequest, resetMockDb } from '@/src/mocks/mockAdapter';

test('Critical Portal End-to-End Journeys', async (t) => {
  resetMockDb();

  await t.test('Journey 4: Examination Creation, Auto-subjects & Publication Flow', async () => {
    // 1. Create a new examination
    const createExamRes = await handleMockRequest('/exams', 'POST', {
      name: 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬',
      academicYearId: 'ay-2026',
      classId: 'cls-10',
      examType: 'MODEL_TEST',
      startDate: '2026-08-10',
      endDate: '2026-08-25',
    });
    assert.equal(createExamRes.error, undefined);
    assert.ok(createExamRes.data);
    const createdExam = createExamRes.data as { id: string; name: string; resultStatus: string };
    assert.ok(createdExam.id);
    assert.equal(createdExam.name, 'দ্বিতীয় সাময়িক পরীক্ষা ২০২৬');
    assert.equal(createdExam.resultStatus, 'DRAFT');

    // 2. Publish results for the created examination
    const publishRes = await handleMockRequest('/exams/process-results', 'POST', {
      examId: createdExam.id,
      action: 'PUBLISH',
    });
    assert.equal(publishRes.error, undefined);
    assert.ok(publishRes.data);
    const publishData = publishRes.data as { exam: { resultStatus: string } };
    assert.equal(publishData.exam.resultStatus, 'PUBLISHED');

    // 3. Lock marks entry to prevent further modifications
    const lockRes = await handleMockRequest('/exams/process-results', 'POST', {
      examId: createdExam.id,
      action: 'LOCK',
    });
    assert.equal(lockRes.error, undefined);
    assert.ok(lockRes.data);
    const lockData = lockRes.data as { exam: { isLocked: boolean } };
    assert.equal(lockData.exam.isLocked, true);
  });

  await t.test('Journey 5: Student Transfer Certificate and Testimonial Flow', async () => {
    // 1. Issue a transfer certificate (TC) for an existing student
    const tcRes = await handleMockRequest('/students/tc', 'POST', {
      studentId: 'stu-10-1',
      tcNumber: 'TC-2026-901',
      reason: 'অভিভাবকের কর্মস্থল পরিবর্তন',
      issueDate: '2026-11-20',
      leavingDate: '2026-11-20',
      destinationSchool: 'ঢাকা গভর্নমেন্ট মুসলিম হাই স্কুল',
      conductRemarks: 'উত্তম ও সুশৃঙ্খল',
    });
    assert.equal(tcRes.error, undefined);
    assert.ok(tcRes.data);
    const tcData = tcRes.data as { id: string; studentId: string; tcNumber: string };
    assert.ok(tcData.id);
    assert.equal(tcData.studentId, 'stu-10-1');
    assert.equal(tcData.tcNumber, 'TC-2026-901');

    // 2. Issue an academic testimonial
    const testimonialRes = await handleMockRequest('/students/testimonials', 'POST', {
      studentId: 'stu-10-1',
      refNumber: 'BHS/TEST/2026/801',
      issueDate: '2026-11-20',
      type: 'STUDY_CHARACTER',
      characterNote: 'সদাচারী ও বিদ্যানুরাগী',
    });
    assert.equal(testimonialRes.error, undefined);
    assert.ok(testimonialRes.data);
    const testData = testimonialRes.data as { id: string; studentId: string; refNumber: string };
    assert.ok(testData.id);
    assert.equal(testData.studentId, 'stu-10-1');
    assert.equal(testData.refNumber, 'BHS/TEST/2026/801');
  });

  await t.test('Notice creation is unavailable in the mock adapter', async () => {
    const response = await handleMockRequest('/notices', 'POST', {
      title: 'A notice must be saved through the backend',
      status: 'PUBLISHED',
    });
    assert.equal(response.error?.status, 404);
  });

  await t.test('Marks a notification as read', async () => {
    const notifRes = await handleMockRequest('/notifications/read', 'POST', {});
    assert.equal(notifRes.error, undefined);
    assert.ok(notifRes.data);
    const notifData = notifRes.data as { ok: boolean };
    assert.equal(notifData.ok, true);
  });
});
