import { WeekDay } from '@/src/types/enums';

export const PERIOD_META = [
  { period: 1, labelBn: '১ম পিরিয়ড', labelEn: 'Period 1', timeBn: '১০:০০ – ১০:৪৫', timeEn: '10:00 – 10:45 AM', startTime: '10:00', endTime: '10:45' },
  { period: 2, labelBn: '২য় পিরিয়ড', labelEn: 'Period 2', timeBn: '১০:৪৫ – ১১:৩০', timeEn: '10:45 – 11:30 AM', startTime: '10:45', endTime: '11:30' },
  { period: 3, labelBn: '৩য় পিরিয়ড', labelEn: 'Period 3', timeBn: '১১:৩০ – ১২:১৫', timeEn: '11:30 AM – 12:15 PM', startTime: '11:30', endTime: '12:15' },
  { period: 4, labelBn: '৪র্থ পিরিয়ড', labelEn: 'Period 4', timeBn: '১২:৪৫ – ১:৩০', timeEn: '12:45 – 01:30 PM', startTime: '12:45', endTime: '13:30' },
] as const;

export const SCHOOL_DAYS = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
] as const;

export function periodClock(period: number) {
  return PERIOD_META.find((item) => item.period === period) ?? PERIOD_META[0];
}

export function getTodayWeekDay(): WeekDay | null {
  const map: Record<number, WeekDay> = {
    0: WeekDay.SUNDAY,
    1: WeekDay.MONDAY,
    2: WeekDay.TUESDAY,
    3: WeekDay.WEDNESDAY,
    4: WeekDay.THURSDAY,
    5: WeekDay.FRIDAY,
    6: WeekDay.SATURDAY,
  };
  return map[new Date().getDay()] ?? null;
}
