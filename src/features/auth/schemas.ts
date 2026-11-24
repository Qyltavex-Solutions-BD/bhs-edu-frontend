import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'ইমেইল অথবা মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'বর্তমান পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
    newPassword: z
      .string()
      .min(8, 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি',
    path: ['confirmPassword'],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
