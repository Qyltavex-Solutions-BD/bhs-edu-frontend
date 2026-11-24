import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMockRequest, resetMockDb } from '@/src/mocks/mockAdapter';

test('Critical Public & Portal End-to-End Journeys', async (t) => {
  // Ensure fresh seed before running journey tests
  resetMockDb();

  await t.test('Journey 1: Public Result Search Flow', async () => {
    // 1. Valid published result lookup
    const foundRes = await handleMockRequest('/public/results/search', 'POST', {
      examId: 'exam-hy-10',
      classId: 'cls-10',
      roll: '1',
    });
    assert.equal(foundRes.error, undefined);
    assert.ok(foundRes.data);
    const foundData = foundRes.data as { status: string; student: { nameBn: string }; summary: { gpa: number } };
    assert.equal(foundData.status, 'FOUND');
    assert.equal(foundData.student.nameBn, 'তানভীর আহমেদ');
    assert.equal(foundData.summary.gpa, 5.0);

    // 2. Withheld result protection lookup
    const withheldRes = await handleMockRequest('/public/results/search', 'POST', {
      examId: 'exam-sel-10',
      classId: 'cls-10',
      roll: '1',
    });
    assert.equal(withheldRes.error, undefined);
    const withheldData = withheldRes.data as { status: string; messageBn: string };
    assert.equal(withheldData.status, 'WITHHELD');
    assert.ok(withheldData.messageBn.includes('স্থগিত'));

    // 3. Unmatched roll lookup
    const notFoundRes = await handleMockRequest('/public/results/search', 'POST', {
      examId: 'exam-hy-10',
      classId: 'cls-10',
      roll: '99999',
    });
    assert.equal(notFoundRes.error, undefined);
    const notFoundData = notFoundRes.data as { status: string };
    assert.equal(notFoundData.status, 'NOT_FOUND');
  });

  await t.test('Journey 2: Online Admission Application Submission & Inbox Flow', async () => {
    const newAppPayload = {
      studentNameBn: 'সোহাগ মিয়া',
      studentNameEn: 'Sohag Mia',
      fatherNameBn: 'রমিজ মিয়া',
      fatherNameEn: 'Romiz Mia',
      motherNameBn: 'রাশিদা বেগম',
      motherNameEn: 'Rashida Begum',
      guardianPhone: '01711999888',
      presentAddress: 'ভোজেশ্বর, শরীয়তপুর',
      permanentAddress: 'ভোজেশ্বর, শরীয়তপুর',
      dateOfBirth: '2011-04-10',
      gender: 'MALE',
      birthCertificateNo: '20119876543210123',
      religion: 'ISLAM',
      targetClassId: 'cls-6',
      declarationAccepted: true,
    };

    // 1. Submit application via public portal
    const submitRes = await handleMockRequest('/public/admissions', 'POST', newAppPayload);
    assert.equal(submitRes.error, undefined);
    assert.ok(submitRes.data);
    const appData = submitRes.data as { id: string; applicationNumber: string; status: string };
    assert.equal(appData.status, 'NEW');
    assert.ok(appData.applicationNumber.startsWith('ADM-'));

    // 2. Prevent duplicate submission with same birth certificate
    const dupRes = await handleMockRequest('/public/admissions', 'POST', newAppPayload);
    assert.ok(dupRes.error);
    assert.equal(dupRes.error?.status, 409);
  });

  await t.test('Journey 3: Attendance Batch Processing & SMS Log Retry Flow', async () => {
    // 1. Submit attendance batch on a valid school working day (Thursday 2026-11-19)
    const batchRes = await handleMockRequest('/attendance/batch', 'POST', {
      academicYearId: 'ay-2026',
      date: '2026-11-19',
      markedBy: 'user-admin',
      entries: [
        { studentEnrollmentId: 'enr-stu-10-1', status: 'PRESENT', method: 'MANUAL' },
        { studentEnrollmentId: 'enr-stu-10-2', status: 'ABSENT', method: 'MANUAL' },
      ],
    });
    assert.equal(batchRes.error, undefined);
    assert.ok(batchRes.data);
    const batchData = batchRes.data as { saved: number; smsQueued: number };
    assert.equal(batchData.saved, 2);

    // 2. Retry all failed SMS notifications
    const retryAllRes = await handleMockRequest('/attendance/sms/retry-all', 'POST');
    assert.equal(retryAllRes.error, undefined);
    assert.ok(retryAllRes.data);
  });
});
