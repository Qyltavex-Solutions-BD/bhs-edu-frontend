import { WeekDay } from '@/src/types/enums';

export const PERIOD_META = [
  {
    period: 1,
    labelBn: '১ম পিরিয়ড',
    labelEn: 'Period 1',
    timeBn: '১০:০০ – ১১:০০',
    timeEn: '10:00 – 11:00 AM',
    startTime: '10:00',
    endTime: '11:00',
  },
  {
    period: 2,
    labelBn: '২য় পিরিয়ড',
    labelEn: 'Period 2',
    timeBn: '১১:০০ – ১২:০০',
    timeEn: '11:00 AM – 12:00 PM',
    startTime: '11:00',
    endTime: '12:00',
  },
  {
    period: 3,
    labelBn: '৩য় পিরিয়ড',
    labelEn: 'Period 3',
    timeBn: '১২:০০ – ০১:০০',
    timeEn: '12:00 – 01:00 PM',
    startTime: '12:00',
    endTime: '13:00',
  },
  {
    period: 4,
    labelBn: '৪র্থ পিরিয়ড',
    labelEn: 'Period 4',
    timeBn: '০২:০০ – ০৩:০০',
    timeEn: '02:00 – 03:00 PM',
    startTime: '14:00',
    endTime: '15:00',
  },
  {
    period: 5,
    labelBn: '৫ম পিরিয়ড',
    labelEn: 'Period 5',
    timeBn: '০৩:০০ – ০৪:০০',
    timeEn: '03:00 – 04:00 PM',
    startTime: '15:00',
    endTime: '16:00',
  },
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
