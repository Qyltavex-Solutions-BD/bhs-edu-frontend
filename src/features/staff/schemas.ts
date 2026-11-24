import { z } from 'zod';
import { StaffType, EmploymentType } from '@/src/types/enums';
import { bdPhoneRegex } from '@/src/lib/validations/regex';

export const staffSchema = z.object({
  employeeId: z.string().min(2, 'স্টাফ আইডি আবশ্যক'),
  name: z.string().min(2, 'নাম আবশ্যক'),
  designation: z.string().min(2, 'পদবি আবশ্যক'),
  qualification: z.string().optional(),
  staffType: z.nativeEnum(StaffType),
  departmentId: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType),
  phone: z.string().regex(bdPhoneRegex, 'সঠিক মোবাইল নম্বর দিন'),
  email: z.string().email('সঠিক ইমেইল দিন').optional().or(z.literal('')),
  joiningDate: z.string().min(4, 'যোগদানের তারিখ আবশ্যক'),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
