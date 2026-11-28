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
import {
  adminLoginSchema,
  loginSchema,
  portalInitiateSchema,
  portalSetupPasswordSchema,
  type AdminLoginFormValues,
  type LoginFormValues,
  type PortalInitiateFormValues,
  type PortalSetupPasswordFormValues,
} from '../schemas';
import { useAppDispatch } from '@/src/store/hooks';
import { setCredentials } from '@/src/store/slices/authSlice';
import {
  useAdminLoginMutation,
  useLoginUserMutation,
  usePortalInitiateMutation,
  usePortalSetupPasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  type LoginResponseData,
} from '../api/auth.api';
import { SCHOOL_LOGO_SRC, SchoolEmblem } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input } from '@/src/components/ui/primitives';
import { DemoLoginCards, type DemoAccount } from './DemoLoginCards';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [step, setStep] = useState<'IDENTIFY' | 'ENTER_PASSWORD' | 'SET_PASSWORD'>('IDENTIFY');
  const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const [maskedTarget, setMaskedTarget] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<DemoAccount['key'] | null>(null);

  const identifyForm = useForm<PortalInitiateFormValues>({
    resolver: zodResolver(portalInitiateSchema),
    defaultValues: { identifier: '' },
  });

  const setupForm = useForm<PortalSetupPasswordFormValues>({
    resolver: zodResolver(portalSetupPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  const [portalInitiateApi, { isLoading: isInitiating }] = usePortalInitiateMutation();
  const [portalSetupPasswordApi, { isLoading: isSettingPassword }] = usePortalSetupPasswordMutation();
  const [loginApi, { isLoading: isLoggingIn }] = useLoginUserMutation();

  const completePortalSession = (res: LoginResponseData) => {
    const roles = res.user?.roles || [];
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      toast.error('এই পোর্টাল দিয়ে অ্যাডমিন প্রবেশ অনুমোদিত নয়।');
      return;
    }

    const role = (['TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'] as const).find((candidate) =>
      roles.includes(candidate)
    );
    if (!role) {
      toast.error('এই অ্যাকাউন্টের কোনো পোর্টাল অ্যাক্সেস নেই।');
      return;
    }

    dispatch(
      setCredentials({
        accessToken: res.accessToken,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          role: role as any,
        },
        role: role as any,
        permissions: res.user.permissions ?? [],
      })
    );

    toast.success('লগইন সফল হয়েছে।');

    let redirectUrl = '/teacher/dashboard';
    if (role === 'PARENT') redirectUrl = '/parent/dashboard';
    else if (role === 'STUDENT') redirectUrl = '/student/dashboard';
    else if (role === 'ACCOUNTANT') redirectUrl = '/accountant/dashboard';

    router.push(redirectUrl);
  };

  const handleInitiateSubmit = async (values: PortalInitiateFormValues) => {
    try {
      const res = await portalInitiateApi({ identifier: values.identifier.trim() }).unwrap();
      setVerifiedIdentifier(res.identifier);
      setAccountName(res.name);
      setMaskedTarget(res.maskedPhone || res.maskedEmail || null);

      if (res.nextStep === 'SET_PASSWORD') {
        setupForm.reset({ otp: '', password: '', confirmPassword: '' });
        setStep('SET_PASSWORD');
        toast.info(
          'প্রথমবার লগইনের জন্য কনসোলে (এসএমএস লগে) একটি ওটিপি পাঠানো হয়েছে। পাসওয়ার্ড সেট করুন।'
        );
      } else {
        setPasswordInput('');
        setStep('ENTER_PASSWORD');
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'অ্যাকাউন্ট যাচাই করা যায়নি। সঠিক ইমেইল বা মোবাইল নম্বর দিন।'
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    try {
      const res = await loginApi({
        email: verifiedIdentifier,
        password: passwordInput,
      }).unwrap();
      completePortalSession(res);
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'লগইন ব্যর্থ হয়েছে। সঠিক পাসওয়ার্ড দিন।'
      );
    }
  };

  const handleSetupPasswordSubmit = async (values: PortalSetupPasswordFormValues) => {
    try {
      const res = await portalSetupPasswordApi({
        identifier: verifiedIdentifier,
        otp: values.otp.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      }).unwrap();
      completePortalSession(res);
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'পাসওয়ার্ড সেট করা যায়নি। ওটিপি ও তথ্য যাচাই করুন।'
      );
    }
  };

  const handleDemoLogin = async (
    email: string,
    password: string,
    roleKey: DemoAccount['key']
  ) => {
    setActiveDemoRole(roleKey);
    try {
      const res = await loginApi({ email: email.trim(), password }).unwrap();
      completePortalSession(res);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'ডেমো লগইন ব্যর্থ হয়েছে।');
    } finally {
      setActiveDemoRole(null);
    }
  };

  const resetToIdentify = () => {
    setStep('IDENTIFY');
    setPasswordInput('');
    setupForm.reset();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Institutional Brand Panel */}
      <aside className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative overflow-hidden bg-[#093B1F] text-white">
        <img
          src="/images/hero_campus_heritage_1795136893336.jpg"
          alt={'ভোজেশ্বর উচ্চ বিদ্যালয় প্রাঙ্গণ'}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#052412]/95 via-[#08341B]/76 to-[#062915]/68"
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{'পাবলিক ওয়েবসাইটে ফিরুন'}</span>
            </Link>
            <span className="text-sm font-medium text-white/80 tabular-nums whitespace-nowrap">
              {'EIIN: ১১৩৫৮৭ · স্থাপিত ১৯৭৮'}
            </span>
          </div>

          <div className="space-y-6 my-auto py-8">
            <div className="inline-flex p-1.5 rounded-full bg-white shadow-lg ring-1 ring-white/30">
              <SchoolEmblem size={76} className="ring-0" />
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-white/85">
                {'ডিজিটাল ক্যাম্পাস ম্যানেজমেন্ট পোর্টাল'}
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
                {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
              </h1>
              <p className="text-base font-medium text-white/85">
                {'Bhojeshwar High School · “শিক্ষাই আলো, জ্ঞানই শক্তি”'}
              </p>
            </div>

            <p className="text-base text-white/80 leading-relaxed max-w-md">
              {'প্রশাসন, শিক্ষক, অভিভাবক ও শিক্ষার্থীদের জন্য একক ও নিরাপদ ডিজিটাল প্ল্যাটফর্ম — হাজিরা, পরীক্ষা, ফলাফল ও একাডেমিক কার্যক্রম পরিচালনার আধুনিক ব্যবস্থা।'}
            </p>
          </div>

          <div className="pt-5 border-t border-white/15 grid grid-cols-3 gap-4 tabular-nums">
            <div>
              <p className="text-lg font-bold text-white">{'৪৮+ বছর'}</p>
              <p className="text-sm text-white/75 mt-0.5">{'শিক্ষার ঐতিহ্য'}</p>
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="text-lg font-bold text-white">{'৬ষ্ঠ – ১০ম'}</p>
              <p className="text-sm text-white/75 mt-0.5">{'বিজ্ঞান · মানবিক · ব্যবসায়'}</p>
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="text-lg font-bold text-white">{'ভোজেশ্বর'}</p>
              <p className="text-sm text-white/75 mt-0.5">{'নড়িয়া, শরীয়তপুর'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Sign-In Workspace */}
      <main className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{'মূল ওয়েবসাইট'}</span>
          </Link>
          <p className="hidden lg:block text-sm text-muted-foreground tabular-nums">
            {'শিক্ষাবর্ষ ২০২৬ · সমন্বিত পোর্টাল অ্যাক্সেস'}
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-10 pt-2">
          <div className="w-full max-w-[440px] space-y-7">
            <div className="flex items-center gap-3.5 lg:hidden pb-2 border-b border-border">
              <SchoolEmblem size={48} />
              <div>
                <p className="font-bold text-foreground text-base leading-snug">
                  {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {'স্থাপিত ১৯৭৮ · EIIN: ১১৩৫৮৭'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {step === 'SET_PASSWORD'
                  ? 'নতুন পাসওয়ার্ড সেট করুন'
                  : 'পোর্টাল সাইন ইন'}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {step === 'IDENTIFY' &&
                  'পোর্টালে প্রবেশ করতে আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর দিন।'}
                {step === 'ENTER_PASSWORD' &&
                  `স্বাগতম, ${accountName || verifiedIdentifier} — প্রবেশ করতে আপনার পাসওয়ার্ড দিন।`}
                {step === 'SET_PASSWORD' &&
                  `স্বাগতম, ${accountName || verifiedIdentifier} — প্রথমবার লগইনের জন্য ওটিপি যাচাই করে পাসওয়ার্ড সেট করুন।`}
              </p>
            </div>

            <Card className="p-6 sm:p-7">
              {step === 'IDENTIFY' && (
                <form onSubmit={identifyForm.handleSubmit(handleInitiateSubmit)} className="space-y-4">
                  <FormField
                    label={'ইমেইল অথবা মোবাইল নম্বর'}
                    required
                    error={identifyForm.formState.errors.identifier?.message}
                  >
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        {...identifyForm.register('identifier')}
                        placeholder="ইমেইল বা মোবাইল (যেমন: 01700000000)"
                        className="pl-10"
                      />
                    </div>
                  </FormField>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isInitiating}
                    className="w-full h-11 text-base font-semibold mt-1"
                  >
                    <span>{isInitiating ? 'যাচাই হচ্ছে...' : 'পরবর্তী ধাপে যান'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'ENTER_PASSWORD' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
                    <span className="font-medium text-foreground truncate">{verifiedIdentifier}</span>
                    <button
                      type="button"
                      onClick={resetToIdentify}
                      className="text-sm font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      {'পরিবর্তন করুন'}
                    </button>
                  </div>

                  <FormField label={'পাসওয়ার্ড'} required>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type={showPass ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={'পাসওয়ার্ড দেখুন বা লুকান'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormField>

                  <div className="flex items-center justify-end text-sm pt-0.5">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-primary hover:underline whitespace-nowrap"
                    >
                      {'পাসওয়ার্ড ভুলে গেছেন?'}
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoggingIn}
                    className="w-full h-11 text-base font-semibold mt-1"
                  >
                    <span>{isLoggingIn ? 'প্রবেশ করছে...' : 'পোর্টালে প্রবেশ করুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              )}

              {step === 'SET_PASSWORD' && (
                <form onSubmit={setupForm.handleSubmit(handleSetupPasswordSubmit)} className="space-y-4">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-800 dark:text-emerald-200">
                    <div>
                      <p className="font-semibold">
                        {'প্রথমবার লগইন যাচাইকরণ'}
                      </p>
                      <p className="opacity-90 mt-0.5">
                        {maskedTarget
                          ? `ওটিপি পাঠানো হয়েছে: ${maskedTarget} (সার্ভার কনসোলে দেখুন)`
                          : 'সার্ভার কনসোল লগ থেকে ৬-সংখ্যার ওটিপি কোডটি দিন।'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetToIdentify}
                      className="font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      {'ফিরুন'}
                    </button>
                  </div>

                  <FormField
                    label={'৬-সংখ্যার ওটিপি কোড'}
                    required
                    error={setupForm.formState.errors.otp?.message}
                  >
                    <Input
                      {...setupForm.register('otp')}
                      maxLength={6}
                      placeholder="123456"
                      className="tracking-widest text-center font-mono text-base"
                    />
                  </FormField>

                  <FormField
                    label={'নতুন পাসওয়ার্ড'}
                    required
                    error={setupForm.formState.errors.password?.message}
                  >
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type={showPass ? 'text' : 'password'}
                        {...setupForm.register('password')}
                        placeholder="কমপক্ষে ৮ অক্ষর (অক্ষর + সংখ্যা)"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormField>

                  <FormField
                    label={'পাসওয়ার্ড নিশ্চিত করুন'}
                    required
                    error={setupForm.formState.errors.confirmPassword?.message}
                  >
                    <div className="relative">
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        type={showConfirmPass ? 'text' : 'password'}
                        {...setupForm.register('confirmPassword')}
                        placeholder="পুনরায় পাসওয়ার্ড দিন"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormField>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSettingPassword}
                    className="w-full h-11 text-base font-semibold mt-1"
                  >
                    <span>
                      {isSettingPassword
                        ? 'সংরক্ষণ হচ্ছে...'
                        : 'পাসওয়ার্ড সেট করে প্রবেশ করুন'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </Card>

            <DemoLoginCards
              onSelectAccount={handleDemoLogin}
              isLoading={isLoggingIn}
              activeRole={activeDemoRole}
            />

            <p className="text-center text-sm text-muted-foreground">
              {'অ্যাকাউন্ট সহায়তার জন্য '}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                {'বিদ্যালয় অফিসে যোগাযোগ করুন'}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AccountantLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [step, setStep] = useState<'IDENTIFY' | 'ENTER_PASSWORD' | 'SET_PASSWORD'>('IDENTIFY');
  const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const [maskedTarget, setMaskedTarget] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const identifyForm = useForm<PortalInitiateFormValues>({
    resolver: zodResolver(portalInitiateSchema),
    defaultValues: { identifier: '' },
  });

  const setupForm = useForm<PortalSetupPasswordFormValues>({
    resolver: zodResolver(portalSetupPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  const [portalInitiateApi, { isLoading: isInitiating }] = usePortalInitiateMutation();
  const [portalSetupPasswordApi, { isLoading: isSettingPassword }] = usePortalSetupPasswordMutation();
  const [loginApi, { isLoading: isLoggingIn }] = useLoginUserMutation();

  const completeAccountantSession = (res: LoginResponseData) => {
    const roles = res.user?.roles || [];
    if (!roles.includes('ACCOUNTANT')) {
      toast.error('এই লগইন শুধুমাত্র অ্যাকাউন্ট্যান্ট রোলের ব্যবহারকারীদের জন্য।');
      return;
    }

    dispatch(
      setCredentials({
        accessToken: res.accessToken,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          role: 'ACCOUNTANT',
        },
        role: 'ACCOUNTANT',
        permissions: res.user.permissions ?? [],
      })
    );

    toast.success('অ্যাকাউন্ট্যান্ট পোর্টালে লগইন সফল হয়েছে।');
    router.push('/accountant/dashboard');
  };

  const handleInitiateSubmit = async (values: PortalInitiateFormValues) => {
    try {
      const res = await portalInitiateApi({ identifier: values.identifier.trim() }).unwrap();
      setVerifiedIdentifier(res.identifier);
      setAccountName(res.name);
      setMaskedTarget(res.maskedPhone || res.maskedEmail || null);

      if (res.nextStep === 'SET_PASSWORD') {
        setupForm.reset({ otp: '', password: '', confirmPassword: '' });
        setStep('SET_PASSWORD');
        toast.info('প্রথমবার লগইনের জন্য কনসোলে (এসএমএস লগে) একটি ওটিপি পাঠানো হয়েছে। পাসওয়ার্ড সেট করুন।');
      } else {
        setPasswordInput('');
        setStep('ENTER_PASSWORD');
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'অ্যাকাউন্ট যাচাই করা যায়নি। সঠিক ইমেইল বা মোবাইল নম্বর দিন।'
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    try {
      const res = await loginApi({
        email: verifiedIdentifier,
        password: passwordInput,
      }).unwrap();
      completeAccountantSession(res);
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'লগইন তথ্য সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    }
  };

  const handleSetupPasswordSubmit = async (values: PortalSetupPasswordFormValues) => {
    try {
      const res = await portalSetupPasswordApi({
        identifier: verifiedIdentifier,
        otp: values.otp.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      }).unwrap();
      completeAccountantSession(res);
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'পাসওয়ার্ড সেট করা যায়নি। ওটিপি ও তথ্য যাচাই করুন।'
      );
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      <aside className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative overflow-hidden bg-[#093B1F] text-white">
        <img
          src="/images/hero_campus_heritage_1795136893336.jpg"
          alt={'ভোজেশ্বর উচ্চ বিদ্যালয় প্রাঙ্গণ'}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#052412]/95 via-[#08341B]/76 to-[#062915]/68"
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 overflow-hidden p-1 shadow-md">
                <img
                  src={SCHOOL_LOGO_SRC}
                  alt={'লোগো'}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">
                  {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                </p>
                <p className="text-sm text-white/80">{'অ্যাকাউন্টস ও হিসাবরক্ষণ বিভাগ'}</p>
              </div>
            </Link>
          </div>

          <div className="space-y-4 max-w-md">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              {'অ্যাকাউন্ট্যান্ট পোর্টাল গেট'}
            </span>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              {'বিদ্যালয়ের আর্থিক ও ফি ব্যবস্থাপনা পোর্টাল'}
            </h1>
            <p className="text-base text-white/85 leading-relaxed">
              {'৬ষ্ঠ থেকে ১০ম শ্রেণির ভর্তি ফি, মাসিক বেতন, পরীক্ষার ফি গ্রহণ, মানি রিসিপ্ট প্রিন্ট, বকেয়া হিসাব এবং দৈনন্দিন আয়-ব্যয় ভাউচার পরিচালনা করুন।'}
            </p>
          </div>

          <p className="text-sm text-white/70">
            {'ভোজেশ্বর উচ্চ বিদ্যালয় · EIIN: ১১৩৫৮৭'}
          </p>
        </div>
      </aside>

      <main className="lg:col-span-6 xl:col-span-7 flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              {'অ্যাকাউন্ট্যান্ট লগইন'}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {'হিসাবরক্ষণ পোর্টালে প্রবেশ করুন'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {'অ্যাডমিন কর্তৃক প্রদত্ত আপনার ইমেইল বা মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন।'}
            </p>
          </div>

          {step === 'IDENTIFY' && (
            <form onSubmit={identifyForm.handleSubmit(handleInitiateSubmit)} className="space-y-4">
              <FormField
                label={'ইমেইল অথবা মোবাইল নম্বর'}
                required
                error={identifyForm.formState.errors.identifier?.message}
              >
                <Input
                  {...identifyForm.register('identifier')}
                  placeholder={'যেমন: accountant@bhs.edu.bd বা 017...'}
                  autoComplete="username"
                />
              </FormField>
              <Button type="submit" variant="primary" className="w-full" disabled={isInitiating}>
                {isInitiating ? 'যাচাই করা হচ্ছে...' : 'পরবর্তী ধাপে যান'}
              </Button>
            </form>
          )}

          {step === 'ENTER_PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-semibold text-foreground">{accountName}</p>
                <p className="text-muted-foreground">{verifiedIdentifier}</p>
              </div>
              <FormField label={'পাসওয়ার্ড'} required>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={'আপনার পাসওয়ার্ড লিখুন'}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={'পাসওয়ার্ড দেখুন'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('IDENTIFY')}
                >
                  {'ফিরে যান'}
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={isLoggingIn}>
                  {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'অ্যাকাউন্ট্যান্ট পোর্টালে প্রবেশ করুন'}
                </Button>
              </div>
            </form>
          )}

          {step === 'SET_PASSWORD' && (
            <form onSubmit={setupForm.handleSubmit(handleSetupPasswordSubmit)} className="space-y-4">
              <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
                <p className="font-semibold text-foreground">{accountName}</p>
                <p className="text-muted-foreground">
                  {`প্রথম লগইন ওটিপি পাঠানো হয়েছে (${maskedTarget || verifiedIdentifier})`}
                </p>
              </div>
              <FormField
                label={'৬-সংখ্যার ওটিপি (OTP)'}
                required
                error={setupForm.formState.errors.otp?.message}
              >
                <Input
                  {...setupForm.register('otp')}
                  placeholder={'যেমন: 123456'}
                  maxLength={6}
                />
              </FormField>
              <FormField
                label={'নতুন পাসওয়ার্ড'}
                required
                error={setupForm.formState.errors.password?.message}
              >
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    {...setupForm.register('password')}
                    placeholder={'কমপক্ষে ৬ অক্ষর'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={'পাসওয়ার্ড দেখুন'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
              <FormField
                label={'পাসওয়ার্ড নিশ্চিত করুন'}
                required
                error={setupForm.formState.errors.confirmPassword?.message}
              >
                <div className="relative">
                  <Input
                    type={showConfirmPass ? 'text' : 'password'}
                    {...setupForm.register('confirmPassword')}
                    placeholder={'পুনরায় পাসওয়ার্ড লিখুন'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={'পাসওয়ার্ড দেখুন'}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('IDENTIFY')}
                >
                  {'ফিরে যান'}
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={isSettingPassword}>
                  {isSettingPassword ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড সেট ও প্রবেশ করুন'}
                </Button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-between text-sm">
            <Link href="/login" className="text-primary hover:underline font-medium">
              {'সাধারণ পোর্টাল লগইন'}
            </Link>
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
              {'পাসওয়ার্ড ভুলে গেছেন?'}
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

export function AdminGateLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showGateKey, setShowGateKey] = useState(false);
  const [adminLoginApi, { isLoading }] = useAdminLoginMutation();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { identifier: '', password: '', accessKey: '' },
  });

  const onSubmit = async (values: AdminLoginFormValues) => {
    try {
      const res = await adminLoginApi({
        email: values.identifier.trim(),
        password: values.password,
        accessKey: values.accessKey.trim(),
      }).unwrap();

      const roles = res.user?.roles || [];
      if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
        toast.error('অ্যাডমিন অনুমতি পাওয়া যায়নি।');
        return;
      }

      dispatch(
        setCredentials({
          accessToken: res.accessToken,
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            role: 'SUPER_ADMIN',
          },
          role: 'SUPER_ADMIN',
          permissions: res.user.permissions ?? [],
        })
      );

      toast.success('অ্যাডমিন পোর্টালে লগইন সফল হয়েছে।');
      router.push('/admin');
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'অ্যাডমিন যাচাইকরণ ব্যর্থ হয়েছে।'
      );
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Institutional Brand Panel (Aligned with Portal Theme) */}
      <aside className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative overflow-hidden bg-[#093B1F] text-white">
        <img
          src="/images/hero_campus_heritage_1795136893336.jpg"
          alt={'ভোজেশ্বর উচ্চ বিদ্যালয় প্রাঙ্গণ'}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#052412]/95 via-[#08341B]/76 to-[#062915]/68"
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{'পাবলিক ওয়েবসাইটে ফিরুন'}</span>
            </Link>
            <span className="text-sm font-medium text-white/80 tabular-nums whitespace-nowrap">
              {'EIIN: ১১৩৫৮৭ · স্থাপিত ১৯৭৮'}
            </span>
          </div>

          <div className="space-y-6 my-auto py-8">
            <div className="inline-flex p-1.5 rounded-full bg-white shadow-lg ring-1 ring-white/30">
              <SchoolEmblem size={76} className="ring-0" />
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-white/85">
                {'সুরক্ষিত প্রশাসনিক কন্ট্রোল প্যানেল'}
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
                {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
              </h1>
              <p className="text-base font-medium text-white/85">
                {'“শিক্ষাই আলো, জ্ঞানই শক্তি” · অ্যাডমিন গেটওয়ে'}
              </p>
            </div>

            <p className="text-base text-white/80 leading-relaxed max-w-md">
              {'শুধুমাত্র অনুমোদিত সিস্টেম অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত প্রবেশাধিকার — ইমেইল বা মোবাইল নম্বর, পাসওয়ার্ড এবং নিরাপত্তা অ্যাক্সেস কী দিয়ে প্রবেশ করুন।'}
            </p>
          </div>

          <div className="pt-5 border-t border-white/15 flex items-center gap-3 text-sm text-white/75">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              {'বহু-স্তরীয় নিরাপত্তা ও অডিট লগ দ্বারা সুরক্ষিত'}
            </span>
          </div>
        </div>
      </aside>

      {/* Right Sign-In Workspace */}
      <main className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{'মূল ওয়েবসাইট'}</span>
          </Link>
          <p className="hidden lg:block text-sm text-muted-foreground tabular-nums">
            {'শিক্ষাবর্ষ ২০২৬ · প্রশাসনিক অ্যাক্সেস'}
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-10 pt-2">
          <div className="w-full max-w-[440px] space-y-7">
            <div className="flex items-center gap-3.5 lg:hidden pb-2 border-b border-border">
              <SchoolEmblem size={48} />
              <div>
                <p className="font-bold text-foreground text-base leading-snug">
                  {'ভোজেশ্বর উচ্চ বিদ্যালয়'}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {'স্থাপিত ১৯৭৮ · EIIN: ১১৩৫৮৭'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{'সুরক্ষিত অ্যাডমিন গেটওয়ে'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {'অ্যাডমিনিস্ট্রেটর সাইন ইন'}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {'আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর, পাসওয়ার্ড ও নিরাপত্তা অ্যাক্সেস কী প্রদান করুন।'}
              </p>
            </div>

            <Card className="p-6 sm:p-7">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label={'ইমেইল অথবা মোবাইল নম্বর'}
                  required
                  error={form.formState.errors.identifier?.message}
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      {...form.register('identifier')}
                      placeholder="ইমেইল বা মোবাইল (যেমন: 01700000000)"
                      className="pl-10"
                    />
                  </div>
                </FormField>

                <FormField
                  label={'পাসওয়ার্ড'}
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
                      aria-label={'পাসওয়ার্ড দেখুন বা লুকান'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <FormField
                  label={'নিরাপত্তা অ্যাক্সেস কী (Security Gate Key)'}
                  required
                  error={form.formState.errors.accessKey?.message}
                >
                  <div className="relative">
                    <ShieldAlert className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showGateKey ? 'text' : 'password'}
                      {...form.register('accessKey')}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGateKey((v) => !v)}
                      aria-label={'অ্যাক্সেস কী দেখুন বা লুকান'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showGateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-semibold mt-1"
                >
                  <span>
                    {isLoading
                      ? 'যাচাই চলছে...'
                      : 'অ্যাডমিন প্যানেলে প্রবেশ করুন'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ForgotPasswordPage() {
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
        'পাসওয়ার্ড রিসেট নির্দেশনা সফলভাবে পাঠানো হয়েছে।'
      );
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'অনুরোধ প্রক্রিয়া করা যায়নি।'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 space-y-4">
        <SchoolEmblem size={48} />
        <h1 className="text-xl font-bold text-foreground">{'পাসওয়ার্ড পুনরুদ্ধার'}</h1>
        {sent ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-success font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {'পুনরুদ্ধার নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে।'}
            </p>
            <Link href="/reset-password">
              <Button variant="primary" size="sm">
                {'নতুন পাসওয়ার্ড সেট করুন'}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <FormField label={'ইমেইল অথবা মোবাইল নম্বর'} required>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="admin@example.com / 017XXXXXXXX"
                required
              />
            </FormField>
            <Button type="submit" variant="primary" className="w-full" disabled={sending}>
              {sending ? 'পাঠানো হচ্ছে...' : 'রিসেট কোড পাঠান'}
            </Button>
            <Link href="/login" className="block text-center text-sm text-primary hover:underline">
              {'লগইনে ফিরে যান'}
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [resetPasswordApi, { isLoading: resetting }] = useResetPasswordMutation();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error('রিসেট টোকেন আবশ্যক');
      return;
    }
    if (pass.length < 6) {
      toast.error('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন');
      return;
    }

    try {
      await resetPasswordApi({ resetToken: token.trim(), newPassword: pass }).unwrap();
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।');
      router.push('/login');
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.message ||
          'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 space-y-4">
        <h1 className="text-xl font-bold text-foreground">{'নতুন পাসওয়ার্ড নির্ধারণ'}</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <FormField label={'রিসেট টোকেন'} required>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="যেমন: eyJhbGci..."
              required
            />
          </FormField>
          <FormField label={'নতুন পাসওয়ার্ড'} required>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={'পাসওয়ার্ড দেখুন বা লুকান'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <Button type="submit" variant="primary" className="w-full" disabled={resetting}>
            {resetting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function VerifyAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <h1 className="text-xl font-bold text-foreground">{'অ্যাকাউন্ট যাচাইকরণ'}</h1>
        <p className="text-base text-muted-foreground">
          {'আপনার ইমেইল/মোবাইল নম্বর সফলভাবে যাচাই হয়েছে। এখন পোর্টালে লগইন করতে পারবেন।'}
        </p>
        <Link href="/login"><Button variant="primary">{'লগইন করুন'}</Button></Link>
      </Card>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-7 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
        <h1 className="text-xl font-bold text-foreground">403 — {'প্রবেশাধিকার নেই'}</h1>
        <p className="text-base text-muted-foreground">
          {'এই পৃষ্ঠাটি দেখার জন্য আপনার অ্যাকাউন্টে প্রয়োজনীয় অনুমতি নেই।'}
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/login"><Button variant="primary">{'অন্য অ্যাকাউন্টে লগইন'}</Button></Link>
          <Link href="/"><Button variant="outline">{'হোমপেজ'}</Button></Link>
        </div>
      </Card>
    </div>
  );
}
