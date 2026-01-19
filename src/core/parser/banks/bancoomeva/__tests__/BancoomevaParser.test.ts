import { BancoomevaParser } from '../BancoomevaParser';

describe('BancoomevaParser', () => {
  const parser = new BancoomevaParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('bancoomeva');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('Bancoomeva');
    });
  });

  describe('internet purchase', () => {
    const samples = [
      {
        description: 'purchase at Didi',
        sms: 'Bancoomeva informa compra por Internet en DL*DIDI RIDES CO por $8,995.00 con su tarjeta Credito 2566 el 2026/01/07 13:12:29. +Info al 3009109898 opc * 3.',
        expected: {
          type: 'expense',
          amount: 8995,
          merchant: 'DL*DIDI RIDES CO',
          accountLast4: '2566',
        },
      },
      {
        description: 'purchase at Google YouTube',
        sms: 'Bancoomeva informa compra por Internet en DLO*GOOGLE YouTube Bogo por $20,900.00 con su tarjeta Credito 2566 el 2026/01/03 12:13:07. +Info al 3009109898 opc * 3.',
        expected: {
          type: 'expense',
          amount: 20900,
          merchant: 'DLO*GOOGLE YouTube Bogo',
          accountLast4: '2566',
        },
      },
      {
        description: 'purchase at Uber',
        sms: 'Bancoomeva informa compra por Internet en UBER RIDES Bogo por $34,510.00 con su tarjeta Credito 2566 el 2026/01/06 15:21:32. +Info al 3009109898 opc * 3.',
        expected: {
          type: 'expense',
          amount: 34510,
          merchant: 'UBER RIDES Bogo',
          accountLast4: '2566',
        },
      },
    ];

    it.each(samples)('$description', ({ sms, expected }) => {
      const result = parser.parse(sms, 'Bancoomeva');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe(expected.type);
        expect(result.amount).toBe(expected.amount);
        expect(result.merchant).toBe(expected.merchant);
        expect(result.accountNumber).toBe(expected.accountLast4);
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid Bancoomeva message', () => {
      const sms =
        'Bancoomeva informa compra por Internet en TIENDA por $10,000.00 con su tarjeta Credito 1234 el 2026/01/01 10:00:00.';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for rejected purchase message', () => {
      const sms =
        'Bancoomeva informa RECHAZO de compra por Internet 2026/01/07 20:57:39 por $10,305.00 en DLO*Didi Bogo con T.Credito +Info al 3009109898 opc * 3.';
      expect(parser.canParse(sms, '')).toBe(false);
    });

    it('returns false for non-Bancoomeva message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
