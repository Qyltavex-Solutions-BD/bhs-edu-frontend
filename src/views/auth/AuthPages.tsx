'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/src/lib/validations/schemas';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { DEMO_ACCOUNTS, loginWithDemoRole, setCredentials, type AppRole } from '@/src/store/slices/authSlice';
import {
  useLoginUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '@/src/features/auth/api/auth.api';
import { useI18n } from '@/src/lib/i18n';
import { SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input } from '@/src/components/ui/primitives';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { locale, pick } = useI18n();
  const enableStudentPortal = useAppSelector((s) => s.ui.enableStudentPortal);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: true },
  });

  const [loginApi, { isLoading: isLoggingIn }] = useLoginUserMutation();

  const handleDemoLogin = async (role: AppRole) => {
    // Map role to backend seeded credentials
    let email = 'admin@example.com';
    let password = 'adminpassword';
    let targetPortal = DEMO_ACCOUNTS[role].redirect;

    if (role === 'TEACHER') {
      email = 'teacher@example.com';
      password = 'teacherpassword';
      targetPortal = '/teacher/dashboard';
    } else if (role === 'PARENT') {
      email = 'parent@example.com';
      password = 'parentpassword';
      targetPortal = '/parent/dashboard';
    } else if (role === 'STUDENT') {
      email = 'student@example.com';
      password = 'studentpassword';
      targetPortal = '/student/dashboard';
    }

    try {
      const res = await loginApi({ email, password }).unwrap();

      const roles = res.user?.roles || [];
      const primaryRole = roles[0] || 'ADMIN';
      const resolvedRole: AppRole =
        primaryRole === 'ADMIN'
          ? role === 'PRINCIPAL' || role === 'SCHOOL_ADMIN'
            ? role
            : 'SUPER_ADMIN'
          : (primaryRole as AppRole);

      dispatch(
        setCredentials({
          accessToken: res.accessToken,
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            role: resolvedRole,
            isDemoSession: false,
          },
          role: resolvedRole,
          permissions: res.user.permissions ?? DEMO_ACCOUNTS[role].permissions,
        })
      );

      toast.success(
        pick(
          `${res.user.name || DEMO_ACCOUNTS[role].user.name} হিসেবে সফলভাবে প্রবেশ করেছেন।`,
          `Signed in as ${res.user.name || DEMO_ACCOUNTS[role].user.name}.`
        )
      );
      router.push(targetPortal);
      return;
    } catch {
      // Graceful fallback to local demo profile if backend is unreachable
      dispatch(loginWithDemoRole(role));
      toast.success(
        pick(
          `${DEMO_ACCOUNTS[role].user.name} হিসেবে ডেমো পোর্টালে প্রবেশ সম্পন্ন হয়েছে।`,
          `Signed in as demo ${DEMO_ACCOUNTS[role].user.name}.`
        )
      );
      router.push(targetPortal);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await loginApi({
        email: values.identifier.trim(),
        password: values.password,
      }).unwrap();

      const roles = res.user?.roles || [];
      const primaryRole = roles[0] || 'ADMIN';
      const role: AppRole =
        primaryRole === 'ADMIN'
          ? 'SUPER_ADMIN'
          : primaryRole === 'TEACHER'
            ? 'TEACHER'
            : primaryRole === 'PARENT'
              ? 'PARENT'
              : primaryRole === 'STUDENT'
                ? 'STUDENT'
                : 'SUPER_ADMIN';

      dispatch(
        setCredentials({
          accessToken: res.accessToken,
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            role,
            isDemoSession: false,
          },
          role,
          permissions: res.user.permissions ?? [],
        })
      );

      toast.success(pick('লগইন সফল হয়েছে।', 'Login successful.'));

      let redirectUrl = '/admin';
      if (role === 'TEACHER') redirectUrl = '/teacher/dashboard';
      else if (role === 'PARENT') redirectUrl = '/parent/dashboard';
      else if (role === 'STUDENT') redirectUrl = '/student/dashboard';

      router.push(redirectUrl);
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        pick(
          'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল/ফোন ও পাসওয়ার্ড দিন।',
          'Login failed. Please check your email/phone and password.'
        );
      toast.error(errorMsg);
    }
  };

  const demoButtons: Array<{
    role: AppRole;
    labelBn: string;
    labelEn: string;
    meta: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      role: 'SUPER_ADMIN',
      labelBn: 'সুপার অ্যাডমিন',
      labelEn: 'Super Admin',
      meta: 'admin@example.com',
      icon: ShieldCheck,
    },
    {
      role: 'PRINCIPAL',
      labelBn: 'প্রধান শিক্ষক',
      labelEn: 'Head Teacher',
      meta: 'admin@example.com',
      icon: Award,
    },
    {
      role: 'TEACHER',
      labelBn: 'শিক্ষক পোর্টাল',
      labelEn: 'Teacher Portal',
      meta: 'teacher@example.com',
      icon: BookOpen,
    },
    {
      role: 'PARENT',
      labelBn: 'অভিভাবক পোর্টাল',
      labelEn: 'Parent Portal',
      meta: 'parent@example.com',
      icon: Users,
    },
    ...(enableStudentPortal
      ? [
          {
            role: 'STUDENT' as AppRole,
            labelBn: 'শিক্ষার্থী পোর্টাল',
            labelEn: 'Student Portal',
            meta: 'student@example.com',
            icon: GraduationCap,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Institutional Brand Panel with Campus Heritage Photograph */}
      <aside className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative overflow-hidden bg-[#093B1F] text-white">
        <img
          src="/images/hero_campus_heritage_1795136893336.jpg"
          alt={pick('ভোজেশ্বর উচ্চ বিদ্যালয় প্রাঙ্গণ', 'Bhojeshwar High School Campus')}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Measured Heritage-Green Contrast Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#052412]/95 via-[#08341B]/76 to-[#062915]/68"
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          {/* Top Navigation & EIIN */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{pick('পাবলিক ওয়েবসাইটে ফিরুন', 'Back to Website')}</span>
            </Link>
            <span className="text-xs font-medium text-white/80 tabular-nums whitespace-nowrap">
              {pick('EIIN: ১১৩৫৮৭ · স্থাপিত ১৯৭৮', 'EIIN: 113587 · Est. 1978')}
            </span>
          </div>

          {/* Center Institutional Identity */}
          <div className="space-y-6 my-auto py-8">
            <div className="inline-flex p-1.5 rounded-full bg-white shadow-lg ring-1 ring-white/30">
              <SchoolEmblem size={76} className="ring-0" />
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-white/85">
                {pick('ডিজিটাল ক্যাম্পাস ম্যানেজমেন্ট পোর্টাল', 'Digital Campus Management Portal')}
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
                {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
              </h1>
              <p className="text-base font-medium text-white/85">
                {locale === 'bn' ? 'Bhojeshwar High School · “শিক্ষাই আলো, জ্ঞানই শক্তি”' : '“Education is Light, Knowledge is Power”'}
              </p>
            </div>

            <p className="text-base text-white/80 leading-relaxed max-w-md">
              {pick(
                'প্রশাসন, শিক্ষক, অভিভাবক ও শিক্ষার্থীদের জন্য একক ও নিরাপদ ডিজিটাল প্ল্যাটফর্ম — হাজিরা, পরীক্ষা, ফলাফল ও একাডেমিক কার্যক্রম পরিচালনার আধুনিক ব্যবস্থা।',
                'A unified, secure institutional platform for administrators, teachers, parents, and students — streamlining attendance, examinations, results, and academics.'
              )}
            </p>
          </div>

          {/* Bottom Institutional Summary Strip */}
          <div className="pt-5 border-t border-white/15 grid grid-cols-3 gap-4 tabular-nums">
            <div>
              <p className="text-lg font-bold text-white">{pick('৪৮+ বছর', '48+ Yrs')}</p>
              <p className="text-xs text-white/75 mt-0.5">{pick('শিক্ষার ঐতিহ্য', 'Academic Heritage')}</p>
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="text-lg font-bold text-white">{pick('৬ষ্ঠ – ১০ম', 'Classes 6–10')}</p>
              <p className="text-xs text-white/75 mt-0.5">{pick('বিজ্ঞান · মানবিক · ব্যবসায়', '3 SSC Streams')}</p>
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="text-lg font-bold text-white">{pick('ভোজেশ্বর', 'Bhojeshwar')}</p>
              <p className="text-xs text-white/75 mt-0.5">{pick('নড়িয়া, শরীয়তপুর', 'Noria, Shariatpur')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Sign-In Workspace */}
      <main className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-screen bg-background">
        {/* Top Utility Row */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{pick('মূল ওয়েবসাইট', 'Home')}</span>
          </Link>
          <p className="hidden lg:block text-xs text-muted-foreground tabular-nums">
            {pick('শিক্ষাবর্ষ ২০২৬ · সমন্বিত পোর্টাল অ্যাক্সেস', 'Session 2026 · Unified Portal Access')}
          </p>
        </div>

        {/* Centered Login Column */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-10 pt-2">
          <div className="w-full max-w-[440px] space-y-7">
            {/* Mobile Brand Lockup */}
            <div className="flex items-center gap-3.5 lg:hidden pb-2 border-b border-border">
              <SchoolEmblem size={48} />
              <div>
                <p className="font-bold text-foreground text-base leading-snug">
                  {pick('ভোজেশ্বর উচ্চ বিদ্যালয়', 'Bhojeshwar High School')}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {pick('স্থাপিত ১৯৭৮ · EIIN: ১১৩৫৮৭', 'Est. 1978 · EIIN: 113587')}
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {pick('পোর্টাল সাইন ইন', 'Portal Sign In')}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {pick(
                  'আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।',
                  'Sign in with your registered email address or mobile number.'
                )}
              </p>
            </div>

            {/* Primary Sign-In Card */}
            <Card className="p-6 sm:p-7">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label={pick('ইমেইল অথবা মোবাইল নম্বর', 'Email or Mobile Number')}
                  required
                  error={form.formState.errors.identifier?.message}
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      {...form.register('identifier')}
                      placeholder="admin@example.com / 01700000000"
                      className="pl-10"
                    />
                  </div>
                </FormField>

                <FormField
                  label={pick('পাসওয়ার্ড', 'Password')}
                  required
                  error={form.formState.errors.password?.message}
                >
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPass ? 'text' : 'password'}
                      {...form.register('password')}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={pick('পাসওয়ার্ড দেখুন বা লুকান', 'Toggle password visibility')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <div className="flex items-center justify-between gap-2 text-sm pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-muted-foreground select-none">
                    <input
                      type="checkbox"
                      {...form.register('rememberMe')}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <span>{pick('আমাকে মনে রাখুন', 'Remember me')}</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="font-medium text-primary hover:underline whitespace-nowrap"
                  >
                    {pick('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?')}
                  </Link>
                </div>

                <Button type="submit" variant="primary" className="w-full h-11 text-base font-semibold mt-1">
                  <span>{pick('পোর্টালে প্রবেশ করুন', 'Sign In to Portal')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </Card>

            {/* Clean Hairline Divider + Organized Quick Role Access */}
            <div className="space-y-3.5">
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs font-medium text-muted-foreground">
                  {pick('দ্রুত ডেমো পোর্টাল প্রবেশ', 'Quick Demo Portal Access')}
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoButtons.map((b) => {
                  const Icon = b.icon;
                  return (
                    <button
                      key={b.role}
                      type="button"
                      onClick={() => handleDemoLogin(b.role)}
                      className="group flex items-center gap-3 p-3 text-left bg-surface border border-border rounded-[var(--radius)] hover:border-primary hover:bg-surface-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-[var(--radius)] bg-surface-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug truncate">
                          {pick(b.labelBn, b.labelEn)}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground tabular-nums truncate">
                          {b.meta}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet Support Footer */}
            <p className="text-center text-sm text-muted-foreground">
              {pick('অ্যাকাউন্ট সহায়তার জন্য ', 'Need help signing in? ')}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                {pick('বিদ্যালয় অফিসে যোগাযোগ করুন', 'Contact School Office')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { pick } = useI18n();
  const [sent, setSent] = useState(false);
  const [contact, setContact] = useState('');
  const [forgotPasswordApi, { isLoading: sending }] = useForgotPasswordMutation();

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;

    try {
      await forgotPasswordApi({ email: contact.trim() }).unwrap();
      setSent(true);
      toast.success(
        pick('পাসওয়ার্ড রিসেট নির্দেশনা সফলভাবে পাঠানো হয়েছে।', 'Password reset instructions sent.')
      );
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          pick('অনুরোধ প্রক্রিয়া করা যায়নি।', 'Failed to process request.')
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 space-y-4">
        <SchoolEmblem size={48} />
        <h1 className="text-xl font-bold text-foreground">{pick('পাসওয়ার্ড পুনরুদ্ধার', 'Forgot Password')}</h1>
        {sent ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-success font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {pick('পুনরুদ্ধার নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে।', 'Reset instructions have been sent to your email.')}
            </p>
            <Link href="/reset-password">
              <Button variant="primary" size="sm">
                {pick('নতুন পাসওয়ার্ড সেট করুন', 'Go to Reset Password')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <FormField label={pick('ইমেইল অথবা মোবাইল নম্বর', 'Email or Phone')} required>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="admin@example.com / 017XXXXXXXX"
                required
              />
            </FormField>
            <Button type="submit" variant="primary" className="w-full" disabled={sending}>
              {sending ? pick('পাঠানো হচ্ছে...', 'Sending...') : pick('রিসেট কোড পাঠান', 'Send Reset Code')}
            </Button>
            <Link href="/login" className="block text-center text-sm text-primary hover:underline">
              {pick('লগইনে ফিরে যান', 'Back to Login')}
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}

export function ResetPasswordPage() {
  const { pick } = useI18n();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [resetPasswordApi, { isLoading: resetting }] = useResetPasswordMutation();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error(pick('রিসেট টোকেন আবশ্যক', 'Reset token is required'));
      return;
    }
    if (pass.length < 6) {
      toast.error(pick('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন', 'Minimum 6 characters required'));
      return;
    }

    try {
      await resetPasswordApi({ resetToken: token.trim(), newPassword: pass }).unwrap();
      toast.success(pick('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।', 'Password reset successfully.'));
      router.push('/login');
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          pick('পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।', 'Password reset failed.')
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 space-y-4">
        <h1 className="text-xl font-bold text-foreground">{pick('নতুন পাসওয়ার্ড নির্ধারণ', 'Reset Password')}</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <FormField label={pick('রিসেট টোকেন', 'Reset Token')} required>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. eyJhbGci..."
              required
            />
          </FormField>
          <FormField label={pick('নতুন পাসওয়ার্ড', 'New Password')} required>
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </FormField>
          <Button type="submit" variant="primary" className="w-full" disabled={resetting}>
            {resetting ? pick('সংরক্ষণ হচ্ছে...', 'Saving...') : pick('সংরক্ষণ করুন', 'Save Password')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function VerifyAccountPage() {
  const { pick } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <h1 className="text-xl font-bold text-foreground">{pick('অ্যাকাউন্ট যাচাইকরণ', 'Account Verification')}</h1>
        <p className="text-base text-muted-foreground">
          {pick('আপনার ইমেইল/মোবাইল নম্বর সফলভাবে যাচাই হয়েছে। এখন পোর্টালে লগইন করতে পারবেন।', 'Your account verification interface is ready for backend OTP/token confirmation.')}
        </p>
        <Link href="/login"><Button variant="primary">{pick('লগইন করুন', 'Proceed to Login')}</Button></Link>
      </Card>
    </div>
  );
}

export function UnauthorizedPage() {
  const { pick } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
        <h1 className="text-xl font-bold text-foreground">403 — {pick('প্রবেশাধিকার নেই', 'Unauthorized Access')}</h1>
        <p className="text-base text-muted-foreground">
          {pick('এই পৃষ্ঠাটি দেখার জন্য আপনার অ্যাকাউন্টে প্রয়োজনীয় অনুমতি নেই।', 'Your current role does not have permission to view this resource.')}
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/login"><Button variant="primary">{pick('অন্য অ্যাকাউন্টে লগইন', 'Switch Account')}</Button></Link>
          <Link href="/"><Button variant="outline">{pick('হোমপেজ', 'Home')}</Button></Link>
        </div>
      </Card>
    </div>
  );
}
