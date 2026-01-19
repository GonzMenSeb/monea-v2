import { styled, Text, type GetProps } from 'tamagui';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';
type BodySize = 'sm' | 'md' | 'lg';
type CaptionSize = 'sm' | 'md';
type AmountType = 'income' | 'expense' | 'transfer' | 'neutral';

const HeadingText = styled(Text, {
  name: 'Heading',
  color: '$textPrimary',
  fontWeight: '700',

  variants: {
    level: {
      h1: {
        fontSize: '$9',
        lineHeight: '$9',
        letterSpacing: -1,
      },
      h2: {
        fontSize: '$8',
        lineHeight: '$8',
        letterSpacing: -0.5,
      },
      h3: {
        fontSize: '$7',
        lineHeight: '$7',
        fontWeight: '600',
      },
      h4: {
        fontSize: '$5',
        lineHeight: '$5',
        fontWeight: '600',
      },
    },
  } as const,

  defaultVariants: {
    level: 'h2',
  },
});

const BodyText = styled(Text, {
  name: 'Body',

  variants: {
    size: {
      sm: {
        fontSize: '$2',
        lineHeight: '$2',
      },
      md: {
        fontSize: '$3',
        lineHeight: '$3',
      },
      lg: {
        fontSize: '$4',
        lineHeight: '$4',
      },
    },
    muted: {
      true: {
        color: '$textSecondary',
      },
      false: {
        color: '$textPrimary',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    muted: false,
  },
});

const CaptionText = styled(Text, {
  name: 'Caption',

  variants: {
    size: {
      sm: {
        fontSize: '$1',
        lineHeight: '$1',
      },
      md: {
        fontSize: '$2',
        lineHeight: '$2',
      },
    },
    muted: {
      true: {
        color: '$textMuted',
      },
      false: {
        color: '$textSecondary',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    muted: true,
  },
});

const AmountText = styled(Text, {
  name: 'Amount',
  fontFamily: '$mono',
  fontWeight: '700',

  variants: {
    type: {
      income: {
        color: '$transactionIncome',
      },
      expense: {
        color: '$transactionExpense',
      },
      transfer: {
        color: '$transactionTransfer',
      },
      neutral: {
        color: '$textPrimary',
      },
    },
    size: {
      sm: {
        fontSize: '$2',
      },
      md: {
        fontSize: '$3',
      },
      lg: {
        fontSize: '$4',
      },
      xl: {
        fontSize: '$6',
      },
      '2xl': {
        fontSize: '$8',
      },
    },
  } as const,

  defaultVariants: {
    type: 'neutral',
    size: 'md',
  },
});

interface HeadingProps extends Omit<GetProps<typeof HeadingText>, 'level'> {
  level?: HeadingLevel;
  children: React.ReactNode;
}

interface BodyProps extends Omit<GetProps<typeof BodyText>, 'size' | 'muted'> {
  size?: BodySize;
  muted?: boolean;
  children: React.ReactNode;
}

interface CaptionProps extends Omit<GetProps<typeof CaptionText>, 'size' | 'muted'> {
  size?: CaptionSize;
  muted?: boolean;
  children: React.ReactNode;
}

interface AmountProps extends Omit<GetProps<typeof AmountText>, 'type'> {
  value: number;
  type?: AmountType;
  showSign?: boolean;
  currency?: string;
  locale?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function Heading({ level = 'h2', children, ...props }: HeadingProps): React.ReactElement {
  return (
    <HeadingText level={level} accessibilityRole="header" {...props}>
      {children}
    </HeadingText>
  );
}

export function Body({
  size = 'md',
  muted = false,
  children,
  ...props
}: BodyProps): React.ReactElement {
  return (
    <BodyText size={size} muted={muted} {...props}>
      {children}
    </BodyText>
  );
}

export function Caption({
  size = 'md',
  muted = true,
  children,
  ...props
}: CaptionProps): React.ReactElement {
  return (
    <CaptionText size={size} muted={muted} {...props}>
      {children}
    </CaptionText>
  );
}

export function Amount({
  value,
  type = 'neutral',
  showSign = false,
  currency = 'COP',
  locale = 'es-CO',
  size = 'md',
  ...props
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

  return (
    <AmountText
      type={type}
      size={size}
      accessibilityLabel={`${type !== 'neutral' ? type : ''} ${displayValue}`.trim()}
      {...props}
    >
      {displayValue}
    </AmountText>
  );
}

export const SectionTitle = styled(Text, {
  name: 'SectionTitle',
  color: '$textPrimary',
  fontSize: '$4',
  fontWeight: '600',
  marginBottom: '$3',
});

export const SectionSubtitle = styled(Text, {
  name: 'SectionSubtitle',
  color: '$textSecondary',
  fontSize: '$2',
});
