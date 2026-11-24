import {
  Gender,
  Religion,
} from '@/src/types/enums';
import type {
  AppNotification,
  FeeInvoice,
  HomeworkAssignment,
  LeaveApplication,
  OnlineAdmissionApplication,
  SmsTemplateConfig,
} from '@/src/types/proposed/future';
import { NOW } from './common';

export function createFutureFixtures() {
  // 13. Proposed / BACKEND-PENDING demo records (Admissions inbox, notifications, future previews)
  const onlineAdmissions: OnlineAdmissionApplication[] = [
    {
      id: 'app-1',
      applicationNumber: 'ADM-2027-001',
      academicSession: '২০২৭',
      status: 'UNDER_REVIEW',
      submittedAt: '2026-11-17T11:20:00.000Z',
      admissionTestRoll: '270601',
      admissionTestDate: '2026-12-24',
      studentNameBn: 'রাফিউল ইসলাম (ডেমো আবেদনকারী)',
      studentNameEn: 'Rafiul Islam',
      fatherNameBn: 'মোঃ সাইদুর রহমান',
      fatherNameEn: 'Md. Saidur Rahman',
      fatherOccupation: 'ব্যবসা',
      fatherNid: '19848614500112233',
      motherNameBn: 'মোছাঃ সালমা বেগম',
      motherNameEn: 'Mst. Salma Begum',
      motherOccupation: 'গৃহিণী',
      motherNid: '19888614500112244',
      guardianPhone: '01712345678',
      presentAddress: 'গ্রাম: মশুরা, ডাকঘর: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'গ্রাম: মশুরা, ডাকঘর: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2014-05-12',
      gender: Gender.MALE,
      birthCertificateNo: '20148614500012345',
      religion: Religion.ISLAM,
      previousSchoolName: 'ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়',
      previousClass: '৫ম শ্রেণি',
      previousGrade: 'A+',
      isReadmission: false,
      targetClassId: 'cls-6',
      preferredSection: 'ক',
      declarationAccepted: true,
    },
    {
      id: 'app-2',
      applicationNumber: 'ADM-2027-002',
      academicSession: '২০২৭',
      status: 'APPROVED',
      submittedAt: '2026-11-18T08:45:00.000Z',
      admissionTestRoll: '270901',
      admissionTestDate: '2026-12-24',
      studentNameBn: 'মালিহা চৌধুরী (ডেমো আবেদনকারী)',
      studentNameEn: 'Maliha Chowdhury',
      fatherNameBn: 'মোঃ জসিম উদ্দিন চৌধুরী',
      fatherNameEn: 'Md. Jasim Uddin Chowdhury',
      fatherOccupation: 'চাকরি',
      fatherNid: '19818614500223344',
      motherNameBn: 'তাসলিমা আক্তার',
      motherNameEn: 'Taslima Akter',
      motherOccupation: 'শিক্ষকতা',
      motherNid: '19868614500223355',
      guardianPhone: '01812345679',
      presentAddress: 'গ্রাম: ভোজেশ্বর বাজার, নড়িয়া, শরীয়তপুর',
      permanentAddress: 'গ্রাম: ভোজেশ্বর বাজার, নড়িয়া, শরীয়তপুর',
      dateOfBirth: '2011-08-20',
      gender: Gender.FEMALE,
      birthCertificateNo: '20118614500098765',
      religion: Religion.ISLAM,
      previousSchoolName: 'নড়িয়া বালিকা উচ্চ বিদ্যালয়',
      previousClass: '৮ম শ্রেণি',
      previousGrade: 'A+',
      isReadmission: false,
      targetClassId: 'cls-9',
      targetGroupId: 'grp-sci',
      optionalSubjectName: 'উচ্চতর গণিত',
      declarationAccepted: true,
    },
  ];

  const notifications: AppNotification[] = [
    { id: 'ntf-1', type: 'MARKS_DEADLINE', titleBn: 'বার্ষিক পরীক্ষার নম্বর এন্ট্রির সময়সীমা', titleEn: 'Annual Exam Marks Entry Deadline', bodyBn: '১০ম শ্রেণির বার্ষিক পরীক্ষার নম্বর আগামী ১০ ডিসেম্বর ২০২৬ এর মধ্যে জমা দিতে হবে।', bodyEn: 'Submit Class 10 Annual Exam marks before 10 December 2026.', createdAt: '2026-11-19T08:00:00.000Z', isRead: false, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'], link: '/admin/examinations/marks-entry' },
    { id: 'ntf-2', type: 'RESULT_PUBLISHED', titleBn: 'অর্ধবার্ষিক পরীক্ষা ২০২৬ ফলাফল প্রকাশিত', titleEn: 'Half-Yearly Exam 2026 Results Published', bodyBn: '৯ম ও ১০ম শ্রেণির অর্ধবার্ষিক ফলাফল পাবলিক রেজাল্ট পেজে উন্মুক্ত করা হয়েছে।', bodyEn: 'Class 9 & 10 Half-Yearly results are now live on public result search.', createdAt: '2026-11-18T11:30:00.000Z', isRead: false, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'], link: '/results' },
    { id: 'ntf-3', type: 'ATTENDANCE_SMS', titleBn: 'আজকের RFID উপস্থিতি এসএমএস প্রেরিত', titleEn: 'Daily RFID Attendance SMS Sent', bodyBn: 'তানভীর আহমেদ সকাল ০৯:৫২ মিনিটে বিদ্যালয়ে প্রবেশ করেছে।', bodyEn: 'Tanvir Ahmed entered campus at 09:52 AM via RFID.', createdAt: '2026-11-19T09:53:00.000Z', isRead: false, targetRoles: ['PARENT', 'SUPER_ADMIN'], link: '/parent/sms-history' },
    { id: 'ntf-4', type: 'ADMISSION', titleBn: 'নতুন অনলাইন ভর্তি আবেদন জমা হয়েছে', titleEn: 'New Online Admission Application', bodyBn: 'আবেদন নং ADM-2027-002 (মালিহা চৌধুরী, ৯ম শ্রেণি) পর্যালোচনার জন্য অপেক্ষমাণ।', bodyEn: 'Application ADM-2027-002 (Maliha Chowdhury, Class 9) awaits review.', createdAt: '2026-11-18T08:50:00.000Z', isRead: true, targetRoles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'], link: '/admin/students/admissions' },
  ];

  const smsTemplateConfig: SmsTemplateConfig = {
    entryTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ {{time}} মিনিটে বিদ্যালয়ে প্রবেশ করেছে। - ভোজেশ্বর উচ্চ বিদ্যালয়',
    exitTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ {{time}} মিনিটে বিদ্যালয় ত্যাগ করেছে। - ভোজেশ্বর উচ্চ বিদ্যালয়',
    absentTemplateBn: 'প্রিয় অভিভাবক, আপনার সন্তান {{studentName}} আজ ({{date}}) বিদ্যালয়ে অনুপস্থিত। অনুগ্রহ করে যোগাযোগ করুন।',
    gatewayProvider: 'BD Bulk SMS Gateway (Backend Pending)',
    senderId: 'BHS',
    isEnabled: true,
  };

  const feeInvoices: FeeInvoice[] = [
    { id: 'inv-1', invoiceNo: 'INV-2026-1001', studentId: 'stu-10-1', studentName: 'তানভীর আহমেদ', className: '১০ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 650, paidAmountBdt: 650, status: 'PAID', paymentGateway: 'BKASH', dueDate: '2026-11-15' },
    { id: 'inv-2', invoiceNo: 'INV-2026-1002', studentId: 'stu-10-2', studentName: 'নুসরাত জাহান মিম', className: '১০ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 650, paidAmountBdt: 0, status: 'UNPAID', dueDate: '2026-11-25' },
    { id: 'inv-3', invoiceNo: 'INV-2026-0901', studentId: 'stu-9-1', studentName: 'তাহসিনা তাবাসসুম', className: '৯ম শ্রেণি', monthLabel: 'নভেম্বর ২০২৬', amountBdt: 550, paidAmountBdt: 300, status: 'PARTIAL', paymentGateway: 'NAGAD', dueDate: '2026-11-25' },
  ];

  const homeworks: HomeworkAssignment[] = [
    { id: 'hw-1', classId: 'cls-10', sectionId: 'sec-10-ka', subjectName: 'গণিত', teacherName: 'মোঃ কামরুল হাসান (ডেমো)', title: 'অনুশীলনী ৯.২ — ত্রিকোণমিতির ১ থেকে ১২ নং সমস্যা সমাধান', description: 'সব অঙ্ক খাতায় লিখে পরবর্তী রবিবারে জমা দিতে হবে।', dueDate: '2026-11-22', status: 'ACTIVE' },
    { id: 'hw-2', classId: 'cls-10', sectionId: 'sec-10-ka', subjectName: 'ইংরেজি', teacherName: 'সাবিনা ইয়াসমিন (ডেমো)', title: 'Paragraph: Digital Education in Rural Bangladesh', description: 'Write within 180–200 words in your classwork notebook.', dueDate: '2026-11-23', status: 'ACTIVE' },
  ];

  const leaveApplications: LeaveApplication[] = [
    { id: 'lv-1', applicantType: 'STUDENT', applicantName: 'মেহেদী হাসান শুভ (১০ম শ্রেণি)', fromDate: '2026-11-20', toDate: '2026-11-21', reason: 'জ্বর ও শারীরিক অসুস্থতা', status: 'PENDING' },
    { id: 'lv-2', applicantType: 'STAFF', applicantName: 'ফারহানা আক্তার (ডেমো)', fromDate: '2026-11-24', toDate: '2026-11-24', reason: 'পারিবারিক জরুরি কাজ', status: 'APPROVED' },
  ];


  return {
    onlineAdmissions,
    notifications,
    smsTemplateConfig,
    feeInvoices,
    homeworks,
    leaveApplications,
  };
}
