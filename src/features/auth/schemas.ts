import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'ইমেইল অথবা মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const portalInitiateSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'নিবন্ধিত ইমেইল অথবা মোবাইল নম্বর দিন'),
});

export type PortalInitiateFormValues = z.infer<typeof portalInitiateSchema>;

export const portalSetupPasswordSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .length(6, '৬-সংখ্যার ওটিপি কোড দিন'),
    password: z
      .string()
      .min(8, 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .max(72, 'নতুন পাসওয়ার্ড ৭২ অক্ষরের বেশি হতে পারবে না')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'পাসওয়ার্ডে অন্তত একটি ইংরেজি অক্ষর এবং একটি সংখ্যা থাকতে হবে'),
    confirmPassword: z.string().min(1, 'পুনরায় পাসওয়ার্ড দিন'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি',
    path: ['confirmPassword'],
  });

export type PortalSetupPasswordFormValues = z.infer<typeof portalSetupPasswordSchema>;

export const adminLoginSchema = z.object({
  identifier: z.string().trim().min(3, 'অ্যাডমিন ইমেইল অথবা মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড আবশ্যক'),
  accessKey: z.string().trim().min(4, 'নিরাপত্তা অ্যাক্সেস কী আবশ্যক'),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const BD_PHONE_REGEX = /^(\+?880|0)1[3-9]\d{8}$/;

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'বর্তমান পাসওয়ার্ড আবশ্যক'),
    newPassword: z
      .string()
      .min(8, 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .max(72, 'নতুন পাসওয়ার্ড ৭২ অক্ষরের বেশি হতে পারবে না')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'নতুন পাসওয়ার্ডে অন্তত একটি অক্ষর এবং একটি সংখ্যা থাকতে হবে'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের থেকে আলাদা হতে হবে',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি',
    path: ['confirmPassword'],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে')
    .max(150, 'পূর্ণ নাম ১৫০ অক্ষরের বেশি হতে পারবে না'),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || BD_PHONE_REGEX.test(v), {
      message: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)',
    })
    .optional(),
  qualification: z
    .string()
    .trim()
    .refine((v) => !v || (v.length >= 2 && v.length <= 150), {
      message: 'শিক্ষাগত যোগ্যতা ২ থেকে ১৫০ অক্ষরের মধ্যে হতে হবে',
    })
    .optional(),
  presentAddress: z
    .string()
    .trim()
    .refine((v) => !v || (v.length >= 4 && v.length <= 300), {
      message: 'বর্তমান ঠিকানা ৪ থেকে ৩০০ অক্ষরের মধ্যে হতে হবে',
    })
    .optional(),
  permanentAddress: z
    .string()
    .trim()
    .refine((v) => !v || (v.length >= 4 && v.length <= 300), {
      message: 'স্থায়ী ঠিকানা ৪ থেকে ৩০০ অক্ষরের মধ্যে হতে হবে',
    })
    .optional(),
  emergencyContact: z
    .string()
    .trim()
    .refine((v) => !v || BD_PHONE_REGEX.test(v), {
      message: 'সঠিক জরুরি মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)',
    })
    .optional(),
  occupation: z
    .string()
    .trim()
    .refine((v) => !v || (v.length >= 2 && v.length <= 100), {
      message: 'পেশা ২ থেকে ১০০ অক্ষরের মধ্যে হতে হবে',
    })
    .optional(),
  address: z
    .string()
    .trim()
    .refine((v) => !v || (v.length >= 4 && v.length <= 300), {
      message: 'ঠিকানা ৪ থেকে ৩০০ অক্ষরের মধ্যে হতে হবে',
    })
    .optional(),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
