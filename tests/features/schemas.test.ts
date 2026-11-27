import assert from 'node:assert/strict';
import test from 'node:test';
import { loginSchema } from '@/src/features/auth/schemas';
import { admissionApplicationSchema } from '@/src/features/admission/schemas';
import { examCreateSchema } from '@/src/features/examinations/schemas';
import { ExamType, Gender, Religion } from '@/src/types/enums';

test('Feature runtime validation schemas', async (t) => {
  await t.test('loginSchema validates email/phone and password constraints', () => {
    const valid = loginSchema.safeParse({
      identifier: 'admin@bhs.edu.bd',
      password: 'password123',
      rememberMe: true,
    });
    assert.equal(valid.success, true);

    const invalid = loginSchema.safeParse({
      identifier: 'ab',
      password: '123',
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.ok(invalid.error.issues.length >= 2);
    }
  });

  await t.test('admissionApplicationSchema validates BD phone and 17-digit birth certificate', () => {
    const valid = admissionApplicationSchema.safeParse({
      studentNameBn: 'তানভীর আহমেদ',
      studentNameEn: 'Tanvir Ahmed',
      fatherNameBn: 'মোঃ আবুল কালাম',
      fatherNameEn: 'Md. Abul Kalam',
      fatherOccupation: 'ব্যবসা',
      fatherNid: '1980123456789',
      motherNameBn: 'মোসাঃ সালেহা বেগম',
      motherNameEn: 'Mst. Saleha Begum',
      motherOccupation: 'গৃহিণী',
      motherNid: '1985123456789',
      guardianPhone: '01711000010',
      presentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2010-05-15',
      gender: Gender.MALE,
      birthCertificateNo: '20101234567890123', // exactly 17 digits
      religion: Religion.ISLAM,
      isReadmission: false,
      targetClassId: 'cls-10',
      declarationAccepted: true,
    });
    assert.equal(valid.success, true);

    const invalidPhone = admissionApplicationSchema.safeParse({
      studentNameBn: 'তানভীর আহমেদ',
      studentNameEn: 'Tanvir Ahmed',
      fatherNameBn: 'মোঃ আবুল কালাম',
      fatherNameEn: 'Md. Abul Kalam',
      fatherOccupation: 'ব্যবসা',
      fatherNid: '1980123456789',
      motherNameBn: 'মোসাঃ সালেহা বেগম',
      motherNameEn: 'Mst. Saleha Begum',
      motherOccupation: 'গৃহিণী',
      motherNid: '1985123456789',
      guardianPhone: '12345', // invalid
      presentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2010-05-15',
      gender: Gender.MALE,
      birthCertificateNo: '123', // invalid
      religion: Religion.ISLAM,
      isReadmission: false,
      targetClassId: 'cls-10',
      declarationAccepted: false,
    });
    assert.equal(invalidPhone.success, false);
  });

  await t.test('examCreateSchema validates required examination scheduling parameters', () => {
    const valid = examCreateSchema.safeParse({
      academicYearId: 'ay-2026',
      classIds: ['cls-10'],
      gradingScaleId: 'gs-nctb-5',
      name: 'বার্ষিক পরীক্ষা ২০২৬',
      examType: ExamType.ANNUAL,
      startDate: '2026-11-20',
      endDate: '2026-12-05',
      allowCombinedPass: true,
    });
    assert.equal(valid.success, true);
  });
});
