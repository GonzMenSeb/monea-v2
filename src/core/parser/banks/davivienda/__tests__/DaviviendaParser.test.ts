import { DaviviendaParser } from '../DaviviendaParser';

describe('DaviviendaParser', () => {
  const parser = new DaviviendaParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('davivienda');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('Davivienda');
    });
  });

  describe('purchase/payment', () => {
    const samples = [
      {
        description: 'payment format with Saldo',
        sms: 'Davivienda: pago por $55.000 en CLARO. Saldo: $445.000',
        expected: { type: 'expense', amount: 55000, balance: 445000 },
      },
      {
        description: 'purchase format',
        sms: 'Davivienda: compra $250.000 en HOMECENTER. Saldo: $750.000',
        expected: { type: 'expense', amount: 250000, balance: 750000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Davivienda');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('withdrawal', () => {
    it('parses ATM withdrawal', () => {
      const sms = 'Davivienda: retiro por $300.000 en CAJERO DAVIVIENDA. Saldo: $700.000';
      const result = parser.parse(sms, 'Davivienda');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(300000);
      }
    });
  });

  describe('transfer received', () => {
    const samples = [
      {
        description: 'transferencia recibida',
        sms: 'Davivienda: transferencia recibida por $400.000 de EMPRESA ABC. Saldo: $1.400.000',
        expected: { type: 'income', amount: 400000, balance: 1400000 },
      },
      {
        description: 'abono format',
        sms: 'Davivienda: abono por $1.000.000 de NOMINA SA. Disponible: $2.000.000',
        expected: { type: 'income', amount: 1000000, balance: 2000000 },
      },
      {
        description: 'consignacion format',
        sms: 'Davivienda: consignacion por $500.000 de EFECTY. Saldo: $1.500.000',
        expected: { type: 'income', amount: 500000, balance: 1500000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Davivienda');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('transfer sent', () => {
    it('parses outgoing transfer', () => {
      const sms = 'Davivienda: transferencia enviada por $200.000 a CARLOS GOMEZ. Saldo: $800.000';
      const result = parser.parse(sms, 'Davivienda');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('transfer_out');
        expect(result.amount).toBe(200000);
        expect(result.balanceAfter).toBe(800000);
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid Davivienda message', () => {
      const sms = 'Davivienda: pago por $55.000 en CLARO. Saldo: $445.000';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for non-Davivienda message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
