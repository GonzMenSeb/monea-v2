const DEFAULT_CURRENCY = 'COP';
const DEFAULT_LOCALE = 'es-CO';

export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  showSign?: boolean;
  useAbsoluteValue?: boolean;
}

export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    showSign = false,
    useAbsoluteValue = false,
  } = options;

  const value = useAbsoluteValue ? Math.abs(amount) : amount;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  if (showSign && amount > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

export function formatTime(date: Date, locale: string = DEFAULT_LOCALE): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateRelative(date: Date, locale: string = DEFAULT_LOCALE): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toDateString();
  if (dateStr === today.toDateString()) {
    return 'Today';
  }
  if (dateStr === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDateShort(date: Date, locale: string = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateLong(date: Date, locale: string = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getDateRangeForCurrentMonth(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}
