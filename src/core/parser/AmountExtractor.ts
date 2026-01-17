export interface AmountExtractionResult {
  value: number;
  raw: string;
  formatted: string;
}

const CURRENCY_SYMBOL_PATTERN = /^\s*\$?\s*/;
const THOUSANDS_SEPARATOR_PATTERN = /\./g;
const DECIMAL_SEPARATOR_PATTERN = /,/g;
const WHITESPACE_PATTERN = /\s+/g;
const COP_DECIMALS = 0;

function normalizeAmountString(input: string): string {
  return input.replace(WHITESPACE_PATTERN, '').replace(CURRENCY_SYMBOL_PATTERN, '');
}

function hasDecimalPart(normalized: string): boolean {
  const commaIndex = normalized.lastIndexOf(',');
  if (commaIndex === -1) {
    return false;
  }

  const afterComma = normalized.slice(commaIndex + 1);
  return afterComma.length <= 2 && /^\d+$/.test(afterComma);
}

function parseColombianFormat(normalized: string): number {
  if (hasDecimalPart(normalized)) {
    const withoutThousands = normalized.replace(THOUSANDS_SEPARATOR_PATTERN, '');
    const standardized = withoutThousands.replace(DECIMAL_SEPARATOR_PATTERN, '.');
    return parseFloat(standardized);
  }

  const withoutSeparators = normalized
    .replace(THOUSANDS_SEPARATOR_PATTERN, '')
    .replace(DECIMAL_SEPARATOR_PATTERN, '');

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

  const value = parseColombianFormat(normalized);

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
