import { DaviplataParser } from '../DaviplataParser';

describe('DaviplataParser', () => {
  const parser = new DaviplataParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('daviplata');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('Daviplata');
    });
  });

  describe('payment/purchase', () => {
    const samples = [
      {
        description: 'payment at store',
        sms: 'DaviPlata: Pago $35.000 en OLIMPICA. Saldo: $65.000',
        expected: { type: 'expense', amount: 35000, merchant: 'OLIMPICA', balance: 65000 },
      },
      {
        description: 'Pago por format',
        sms: 'DaviPlata: Pago por $22.000 en TIENDA ARA. Disponible: $78.000',
        expected: { type: 'expense', amount: 22000, merchant: 'TIENDA ARA', balance: 78000 },
      },
      {
        description: 'Compra format',
        sms: 'DaviPlata: Compra $45.000 en ALKOSTO. Saldo: $155.000',
        expected: { type: 'expense', amount: 45000, merchant: 'ALKOSTO', balance: 155000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'DaviPlata');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('withdrawal', () => {
    it('parses withdrawal at ATM', () => {
      const sms = 'DaviPlata: Retiro $150.000 en CAJERO SERVIBANCA. Saldo: $50.000';
      const result = parser.parse(sms, 'DaviPlata');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(150000);
      }
    });

    it('parses withdrawal with por format', () => {
      const sms = 'DaviPlata: Retiro por $100.000 en CORRESPONSAL. Disponible: $200.000';
      const result = parser.parse(sms, 'DaviPlata');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(100000);
        expect(result.balanceAfter).toBe(200000);
      }
    });
  });

  describe('money received', () => {
    const samples = [
      {
        description: 'Recibiste from person',
        sms: 'DaviPlata: Recibiste $80.000 de Luis Hernandez. Disponible: $180.000',
        expected: { type: 'income', amount: 80000, balance: 180000 },
      },
      {
        description: 'Te enviaron format',
        sms: 'DaviPlata: Te enviaron $120.000 de Sandra Rojas. Saldo: $320.000',
        expected: { type: 'income', amount: 120000, balance: 320000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'DaviPlata');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('money sent', () => {
    const samples = [
      {
        description: 'Enviaste to person',
        sms: 'DaviPlata: Enviaste $50.000 a Jorge Mendez. Saldo: $150.000',
        expected: { type: 'transfer_out', amount: 50000, balance: 150000 },
      },
      {
        description: 'Transferiste format',
        sms: 'DaviPlata: Transferiste $75.000 a Carolina Diaz. Disponible: $125.000',
        expected: { type: 'transfer_out', amount: 75000, balance: 125000 },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'DaviPlata');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.balanceAfter).toBe(expected.balance);
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid Daviplata message', () => {
      const sms = 'DaviPlata: Pago $35.000 en OLIMPICA. Saldo: $65.000';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for non-Daviplata message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
