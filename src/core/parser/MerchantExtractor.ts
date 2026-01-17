export interface MerchantExtractionResult {
  value: string;
  raw: string;
  normalized: string;
  category?: MerchantCategory;
}

export type MerchantCategory =
  | 'supermarket'
  | 'restaurant'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'shopping'
  | 'transfer'
  | 'atm'
  | 'other';

const CATEGORY_PATTERNS: Array<{ category: MerchantCategory; patterns: RegExp[] }> = [
  {
    category: 'supermarket',
    patterns: [
      /exito/i,
      /carulla/i,
      /jumbo/i,
      /olimpica/i,
      /d1\b/i,
      /ara\b/i,
      /euro\s*supermercado/i,
      /super\s*inter/i,
      /alkosto/i,
      /makro/i,
      /precio/i,
    ],
  },
  {
    category: 'restaurant',
    patterns: [
      /restaurante?/i,
      /rest\./i,
      /rappi/i,
      /ifood/i,
      /domicilios/i,
      /mcdonald/i,
      /burger/i,
      /pizza/i,
      /kfc/i,
      /subway/i,
      /juan\s*valdez/i,
      /starbucks/i,
      /crepes/i,
      /wok/i,
      /frisby/i,
      /kokoriko/i,
    ],
  },
  {
    category: 'transport',
    patterns: [
      /uber/i,
      /didi/i,
      /beat/i,
      /cabify/i,
      /indriver/i,
      /taxi/i,
      /gasolina/i,
      /combustible/i,
      /terpel/i,
      /texaco/i,
      /mobil/i,
      /esso/i,
      /peaje/i,
      /transmilenio/i,
      /metro\s*(?:de\s*)?medell[ií]n/i,
      /sitp/i,
    ],
  },
  {
    category: 'utilities',
    patterns: [
      /epm/i,
      /codensa/i,
      /enel/i,
      /gas\s*natural/i,
      /vanti/i,
      /acueducto/i,
      /claro/i,
      /movistar/i,
      /tigo/i,
      /wom/i,
      /etb/i,
      /une/i,
      /directv/i,
    ],
  },
  {
    category: 'entertainment',
    patterns: [
      /netflix/i,
      /spotify/i,
      /disney/i,
      /hbo/i,
      /amazon\s*prime/i,
      /youtube/i,
      /cine/i,
      /procinal/i,
      /cineco?lo?mbia/i,
      /cinemark/i,
      /royal\s*films/i,
    ],
  },
  {
    category: 'health',
    patterns: [
      /droguer[ií]a/i,
      /farmacia/i,
      /la\s*rebaja/i,
      /colsubsidio/i,
      /cruz\s*verde/i,
      /copidrogas/i,
      /hospital/i,
      /cl[ií]nica/i,
      /consultorio/i,
      /eps/i,
      /salud/i,
    ],
  },
  {
    category: 'education',
    patterns: [
      /universidad/i,
      /colegio/i,
      /escuela/i,
      /instituto/i,
      /sena\b/i,
      /icetex/i,
      /librer[ií]a/i,
      /papeler[ií]a/i,
      /panamericana/i,
    ],
  },
  {
    category: 'shopping',
    patterns: [
      /falabella/i,
      /homecenter/i,
      /ripley/i,
      /ktronix/i,
      /zara/i,
      /h&m/i,
      /pull\s*&\s*bear/i,
      /bershka/i,
      /arturo\s*calle/i,
      /offcorss/i,
      /tennis/i,
      /adidas/i,
      /nike/i,
      /mercado\s*libre/i,
      /amazon/i,
      /linio/i,
    ],
  },
  {
    category: 'transfer',
    patterns: [
      /transferencia/i,
      /transfiya/i,
      /pse\b/i,
      /nequi/i,
      /daviplata/i,
      /movii/i,
      /rappipay/i,
    ],
  },
  {
    category: 'atm',
    patterns: [/cajero/i, /atm\b/i, /retiro/i, /efectivo/i],
  },
];

const NOISE_PATTERNS: RegExp[] = [
  /\bS\.?A\.?S?\.?\b/gi,
  /\bLTDA\.?\b/gi,
  /\bS\.?A\.?\b/gi,
  /\bCIA\.?\b/gi,
  /\bINC\.?\b/gi,
  /\bCORP\.?\b/gi,
  /\bNIT[\s:]*[\d-]+/gi,
  /\bCC[\s:]*[\d-]+/gi,
  /\bTEL[\s:.]*[\d-]+/gi,
  /\bCEL[\s:.]*[\d-]+/gi,
  /\*+/g,
  /\s+/g,
];

const TRIM_PATTERNS: RegExp[] = [/^[\s\-.*]+/, /[\s\-.*]+$/];

function removeNoise(input: string): string {
  let result = input;
  for (const pattern of NOISE_PATTERNS) {
    result = result.replace(pattern, ' ');
  }
  return result;
}

function trimSpecialChars(input: string): string {
  let result = input;
  for (const pattern of TRIM_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function capitalizeWords(input: string): string {
  return input
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.length === 0) {
        return '';
      }
      if (word.length <= 2 && !/^(de|el|la|en|y|a)$/.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function detectCategory(normalized: string): MerchantCategory | undefined {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return category;
      }
    }
  }
  return undefined;
}

export function extractMerchant(input: string | undefined): MerchantExtractionResult | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const withoutNoise = removeNoise(trimmed);
  const withoutSpecialChars = trimSpecialChars(withoutNoise);
  const normalized = normalizeWhitespace(withoutSpecialChars);

  if (!normalized || normalized.length < 2) {
    return null;
  }

  const capitalized = capitalizeWords(normalized);
  const category = detectCategory(normalized);

  return {
    value: capitalized,
    raw: input,
    normalized: capitalized,
    category,
  };
}

export function normalizeMerchant(input: string | undefined): string {
  const result = extractMerchant(input);
  return result?.normalized ?? '';
}

export function categorizeMerchant(input: string | undefined): MerchantCategory {
  const result = extractMerchant(input);
  return result?.category ?? 'other';
}

export function isKnownMerchant(input: string | undefined): boolean {
  const result = extractMerchant(input);
  return result?.category !== undefined;
}

export function extractDescription(sms: string): string | undefined {
  if (!sms || typeof sms !== 'string') {
    return undefined;
  }

  const descriptionPatterns = [
    /(?:concepto|descripcion|detalle|motivo)[\s:]+([^.\n]+)/i,
    /(?:ref(?:erencia)?|referencia)[\s:]+([A-Za-z0-9\s-]+)/i,
    /(?:por\s+concepto\s+de)[\s:]+([^.\n]+)/i,
  ];

  for (const pattern of descriptionPatterns) {
    const match = pattern.exec(sms);
    if (match?.[1]) {
      const description = match[1].trim();
      if (description.length >= 3) {
        return capitalizeWords(description);
      }
    }
  }

  return undefined;
}

export function extractReference(sms: string): string | undefined {
  if (!sms || typeof sms !== 'string') {
    return undefined;
  }

  const referencePatterns = [
    /(?:ref(?:erencia)?|ref\.?)[\s:]+([A-Za-z0-9]+)/i,
    /(?:comprobante|nro|num(?:ero)?)[\s:.]+([A-Za-z0-9]+)/i,
    /(?:aprobacion|aprobado)[\s:]+([A-Za-z0-9]+)/i,
  ];

  for (const pattern of referencePatterns) {
    const match = pattern.exec(sms);
    if (match?.[1]) {
      return match[1].trim().toUpperCase();
    }
  }

  return undefined;
}
