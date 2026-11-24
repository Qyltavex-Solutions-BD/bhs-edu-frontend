import {
  AttendanceStatus,
  AttendanceMethod,
  AttendanceSmsType,
  SmsStatus,
} from '../enums';

export interface Attendance {
  id: string;
  studentEnrollmentId: string;
  date: string;
  inTime?: string | null;
  outTime?: string | null;
  status: AttendanceStatus;
  method: AttendanceMethod;
  remarks?: string | null;
  markedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSmsLog {
  id: string;
  attendanceId: string;
  parentId: string;
  smsType: AttendanceSmsType;
  phone: string;
  message: string;
  status: SmsStatus;
  sentAt?: string | null;
  createdAt: string;
}
