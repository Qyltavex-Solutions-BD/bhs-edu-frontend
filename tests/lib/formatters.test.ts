import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toBnDigits,
  formatNumber,
  formatYear,
  evaluateExamSubjectMark,
  calculateOverallGpa,
} from '@/src/lib/formatters';
import type { GradeRange, GradingScale } from '@/src/types/entities';

const SAMPLE_SCALE: GradingScale = {
  id: 'gs-nctb-5',
  name: 'NCTB Secondary 5.00',
  maxGpa: 5.0,
  isDefault: true,
  isSystemDefault: true,
  isActive: true,
  isDeleted: false,
  optionalBonusThreshold: 2.0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const SAMPLE_RANGES: GradeRange[] = [
  { id: 'gr-1', gradingScaleId: 'gs-nctb-5', letterGrade: 'A+', gradePoint: 5.0, minPercentage: 80, maxPercentage: 100, isFailGrade: false, remarks: 'Outstanding', displayOrder: 1, isDeleted: false },
  { id: 'gr-2', gradingScaleId: 'gs-nctb-5', letterGrade: 'A', gradePoint: 4.0, minPercentage: 70, maxPercentage: 79.99, isFailGrade: false, remarks: 'Excellent', displayOrder: 2, isDeleted: false },
  { id: 'gr-3', gradingScaleId: 'gs-nctb-5', letterGrade: 'A-', gradePoint: 3.5, minPercentage: 60, maxPercentage: 69.99, isFailGrade: false, remarks: 'Very Good', displayOrder: 3, isDeleted: false },
  { id: 'gr-4', gradingScaleId: 'gs-nctb-5', letterGrade: 'B', gradePoint: 3.0, minPercentage: 50, maxPercentage: 59.99, isFailGrade: false, remarks: 'Good', displayOrder: 4, isDeleted: false },
  { id: 'gr-5', gradingScaleId: 'gs-nctb-5', letterGrade: 'C', gradePoint: 2.0, minPercentage: 40, maxPercentage: 49.99, isFailGrade: false, remarks: 'Satisfactory', displayOrder: 5, isDeleted: false },
  { id: 'gr-6', gradingScaleId: 'gs-nctb-5', letterGrade: 'D', gradePoint: 1.0, minPercentage: 33, maxPercentage: 39.99, isFailGrade: false, remarks: 'Pass', displayOrder: 6, isDeleted: false },
  { id: 'gr-7', gradingScaleId: 'gs-nctb-5', letterGrade: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 32.99, isFailGrade: true, remarks: 'Fail', displayOrder: 7, isDeleted: false },
];

test('Formatters and localization helpers', async (t) => {
  await t.test('converts western digits to Bengali numerals', () => {
    assert.equal(toBnDigits('2026'), '২০২৬');
    assert.equal(toBnDigits('1234567890'), '১২৩৪৫৬৭৮৯০');
    assert.equal(toBnDigits('Roll: 42'), 'Roll: ৪২');
  });

  await t.test('formats numbers with locale and decimal precision', () => {
    assert.equal(formatNumber(1500, 'en'), '1,500');
    assert.equal(formatNumber(1500, 'bn'), '১,৫০০');
    assert.equal(formatNumber(3.75, 'bn', 2), '৩.৭৫');
    assert.equal(formatNumber(null, 'bn'), '—');
  });

  await t.test('formats year without grouping commas', () => {
    assert.equal(formatYear(2026, 'bn'), '২০২৬');
    assert.equal(formatYear(2026, 'en'), '2026');
    assert.equal(formatYear(null, 'en'), '—');
  });
});

test('Unified NCTB Examination evaluation logic', async (t) => {
  await t.test('correctly evaluates passed subject with component marks', () => {
    const res = evaluateExamSubjectMark(
      { writtenMarks: 50, mcqMarks: 25, practicalMarks: 15, isAbsent: false },
      { fullMarks: 100, passMarks: 33, hasWritten: true, writtenPassMarks: 23, hasMcq: true, mcqPassMarks: 10, hasPractical: true, practicalPassMarks: 8 },
      SAMPLE_RANGES
    );
    assert.equal(res.totalMarks, 90);
    assert.equal(res.letterGrade, 'A+');
    assert.equal(res.gradePoint, 5.0);
    assert.equal(res.isPassed, true);
    assert.equal(res.failReason, null);
  });

  await t.test('fails subject when written component is below minimum pass marks', () => {
    const res = evaluateExamSubjectMark(
      { writtenMarks: 18, mcqMarks: 28, practicalMarks: 24, isAbsent: false },
      { fullMarks: 100, passMarks: 33, hasWritten: true, writtenPassMarks: 23, hasMcq: true, mcqPassMarks: 10, hasPractical: true, practicalPassMarks: 8 },
      SAMPLE_RANGES
    );
    assert.equal(res.totalMarks, 70); // Even though total is 70 (A grade), written failed!
    assert.equal(res.isPassed, false);
    assert.equal(res.letterGrade, 'F');
    assert.equal(res.gradePoint, 0.0);
    assert.equal(res.failReason, 'WRITTEN_FAIL');
  });

  await t.test('evaluates absent mark as F with zero grade point', () => {
    const res = evaluateExamSubjectMark(
      { writtenMarks: 0, mcqMarks: 0, practicalMarks: 0, isAbsent: true },
      { fullMarks: 100, passMarks: 33 },
      SAMPLE_RANGES
    );
    assert.equal(res.isPassed, false);
    assert.equal(res.letterGrade, 'F');
    assert.equal(res.failReason, 'ABSENT');
  });

  await t.test('calculates overall GPA with 4th optional subject bonus point deduction', () => {
    const subjects = [
      { gradePoint: 5.0, isPassed: true, isOptional: false },
      { gradePoint: 5.0, isPassed: true, isOptional: false },
      { gradePoint: 4.0, isPassed: true, isOptional: false },
      { gradePoint: 4.0, isPassed: true, isOptional: false },
      { gradePoint: 5.0, isPassed: true, isOptional: true }, // Optional bonus: 5.0 - 2.0 = 3.0 points added!
    ];

    const overall = calculateOverallGpa(subjects, SAMPLE_SCALE, SAMPLE_RANGES);
    assert.equal(overall.isPassed, true);
    assert.equal(overall.gpaWithoutOptional, 4.5);
    // (18 compulsory + 3 bonus) / 4 compulsory = 21 / 4 = 5.25 -> capped at 5.00
    assert.equal(overall.gpa, 5.0);
    assert.equal(overall.letterGrade, 'A+');
    assert.equal(overall.failedSubjectCount, 0);
  });
});
