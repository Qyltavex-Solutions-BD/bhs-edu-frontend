import { AcademicEventType } from '@/src/types/enums';
import type { MockDatabase } from '@/src/mocks/seed';

export function localToday() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Empty string means the date is a school day. Bangla text is the office reason it is closed. */
export function closedDay(db: MockDatabase, date: string, yearId: string) {
  if (!date) return '';
  if (date > localToday()) return 'আগামী তারিখে হাজিরা হয় না।';
  const weekday = new Date(`${date}T12:00:00`).getDay();
  if (weekday === 5 || weekday === 6) return 'শুক্র ও শনিবার বিদ্যালয় বন্ধ।';
  const holiday = db.academicEvents.find(
    (event) =>
      event.academicYearId === yearId &&
      event.eventType === AcademicEventType.HOLIDAY &&
      event.startDate.slice(0, 10) <= date &&
      event.endDate.slice(0, 10) >= date
  );
  return holiday ? `ছুটি: ${holiday.title}` : '';
}

export function latestOpenDay(db: MockDatabase, yearId: string, from = localToday()) {
  let cursor = from;
  for (let i = 0; i < 21; i += 1) {
    if (!closedDay(db, cursor, yearId)) return cursor;
    cursor = shiftDate(cursor, -1);
  }
  return from;
}
