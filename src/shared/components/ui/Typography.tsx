import { Text, type TextProps } from 'react-native';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';
type BodySize = 'sm' | 'md' | 'lg';
type CaptionSize = 'sm' | 'md';
type AmountType = 'income' | 'expense' | 'transfer' | 'neutral';

interface HeadingProps extends TextProps {
  level?: HeadingLevel;
  children: React.ReactNode;
}

interface BodyProps extends TextProps {
  size?: BodySize;
  muted?: boolean;
  children: React.ReactNode;
}

interface CaptionProps extends TextProps {
  size?: CaptionSize;
  muted?: boolean;
  children: React.ReactNode;
}

interface AmountProps extends TextProps {
  value: number;
  type?: AmountType;
  showSign?: boolean;
  currency?: string;
  locale?: string;
}

const HEADING_STYLES: Record<HeadingLevel, string> = {
  h1: 'text-4xl font-bold text-text-primary leading-10',
  h2: 'text-3xl font-bold text-text-primary leading-9',
  h3: 'text-2xl font-semibold text-text-primary leading-8',
  h4: 'text-xl font-semibold text-text-primary leading-7',
};

const BODY_STYLES: Record<BodySize, string> = {
  sm: 'text-sm leading-5',
  md: 'text-base leading-6',
  lg: 'text-lg leading-7',
};

const CAPTION_STYLES: Record<CaptionSize, string> = {
  sm: 'text-2xs leading-3.5',
  md: 'text-xs leading-4',
};

const AMOUNT_TYPE_STYLES: Record<AmountType, string> = {
  income: 'text-transaction-income',
  expense: 'text-transaction-expense',
  transfer: 'text-transaction-transfer',
  neutral: 'text-text-primary',
};

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function Heading({
  level = 'h2',
  children,
  className,
  ...textProps
}: HeadingProps): React.ReactElement {
  const baseStyle = HEADING_STYLES[level];
  const combinedClassName = className ? `${baseStyle} ${className}` : baseStyle;

  return (
    <Text {...textProps} className={combinedClassName} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({
  size = 'md',
  muted = false,
  children,
  className,
  ...textProps
}: BodyProps): React.ReactElement {
  const baseStyle = BODY_STYLES[size];
  const colorStyle = muted ? 'text-text-secondary' : 'text-text-primary';
  const combinedClassName = className
    ? `${baseStyle} ${colorStyle} ${className}`
    : `${baseStyle} ${colorStyle}`;

  return (
    <Text {...textProps} className={combinedClassName}>
      {children}
    </Text>
  );
}

export function Caption({
  size = 'md',
  muted = true,
  children,
  className,
  ...textProps
}: CaptionProps): React.ReactElement {
  const baseStyle = CAPTION_STYLES[size];
  const colorStyle = muted ? 'text-text-muted' : 'text-text-secondary';
  const combinedClassName = className
    ? `${baseStyle} ${colorStyle} ${className}`
    : `${baseStyle} ${colorStyle}`;

  return (
    <Text {...textProps} className={combinedClassName}>
      {children}
    </Text>
  );
}

export function Amount({
  value,
  type = 'neutral',
  showSign = false,
  currency = 'COP',
  locale = 'es-CO',
  className,
  ...textProps
}: AmountProps): React.ReactElement {
  const absoluteValue = Math.abs(value);
  const formattedValue = formatCurrency(absoluteValue, currency, locale);

  let displayValue = formattedValue;
  if (showSign) {
    const sign = value >= 0 ? '+' : '-';
    displayValue = `${sign}${formattedValue}`;
  } else if (value < 0) {
    displayValue = `-${formattedValue}`;
  }

  const typeStyle = AMOUNT_TYPE_STYLES[type];
  const baseStyle = 'font-bold';
  const combinedClassName = className
    ? `${baseStyle} ${typeStyle} ${className}`
    : `${baseStyle} ${typeStyle}`;

  return (
    <Text
      {...textProps}
      className={combinedClassName}
      accessibilityLabel={`${type !== 'neutral' ? type : ''} ${displayValue}`.trim()}
    >
      {displayValue}
    </Text>
  );
}
