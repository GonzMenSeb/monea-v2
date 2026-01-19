import { BancolombiaParser } from '../BancolombiaParser';

describe('BancolombiaParser', () => {
  const parser = new BancolombiaParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('bancolombia');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('Bancolombia');
    });
  });

  describe('purchase/payment (compra/pago) - legacy format', () => {
    const samples = [
      {
        description: 'purchase without date (clean format)',
        sms: 'Bancolombia le informa compra por $75.500 en RAPPI SAS. T.*1234. Saldo: $425.000',
        expected: { type: 'expense', amount: 75500, merchant: 'RAPPI SAS', balance: 425000 },
      },
      {
        description: 'purchase with balance Disp format',
        sms: 'Bancolombia le informa compra por $1.500.000 en FALABELLA. Disp: $500.000',
        expected: { type: 'expense', amount: 1500000, merchant: 'FALABELLA', balance: 500000 },
      },
      {
        description: 'small amount purchase',
        sms: 'Bancolombia le informa compra por $5.000 en TIENDA D1. Saldo: $95.000',
        expected: { type: 'expense', amount: 5000, merchant: 'TIENDA D1', balance: 95000 },
      },
      {
        description: 'purchase at supermarket',
        sms: 'Bancolombia le informa compra por $150.000 en EXITO. T.*4521. Saldo: $1.250.000',
        expected: { type: 'expense', amount: 150000, merchant: 'EXITO', balance: 1250000 },
      },
      {
        description: 'payment (pago) at streaming service',
        sms: 'Bancolombia le informa pago por $89.900 en NETFLIX. T.*9876. Saldo: $335.100',
        expected: { type: 'expense', amount: 89900, merchant: 'NETFLIX', balance: 335100 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('withdrawal (retiro)', () => {
    it('parses ATM withdrawal', () => {
      const sms = 'Bancolombia le informa retiro por $100.000 en ATM BANCOLOMBIA. Saldo: $900.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(100000);
      }
    });
  });

  describe('transfer received (transferencia recibida)', () => {
    const samples = [
      {
        description: 'transfer from company (simple format)',
        sms: 'Bancolombia le informa transferencia recibida por $3.500.000 de EMPRESA XYZ SAS. Saldo: $4.000.000',
        expected: { type: 'income', amount: 3500000, balance: 4000000 },
      },
      {
        description: 'consignacion format',
        sms: 'Bancolombia le informa consignacion por $250.000 de EFECTY. Saldo: $750.000',
        expected: { type: 'income', amount: 250000, balance: 750000 },
      },
      {
        description: 'recepcion format',
        sms: 'Bancolombia le informa recepcion por $1.000.000 de NEQUI. Saldo: $2.000.000',
        expected: { type: 'income', amount: 1000000, balance: 2000000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('transfer sent (transferencia enviada)', () => {
    it('parses transfer to person (simple format)', () => {
      const sms =
        'Bancolombia le informa transferencia enviada por $300.000 a MARIA LOPEZ. Saldo: $700.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('transfer_out');
        expect(result.amount).toBe(300000);
        expect(result.balanceAfter).toBe(700000);
      }
    });
  });

  describe('credit card purchase with COP format (2024-2026)', () => {
    const samples = [
      {
        description: 'COP purchase at Didi',
        sms: 'Bancolombia: Compraste COP5.680,00 en DLO*Didi con tu T.Cred *1194, el 16/01/2026 a las 16:56. Si tienes dudas, encuentranos aqui: 6045109095 o 018000931987. Estamos cerca.',
        expected: { type: 'expense', amount: 5680, merchant: 'DLO*Didi', accountLast4: '1194' },
      },
      {
        description: 'COP purchase at Skechers',
        sms: 'Bancolombia: Compraste COP239.940,00 en SKECHERS VIVA ENVIGA con tu T.Cred *1194, el 14/01/2026 a las 19:07. Si tienes dudas, encuentranos aqui: 6045109095 o 018000931987. Estamos cerca.',
        expected: {
          type: 'expense',
          amount: 239940,
          merchant: 'SKECHERS VIVA ENVIGA',
          accountLast4: '1194',
        },
      },
      {
        description: 'COP purchase at DiDi Food',
        sms: 'Bancolombia: Compraste COP175.700,00 en DiDi CO Food con tu T.Cred *1194, el 15/01/2026 a las 18:13. Si tienes dudas, encuentranos aqui: 6045109095 o 018000931987. Estamos cerca.',
        expected: {
          type: 'expense',
          amount: 175700,
          merchant: 'DiDi CO Food',
          accountLast4: '1194',
        },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, '85540');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
        expect(result.accountNumber).toBe(expected.accountLast4);
      }
    });
  });

  describe('credit card purchase with USD format', () => {
    it('parses USD purchase (amount rounded to whole number)', () => {
      const sms =
        'Bancolombia: Compraste USD7,70 en OVHcloud con tu T.Cred *1194, el 16/01/2026 a las 07:15. Si tienes dudas, encuentranos aqui: 6045109095 o 018000931987. Estamos cerca.';
      const result = parser.parse(sms, '85540');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(8);
        expect(result.merchant).toBe('OVHcloud');
        expect(result.accountNumber).toBe('1194');
      }
    });
  });

  describe('transfer out (Transferiste format)', () => {
    const samples = [
      {
        description: 'transfer to account with comma thousands',
        sms: 'Bancolombia: Transferiste $66,000.00 desde tu cuenta 0810 a la cuenta *3052269855 el 14/11/2025 a las 10:09. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        expected: { type: 'transfer_out', amount: 66000, accountLast4: '0810' },
      },
      {
        description: 'transfer with different amount format',
        sms: 'Bancolombia: Transferiste $320,000 desde tu cuenta *0810 a la cuenta *00416448132 el 17/11/2025 a las 18:56. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        expected: { type: 'transfer_out', amount: 320000, accountLast4: '0810' },
      },
      {
        description: 'transfer by QR',
        sms: 'Bancolombia: Transferiste $30,300.00 por QR desde tu cuenta 0810 a la cuenta ALEMANA 274, el 2025/07/25 19:04. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        expected: { type: 'transfer_out', amount: 30300, accountLast4: '0810' },
      },
      {
        description: 'large transfer',
        sms: 'Bancolombia: Transferiste $1,500,000.00 desde tu cuenta *0810 a la cuenta *0000003052269855 el 15/05/2025 a las 11:03. ¿Dudas? Llamanos al 018000931987. Estamos cerca.',
        expected: { type: 'transfer_out', amount: 1500000, accountLast4: '0810' },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, '85540');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.accountNumber).toBe(expected.accountLast4);
      }
    });
  });

  describe('income received by QR (Recibiste por QR)', () => {
    it('parses QR received payment', () => {
      const sms =
        'Bancolombia: Recibiste $100,000.00 por QR de MARIA ELIZABETH GONZALEZ DIAZ en tu cuenta *0810 el 2025/05/05 a las 17:49. ¿Dudas? Llama al 018000931987. Estamos cerca.';
      const result = parser.parse(sms, '85784');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('income');
        expect(result.amount).toBe(100000);
        expect(result.merchant).toBe('MARIA ELIZABETH GONZALEZ DIAZ');
        expect(result.accountNumber).toBe('0810');
      }
    });
  });

  describe('payroll income (Nomina)', () => {
    it('parses payroll payment', () => {
      const sms =
        'Bancolombia: Recibiste un pago de Nomina de QUANTUM OUTSOUR por $1,595,260.00 en tu cuenta de Ahorros el 30/04/2025 a las 10:40. Si tienes dudas, llamanos al 018000931987. A tu lado siempre.';
      const result = parser.parse(sms, '85784');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('income');
        expect(result.amount).toBe(1595260);
        expect(result.merchant).toBe('QUANTUM OUTSOUR');
      }
    });
  });

  describe('account number extraction', () => {
    it('extracts account last 4 digits from T.* format', () => {
      const sms = 'Bancolombia le informa compra por $50.000 en EXITO. T.*4521. Saldo: $500.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.accountNumber).toBe('4521');
      }
    });

    it('extracts account last 4 digits from Cta.* format', () => {
      const sms =
        'Bancolombia le informa retiro por $100.000 en CAJERO. Cta.*5678. Saldo: $900.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.accountNumber).toBe('5678');
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid Bancolombia message', () => {
      const sms =
        'Bancolombia le informa compra por $75.500 en RAPPI SAS. T.*1234. Saldo: $425.000';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for promotional message', () => {
      const sms = 'Bancolombia: Aprovecha nuestras promociones especiales. Aplica TyC.';
      expect(parser.canParse(sms, '')).toBe(false);
    });

    it('returns false for non-Bancolombia message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
