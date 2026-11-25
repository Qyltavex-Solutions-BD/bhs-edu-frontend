'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setCredentials } from '@/src/store/slices/authSlice';
import { toggleTheme } from '@/src/store/slices/uiSlice';
import { useI18n } from '@/src/lib/i18n';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { passwordChangeSchema, profileUpdateSchema } from '@/src/features/auth/schemas';
import {
  useChangePasswordMutation,
  useGetAuthProfileQuery,
  useGetAuthSessionsQuery,
  useRevokeAuthSessionMutation,
  useRevokeOtherAuthSessionsMutation,
  useUpdateAuthProfileMutation,
} from '@/src/features/auth/api/auth.api';
import { Button, Card, FormField, Input, Switch } from '@/src/components/ui/primitives';

function parseUserAgent(ua: string): { label: string; isMobile: boolean } {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'Desktop';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { label: `${browser} · ${os}`, isMobile };
}

function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  ariaLabel,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={ariaLabel}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

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

  const { data: profile, isLoading: loadingProfile } = useGetAuthProfileQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateAuthProfileMutation();
  const [changePasswordApi, { isLoading: changingPassword }] = useChangePasswordMutation();
  const { data: sessions = [], isLoading: loadingSessions } = useGetAuthSessionsQuery();
  const [revokeSessionApi, { isLoading: revokingSession }] = useRevokeAuthSessionMutation();
  const [revokeOtherSessionsApi, { isLoading: revokingOthers }] =
    useRevokeOtherAuthSessionsMutation();

  const [displayName, setDisplayName] = useState(auth.user?.name ?? '');
  const [phone, setPhone] = useState(auth.user?.phone ?? '');
  const [qualification, setQualification] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    if (profile.staff) {
      setQualification(profile.staff.qualification ?? '');
      setPresentAddress(profile.staff.presentAddress ?? '');
      setPermanentAddress(profile.staff.permanentAddress ?? '');
      setEmergencyContact(profile.staff.emergencyContact ?? '');
    }
    if (profile.parent) {
      setOccupation(profile.parent.occupation ?? '');
      setAddress(profile.parent.address ?? '');
    }
  }, [profile]);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwError, setPwError] = useState<string | null>(null);

  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileUpdateSchema.safeParse({
      name: displayName,
      phone,
      ...(profile?.staff
        ? {
            qualification,
            presentAddress,
            permanentAddress,
            emergencyContact,
          }
        : {}),
      ...(profile?.parent
        ? {
            occupation,
            address,
          }
        : {}),
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? pick('সঠিক তথ্য দিন।', 'Invalid profile input.');
      setProfileError(msg);
      toast.error(msg);
      return;
    }

    setProfileError(null);
    try {
      const payload = {
        name: displayName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(profile?.staff
          ? {
              ...(qualification.trim() ? { qualification: qualification.trim() } : {}),
              ...(presentAddress.trim() ? { presentAddress: presentAddress.trim() } : {}),
              ...(permanentAddress.trim() ? { permanentAddress: permanentAddress.trim() } : {}),
              ...(emergencyContact.trim() ? { emergencyContact: emergencyContact.trim() } : {}),
            }
          : {}),
        ...(profile?.parent
          ? {
              ...(occupation.trim() ? { occupation: occupation.trim() } : {}),
              ...(address.trim() ? { address: address.trim() } : {}),
            }
          : {}),
      };

      const updated = await updateProfile(payload).unwrap();

      if (auth.accessToken && auth.user) {
        dispatch(
          setCredentials({
            accessToken: auth.accessToken,
            user: {
              ...auth.user,
              name: updated.name,
              phone: updated.phone ?? '',
            },
          })
        );
      }

      toast.success(
        pick('প্রোফাইল তথ্য সফলভাবে হালনাগাদ করা হয়েছে।', 'Profile updated successfully.')
      );
    } catch (err: any) {
      toast.error(
        err?.message ||
          pick('প্রোফাইল আপডেট করা যায়নি।', 'Could not update profile.')
      );
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordChangeSchema.safeParse(pwForm);
    if (!parsed.success) {
      setPwError(parsed.error.issues[0]?.message ?? 'Invalid password input');
      return;
    }

    setPwError(null);
    try {
      await changePasswordApi({
        oldPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      }).unwrap();
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(
        pick('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।', 'Password changed successfully.')
      );
    } catch (err: any) {
      const msg =
        err?.message ||
        pick('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।', 'Could not change password.');
      setPwError(msg);
      toast.error(msg);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSessionApi(id).unwrap();
      toast.success(pick('সেশন সফলভাবে বাতিল করা হয়েছে।', 'Session revoked successfully.'));
    } catch (err: any) {
      toast.error(err?.message || pick('সেশন বাতিল করা যায়নি।', 'Could not revoke session.'));
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await revokeOtherSessionsApi().unwrap();
      toast.success(
        pick('অন্যান্য সকল ডিভাইস থেকে সাইন আউট করা হয়েছে।', 'Signed out of all other devices.')
      );
    } catch (err: any) {
      toast.error(
        err?.message || pick('অন্যান্য সেশন বাতিল করা যায়নি।', 'Could not revoke other sessions.')
      );
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;
  const effectiveName = displayName || profile?.name || auth.user?.name || 'User';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Profile Information + Change Password */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 space-y-5">
          {loadingProfile ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="h-16 w-16 rounded-full bg-surface-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 rounded bg-surface-muted" />
                  <div className="h-3.5 w-64 rounded bg-surface-muted" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 rounded bg-surface-muted" />
                <div className="h-10 rounded bg-surface-muted" />
                <div className="h-10 rounded bg-surface-muted" />
                <div className="h-10 rounded bg-surface-muted" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                    {effectiveName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {effectiveName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel ?? profile?.roles?.join(', ') ?? auth.role}
                      {extraMeta ? ` · ${extraMeta}` : ''}
                    </p>
                    {profile?.createdAt && (
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {pick('সদস্য হিসেবে যুক্ত:', 'Member since:')}{' '}
                        {formatDateShort(profile.createdAt, locale)}
                      </p>
                    )}
                  </div>
                </div>

                {profile?.roles?.length ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {profile.roles.map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Role-specific institutional summary */}
              {profile?.staff && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-muted/60 border border-border text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {pick('পদবি', 'Designation')}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {profile.staff.designation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {pick('বিভাগ', 'Department')}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {profile.staff.department?.name ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {pick('স্টাফ আইডি', 'Employee ID')}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5 tabular-nums">
                      {profile.staff.employeeId ?? '—'}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={pick('পূর্ণ নাম', 'Full Name')} required>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={pick('আপনার পূর্ণ নাম লিখুন', 'Enter your full name')}
                      required
                    />
                  </FormField>
                  <FormField label={pick('ফোন নম্বর', 'Phone Number')}>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                    />
                  </FormField>
                  <FormField label={pick('ইমেইল ঠিকানা', 'Email Address')}>
                    <Input
                      type="email"
                      value={profile?.email ?? auth.user?.email ?? ''}
                      placeholder="name@example.com"
                      disabled
                      className="bg-surface-muted cursor-not-allowed opacity-80"
                    />
                  </FormField>

                  {profile?.staff && (
                    <>
                      <FormField label={pick('শিক্ষাগত যোগ্যতা', 'Qualification')}>
                        <Input
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          placeholder={pick(
                            'যেমন: M.Sc in Mathematics, B.Ed',
                            'e.g. M.Sc in Mathematics, B.Ed'
                          )}
                        />
                      </FormField>
                      <FormField label={pick('জরুরি যোগাযোগ', 'Emergency Contact')}>
                        <Input
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="018XXXXXXXX"
                        />
                      </FormField>
                      <FormField label={pick('বর্তমান ঠিকানা', 'Present Address')}>
                        <Input
                          value={presentAddress}
                          onChange={(e) => setPresentAddress(e.target.value)}
                          placeholder={pick(
                            'গ্রাম/সড়ক, উপজেলা, জেলা',
                            'Village/Road, Upazila, District'
                          )}
                        />
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField label={pick('স্থায়ী ঠিকানা', 'Permanent Address')}>
                          <Input
                            value={permanentAddress}
                            onChange={(e) => setPermanentAddress(e.target.value)}
                            placeholder={pick('স্থায়ী ঠিকানা লিখুন', 'Enter permanent address')}
                          />
                        </FormField>
                      </div>
                    </>
                  )}

                  {profile?.parent && (
                    <>
                      <FormField label={pick('পেশা', 'Occupation')}>
                        <Input
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder={pick(
                            'যেমন: ব্যবসায়ী, চাকরিজীবী',
                            'e.g. Businessman, Service Holder'
                          )}
                        />
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField label={pick('ঠিকানা', 'Address')}>
                          <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={pick(
                              'আপনার বর্তমান ঠিকানা লিখুন',
                              'Enter your residential address'
                            )}
                          />
                        </FormField>
                      </div>
                    </>
                  )}
                </div>

                {profileError && (
                  <p className="text-sm text-destructive font-medium">{profileError}</p>
                )}

                <Button type="submit" variant="primary" size="sm" disabled={savingProfile}>
                  {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {pick('প্রোফাইল সংরক্ষণ করুন', 'Save Profile Changes')}
                </Button>
              </form>
            </>
          )}
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
              <PasswordInput
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                ariaLabel={pick('বর্তমান পাসওয়ার্ড দেখুন বা লুকান', 'Toggle current password visibility')}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label={pick('নতুন পাসওয়ার্ড', 'New Password')} required>
                <PasswordInput
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  ariaLabel={pick('নতুন পাসওয়ার্ড দেখুন বা লুকান', 'Toggle new password visibility')}
                />
              </FormField>
              <FormField label={pick('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm Password')} required>
                <PasswordInput
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  ariaLabel={pick('নিশ্চিত পাসওয়ার্ড দেখুন বা লুকান', 'Toggle confirm password visibility')}
                />
              </FormField>
            </div>
            {pwError && <p className="text-sm text-destructive font-medium">{pwError}</p>}
            <Button type="submit" variant="outline" size="sm" disabled={changingPassword}>
              {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {pick('পাসওয়ার্ড হালনাগাদ করুন', 'Update Password')}
            </Button>
          </form>
        </Card>
      </div>

      {/* Right 5 Cols: Preferences + Active Sessions */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">
            {pick('থিম ও নোটিফিকেশন পছন্দ', 'Theme & Notification Preferences')}
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
                <span className="text-sm text-foreground">
                  {pick('ইন-অ্যাপ নোটিফিকেশন', 'In-App Alerts')}
                </span>
                <Switch checked={notifyInApp} onChange={setNotifyInApp} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {pick('হাজিরা ও জরুরি SMS', 'Attendance & Urgent SMS')}
                </span>
                <Switch checked={notifySms} onChange={setNotifySms} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {pick('ইমেইল বিজ্ঞপ্তি', 'Email Digests')}
                </span>
                <Switch checked={notifyEmail} onChange={setNotifyEmail} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {pick('সক্রিয় লগইন সেশনসমূহ', 'Active Login Sessions')}
            </h3>
            {otherSessionsCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={revokingOthers}
                onClick={handleRevokeOthers}
                className="text-xs text-destructive hover:text-destructive"
              >
                {pick('অন্য সব বাতিল', 'Sign out others')}
              </Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {loadingSessions ? (
              Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 rounded bg-surface-muted shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-40 rounded bg-surface-muted" />
                    <div className="h-3 w-52 rounded bg-surface-muted" />
                  </div>
                </div>
              ))
            ) : sessions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground text-center">
                {pick('কোনো সক্রিয় সেশন পাওয়া যায়নি।', 'No active sessions found.')}
              </p>
            ) : (
              sessions.map((s) => {
                const { label, isMobile } = parseUserAgent(s.userAgent);
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isMobile ? (
                        <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      ) : (
                        <Monitor className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                          {s.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {pick('বর্তমান', 'Current')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                          IP: {s.ipAddress} · {formatDateShort(s.lastActiveAt, locale)}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={revokingSession}
                        onClick={() => handleRevokeSession(s.id)}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {pick('বাতিল', 'Revoke')}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {profile?.permissions?.length ? (
            <div className="pt-3 border-t border-border text-xs text-muted-foreground">
              {pick('অনুমোদিত পারমিশন:', 'Granted permissions:')}{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(profile.permissions.length, locale)}
              </span>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
