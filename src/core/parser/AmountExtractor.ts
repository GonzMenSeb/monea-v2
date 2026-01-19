export interface AmountExtractionResult {
  value: number;
  raw: string;
  formatted: string;
}

const CURRENCY_SYMBOL_PATTERN = /^\s*\$?\s*/;
const WHITESPACE_PATTERN = /\s+/g;
const COP_DECIMALS = 0;

function normalizeAmountString(input: string): string {
  return input.replace(WHITESPACE_PATTERN, '').replace(CURRENCY_SYMBOL_PATTERN, '');
}

function detectFormat(normalized: string): 'us' | 'european' | 'plain' {
  const lastDotIndex = normalized.lastIndexOf('.');
  const lastCommaIndex = normalized.lastIndexOf(',');

  if (lastDotIndex !== -1) {
    const afterDot = normalized.slice(lastDotIndex + 1);
    if (afterDot.length === 2 && /^\d{2}$/.test(afterDot)) {
      return 'us';
    }
  }

  if (lastCommaIndex !== -1) {
    const afterComma = normalized.slice(lastCommaIndex + 1);
    if (afterComma.length === 2 && /^\d{2}$/.test(afterComma)) {
      return 'european';
    }
  }

  return 'plain';
}

function parseAmountByFormat(normalized: string): number {
  const format = detectFormat(normalized);

  if (format === 'us') {
    const withoutCommas = normalized.replace(/,/g, '');
    return parseFloat(withoutCommas);
  }

  if (format === 'european') {
    const withoutDots = normalized.replace(/\./g, '');
    const standardized = withoutDots.replace(/,/g, '.');
    return parseFloat(standardized);
  }

  const withoutSeparators = normalized.replace(/[.,]/g, '');
  return parseInt(withoutSeparators, 10);
}

export function extractAmount(input: string): AmountExtractionResult | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = normalizeAmountString(input);

  if (!normalized || !/\d/.test(normalized)) {
    return null;
  }

  const value = parseAmountByFormat(normalized);

  if (isNaN(value) || !isFinite(value)) {
    return null;
  }

  const roundedValue = Math.round(value);

  return {
    value: roundedValue,
    raw: input,
    formatted: formatCOP(roundedValue),
  };
}

export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  return `$${rounded.toLocaleString('es-CO', {
    minimumFractionDigits: COP_DECIMALS,
    maximumFractionDigits: COP_DECIMALS,
  })}`;
}

export function parseAmount(amountStr: string): number {
  const result = extractAmount(amountStr);
  return result?.value ?? 0;
}

export function isValidCOPAmount(input: string): boolean {
  return extractAmount(input) !== null;
}
