import {
  BANK_INFO,
  BANK_PATTERNS,
  parseAmount,
  parseDate,
  detectBankFromContent,
} from '../BankPatterns';

describe('BankPatterns', () => {
  describe('BANK_INFO', () => {
    it('contains all supported Colombian banks', () => {
      expect(BANK_INFO).toHaveProperty('bancolombia');
      expect(BANK_INFO).toHaveProperty('davivienda');
      expect(BANK_INFO).toHaveProperty('bbva');
      expect(BANK_INFO).toHaveProperty('nequi');
      expect(BANK_INFO).toHaveProperty('daviplata');
      expect(BANK_INFO).toHaveProperty('bancoomeva');
    });

    it('each bank has required properties', () => {
      Object.values(BANK_INFO).forEach((bank) => {
        expect(bank).toHaveProperty('code');
        expect(bank).toHaveProperty('name');
      });
    });
  });

  describe('BANK_PATTERNS', () => {
    it('contains patterns for all banks', () => {
      Object.keys(BANK_INFO).forEach((bankCode) => {
        expect(BANK_PATTERNS).toHaveProperty(bankCode);
        expect(Array.isArray(BANK_PATTERNS[bankCode as keyof typeof BANK_PATTERNS])).toBe(true);
      });
    });

    it('established banks have expense, income, and transfer patterns', () => {
      const establishedBanks = ['bancolombia', 'davivienda', 'bbva', 'nequi', 'daviplata'] as const;
      establishedBanks.forEach((bankCode) => {
        const patterns = BANK_PATTERNS[bankCode];
        const types = patterns.map((p) => p.type);
        expect(types).toContain('expense');
        expect(types).toContain('income');
        expect(types).toContain('transfer_out');
      });
    });

    it('bancoomeva has at least expense patterns', () => {
      const patterns = BANK_PATTERNS.bancoomeva;
      const types = patterns.map((p) => p.type);
      expect(types).toContain('expense');
    });
  });

  describe('parseAmount', () => {
    it('parses Colombian peso amounts without symbols', () => {
      expect(parseAmount('50000')).toBe(50000);
      expect(parseAmount('1000000')).toBe(1000000);
    });

    it('parses amounts with $ symbol', () => {
      expect(parseAmount('$50000')).toBe(50000);
      expect(parseAmount('$1000000')).toBe(1000000);
    });

    it('parses amounts with thousand separators (dots)', () => {
      expect(parseAmount('50.000')).toBe(50000);
      expect(parseAmount('1.000.000')).toBe(1000000);
      expect(parseAmount('$1.500.000')).toBe(1500000);
    });

    it('parses amounts with comma separators', () => {
      expect(parseAmount('50,000')).toBe(50000);
      expect(parseAmount('1,000,000')).toBe(1000000);
    });

    it('returns 0 for invalid amounts', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('abc')).toBe(0);
    });
  });

  describe('parseDate', () => {
    it('parses date in DD/MM/YYYY format', () => {
      const date = parseDate('15/03/2024');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(2);
      expect(date.getFullYear()).toBe(2024);
    });

    it('parses date with time', () => {
      const date = parseDate('15/03/2024', '14:30');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(2);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
    });

    it('returns current date when dateStr is undefined', () => {
      const now = new Date();
      const date = parseDate(undefined);
      expect(date.getDate()).toBe(now.getDate());
    });
  });

  describe('detectBankFromContent', () => {
    it('detects Bancolombia from message content', () => {
      const sms = 'Bancolombia le informa compra por $50.000 en EXITO. Saldo: $500.000';
      expect(detectBankFromContent(sms)?.code).toBe('bancolombia');
    });

    it('detects Bancolombia from Compraste format', () => {
      const sms =
        'Bancolombia: Compraste COP14.580,00 en DLO*Didi con tu T.Cred *1194, el 17/01/2026 a las 16:38.';
      expect(detectBankFromContent(sms)?.code).toBe('bancolombia');
    });

    it('detects Nequi from message content', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $75.000';
      expect(detectBankFromContent(sms)?.code).toBe('nequi');
    });

    it('detects Daviplata from message content', () => {
      const sms = 'DaviPlata: Pago $15.000 en TIENDA. Saldo: $35.000';
      expect(detectBankFromContent(sms)?.code).toBe('daviplata');
    });

    it('detects Davivienda from message content', () => {
      const sms = 'Davivienda: compra por $80.000 en ALMACEN. Disponible: $420.000';
      expect(detectBankFromContent(sms)?.code).toBe('davivienda');
    });

    it('detects BBVA from message content', () => {
      const sms = 'BBVA: compra por $60.000 en SUPERMERCADO Cta. 1234. Disponible: $340.000';
      expect(detectBankFromContent(sms)?.code).toBe('bbva');
    });

    it('detects Bancoomeva from message content', () => {
      const sms =
        'Bancoomeva informa compra por Internet en DLO*Didi por $12,300.00 con su tarjeta Credito 2566 el 2026/01/17 8:25:07.';
      expect(detectBankFromContent(sms)?.code).toBe('bancoomeva');
    });

    it('returns null for non-bank messages', () => {
      expect(detectBankFromContent('Random message')).toBeNull();
      expect(detectBankFromContent('Your OTP is 123456')).toBeNull();
    });
  });

  describe('Bancolombia patterns', () => {
    const patterns = BANK_PATTERNS.bancolombia;

    it('matches purchase/payment messages', () => {
      const purchasePattern = patterns.find((p) => p.type === 'expense');
      expect(purchasePattern).toBeDefined();

      const sms =
        'Bancolombia le informa compra por $50.000 en EXITO 15/03/2024 14:30. T.*1234. Saldo: $500.000';
      const match = purchasePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });

    it('matches income messages', () => {
      const incomePattern = patterns.find((p) => p.type === 'income');
      expect(incomePattern).toBeDefined();

      const sms =
        'Bancolombia le informa transferencia recibida por $100.000 de JUAN PEREZ 15/03/2024. Cuenta *5678. Saldo: $600.000';
      const match = incomePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });

    it('matches Compraste COP format (credit card)', () => {
      const sms =
        'Bancolombia: Compraste COP14.580,00 en DLO*Didi con tu T.Cred *1194, el 17/01/2026 a las 16:38. Si tienes dudas, encuentranos aqui: 6045109095 o 018000931987. Estamos cerca.';
      const matched = patterns.some((p) => p.pattern.test(sms));
      expect(matched).toBe(true);
    });

    it('extracts correct data from Compraste COP format', () => {
      const sms =
        'Bancolombia: Compraste COP22.800,00 en DLO*Didi con tu T.Cred *1194, el 17/01/2026 a las 17:40.';
      const pattern = patterns.find((p) => p.pattern.test(sms));
      expect(pattern).toBeDefined();
      expect(pattern!.type).toBe('expense');

      const match = pattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
      expect(parseAmount(match![pattern!.groups.amount]!)).toBe(22800);
    });
  });

  describe('Nequi patterns', () => {
    const patterns = BANK_PATTERNS.nequi;

    it('matches payment messages', () => {
      const expensePattern = patterns.find((p) => p.type === 'expense');
      expect(expensePattern).toBeDefined();

      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $75.000';
      const match = expensePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });

    it('matches received transfer messages', () => {
      const incomePattern = patterns.find((p) => p.type === 'income');
      expect(incomePattern).toBeDefined();

      const sms = 'Nequi: Recibiste $50.000 de Maria Garcia. Disponible: $125.000';
      const match = incomePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });
  });

  describe('Daviplata patterns', () => {
    const patterns = BANK_PATTERNS.daviplata;

    it('matches payment messages', () => {
      const expensePattern = patterns.find((p) => p.type === 'expense');
      expect(expensePattern).toBeDefined();

      const sms = 'DaviPlata: Pago $15.000 en TIENDA. Saldo: $35.000';
      const match = expensePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });

    it('matches received messages', () => {
      const incomePattern = patterns.find((p) => p.type === 'income');
      expect(incomePattern).toBeDefined();

      const sms = 'DaviPlata: Recibiste $20.000 de Pedro Lopez. Disponible: $55.000';
      const match = incomePattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
    });
  });

  describe('Bancoomeva patterns', () => {
    const patterns = BANK_PATTERNS.bancoomeva;

    it('matches internet purchase with single-digit hour time', () => {
      const sms =
        'Bancoomeva informa compra por Internet en DLO*Didi Bogo por $12,300.00 con su tarjeta Credito 2566 el 2026/01/17 8:25:07. +Info al 3009109898 opc * 3.';
      const matched = patterns.some((p) => p.pattern.test(sms));
      expect(matched).toBe(true);
    });

    it('matches internet purchase with two-digit hour time', () => {
      const sms =
        'Bancoomeva informa compra por Internet en DLO*Platzi Colombia BOGO por $281,065.00 con su tarjeta Credito 2566 el 2026/01/18 8:06:03. +Info al 3009109898 opc * 3.';
      const matched = patterns.some((p) => p.pattern.test(sms));
      expect(matched).toBe(true);
    });

    it('extracts correct data from Bancoomeva messages', () => {
      const sms =
        'Bancoomeva informa compra por Internet en DLO*Didi Bogo por $12,300.00 con su tarjeta Credito 2566 el 2026/01/17 8:25:07.';
      const pattern = patterns.find((p) => p.pattern.test(sms));
      expect(pattern).toBeDefined();
      expect(pattern!.type).toBe('expense');

      const match = pattern!.pattern.exec(sms);
      expect(match).not.toBeNull();
      expect(match![pattern!.groups.merchant!]).toContain('DLO*Didi');
      expect(parseAmount(match![pattern!.groups.amount]!)).toBe(12300);
      expect(match![pattern!.groups.accountLast4!]).toBe('2566');
    });
  });
});
