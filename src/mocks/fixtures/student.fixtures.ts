import {
  BloodGroup,
  CardStatus,
  EnrollmentStatus,
  Gender,
  PromotionType,
  RelationshipType,
  Religion,
  StudentStatus,
  TestimonialType,
} from '@/src/types/enums';
import type {
  Parent,
  ParentStudent,
  Student,
  StudentEnrollment,
  StudentPromotion,
  StudentRFIDcard,
  StudentTestimonial,
  StudentTransferCertificate,
} from '@/src/types/entities';
import { NOW } from './common';

export function createStudentFixtures() {
  // 5. Realistic Fictional Demo Students & Parents across Classes 6–10
  const studentSeedRows: Array<{
    id: string;
    studentId: string;
    nameEn: string;
    nameBn: string;
    gender: Gender;
    religion: Religion;
    blood: BloodGroup;
    classNum: number;
    sec: 'ka' | 'kha' | 'ga';
    roll: number;
    groupId: string | null;
    parentName: string;
    parentNameBn: string;
    parentPhone: string;
    parentOcc: string;
    parentId: string;
    userId?: string;
    rfid?: string;
  }> = [
    // Class 10 (SSC Batch - RFID enabled)
    { id: 'stu-10-1', studentId: 'BHS-2026-1001', nameEn: 'Tanvir Ahmed', nameBn: 'তানভীর আহমেদ', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 10, sec: 'ka', roll: 1, groupId: 'grp-sci', parentName: 'Md. Abul Kalam', parentNameBn: 'মোঃ আবুল কালাম', parentPhone: '01711000010', parentOcc: 'ব্যবসা', parentId: 'par-1', userId: 'user-student-1', rfid: 'RFID-10-8841' },
    { id: 'stu-10-2', studentId: 'BHS-2026-1002', nameEn: 'Nusrat Jahan Mim', nameBn: 'নুসরাত জাহান মিম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 10, sec: 'ka', roll: 2, groupId: 'grp-sci', parentName: 'Md. Delwar Hossain', parentNameBn: 'মোঃ দেলোয়ার হোসেন', parentPhone: '01711000011', parentOcc: 'চাকরি', parentId: 'par-2', rfid: 'RFID-10-8842' },
    { id: 'stu-10-3', studentId: 'BHS-2026-1003', nameEn: 'Pranto Chandra Das', nameBn: 'প্রান্ত চন্দ্র দাস', gender: Gender.MALE, religion: Religion.HINDUISM, blood: BloodGroup.B_POSITIVE, classNum: 10, sec: 'ka', roll: 3, groupId: 'grp-sci', parentName: 'Nirmal Chandra Das', parentNameBn: 'নির্মল চন্দ্র দাস', parentPhone: '01711000012', parentOcc: 'কৃষি ও ব্যবসা', parentId: 'par-3', rfid: 'RFID-10-8843' },
    { id: 'stu-10-4', studentId: 'BHS-2026-1004', nameEn: 'Farzana Akter', nameBn: 'ফারজানা আক্তার', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.AB_POSITIVE, classNum: 10, sec: 'ka', roll: 4, groupId: 'grp-sci', parentName: 'Md. Nasir Uddin', parentNameBn: 'মোঃ নাসির উদ্দিন', parentPhone: '01711000013', parentOcc: 'শিক্ষকতা', parentId: 'par-4', rfid: 'RFID-10-8844' },
    { id: 'stu-10-5', studentId: 'BHS-2026-1005', nameEn: 'Mehedi Hasan Shuvo', nameBn: 'মেহেদী হাসান শুভ', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_NEGATIVE, classNum: 10, sec: 'ka', roll: 5, groupId: 'grp-sci', parentName: 'Md. Rafiqul Islam', parentNameBn: 'মোঃ রফিকুল ইসলাম', parentPhone: '01711000014', parentOcc: 'প্রবাসী', parentId: 'par-5', rfid: 'RFID-10-8845' },
    { id: 'stu-10-6', studentId: 'BHS-2026-1006', nameEn: 'Sadia Afrin', nameBn: 'সাদিয়া আফরিন', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 10, sec: 'kha', roll: 1, groupId: 'grp-hum', parentName: 'Md. Kamal Mia', parentNameBn: 'মোঃ কামাল মিয়া', parentPhone: '01711000015', parentOcc: 'ব্যবসা', parentId: 'par-6', rfid: 'RFID-10-8846' },
    { id: 'stu-10-7', studentId: 'BHS-2026-1007', nameEn: 'Rakibul Islam', nameBn: 'রাকিবুল ইসলাম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 10, sec: 'kha', roll: 2, groupId: 'grp-bus', parentName: 'Md. Mizanur Rahman', parentNameBn: 'মোঃ মিজানুর রহমান', parentPhone: '01711000016', parentOcc: 'কৃষি', parentId: 'par-7', rfid: 'RFID-10-8847' },

    // Class 9
    { id: 'stu-9-1', studentId: 'BHS-2026-0901', nameEn: 'Tahsina Tabassum', nameBn: 'তাহসিনা তাবাসসুম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 9, sec: 'ka', roll: 1, groupId: 'grp-sci', parentName: 'Md. Abul Kalam', parentNameBn: 'মোঃ আবুল কালাম', parentPhone: '01711000010', parentOcc: 'ব্যবসা', parentId: 'par-1' }, // Second child of par-1!
    { id: 'stu-9-2', studentId: 'BHS-2026-0902', nameEn: 'Sajib Hossain', nameBn: 'সজীব হোসেন', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 9, sec: 'ka', roll: 2, groupId: 'grp-sci', parentName: 'Md. Shahidul Islam', parentNameBn: 'মোঃ শহিদুল ইসলাম', parentPhone: '01711000017', parentOcc: 'ব্যবসা', parentId: 'par-8' },
    { id: 'stu-9-3', studentId: 'BHS-2026-0903', nameEn: 'Ananya Saha', nameBn: 'অনন্যা সাহা', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.A_POSITIVE, classNum: 9, sec: 'ka', roll: 3, groupId: 'grp-sci', parentName: 'Bimal Saha', parentNameBn: 'বিমল সাহা', parentPhone: '01711000018', parentOcc: 'ব্যবসা', parentId: 'par-9' },
    { id: 'stu-9-4', studentId: 'BHS-2026-0904', nameEn: 'Mahir Faisal', nameBn: 'মাহির ফয়সাল', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.AB_POSITIVE, classNum: 9, sec: 'kha', roll: 1, groupId: 'grp-bus', parentName: 'Md. Moniruzzaman', parentNameBn: 'মোঃ মনিরুজ্জামান', parentPhone: '01711000019', parentOcc: 'চাকরি', parentId: 'par-10' },

    // Class 8
    { id: 'stu-8-1', studentId: 'BHS-2026-0801', nameEn: 'Jannatul Ferdous', nameBn: 'জান্নাতুল ফেরদৌস', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 8, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Delwar Hossain', parentNameBn: 'মোঃ দেলোয়ার হোসেন', parentPhone: '01711000011', parentOcc: 'চাকরি', parentId: 'par-2' },
    { id: 'stu-8-2', studentId: 'BHS-2026-0802', nameEn: 'Samiul Alim', nameBn: 'সামিউল আলিম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 8, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Harun-or-Rashid', parentNameBn: 'মোঃ হারুন-অর-রশিদ', parentPhone: '01711000021', parentOcc: 'কৃষি', parentId: 'par-11' },
    { id: 'stu-8-3', studentId: 'BHS-2026-0803', nameEn: 'Riya Rani Paul', nameBn: 'রিয়া রানী পাল', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.B_POSITIVE, classNum: 8, sec: 'kha', roll: 1, groupId: null, parentName: 'Kartik Paul', parentNameBn: 'কার্তিক পাল', parentPhone: '01711000022', parentOcc: 'মৃৎশিল্প ব্যবসা', parentId: 'par-12' },

    // Class 7
    { id: 'stu-7-1', studentId: 'BHS-2026-0701', nameEn: 'Nafis Iqbal', nameBn: 'নাফিস ইকবাল', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 7, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Iqbal Hossain', parentNameBn: 'মোঃ ইকবাল হোসেন', parentPhone: '01711000023', parentOcc: 'চাকরি', parentId: 'par-13' },
    { id: 'stu-7-2', studentId: 'BHS-2026-0702', nameEn: 'Sumaiya Islam', nameBn: 'সুমাইয়া ইসলাম', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 7, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Zakir Hossain', parentNameBn: 'মোঃ জাকির হোসেন', parentPhone: '01711000024', parentOcc: 'ব্যবসা', parentId: 'par-14' },
    { id: 'stu-7-3', studentId: 'BHS-2026-0703', nameEn: 'Arifur Rahman', nameBn: 'আরিফুর রহমান', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.A_POSITIVE, classNum: 7, sec: 'kha', roll: 1, groupId: null, parentName: 'Md. Selim Mia', parentNameBn: 'মোঃ সেলিম মিয়া', parentPhone: '01711000025', parentOcc: 'কৃষি', parentId: 'par-15' },

    // Class 6
    { id: 'stu-6-1', studentId: 'BHS-2026-0601', nameEn: 'Lamia Akter', nameBn: 'লামিয়া আক্তার', gender: Gender.FEMALE, religion: Religion.ISLAM, blood: BloodGroup.O_POSITIVE, classNum: 6, sec: 'ka', roll: 1, groupId: null, parentName: 'Md. Masud Rana', parentNameBn: 'মোঃ মাসুদ রানা', parentPhone: '01711000026', parentOcc: 'ব্যবসা', parentId: 'par-16' },
    { id: 'stu-6-2', studentId: 'BHS-2026-0602', nameEn: 'Ashraful Alam', nameBn: 'আশরাফুল আলম', gender: Gender.MALE, religion: Religion.ISLAM, blood: BloodGroup.B_POSITIVE, classNum: 6, sec: 'ka', roll: 2, groupId: null, parentName: 'Md. Nurul Islam', parentNameBn: 'মোঃ নুরুল ইসলাম', parentPhone: '01711000027', parentOcc: 'প্রবাসী', parentId: 'par-17' },
    { id: 'stu-6-3', studentId: 'BHS-2026-0603', nameEn: 'Puja Rani Mondol', nameBn: 'পূজা রানী মণ্ডল', gender: Gender.FEMALE, religion: Religion.HINDUISM, blood: BloodGroup.AB_POSITIVE, classNum: 6, sec: 'kha', roll: 1, groupId: null, parentName: 'Sujit Mondol', parentNameBn: 'সুজিত মণ্ডল', parentPhone: '01711000028', parentOcc: 'চাকরি', parentId: 'par-18' },
  ];

  const students: Student[] = [];
  const enrollments: StudentEnrollment[] = [];
  const rfidCards: StudentRFIDcard[] = [];
  const parentsMap = new Map<string, Parent>();
  const parentStudents: ParentStudent[] = [];

  studentSeedRows.forEach((row, idx) => {
    const isSeededTransfer = row.id === 'stu-8-3';
    students.push({
      id: row.id,
      userId: row.userId ?? null,
      studentId: row.studentId,
      birthCertificateNo: `2011861450000${String(1000 + idx)}`,
      boardRegistrationNo: row.classNum >= 9 ? `21108654${String(10 + idx)}` : null,
      nameEn: row.nameEn,
      nameBn: row.nameBn,
      dateOfBirth: `${2016 - row.classNum}-0${(idx % 9) + 1}-1${idx % 9}`,
      gender: row.gender,
      bloodGroup: row.blood,
      religion: row.religion,
      presentAddress: 'গ্রাম: ভোজেশ্বর, ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর',
      permanentAddress: 'গ্রাম: ভোজেশ্বর, ডাকঘর: ভোজেশ্বর, উপজেলা: নড়িয়া, জেলা: শরীয়তপুর',
      admissionDate: `${2026 - (row.classNum - 6)}-01-10`,
      status: isSeededTransfer ? StudentStatus.TRANSFERRED : StudentStatus.ACTIVE,
      previousSchoolName: 'ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়',
      previousGpa: 4.75,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const optCsId =
      row.classNum >= 9 && row.groupId === 'grp-sci'
        ? `cs-${row.classNum}-sci-sub-hmath`
        : row.classNum >= 9
          ? `cs-${row.classNum}-hum-sub-agri`
          : null;

    enrollments.push({
      id: `enr-${row.id}`,
      studentId: row.id,
      academicYearId: 'ay-2026',
      classId: `cls-${row.classNum}`,
      sectionId: `sec-${row.classNum}-${row.sec}`,
      groupId: row.groupId,
      optionalClassSubjectId: optCsId,
      roll: row.roll,
      enrollmentDate: '2026-01-05',
      formSerialNo: String(100 + idx),
      isRepeater: false,
      isReadmission: row.classNum > 6,
      status: isSeededTransfer ? EnrollmentStatus.TRANSFERRED : EnrollmentStatus.ACTIVE,
      createdAt: NOW,
      updatedAt: NOW,
    });

    if (row.rfid) {
      rfidCards.push({
        id: `rfid-${idx + 1}`,
        studentId: row.id,
        cardNumber: row.rfid,
        status: idx === 4 ? CardStatus.LOST : CardStatus.ACTIVE,
        issuedAt: '2026-01-15T09:00:00.000Z',
        remarks: idx === 4 ? 'শিক্ষার্থী কার্ড হারানোর রিপোর্ট করেছে' : 'সক্রিয় এসএসসি ব্যাচ কার্ড',
        createdAt: NOW,
        updatedAt: NOW,
      });
    }

    if (!parentsMap.has(row.parentId)) {
      parentsMap.set(row.parentId, {
        id: row.parentId,
        userId: row.parentId === 'par-1' ? 'user-parent-1' : null,
        name: row.parentName,
        nameBn: row.parentNameBn,
        phone: row.parentPhone,
        email: row.parentId === 'par-1' ? 'parent@bhs.edu.bd' : null,
        nid: `19828614500${String(100000 + idx)}`,
        occupation: row.parentOcc,
        monthlyIncome: 28000 + idx * 1500,
        address: 'ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
        createdAt: NOW,
        updatedAt: NOW,
      });
    }

    parentStudents.push({
      id: `ps-${idx + 1}`,
      parentId: row.parentId,
      studentId: row.id,
      relationship: RelationshipType.FATHER,
      isPrimary: true,
      isEmergencyContact: true,
      isSmsReceiver: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  const parents = Array.from(parentsMap.values());

  const promotions: StudentPromotion[] = [
    {
      id: 'promo-1',
      studentId: 'stu-10-1',
      fromEnrollmentId: 'enr-prev-2025-1',
      toEnrollmentId: 'enr-stu-10-1',
      promotionType: PromotionType.PROMOTED,
      promotionDate: '2026-01-02',
      remarks: '৯ম শ্রেণির বার্ষিক পরীক্ষায় জিপিএ ৫.০০ অর্জন করে উত্তীর্ণ।',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const transferCertificates: StudentTransferCertificate[] = [
    {
      id: 'tc-1',
      studentId: 'stu-8-3',
      enrollmentId: 'enr-stu-8-3',
      tcNumber: 'TC-2026-001',
      issueDate: '2026-08-14',
      leavingDate: '2026-08-10',
      reason: 'অভিভাবকের কর্মস্থল পরিবর্তনের কারণে ঢাকায় স্থানান্তর।',
      duesCleared: true,
      conductRemarks: 'উত্তম ও শান্ত',
      leavingClass: '৮ম শ্রেণি',
      promotedToNextClass: false,
      destinationSchool: 'মিরপুর গার্লস আইডিয়াল স্কুল, ঢাকা',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const testimonials: StudentTestimonial[] = [
    {
      id: 'test-1',
      studentId: 'stu-10-1',
      enrollmentId: 'enr-stu-10-1',
      refNumber: 'BHS/TEST/2026/001',
      type: TestimonialType.STUDY_CHARACTER,
      issueDate: '2026-09-12',
      academicSession: '2026',
      className: '১০ম শ্রেণি',
      sectionName: 'ক',
      roll: 1,
      groupName: 'বিজ্ঞান',
      purpose: 'উপবৃত্তি ও মেধাবৃত্তি আবেদনের জন্য',
      conductRemarks: 'উত্তম, বিনয়ী ও শৃঙ্খলাপরায়ণ',
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'test-2',
      studentId: 'stu-10-2',
      enrollmentId: 'enr-stu-10-2',
      refNumber: 'BHS/TEST/2026/002',
      type: TestimonialType.SSC_GRADUATE,
      issueDate: '2026-06-20',
      academicSession: '2024–2025',
      className: '১০ম শ্রেণি (এসএসসি)',
      sectionName: 'ক',
      roll: 2,
      groupName: 'বিজ্ঞান',
      purpose: 'উচ্চ মাধ্যমিক (একাদশ শ্রেণি) ভর্তির জন্য',
      conductRemarks: 'উত্তম ও প্রশংসনীয়',
      boardName: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা',
      passingYear: '2026',
      boardRoll: '145829',
      registrationNo: '2110865411',
      gpa: '5.00',
      letterGrade: 'A+',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];


  return {
    students,
    enrollments,
    rfidCards,
    promotions,
    transferCertificates,
    testimonials,
    parents,
    parentStudents,
  };
}
