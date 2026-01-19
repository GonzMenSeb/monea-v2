import { NequiParser } from '../NequiParser';

describe('NequiParser', () => {
  const parser = new NequiParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('nequi');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('Nequi');
    });
  });

  describe('payment (Pagaste/Compraste)', () => {
    const samples = [
      {
        description: 'payment at establishment',
        sms: 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000',
        expected: { type: 'expense', amount: 25000, merchant: 'RAPPI', balance: 175000 },
      },
      {
        description: 'payment with Disponible format',
        sms: 'Nequi: Pagaste $45.500 en UBER EATS. Disponible: $54.500',
        expected: { type: 'expense', amount: 45500, merchant: 'UBER EATS', balance: 54500 },
      },
      {
        description: 'purchase (Compraste) format',
        sms: 'Nequi: Compraste $89.900 en MERCADO LIBRE. Saldo: $110.100',
        expected: { type: 'expense', amount: 89900, merchant: 'MERCADO LIBRE', balance: 110100 },
      },
      {
        description: 'payment with asterisk prefix',
        sms: '*Nequi*: Pagaste $15.000 en SPOTIFY. Saldo: $85.000',
        expected: { type: 'expense', amount: 15000, merchant: 'SPOTIFY', balance: 85000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Nequi');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('payment without thousand separators (2024-2026 format)', () => {
    const samples = [
      {
        description: 'payment at bookstore',
        sms: 'Nequi: Pagaste $450300.00 en PANAMERICANA LIBRERIA .',
        expected: { type: 'expense', amount: 450300, merchant: 'PANAMERICANA LIBRERIA' },
      },
      {
        description: 'payment at restaurant',
        sms: 'Nequi: Pagaste $171209.00 en PARMESSANO REST DELICA.',
        expected: { type: 'expense', amount: 171209, merchant: 'PARMESSANO REST DELICA' },
      },
      {
        description: 'payment at Rappi',
        sms: 'Nequi: Pagaste $23490.00 en DLO Rappi CO PRO .',
        expected: { type: 'expense', amount: 23490, merchant: 'DLO Rappi CO PRO' },
      },
      {
        description: 'payment at Google Play',
        sms: 'Nequi: Pagaste $10560.00 en GOOGLE PLAY YOUTUBE D.',
        expected: { type: 'expense', amount: 10560, merchant: 'GOOGLE PLAY YOUTUBE D' },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, '85954');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
      }
    });
  });

  describe('withdrawal (Retiraste/Sacaste)', () => {
    it('parses withdrawal at ATM', () => {
      const sms = 'Nequi: Retiraste $100.000 en CAJERO SERVIBANCA. Saldo: $50.000';
      const result = parser.parse(sms, 'Nequi');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(100000);
      }
    });

    it('parses withdrawal with Sacaste format', () => {
      const sms = 'Nequi: Sacaste $200.000 en CORRESPONSAL EXITO. Disponible: $300.000';
      const result = parser.parse(sms, 'Nequi');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(200000);
        expect(result.balanceAfter).toBe(300000);
      }
    });
  });

  describe('money received (Recibiste/Te enviaron)', () => {
    const samples = [
      {
        description: 'received from person',
        sms: 'Nequi: Recibiste $50.000 de Maria Garcia. Disponible: $150.000',
        expected: { type: 'income', amount: 50000, balance: 150000 },
      },
      {
        description: 'Te enviaron format',
        sms: 'Nequi: Te enviaron $75.000 de Pedro Ramirez. Saldo: $225.000',
        expected: { type: 'income', amount: 75000, balance: 225000 },
      },
      {
        description: 'Te transfirieron format',
        sms: 'Nequi: Te transfirieron $120.000 de Carlos Lopez. Disponible: $320.000',
        expected: { type: 'income', amount: 120000, balance: 320000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Nequi');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('money sent (Enviaste/Transferiste)', () => {
    const samples = [
      {
        description: 'sent to person',
        sms: 'Nequi: Enviaste $30.000 a Pedro Lopez. Saldo: $70.000',
        expected: { type: 'transfer_out', amount: 30000, balance: 70000 },
      },
      {
        description: 'Transferiste format',
        sms: 'Nequi: Transferiste $100.000 a Ana Martinez. Disponible: $400.000',
        expected: { type: 'transfer_out', amount: 100000, balance: 400000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Nequi');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid Nequi message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for insufficient funds message', () => {
      const sms = 'Nequi: No te alcanzo para pagar $127000.00 en FLORIDA ETAPA 2 .';
      expect(parser.canParse(sms, '')).toBe(false);
    });

    it('returns false for non-Nequi message', () => {
      const sms =
        'Bancolombia le informa compra por $75.500 en RAPPI SAS. T.*1234. Saldo: $425.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
