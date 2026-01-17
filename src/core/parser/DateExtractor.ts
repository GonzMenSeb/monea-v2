export interface DateExtractionResult {
  value: Date;
  raw: string;
  formatted: string;
  hasTime: boolean;
}

const DATE_PATTERNS = {
  dmySlash: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
  dmyDash: /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
  dmyDot: /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/,
  ymdSlash: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  ymdDash: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  monthNameDmy: /^(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{2,4})$/i,
  monthNameMdy: /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?\s+(\d{1,2}),?\s+(\d{2,4})$/i,
};

const TIME_PATTERNS = {
  hhmm24: /^(\d{1,2}):(\d{2})$/,
  hhmmss24: /^(\d{1,2}):(\d{2}):(\d{2})$/,
  hhmm12: /^(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)$/i,
  hhmmss12: /^(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)$/i,
};

const MONTH_NAME_MAP: Record<string, number> = {
  ene: 0,
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  may: 4,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  septiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11,
};

function normalizeYear(year: number): number {
  if (year < 100) {
    return year >= 70 ? 1900 + year : 2000 + year;
  }
  return year;
}

function parseMonthName(monthStr: string): number {
  const normalized = monthStr.toLowerCase().replace('.', '');
  return MONTH_NAME_MAP[normalized] ?? -1;
}

function parseDatePart(dateStr: string): { day: number; month: number; year: number } | null {
  const trimmed = dateStr.trim();

  for (const [format, pattern] of Object.entries(DATE_PATTERNS)) {
    const match = pattern.exec(trimmed);
    if (!match) {
      continue;
    }

    if (format.startsWith('ymd')) {
      const year = normalizeYear(parseInt(match[1] ?? '0', 10));
      const month = parseInt(match[2] ?? '1', 10) - 1;
      const day = parseInt(match[3] ?? '1', 10);
      return { day, month, year };
    }

    if (format === 'monthNameDmy') {
      const day = parseInt(match[1] ?? '1', 10);
      const month = parseMonthName(match[2] ?? '');
      const year = normalizeYear(parseInt(match[3] ?? '0', 10));
      if (month === -1) {
        continue;
      }
      return { day, month, year };
    }

    if (format === 'monthNameMdy') {
      const month = parseMonthName(match[1] ?? '');
      const day = parseInt(match[2] ?? '1', 10);
      const year = normalizeYear(parseInt(match[3] ?? '0', 10));
      if (month === -1) {
        continue;
      }
      return { day, month, year };
    }

    const day = parseInt(match[1] ?? '1', 10);
    const month = parseInt(match[2] ?? '1', 10) - 1;
    const year = normalizeYear(parseInt(match[3] ?? '0', 10));
    return { day, month, year };
  }

  return null;
}

function parseTimePart(
  timeStr: string
): { hours: number; minutes: number; seconds: number } | null {
  const trimmed = timeStr.trim();

  for (const [format, pattern] of Object.entries(TIME_PATTERNS)) {
    const match = pattern.exec(trimmed);
    if (!match) {
      continue;
    }

    let hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const seconds = format.includes('ss') ? parseInt(match[3] ?? '0', 10) : 0;

    if (format.includes('12')) {
      const meridiem = format.includes('ss') ? (match[4] ?? '') : (match[3] ?? '');
      const isPM = /^p/i.test(meridiem);
      const isAM = /^a/i.test(meridiem);

      if (isPM && hours !== 12) {
        hours += 12;
      } else if (isAM && hours === 12) {
        hours = 0;
      }
    }

    return { hours, minutes, seconds };
  }

  return null;
}

function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 0 || month > 11) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }
  if (year < 1970 || year > 2100) {
    return false;
  }

  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

function isValidTime(hours: number, minutes: number, seconds: number): boolean {
  return (
    hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59
  );
}

function formatDateOutput(date: Date, hasTime: boolean): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  if (!hasTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function extractDate(
  dateStr: string | undefined,
  timeStr?: string
): DateExtractionResult | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const datePart = parseDatePart(dateStr);
  if (!datePart) {
    return null;
  }

  const { day, month, year } = datePart;
  if (!isValidDate(day, month, year)) {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let hasTime = false;

  if (timeStr && typeof timeStr === 'string') {
    const timePart = parseTimePart(timeStr);
    if (timePart && isValidTime(timePart.hours, timePart.minutes, timePart.seconds)) {
      hours = timePart.hours;
      minutes = timePart.minutes;
      seconds = timePart.seconds;
      hasTime = true;
    }
  }

  const value = new Date(year, month, day, hours, minutes, seconds);
  const raw = timeStr ? `${dateStr} ${timeStr}` : dateStr;

  return {
    value,
    raw,
    formatted: formatDateOutput(value, hasTime),
    hasTime,
  };
}

export function parseDate(dateStr: string | undefined, timeStr?: string): Date {
  const result = extractDate(dateStr, timeStr);
  return result?.value ?? new Date();
}

export function parseTimeOnly(
  timeStr: string
): { hours: number; minutes: number; seconds: number } | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const timePart = parseTimePart(timeStr);
  if (!timePart || !isValidTime(timePart.hours, timePart.minutes, timePart.seconds)) {
    return null;
  }

  return timePart;
}

export function isValidDateString(dateStr: string): boolean {
  if (!dateStr) {
    return false;
  }
  const result = parseDatePart(dateStr);
  if (!result) {
    return false;
  }
  return isValidDate(result.day, result.month, result.year);
}

export function isValidTimeString(timeStr: string): boolean {
  if (!timeStr) {
    return false;
  }
  const result = parseTimePart(timeStr);
  if (!result) {
    return false;
  }
  return isValidTime(result.hours, result.minutes, result.seconds);
}

export function formatCODate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCODateTime(date: Date): string {
  const dateStr = formatCODate(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}
