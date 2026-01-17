import {
  BANK_INFO,
  BANK_PATTERNS,
  parseAmount,
  parseDate,
  matchesSender,
  getBankBySender,
} from '../BankPatterns';

describe('BankPatterns', () => {
  describe('BANK_INFO', () => {
    it('contains all supported Colombian banks', () => {
      expect(BANK_INFO).toHaveProperty('bancolombia');
      expect(BANK_INFO).toHaveProperty('davivienda');
      expect(BANK_INFO).toHaveProperty('bbva');
      expect(BANK_INFO).toHaveProperty('nequi');
      expect(BANK_INFO).toHaveProperty('daviplata');
    });

    it('each bank has required properties', () => {
      Object.values(BANK_INFO).forEach((bank) => {
        expect(bank).toHaveProperty('code');
        expect(bank).toHaveProperty('name');
        expect(bank).toHaveProperty('senderPatterns');
        expect(Array.isArray(bank.senderPatterns)).toBe(true);
        expect(bank.senderPatterns.length).toBeGreaterThan(0);
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

    it('each bank has expense, income, and transfer patterns', () => {
      Object.values(BANK_PATTERNS).forEach((patterns) => {
        const types = patterns.map((p) => p.type);
        expect(types).toContain('expense');
        expect(types).toContain('income');
        expect(types).toContain('transfer_out');
      });
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

  describe('matchesSender', () => {
    it('matches Bancolombia sender patterns', () => {
      const bank = BANK_INFO.bancolombia;
      expect(matchesSender('Bancolombia', bank)).toBe(true);
      expect(matchesSender('BANCOLOMBIA', bank)).toBe(true);
      expect(matchesSender('891333', bank)).toBe(true);
      expect(matchesSender('85954', bank)).toBe(true);
    });

    it('matches Nequi sender patterns', () => {
      const bank = BANK_INFO.nequi;
      expect(matchesSender('Nequi', bank)).toBe(true);
      expect(matchesSender('NEQUI', bank)).toBe(true);
      expect(matchesSender('85432', bank)).toBe(true);
    });

    it('does not match unrelated senders', () => {
      const bank = BANK_INFO.bancolombia;
      expect(matchesSender('Davivienda', bank)).toBe(false);
      expect(matchesSender('12345', bank)).toBe(false);
    });
  });

  describe('getBankBySender', () => {
    it('returns correct bank for known senders', () => {
      expect(getBankBySender('Bancolombia')?.code).toBe('bancolombia');
      expect(getBankBySender('891333')?.code).toBe('bancolombia');
      expect(getBankBySender('Davivienda')?.code).toBe('davivienda');
      expect(getBankBySender('BBVA')?.code).toBe('bbva');
      expect(getBankBySender('Nequi')?.code).toBe('nequi');
      expect(getBankBySender('DaviPlata')?.code).toBe('daviplata');
    });

    it('returns null for unknown senders', () => {
      expect(getBankBySender('Unknown')).toBeNull();
      expect(getBankBySender('99999')).toBeNull();
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
});
