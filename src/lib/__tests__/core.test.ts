import assert from 'node:assert/strict';
import {
  calculateOverallGpa,
  formatBdt,
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatTime12h,
  resolveGradeFromScale,
  toBnDigits,
} from '../formatters';
import {
  admissionApplicationSchema,
  loginSchema,
  noticeSchema,
  passwordChangeSchema,
} from '../validations/schemas';
import { Gender, NoticeStatus, Religion } from '../../types/enums';
import type { GradeRange } from '../../types/entities';

const NCTB_RANGES: GradeRange[] = [
  { id: 'r1', gradingScaleId: 'gs', letterGrade: 'A+', gradePoint: 5.0, minPercentage: 80, maxPercentage: 100, isFailGrade: false, displayOrder: 1, isDeleted: false },
  { id: 'r2', gradingScaleId: 'gs', letterGrade: 'A', gradePoint: 4.0, minPercentage: 70, maxPercentage: 79.99, isFailGrade: false, displayOrder: 2, isDeleted: false },
  { id: 'r3', gradingScaleId: 'gs', letterGrade: 'A-', gradePoint: 3.5, minPercentage: 60, maxPercentage: 69.99, isFailGrade: false, displayOrder: 3, isDeleted: false },
  { id: 'r4', gradingScaleId: 'gs', letterGrade: 'B', gradePoint: 3.0, minPercentage: 50, maxPercentage: 59.99, isFailGrade: false, displayOrder: 4, isDeleted: false },
  { id: 'r5', gradingScaleId: 'gs', letterGrade: 'C', gradePoint: 2.0, minPercentage: 40, maxPercentage: 49.99, isFailGrade: false, displayOrder: 5, isDeleted: false },
  { id: 'r6', gradingScaleId: 'gs', letterGrade: 'D', gradePoint: 1.0, minPercentage: 33, maxPercentage: 39.99, isFailGrade: false, displayOrder: 6, isDeleted: false },
  { id: 'r7', gradingScaleId: 'gs', letterGrade: 'F', gradePoint: 0.0, minPercentage: 0, maxPercentage: 32.99, isFailGrade: true, displayOrder: 7, isDeleted: false },
];

// 1. Bangla & English Formatters
assert.equal(toBnDigits('113587'), '১১৩৫৮৭');
assert.equal(formatNumber(1978, 'bn'), '১,৯৭৮');
assert.equal(formatNumber(4.85, 'bn', 2), '৪.৮৫');
assert.equal(formatNumber(4.85, 'en', 2), '4.85');
assert.equal(formatBdt(1250, 'bn'), '৳১,২৫০');
assert.equal(formatBdt(1250, 'en'), 'BDT 1,250');
assert.equal(formatDateShort('2026-11-19T12:00:00Z', 'en'), '19/11/2026');
assert.equal(formatDateLong('2026-11-19T12:00:00Z', 'bn'), '১৯ নভেম্বর ২০২৬');
assert.equal(formatTime12h('10:30', 'en'), '10:30 AM');
assert.equal(formatTime12h('14:15', 'en'), '02:15 PM');

// 2. Configurable GradingScale & 4th-Subject Bonus GPA Engine
const gradeAPlus = resolveGradeFromScale(86, 100, NCTB_RANGES, false, 33);
assert.equal(gradeAPlus.letterGrade, 'A+');
assert.equal(gradeAPlus.gradePoint, 5.0);
assert.equal(gradeAPlus.isPassed, true);

const gradeAbsent = resolveGradeFromScale(0, 100, NCTB_RANGES, true, 33);
assert.equal(gradeAbsent.letterGrade, 'F');
assert.equal(gradeAbsent.isPassed, false);

// 4 compulsory subjects (GP: 4.0, 4.0, 4.0, 4.0 => 4.00) + 1 optional A+ (5.0 => bonus +3.0 => (16+3)/4 = 4.75)
const withBonus = calculateOverallGpa(
  [
    { gradePoint: 4.0, isPassed: true, isOptional: false },
    { gradePoint: 4.0, isPassed: true, isOptional: false },
    { gradePoint: 4.0, isPassed: true, isOptional: false },
    { gradePoint: 4.0, isPassed: true, isOptional: false },
    { gradePoint: 5.0, isPassed: true, isOptional: true },
  ],
  { maxGpa: 5.0 },
  NCTB_RANGES
);
assert.equal(withBonus.gpaWithoutOptional, 4.0);
assert.equal(withBonus.gpa, 4.75);
assert.equal(withBonus.isPassed, true);

// Fail in any compulsory subject results in overall GPA 0.00 & F
const failedOverall = calculateOverallGpa(
  [
    { gradePoint: 5.0, isPassed: true, isOptional: false },
    { gradePoint: 0.0, isPassed: false, isOptional: false },
    { gradePoint: 5.0, isPassed: true, isOptional: true },
  ],
  { maxGpa: 5.0 },
  NCTB_RANGES
);
assert.equal(failedOverall.gpa, 0.0);
assert.equal(failedOverall.letterGrade, 'F');
assert.equal(failedOverall.failedSubjectCount, 1);

// 3. Zod Validation Schemas
assert.equal(loginSchema.safeParse({ identifier: 'admin@bhs.edu.bd', password: 'password123' }).success, true);
assert.equal(loginSchema.safeParse({ identifier: 'a', password: '123' }).success, false);

assert.equal(
  passwordChangeSchema.safeParse({
    currentPassword: 'oldpassword',
    newPassword: 'newpassword123',
    confirmPassword: 'newpassword123',
  }).success,
  true
);
assert.equal(
  passwordChangeSchema.safeParse({
    currentPassword: 'oldpassword',
    newPassword: 'newpassword123',
    confirmPassword: 'mismatchpassword',
  }).success,
  false
);

assert.equal(
  noticeSchema.safeParse({
    title: 'বার্ষিক পরীক্ষার সময়সূচি প্রকাশ',
    description: 'আগামী ১ ডিসেম্বর থেকে বার্ষিক পরীক্ষা শুরু হবে।',
    status: NoticeStatus.PUBLISHED,
    isUrgent: true,
  }).success,
  true
);

assert.equal(
  admissionApplicationSchema.safeParse({
    studentNameBn: 'রাফি আহমেদ',
    studentNameEn: 'Rafi Ahmed',
    fatherNameBn: 'কামাল আহমেদ',
    fatherNameEn: 'Kamal Ahmed',
    fatherOccupation: 'ব্যবসা',
    fatherNid: '1980123456789',
    motherNameBn: 'সালমা বেগম',
    motherNameEn: 'Salma Begum',
    motherOccupation: 'গৃহিণী',
    motherNid: '1985123456789',
    guardianPhone: '01711223344',
    presentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
    permanentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
    dateOfBirth: '2013-05-14',
    gender: Gender.MALE,
    birthCertificateNo: '20138616543210987',
    religion: Religion.ISLAM,
    isReadmission: false,
    targetClassId: 'cls-6',
    declarationAccepted: true,
  }).success,
  true
);

console.log('All core unit tests passed (formatters, GPA calculator, Zod schemas).');
