import { format, addDays, nextDay, isToday as isTodayFns, parseISO, startOfDay } from "date-fns";

export interface ResolvedDate {
  display: string;
  iso: string | null;
  hasTime: boolean;
  confidence: "exact" | "assumed" | "unresolved";
}

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const TIME_DEFAULTS: Record<string, [number, number]> = {
  morning: [9, 0],
  lunch: [12, 30],
  midday: [12, 30],
  noon: [12, 30],
  afternoon: [15, 0],
  evening: [18, 0],
  tonight: [21, 0],
  night: [21, 0],
  eod: [17, 0],
  "end of day": [17, 0],
};

const WEEKEND_DEFAULT: [number, number] = [14, 0];
const WEEKDAY_DEFAULT: [number, number] = [9, 0];
const FRIDAY_DEFAULT: [number, number] = [17, 0];

function parseMeetingDate(raw?: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  // DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const d = new Date(+slashMatch[3], +slashMatch[2] - 1, +slashMatch[1]);
    if (!isNaN(d.getTime())) return d;
  }

  // Try natural: "27 Feb 2026", "Feb 27 2026", "February 27, 2026"
  const natural = new Date(s);
  if (!isNaN(natural.getTime())) return natural;

  return null;
}

function getNextDayOfWeek(ref: Date, dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6): Date {
  const refDay = ref.getDay();
  let diff = dayIndex - refDay;
  if (diff <= 0) diff += 7;
  return addDays(ref, diff);
}

function applyTime(d: Date, time: [number, number] | null): { date: Date; hasTime: boolean } {
  if (!time) return { date: startOfDay(d), hasTime: false };
  const result = new Date(d);
  result.setHours(time[0], time[1], 0, 0);
  return { date: result, hasTime: true };
}

function buildResult(d: Date, hasTime: boolean, confidence: "exact" | "assumed"): ResolvedDate {
  return {
    display: formatDateDisplay(toISO(d, hasTime)),
    iso: toISO(d, hasTime),
    hasTime,
    confidence,
  };
}

function toISO(d: Date, hasTime: boolean): string {
  if (hasTime) {
    return format(d, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return format(d, "yyyy-MM-dd'T'00:00:00");
}

export function resolveDate(rawText: string, meetingDate?: string): ResolvedDate {
  if (!rawText || !rawText.trim()) {
    return { display: "", iso: null, hasTime: false, confidence: "unresolved" };
  }

  const text = rawText.trim().toLowerCase();
  const ref = parseMeetingDate(meetingDate) || new Date();

  // Extract time modifier
  let timeOverride: [number, number] | null = null;
  let hasExplicitTime = false;
  for (const [key, val] of Object.entries(TIME_DEFAULTS)) {
    if (text.includes(key)) {
      timeOverride = val;
      hasExplicitTime = true;
      break;
    }
  }

  // "today" variants
  if (text.startsWith("today")) {
    const { date, hasTime } = applyTime(ref, timeOverride);
    return buildResult(date, hasTime, hasTime ? "assumed" : "exact");
  }

  // "tonight"
  if (text === "tonight") {
    const { date } = applyTime(ref, [21, 0]);
    return buildResult(date, true, "assumed");
  }

  // "tomorrow" variants
  if (text.startsWith("tomorrow")) {
    const tom = addDays(ref, 1);
    const { date, hasTime } = applyTime(tom, timeOverride);
    return buildResult(date, hasTime, hasTime ? "assumed" : "exact");
  }

  // "end of week" / "by friday"
  if (text === "end of week" || text === "by friday" || text === "by end of week") {
    const fri = getNextDayOfWeek(ref, 5);
    const { date } = applyTime(fri, FRIDAY_DEFAULT);
    return buildResult(date, true, "assumed");
  }

  // "next week"
  if (text === "next week") {
    const mon = getNextDayOfWeek(ref, 1);
    const { date } = applyTime(mon, WEEKDAY_DEFAULT);
    return buildResult(date, true, "assumed");
  }

  // Day names: "monday", "next monday", "this friday", etc.
  for (const [dayName, dayIdx] of Object.entries(DAY_MAP)) {
    if (text === dayName || text === `next ${dayName}` || text === `this ${dayName}`) {
      const target = getNextDayOfWeek(ref, dayIdx);
      const isWeekend = dayIdx === 0 || dayIdx === 6;
      const defaultTime = isWeekend ? WEEKEND_DEFAULT : (dayIdx === 5 ? FRIDAY_DEFAULT : WEEKDAY_DEFAULT);
      const { date } = applyTime(target, hasExplicitTime ? timeOverride : defaultTime);
      return buildResult(date, true, "assumed");
    }
  }

  // DD/MM/YYYY
  const slashMatch = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const d = new Date(+slashMatch[3], +slashMatch[2] - 1, +slashMatch[1]);
    if (!isNaN(d.getTime())) {
      const { date, hasTime } = applyTime(d, timeOverride);
      return buildResult(date, hasTime, hasTime ? "assumed" : "exact");
    }
  }

  // "27 Feb", "Feb 27", "February 27" (no year — assume current/next occurrence)
  const monthDayMatch = text.match(/^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*$/i)
    || text.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})$/i);
  if (monthDayMatch) {
    const natural = new Date(`${text} ${ref.getFullYear()}`);
    if (!isNaN(natural.getTime())) {
      if (natural < ref) natural.setFullYear(ref.getFullYear() + 1);
      const { date, hasTime } = applyTime(natural, timeOverride);
      return buildResult(date, hasTime, hasTime ? "assumed" : "exact");
    }
  }

  // Try generic Date parse as fallback
  const generic = new Date(text);
  if (!isNaN(generic.getTime())) {
    const { date, hasTime } = applyTime(generic, timeOverride);
    return buildResult(date, hasTime, hasTime ? "assumed" : "exact");
  }

  return { display: rawText.trim(), iso: null, hasTime: false, confidence: "unresolved" };
}

export function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    const hasTime = !iso.endsWith("T00:00:00");
    const datePart = format(d, "EEE d MMM");
    if (!hasTime) return datePart;
    const timePart = format(d, "h:mmaaa");
    return `${datePart} · ${timePart}`;
  } catch {
    return iso;
  }
}

export function isToday(iso: string): boolean {
  try {
    return isTodayFns(parseISO(iso));
  } catch {
    return false;
  }
}

export function isOverdue(iso: string): boolean {
  try {
    const d = parseISO(iso);
    return d < new Date() && !isTodayFns(d);
  } catch {
    return false;
  }
}

export { parseMeetingDate };
