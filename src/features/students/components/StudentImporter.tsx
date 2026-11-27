'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Search,
  UploadCloud,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useImportStudentsMutation } from '@/src/features/students/api/students.api';
import { useGetAcademicYearsQuery } from '@/src/services/academic/year.api';
import { useGetSchoolClassesQuery } from '@/src/services/academic/class.api';
import { useGetSectionsQuery } from '@/src/services/academic/section.api';
import { useGetAcademicGroupsQuery } from '@/src/services/academic/group.api';
import { formatNumber } from '@/src/lib/formatters';
import { Button, Card, Input } from '@/src/components/ui/primitives';
import { errorMessage } from './admin/studentShared';

interface ParsedRow {
  rowNumber: number;
  studentId: string;
  nameEn: string;
  nameBn: string;
  gender: string;
  dateOfBirth: string;
  birthCertificateNo: string;
  religion: string;
  bloodGroup: string;
  nationality: string;
  studentPhone: string;
  boardRegistrationNo: string;
  boardRegistrationSession: string;
  rfidCardNo: string;
  admissionDate: string;
  className: string;
  sectionName: string;
  groupName: string;
  roll: string;
  admissionType: string;
  formSerialNo: string;
  admissionFeePaid: string;
  receiptNo: string;
  presentAddress: string;
  permanentAddress: string;
  fatherNameEn: string;
  fatherNameBn: string;
  fatherPhone: string;
  fatherNid: string;
  fatherOccupation: string;
  fatherAlive: string;
  motherNameEn: string;
  motherNameBn: string;
  motherPhone: string;
  motherNid: string;
  motherOccupation: string;
  motherAlive: string;
  primaryGuardianType: string;
  legalGuardianNameEn: string;
  legalGuardianNameBn: string;
  legalGuardianPhone: string;
  legalGuardianNid: string;
  legalGuardianRelation: string;
  legalGuardianAddress: string;
  parentName: string;
  parentPhone: string;
  parentRelation: string;
  previousSchoolName: string;
  previousSchoolEiin: string;
  previousClass: string;
  previousGpa: string;
  prevExamPassingYear: string;
  prevExamRoll: string;
  transferCertificateNo: string;
  remarks: string;
}

interface ImportReport {
  created: number;
  failed: number;
  total: number;
  errors: { row: number; studentName?: string; message: string }[];
}

function normalizeDigits(value: string): string {
  const bn = '০১২৩৪৫৬৭৮৯';
  return value.replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  return String(val).trim();
}

function parseExcelDate(val: unknown): string {
  if (typeof val === 'number' && val > 10000 && val < 80000) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  return formatCellValue(val);
}

function isValidGender(val: string): boolean {
  const upper = val.trim().toUpperCase();
  return [
    'MALE',
    'FEMALE',
    'OTHER',
    'M',
    'F',
    'ছাত্র',
    'ছেলে',
    'পুরুষ',
    'ছাত্রী',
    'মেয়ে',
    'মেয়ে',
    'নারী',
    'অন্যান্য',
  ].includes(upper === 'M' || upper === 'F' || upper === 'MALE' || upper === 'FEMALE' || upper === 'OTHER' ? upper : val.trim());
}

export function StudentImporter({ yearId }: { yearId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStudents, { isLoading }] = useImportStudentsMutation();
  const { data: years = [] } = useGetAcademicYearsQuery();
  const { data: classes = [] } = useGetSchoolClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: groups = [] } = useGetAcademicGroupsQuery();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);

  const activeYear = years.find((y) => y.id === yearId) ?? years.find((y) => y.isActive);

  const validatedRows = useMemo(() => {
    const seenRollKeys = new Set<string>();
    return rows.map((row) => {
      const issues: string[] = [];
      if (!row.nameEn) issues.push('ইংরেজি নাম (nameEn) নেই');
      if (!row.gender || !isValidGender(row.gender)) {
        issues.push('সঠিক লিঙ্গ (MALE/FEMALE) দিন');
      }

      const classKey = row.className.toLowerCase();
      const schoolClass = classes.find(
        (c) =>
          c.name.trim().toLowerCase() === classKey ||
          (c.nameBn ?? '').trim().toLowerCase() === classKey
      );
      if (!schoolClass) {
        issues.push(`শ্রেণি '${row.className || '—'}' ডাটাবেজে নেই`);
      }

      const secKey = row.sectionName.toLowerCase();
      const section = schoolClass
        ? sections.find(
            (s) => s.classId === schoolClass.id && s.name.trim().toLowerCase() === secKey
          )
        : undefined;
      if (schoolClass && !section) {
        issues.push(`শাখা '${row.sectionName || '—'}' পাওয়া যায়নি`);
      }

      if (row.groupName) {
        const grpKey = row.groupName.toLowerCase();
        const grp = groups.find(
          (g) =>
            g.name.trim().toLowerCase() === grpKey ||
            (g.nameBn ?? '').trim().toLowerCase() === grpKey
        );
        if (!grp) issues.push(`বিভাগ '${row.groupName}' ডাটাবেজে নেই`);
      }

      const rollNum = Number(normalizeDigits(row.roll));
      if (!Number.isInteger(rollNum) || rollNum < 1) {
        issues.push('সঠিক রোল নম্বর দিন');
      } else if (schoolClass && section) {
        const key = `${schoolClass.id}:${section.id}:${rollNum}`;
        if (seenRollKeys.has(key)) {
          issues.push(`একই ফাইলে রোল ${formatNumber(rollNum, 'bn')} ডুপ্লিকেট`);
        }
        seenRollKeys.add(key);
      }

      const hasFather = Boolean(row.fatherNameEn || row.fatherNameBn || row.fatherPhone);
      const hasMother = Boolean(row.motherNameEn || row.motherNameBn || row.motherPhone);
      const hasLegal = Boolean(row.legalGuardianNameEn || row.legalGuardianNameBn || row.legalGuardianPhone);
      const hasLegacyParent = Boolean(row.parentName && row.parentPhone);
      if (!hasFather && !hasMother && !hasLegal && !hasLegacyParent) {
        issues.push('পিতা, মাতা বা অভিভাবকের নাম ও মোবাইল দিন');
      }

      return {
        ...row,
        issues,
        isValid: issues.length === 0,
      };
    });
  }, [rows, classes, sections, groups]);

  const validCount = useMemo(
    () => validatedRows.filter((r) => r.isValid).length,
    [validatedRows]
  );
  const invalidCount = validatedRows.length - validCount;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return validatedRows.filter((r) => {
      if (filterTab === 'valid' && !r.isValid) return false;
      if (filterTab === 'invalid' && r.isValid) return false;
      if (!q) return true;
      return (
        r.nameEn.toLowerCase().includes(q) ||
        r.nameBn.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.fatherNameEn.toLowerCase().includes(q) ||
        r.fatherPhone.toLowerCase().includes(q) ||
        r.motherPhone.toLowerCase().includes(q) ||
        r.parentPhone.toLowerCase().includes(q) ||
        r.roll.toLowerCase().includes(q)
      );
    });
  }, [validatedRows, filterTab, search]);

  const handleDownloadDemo = () => {
    const firstClass = classes[0];
    const firstSection = firstClass
      ? sections.find((s) => s.classId === firstClass.id) ?? sections[0]
      : sections[0];
    const secondClass = classes[1] ?? firstClass;
    const secondSection = secondClass
      ? sections.find((s) => s.classId === secondClass.id) ?? firstSection
      : firstSection;
    const firstGroup = groups[0];

    const demoRows = [
      {
        studentId: '',
        nameEn: 'Md. Tariqul Islam',
        nameBn: 'মোঃ তারিকুল ইসলাম',
        gender: 'MALE',
        dateOfBirth: '2012-03-14',
        birthCertificateNo: '20121910123456001',
        religion: 'ISLAM',
        bloodGroup: 'O_POSITIVE',
        nationality: 'বাংলাদেশি',
        studentPhone: '',
        boardRegistrationNo: '',
        boardRegistrationSession: '',
        rfidCardNo: '',
        admissionDate: '2026-01-15',
        className: firstClass?.name ?? 'Class 6',
        sectionName: firstSection?.name ?? 'A',
        groupName: '',
        roll: '101',
        admissionType: 'NEW',
        formSerialNo: 'FRM-2026-101',
        admissionFeePaid: '1500',
        receiptNo: 'RCP-101',
        presentAddress: 'গ্রাম: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
        permanentAddress: 'গ্রাম: ভোজেশ্বর, নড়িয়া, শরীয়তপুর',
        fatherNameEn: 'Md. Shafiqul Islam',
        fatherNameBn: 'মোঃ শফিকুল ইসলাম',
        fatherPhone: '01711000901',
        fatherNid: '19821910123456701',
        fatherOccupation: 'ব্যবসায়ী',
        fatherAlive: 'true',
        motherNameEn: 'Taslima Begum',
        motherNameBn: 'তাসলিমা বেগম',
        motherPhone: '01811000901',
        motherNid: '19861910123456702',
        motherOccupation: 'গৃহিণী',
        motherAlive: 'true',
        primaryGuardianType: 'FATHER',
        legalGuardianNameEn: '',
        legalGuardianNameBn: '',
        legalGuardianPhone: '',
        legalGuardianNid: '',
        legalGuardianRelation: '',
        legalGuardianAddress: '',
        previousSchoolName: 'ভোজেশ্বর সরকারি প্রাথমিক বিদ্যালয়',
        previousSchoolEiin: '108456',
        previousClass: '৫ম শ্রেণি',
        previousGpa: '4.85',
        prevExamPassingYear: '2025',
        prevExamRoll: '5012',
        transferCertificateNo: 'TC-2025-101',
        remarks: 'নতুন ভর্তি',
      },
      {
        studentId: '',
        nameEn: 'Nusrat Jahan Mim',
        nameBn: 'নুসরাত জাহান মিম',
        gender: 'FEMALE',
        dateOfBirth: '2010-08-22',
        birthCertificateNo: '20101910123456002',
        religion: 'ISLAM',
        bloodGroup: 'A_POSITIVE',
        nationality: 'বাংলাদেশি',
        studentPhone: '',
        boardRegistrationNo: '',
        boardRegistrationSession: '2025-26',
        rfidCardNo: '',
        admissionDate: '2026-01-15',
        className: secondClass?.name ?? 'Class 9',
        sectionName: secondSection?.name ?? 'A',
        groupName: firstGroup?.name ?? '',
        roll: '102',
        admissionType: 'NEW',
        formSerialNo: 'FRM-2026-102',
        admissionFeePaid: '1800',
        receiptNo: 'RCP-102',
        presentAddress: 'ভোজেশ্বর বাজার, শরীয়তপুর',
        permanentAddress: 'ভোজেশ্বর বাজার, শরীয়তপুর',
        fatherNameEn: 'Md. Delwar Hossain',
        fatherNameBn: 'মোঃ দেলোয়ার হোসেন',
        fatherPhone: '01711000902',
        fatherNid: '',
        fatherOccupation: 'চাকরি',
        fatherAlive: 'true',
        motherNameEn: 'Rashida Begum',
        motherNameBn: 'রাশিদা বেগম',
        motherPhone: '01811000902',
        motherNid: '',
        motherOccupation: 'গৃহিণী',
        motherAlive: 'true',
        primaryGuardianType: 'MOTHER',
        legalGuardianNameEn: '',
        legalGuardianNameBn: '',
        legalGuardianPhone: '',
        legalGuardianNid: '',
        legalGuardianRelation: '',
        legalGuardianAddress: '',
        previousSchoolName: '',
        previousSchoolEiin: '',
        previousClass: '',
        previousGpa: '',
        prevExamPassingYear: '',
        prevExamRoll: '',
        transferCertificateNo: '',
        remarks: '',
      },
    ];

    const guideRows = [
      { 'কলাম (Header)': 'studentId (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': 'খালি রাখলে অটো-জেনারেট হবে (যেমন: STU20260001)' },
      { 'কলাম (Header)': 'nameEn (আবশ্যক)', 'বিবরণ ও উদাহরণ': 'শিক্ষার্থীর ইংরেজি নাম — যেমন: Md. Tariqul Islam' },
      { 'কলাম (Header)': 'nameBn (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': 'শিক্ষার্থীর বাংলা নাম — যেমন: মোঃ তারিকুল ইসলাম' },
      { 'কলাম (Header)': 'gender (আবশ্যক)', 'বিবরণ ও উদাহরণ': 'MALE, FEMALE, অথবা OTHER' },
      { 'কলাম (Header)': 'dateOfBirth (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': 'YYYY-MM-DD ফরম্যাট — যেমন: 2012-03-14' },
      { 'কলাম (Header)': 'birthCertificateNo (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': '১৭ সংখ্যার জন্ম নিবন্ধন নম্বর (অনন্য হতে হবে)' },
      { 'কলাম (Header)': 'religion (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': 'ISLAM, HINDUISM, CHRISTIANITY, BUDDHISM, OTHER' },
      { 'কলাম (Header)': 'bloodGroup (ঐচ্ছিক)', 'বিবরণ ও উদাহরণ': 'A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE, AB_POSITIVE, AB_NEGATIVE (অথবা A+, O+ ইত্যাদি)' },
      {
        'কলাম (Header)': 'className (আবশ্যক)',
        'বিবরণ ও উদাহরণ': classes.length
          ? `ডাটাবেজের শ্রেণিসমূহ: ${classes.map((c) => c.name).join(', ')}`
          : 'Class 6, Class 7, Class 8, Class 9, Class 10',
      },
      {
        'কলাম (Header)': 'sectionName (আবশ্যক)',
        'বিবরণ ও উদাহরণ': sections.length
          ? `উপলব্ধ শাখাসমূহ: ${Array.from(new Set(sections.map((s) => s.name))).join(', ')}`
          : 'A, B',
      },
      {
        'কলাম (Header)': 'groupName (ঐচ্ছিক)',
        'বিবরণ ও উদাহরণ': groups.length
          ? `বিভাগসমূহ: ${groups.map((g) => g.name).join(', ')}`
          : 'Science, Humanities, Business Studies',
      },
      { 'কলাম (Header)': 'roll (আবশ্যক)', 'বিবরণ ও উদাহরণ': 'শ্রেণি ও শাখায় অনন্য রোল নম্বর (যেমন: 101)' },
      { 'কলাম (Header)': 'admissionType, formSerialNo, admissionFeePaid, receiptNo', 'বিবরণ ও উদাহরণ': 'ভর্তির ধরন (NEW/READMISSION/TRANSFER), ফরম নং, ফি ও রসিদ নং (ঐচ্ছিক)' },
      { 'কলাম (Header)': 'presentAddress, permanentAddress', 'বিবরণ ও উদাহরণ': 'বর্তমান ও স্থায়ী ঠিকানা (ঐচ্ছিক)' },
      { 'কলাম (Header)': 'fatherNameEn, fatherNameBn, fatherPhone, fatherNid, fatherOccupation, fatherAlive', 'বিবরণ ও উদাহরণ': 'পিতার পূর্ণ তথ্য (স্বয়ংক্রিয়ভাবে অভিভাবক প্রোফাইল তৈরি ও সংযুক্ত হবে)' },
      { 'কলাম (Header)': 'motherNameEn, motherNameBn, motherPhone, motherNid, motherOccupation, motherAlive', 'বিবরণ ও উদাহরণ': 'মাতার পূর্ণ তথ্য (স্বয়ংক্রিয়ভাবে অভিভাবক প্রোফাইল তৈরি ও সংযুক্ত হবে)' },
      { 'কলাম (Header)': 'primaryGuardianType', 'বিবরণ ও উদাহরণ': 'FATHER, MOTHER, অথবা LEGAL_GUARDIAN (ডিফল্ট: FATHER)' },
      { 'কলাম (Header)': 'legalGuardianNameEn, legalGuardianPhone, ...', 'বিবরণ ও উদাহরণ': 'পিতা/মাতা ব্যতীত অন্য আইনগত অভিভাবক হলে পূরণ করুন (ঐচ্ছিক)' },
      { 'কলাম (Header)': 'previousSchoolName, previousSchoolEiin, previousClass, previousGpa, prevExamPassingYear, prevExamRoll, transferCertificateNo', 'বিবরণ ও উদাহরণ': 'পূর্ববর্তী বিদ্যালয় ও পরীক্ষার রেকর্ড (ঐচ্ছিক)' },
    ];

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(demoRows);
    wsData['!cols'] = Object.keys(demoRows[0]).map((k) => ({
      wch: Math.max(k.length + 4, 18),
    }));
    XLSX.utils.book_append_sheet(wb, wsData, 'শিক্ষার্থী_তথ্য');

    const wsGuide = XLSX.utils.json_to_sheet(guideRows);
    wsGuide['!cols'] = [{ wch: 42 }, { wch: 76 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, 'নির্দেশিকা');

    XLSX.writeFile(wb, 'bhs-student-import-demo.xlsx');
    toast.success('পূর্ণাঙ্গ অ্যাডমিশন ডেমো এক্সেল ফাইল ডাউনলোড হয়েছে।');
  };

  const handleFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error('ফাইলে কোনো ডাটা শিট পাওয়া যায়নি।');
        return;
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });

      if (!rawJson.length) {
        toast.error('ফাইলে কোনো শিক্ষার্থীর সারি পাওয়া যায়নি।');
        return;
      }

      const mapped: ParsedRow[] = rawJson.map((r, idx) => ({
        rowNumber: idx + 1,
        studentId: formatCellValue(r.studentId),
        nameEn: formatCellValue(r.nameEn ?? r['ইংরেজি নাম']),
        nameBn: formatCellValue(r.nameBn ?? r['বাংলা নাম']),
        gender: formatCellValue(r.gender ?? r['লিঙ্গ']),
        dateOfBirth: parseExcelDate(r.dateOfBirth ?? r['জন্ম তারিখ']),
        birthCertificateNo: formatCellValue(r.birthCertificateNo ?? r['জন্ম নিবন্ধন']),
        religion: formatCellValue(r.religion ?? r['ধর্ম']),
        bloodGroup: formatCellValue(r.bloodGroup ?? r['রক্তের গ্রুপ']),
        nationality: formatCellValue(r.nationality),
        studentPhone: formatCellValue(r.studentPhone),
        boardRegistrationNo: formatCellValue(r.boardRegistrationNo),
        boardRegistrationSession: formatCellValue(r.boardRegistrationSession),
        rfidCardNo: formatCellValue(r.rfidCardNo),
        admissionDate: parseExcelDate(r.admissionDate),
        className: formatCellValue(r.className ?? r['শ্রেণি']),
        sectionName: formatCellValue(r.sectionName ?? r['শাখা']),
        groupName: formatCellValue(r.groupName ?? r['বিভাগ']),
        roll: formatCellValue(r.roll ?? r['রোল']),
        admissionType: formatCellValue(r.admissionType),
        formSerialNo: formatCellValue(r.formSerialNo),
        admissionFeePaid: formatCellValue(r.admissionFeePaid),
        receiptNo: formatCellValue(r.receiptNo),
        presentAddress: formatCellValue(r.presentAddress ?? r['বর্তমান ঠিকানা']),
        permanentAddress: formatCellValue(r.permanentAddress ?? r['স্থায়ী ঠিকানা']),
        fatherNameEn: formatCellValue(r.fatherNameEn),
        fatherNameBn: formatCellValue(r.fatherNameBn),
        fatherPhone: formatCellValue(r.fatherPhone),
        fatherNid: formatCellValue(r.fatherNid),
        fatherOccupation: formatCellValue(r.fatherOccupation),
        fatherAlive: formatCellValue(r.fatherAlive),
        motherNameEn: formatCellValue(r.motherNameEn),
        motherNameBn: formatCellValue(r.motherNameBn),
        motherPhone: formatCellValue(r.motherPhone),
        motherNid: formatCellValue(r.motherNid),
        motherOccupation: formatCellValue(r.motherOccupation),
        motherAlive: formatCellValue(r.motherAlive),
        primaryGuardianType: formatCellValue(r.primaryGuardianType),
        legalGuardianNameEn: formatCellValue(r.legalGuardianNameEn),
        legalGuardianNameBn: formatCellValue(r.legalGuardianNameBn),
        legalGuardianPhone: formatCellValue(r.legalGuardianPhone),
        legalGuardianNid: formatCellValue(r.legalGuardianNid),
        legalGuardianRelation: formatCellValue(r.legalGuardianRelation),
        legalGuardianAddress: formatCellValue(r.legalGuardianAddress),
        parentName: formatCellValue(r.parentName),
        parentPhone: formatCellValue(r.parentPhone),
        parentRelation: formatCellValue(r.parentRelation),
        previousSchoolName: formatCellValue(r.previousSchoolName),
        previousSchoolEiin: formatCellValue(r.previousSchoolEiin),
        previousClass: formatCellValue(r.previousClass),
        previousGpa: formatCellValue(r.previousGpa),
        prevExamPassingYear: formatCellValue(r.prevExamPassingYear),
        prevExamRoll: formatCellValue(r.prevExamRoll),
        transferCertificateNo: formatCellValue(r.transferCertificateNo),
        remarks: formatCellValue(r.remarks),
      }));

      setRows(mapped);
      setFileName(file.name);
      setReport(null);
      setFilterTab('all');
      toast.success(`${formatNumber(mapped.length, 'bn')}টি সারি প্রিভিউয়ের জন্য লোড হয়েছে।`);
    } catch {
      toast.error('ফাইলটি পড়া যায়নি। অনুগ্রহ করে সঠিক .xlsx, .xls অথবা .csv ফাইল আপলোড করুন।');
    }
  };

  const resetAll = () => {
    setRows([]);
    setFileName('');
    setReport(null);
    setSearch('');
    setFilterTab('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const commit = async () => {
    const ready = validatedRows.filter((r) => r.isValid);
    if (!ready.length) {
      toast.error('ভর্তির জন্য কোনো বৈধ সারি পাওয়া যায়নি।');
      return;
    }
    try {
      const payloadRows = ready.map(({ issues: _i, isValid: _v, ...rest }) => rest);
      const res = await importStudents({
        academicYearId: yearId || activeYear?.id || '',
        rows: payloadRows,
      }).unwrap();

      setReport(res);
      if (res.created > 0) {
        toast.success(`${formatNumber(res.created, 'bn')} জন শিক্ষার্থী সফলভাবে ভর্তি হয়েছে।`);
      }
      if (res.failed > 0) {
        toast.error(`${formatNumber(res.failed, 'bn')}টি সারিতে ব্যাকএন্ড যাচাইয়ে ত্রুটি পাওয়া গেছে।`);
      }
      if (res.failed === 0) {
        setRows([]);
        setFileName('');
      }
    } catch (err) {
      toast.error(errorMessage(err, 'বাল্ক আমদানি সম্পন্ন করা যায়নি।'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Demo Download Card */}
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {'পূর্ণাঙ্গ অ্যাডমিশন এক্সেল বা CSV থেকে শিক্ষার্থী ভর্তি'}
              </h2>
              {activeYear && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {`শিক্ষাবর্ষ: ${activeYear.name}`}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {'ডেমো এক্সেল ফাইলে পূর্ণাঙ্গ ভর্তি ফরমের সব কলাম (শিক্ষার্থী, পিতা, মাতা, আইনগত অভিভাবক, ঠিকানা, ভর্তি ফি ও পূর্ববর্তী স্কুল) রয়েছে। ডাটা সাজিয়ে আপলোড করলে পিতা-মাতা উভয়ের প্রোফাইল ও এনরোলমেন্ট সহ সরাসরি ডাটাবেজে সেভ হবে।'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button type="button" variant="outline" onClick={handleDownloadDemo}>
              <Download className="w-4 h-4" />
              <span>{'ডেমো এক্সেল ডাউনলোড (.xlsx)'}</span>
            </Button>
            {rows.length > 0 && (
              <Button type="button" variant="ghost" onClick={resetAll}>
                <RotateCcw className="w-4 h-4" />
                <span>{'রিসেট'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-surface-muted/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              {fileName ? <FileSpreadsheet className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            {fileName ? (
              <>
                <p className="text-base font-semibold text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {`মোট ${formatNumber(rows.length, 'bn')}টি সারি লোড হয়েছে · নতুন ফাইল নির্বাচন করতে এখানে ক্লিক করুন`}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">
                  {'এক্সেল (.xlsx, .xls) অথবা CSV ফাইল এখানে টেনে আনুন বা ক্লিক করে নির্বাচন করুন'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {'সর্বোচ্চ ৫০০ জন শিক্ষার্থীর পূর্ণাঙ্গ তথ্য একবারে আপলোড ও যাচাই করা যাবে'}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Server Import Result Banner */}
      {report && (
        <Card className="p-5 sm:p-6 border-primary/30 bg-primary/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {`${formatNumber(report.created, 'bn')} জন শিক্ষার্থী সফলভাবে ডাটাবেজে ভর্তি হয়েছে`}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {`মোট প্রেরিত: ${formatNumber(report.total, 'bn')} · সফল: ${formatNumber(report.created, 'bn')} · ব্যর্থ: ${formatNumber(report.failed, 'bn')}`}
                </p>
              </div>
            </div>
            <Link href="/admin/students">
              <Button size="sm" variant="primary">
                <Users className="w-4 h-4" />
                <span>{'শিক্ষার্থী তালিকায় যান'}</span>
              </Button>
            </Link>
          </div>

          {report.errors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-surface p-4 space-y-2">
              <p className="text-sm font-semibold text-destructive">
                {'নিম্নোক্ত সারিসমূহ ব্যাকএন্ড যাচাইয়ে ভর্তি হয়নি:'}
              </p>
              <ul className="space-y-1 text-sm text-foreground max-h-48 overflow-y-auto">
                {report.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>{`সারি ${formatNumber(err.row, 'bn')}${err.studentName ? ` (${err.studentName})` : ''}:`}</strong>{' '}
                      {err.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Preview & Validation Section */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 sm:p-5">
              <p className="text-sm font-medium text-muted-foreground">{'মোট আপলোডকৃত সারি'}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                {formatNumber(validatedRows.length, 'bn')}
              </p>
            </Card>
            <Card className="p-4 sm:p-5">
              <p className="text-sm font-medium text-muted-foreground">{'ভর্তির জন্য প্রস্তুত (বৈধ)'}</p>
              <p className="text-2xl font-bold text-primary tabular-nums mt-1">
                {formatNumber(validCount, 'bn')}
              </p>
            </Card>
            <Card className="p-4 sm:p-5">
              <p className="text-sm font-medium text-muted-foreground">{'সংশোধন প্রয়োজন (ত্রুটিপূর্ণ)'}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${invalidCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {formatNumber(invalidCount, 'bn')}
              </p>
            </Card>
          </div>

          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'all', label: `সকল (${formatNumber(validatedRows.length, 'bn')})` },
                    { key: 'valid', label: `বৈধ (${formatNumber(validCount, 'bn')})` },
                    { key: 'invalid', label: `ত্রুটিপূর্ণ (${formatNumber(invalidCount, 'bn')})` },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFilterTab(t.key)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
                      filterTab === t.key
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-foreground border-border hover:bg-surface-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={'নাম, শ্রেণি, রোল বা মোবাইল দিয়ে খুঁজুন...'}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-2xl">
              <table className="w-full text-base text-left border-collapse">
                <thead className="bg-surface-muted/70 border-b border-border text-sm font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">{'সারি'}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{'শিক্ষার্থী'}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{'শ্রেণি, শাখা ও রোল'}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{'পিতা ও মাতা'}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{'ঠিকানা ও পূর্ববর্তী স্কুল'}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{'যাচাই অবস্থা'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {formatNumber(row.rowNumber, 'bn')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{row.nameBn || row.nameEn || '—'}</p>
                        {row.nameBn && row.nameEn && (
                          <p className="text-sm text-muted-foreground">{row.nameEn}</p>
                        )}
                        {(row.gender || row.bloodGroup) && (
                          <p className="text-sm text-muted-foreground">
                            {[row.gender, row.bloodGroup, row.birthCertificateNo].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {row.className || '—'} {row.sectionName ? `· ${row.sectionName}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {`রোল: ${row.roll || '—'}${row.groupName ? ` · ${row.groupName}` : ''}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {row.fatherNameBn || row.fatherNameEn || row.fatherPhone ? (
                          <p className="text-sm text-foreground">
                            <strong>{'পিতা:'}</strong> {row.fatherNameBn || row.fatherNameEn || '—'}{' '}
                            {row.fatherPhone ? `(${row.fatherPhone})` : ''}
                          </p>
                        ) : null}
                        {row.motherNameBn || row.motherNameEn || row.motherPhone ? (
                          <p className="text-sm text-muted-foreground">
                            <strong>{'মাতা:'}</strong> {row.motherNameBn || row.motherNameEn || '—'}{' '}
                            {row.motherPhone ? `(${row.motherPhone})` : ''}
                          </p>
                        ) : null}
                        {!row.fatherNameEn && !row.fatherPhone && !row.motherNameEn && !row.motherPhone && (
                          <p className="text-sm text-foreground">
                            {row.legalGuardianNameBn || row.legalGuardianNameEn || row.parentName || '—'}{' '}
                            {row.legalGuardianPhone || row.parentPhone ? `(${row.legalGuardianPhone || row.parentPhone})` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground line-clamp-1">{row.presentAddress || '—'}</p>
                        {row.previousSchoolName && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{row.previousSchoolName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {'প্রস্তুত'}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/25">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {'ত্রুটি'}
                            </span>
                            <p className="text-sm text-destructive">{row.issues.join(' · ')}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted-foreground">
                {invalidCount > 0
                  ? `${formatNumber(invalidCount, 'bn')}টি ত্রুটিপূর্ণ সারি বাদ দিয়ে শুধুমাত্র বৈধ ${formatNumber(validCount, 'bn')} জন শিক্ষার্থী ভর্তি করা হবে।`
                  : `সকল ${formatNumber(validCount, 'bn')}টি সারি ভর্তির জন্য প্রস্তুত।`}
              </p>
              <Button
                variant="primary"
                disabled={isLoading || validCount === 0}
                onClick={commit}
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'ভর্তি প্রক্রিয়া চলছে...'
                    : `বৈধ শিক্ষার্থীরা ভর্তি করুন (${formatNumber(validCount, 'bn')} জন)`}
                </span>
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
