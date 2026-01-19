import { BANK_INFO } from '../BankPatterns';
import { TransactionParser, transactionParser } from '../TransactionParser';

describe('TransactionParser', () => {
  let parser: TransactionParser;

  beforeEach(() => {
    parser = new TransactionParser();
  });

  describe('canParse', () => {
    it('returns true for valid Bancolombia purchase message', () => {
      const sms =
        'Bancolombia le informa compra por $50.000 en EXITO 15/03/2024 14:30. T.*1234. Saldo: $500.000';
      expect(parser.canParse(sms)).toBe(true);
    });

    it('returns true for valid Nequi payment message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $75.000';
      expect(parser.canParse(sms)).toBe(true);
    });

    it('returns false for unrecognized message format', () => {
      const sms = 'Some random text that is not a transaction';
      expect(parser.canParse(sms)).toBe(false);
    });

    it('returns false for non-bank message', () => {
      const sms = 'Your OTP code is 123456';
      expect(parser.canParse(sms)).toBe(false);
    });
  });

  describe('parse - Bancolombia', () => {
    const sender = 'Bancolombia';

    it('parses purchase message successfully', () => {
      const sms = 'Bancolombia le informa compra por $50.000 en EXITO. Saldo: $500.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank.code).toBe('bancolombia');
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(50000);
        expect(result.transaction.merchant).toBe('EXITO');
        expect(result.transaction.balanceAfter).toBe(500000);
      }
    });

    it('parses income/transfer received message', () => {
      const sms =
        'Bancolombia le informa transferencia recibida por $100.000 de EMPRESA. Saldo: $600.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('income');
        expect(result.transaction.amount).toBe(100000);
        expect(result.transaction.balanceAfter).toBe(600000);
      }
    });

    it('parses withdrawal message', () => {
      const sms =
        'Bancolombia le informa retiro por $200.000 en CAJERO EXITO 15/03/2024 10:00. Cta.*1234. Saldo: $300.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(200000);
      }
    });

    it('parses outgoing transfer message', () => {
      const sms =
        'Bancolombia le informa transferencia enviada por $75.000 a MARIA LOPEZ 15/03/2024. Cuenta *9012. Saldo: $225.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('transfer_out');
        expect(result.transaction.amount).toBe(75000);
      }
    });
  });

  describe('parse - Nequi', () => {
    const sender = 'Nequi';

    it('parses payment message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $75.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank.code).toBe('nequi');
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(25000);
        expect(result.transaction.merchant).toBe('RAPPI');
        expect(result.transaction.balanceAfter).toBe(75000);
      }
    });

    it('parses received transfer message', () => {
      const sms = 'Nequi: Recibiste $50.000 de Maria Garcia. Disponible: $125.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('income');
        expect(result.transaction.amount).toBe(50000);
        expect(result.transaction.balanceAfter).toBe(125000);
      }
    });

    it('parses sent transfer message', () => {
      const sms = 'Nequi: Enviaste $30.000 a Pedro Lopez. Saldo: $45.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('transfer_out');
        expect(result.transaction.amount).toBe(30000);
      }
    });

    it('parses withdrawal message', () => {
      const sms = 'Nequi: Retiraste $100.000 en CAJERO SERVIBANCA. Saldo: $20.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(100000);
      }
    });
  });

  describe('parse - Daviplata', () => {
    const sender = 'DaviPlata';

    it('parses payment message', () => {
      const sms = 'DaviPlata: Pago $15.000 en TIENDA. Saldo: $35.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank.code).toBe('daviplata');
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(15000);
        expect(result.transaction.merchant).toBe('TIENDA');
      }
    });

    it('parses received transfer message', () => {
      const sms = 'DaviPlata: Recibiste $20.000 de Pedro Lopez. Disponible: $55.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('income');
        expect(result.transaction.amount).toBe(20000);
      }
    });
  });

  describe('parse - Davivienda', () => {
    const sender = 'Davivienda';

    it('parses purchase message', () => {
      const sms = 'Davivienda: compra por $80.000 en ALMACEN 15/03/2024. Disponible: $420.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank.code).toBe('davivienda');
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(80000);
      }
    });

    it('parses income message', () => {
      const sms = 'Davivienda: transferencia recibida por $150.000 de EMPRESA SA. Saldo: $570.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('income');
        expect(result.transaction.amount).toBe(150000);
      }
    });
  });

  describe('parse - BBVA', () => {
    const sender = 'BBVA';

    it('parses purchase message', () => {
      const sms =
        'BBVA: compra por $60.000 en SUPERMERCADO Cta. 1234 15/03/2024. Disponible: $340.000';
      const result = parser.parse(sms, sender);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank.code).toBe('bbva');
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBe(60000);
      }
    });
  });

  describe('parse - error cases', () => {
    it('returns error for non-bank message', () => {
      const sms = 'Some random message';
      const result = parser.parse(sms, 'Unknown');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No bank pattern matched');
        expect(result.rawSms).toBe(sms);
      }
    });

    it('preserves raw SMS in error response', () => {
      const sms = 'Random message content';
      const result = parser.parse(sms, 'Unknown');

      expect(result.success).toBe(false);
      expect(result.rawSms).toBe(sms);
    });
  });

  describe('exported singleton', () => {
    it('transactionParser is a TransactionParser instance', () => {
      expect(transactionParser).toBeInstanceOf(TransactionParser);
    });

    it('singleton can parse messages', () => {
      const sms = 'Nequi: Pagaste $10.000 en CAFETERIA. Saldo: $90.000';
      const result = transactionParser.parse(sms, 'Nequi');

      expect(result.success).toBe(true);
    });
  });

  describe('bank info in successful parse', () => {
    it('includes complete bank info in result', () => {
      const sms = 'Nequi: Pagaste $10.000 en CAFETERIA. Saldo: $90.000';
      const result = parser.parse(sms, 'Nequi');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.bank).toEqual(BANK_INFO.nequi);
        expect(result.bank.name).toBe('Nequi');
        expect(result.bank.code).toBe('nequi');
      }
    });
  });
});
