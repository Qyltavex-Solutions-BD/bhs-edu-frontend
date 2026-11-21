'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Camera,
  KeyRound,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { toggleTheme } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { passwordChangeSchema } from '@/src/lib/validations/schemas';
import { Button, Card, FormField, Input, Switch } from '@/src/components/ui/primitives';

interface DemoSession {
  id: string;
  device: string;
  location: string;
  lastActiveBn: string;
  lastActiveEn: string;
  current: boolean;
  type: 'desktop' | 'mobile';
}

const INITIAL_SESSIONS: DemoSession[] = [
  {
    id: 'sess-current',
    device: 'Chrome 132 · Windows 11',
    location: 'Noria, Shariatpur, BD',
    lastActiveBn: 'বর্তমান সেশন (সক্রিয়)',
    lastActiveEn: 'Current session (Active now)',
    current: true,
    type: 'desktop',
  },
  {
    id: 'sess-mobile',
    device: 'Android Mobile · Chrome',
    location: 'Shariatpur, BD',
    lastActiveBn: '২ ঘণ্টা আগে',
    lastActiveEn: '2 hours ago',
    current: false,
    type: 'mobile',
  },
];

export function CommonProfilePanel({
  roleLabel,
  extraMeta,
}: {
  roleLabel?: string;
  extraMeta?: string;
}) {
  const auth = useAppSelector((s) => s.auth);
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatch();
  const { locale, pick } = useI18n();

  const [displayName, setDisplayName] = useState(auth.user?.name ?? '');
  const [phone, setPhone] = useState(auth.user?.phone ?? '');
  const [email, setEmail] = useState(auth.user?.email ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<DemoSession[]>(INITIAL_SESSIONS);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(pick('শুধুমাত্র ছবি ফাইল নির্বাচন করুন।', 'Please select a valid image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        toast.success(
          pick(
            'প্রোফাইল ছবির প্রিভিউ আপডেট হয়েছে (সার্ভার আপলোড ব্যাকএন্ড-পেন্ডিং)।',
            'Profile photo preview updated (cloud upload backend-pending).'
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error(pick('পূর্ণ নাম আবশ্যক।', 'Full name is required.'));
      return;
    }
    toast.success(
      pick('প্রোফাইল তথ্য হালনাগাদ করা হয়েছে।', 'Profile details saved successfully.')
    );
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordChangeSchema.safeParse(pwForm);
    if (!parsed.success) {
      setPwError(parsed.error.issues[0]?.message ?? 'Invalid password input');
      return;
    }
    setPwError(null);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success(
      pick(
        'পাসওয়ার্ড পরিবর্তন অনুরোধ যাচাই সম্পন্ন (ডেমো মোড — আসল পাসওয়ার্ড ব্যাকএন্ড এপিআই দ্বারা সংরক্ষিত হবে)।',
        'Password policy validated (demo mode — persisted via backend auth API).'
      )
    );
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success(pick('সেশন সফলভাবে বাতিল করা হয়েছে।', 'Session revoked successfully.'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Edit Profile + Photo Upload + Change Password */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold text-lg flex items-center justify-center">
                  {(displayName || 'U').slice(0, 2)}
                </div>
              )}
              <label
                htmlFor="profile-avatar-upload"
                title={pick('ছবি পরিবর্তন করুন', 'Upload photo')}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center cursor-pointer shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {displayName || auth.user?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {roleLabel ?? auth.role}
                {extraMeta ? ` · ${extraMeta}` : ''}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={pick('পূর্ণ নাম', 'Full Name')} required>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </FormField>
              <FormField label={pick('ফোন নম্বর', 'Phone Number')}>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <FormField label={pick('ইমেইল ঠিকানা', 'Email Address')}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormField>
            </div>
            <Button type="submit" variant="primary" size="sm">
              {pick('প্রোফাইল সংরক্ষণ করুন', 'Save Profile Changes')}
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {pick('পাসওয়ার্ড পরিবর্তন', 'Change Password')}
            </h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <FormField label={pick('বর্তমান পাসওয়ার্ড', 'Current Password')} required>
              <Input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={pick('নতুন পাসওয়ার্ড', 'New Password')} required>
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
              </FormField>
              <FormField label={pick('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm Password')} required>
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
              </FormField>
            </div>
            {pwError && <p className="text-sm text-destructive font-medium">{pwError}</p>}
            <Button type="submit" variant="outline" size="sm">
              {pick('পাসওয়ার্ড হালনাগাদ করুন', 'Update Password')}
            </Button>
          </form>
        </Card>
      </div>

      {/* Right 5 Cols: Preferences + Active Sessions */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">
            {pick('থিম ও নোটিফিকেশন পছন্দ', 'থিম ও নোটিফিকেশন')}
          </h3>
          <div className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground">{pick('ডার্ক মোড', 'Dark Theme')}</span>
              <Switch checked={theme === 'dark'} onChange={() => dispatch(toggleTheme())} />
            </div>
            <div className="pt-3 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {pick('নোটিফিকেশন চ্যানেল', 'Notification Channels')}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{pick('ইন-অ্যাপ নোটিফিকেশন', 'In-App Alerts')}</span>
                <Switch checked={notifyInApp} onChange={setNotifyInApp} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{pick('হাজিরা ও জরুরি SMS', 'Attendance & Urgent SMS')}</span>
                <Switch checked={notifySms} onChange={setNotifySms} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{pick('ইমেইল বিজ্ঞপ্তি', 'Email Digests')}</span>
                <Switch checked={notifyEmail} onChange={setNotifyEmail} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {pick('সক্রিয় লগইন সেশনসমূহ', 'Active Sessions')}
            </h3>
            <span className="text-xs text-muted-foreground">BACKEND-PENDING</span>
          </div>
          <div className="divide-y divide-border">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {s.type === 'desktop' ? (
                    <Monitor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.location} · {locale === 'bn' ? s.lastActiveBn : s.lastActiveEn}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(s.id)}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {pick('বাতিল', 'Revoke')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
