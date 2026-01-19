import { BbvaParser } from '../BbvaParser';

describe('BbvaParser', () => {
  const parser = new BbvaParser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('bbva');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('BBVA');
    });
  });

  describe('purchase/payment', () => {
    it('parses purchase without account', () => {
      const sms = 'BBVA: compra por $45.000 en RESTAURANTE. Disponible: $455.000';
      const result = parser.parse(sms, 'BBVA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(45000);
        expect(result.balanceAfter).toBe(455000);
      }
    });
  });

  describe('withdrawal', () => {
    it('parses ATM withdrawal', () => {
      const sms = 'BBVA: retiro por $250.000 en CAJERO. Saldo: $750.000';
      const result = parser.parse(sms, 'BBVA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBe(250000);
      }
    });
  });

  describe('transfer received', () => {
    it('parses transfer received', () => {
      const sms = 'BBVA: transferencia recibida por $600.000 de EMPRESA TECH. Saldo: $1.600.000';
      const result = parser.parse(sms, 'BBVA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('income');
        expect(result.amount).toBe(600000);
        expect(result.balanceAfter).toBe(1600000);
      }
    });

    it('parses abono format', () => {
      const sms = 'BBVA: abono por $2.500.000 de NOMINA. Disponible: $3.000.000';
      const result = parser.parse(sms, 'BBVA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('income');
        expect(result.amount).toBe(2500000);
        expect(result.balanceAfter).toBe(3000000);
      }
    });
  });

  describe('transfer sent', () => {
    it('parses outgoing transfer', () => {
      const sms = 'BBVA: transferencia enviada por $350.000 a PROVEEDOR SAS. Saldo: $650.000';
      const result = parser.parse(sms, 'BBVA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('transfer_out');
        expect(result.amount).toBe(350000);
        expect(result.balanceAfter).toBe(650000);
      }
    });
  });

  describe('canParse', () => {
    it('returns true for valid BBVA message', () => {
      const sms = 'BBVA: compra por $45.000 en RESTAURANTE. Disponible: $455.000';
      expect(parser.canParse(sms, '')).toBe(true);
    });

    it('returns false for non-BBVA message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $175.000';
      expect(parser.canParse(sms, '')).toBe(false);
    });
  });
});
