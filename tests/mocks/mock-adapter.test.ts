import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMockRequest, resetMockDb, getDbSnapshot } from '@/src/mocks/mockAdapter';

test('mockAdapter domain handler dispatch lifecycle', async (t) => {
  await t.test('handles /bootstrap GET endpoint and returns full state', async () => {
    const res = await handleMockRequest('/bootstrap', 'GET');
    assert.equal(res.error, undefined);
    assert.ok(res.data);
    const data = res.data as { schoolProfile: { name: string }; classes: unknown[] };
    assert.equal(data.schoolProfile.name, 'ভোজেশ্বর উচ্চ বিদ্যালয়');
    assert.ok(Array.isArray(data.classes));
    assert.ok(data.classes.length > 0);
  });

  await t.test('handles /public/results/search with exam validation', async () => {
    const res = await handleMockRequest('/public/results/search', 'POST', {
      examId: 'exam-hy-10',
      classId: 'cls-10',
      roll: '1',
    });
    assert.equal(res.error, undefined);
    assert.ok(res.data);
    const data = res.data as { status: string; student: { nameBn: string } };
    assert.equal(data.status, 'FOUND');
    assert.equal(data.student.nameBn, 'তানভীর আহমেদ');
  });

  await t.test('returns 404 error for unknown mock routes', async () => {
    const res = await handleMockRequest('/unknown/non-existent-endpoint', 'POST');
    assert.ok(res.error);
    assert.equal(res.error?.status, 404);
  });

  await t.test('resets mock database to initial seed without side effects', async () => {
    const initial = getDbSnapshot();
    assert.ok(initial.students.length > 0);
    const reset = resetMockDb();
    assert.equal(reset.students.length, initial.students.length);
  });
});
