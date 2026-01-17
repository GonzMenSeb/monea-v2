import { TransactionParser } from '../TransactionParser';

describe('Real SMS Samples - Colombian Banks', () => {
  const parser = new TransactionParser();

  describe('Bancolombia', () => {
    const sender = 'Bancolombia';
    const senderCode = '891333';

    describe('purchase/payment (compra/pago)', () => {
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.merchant).toBe(expected.merchant);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });

      it('parses from numeric sender code 891333', () => {
        const sms =
          'Bancolombia le informa compra por $50.000 en CARULLA. T.*1234. Saldo: $200.000';
        const result = parser.parse(sms, senderCode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('bancolombia');
        }
      });

      it('parses from sender code 85954', () => {
        const sms = 'Bancolombia le informa compra por $30.000 en TIENDA. Saldo: $170.000';
        const result = parser.parse(sms, '85954');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('bancolombia');
        }
      });
    });

    describe('withdrawal (retiro)', () => {
      it('parses ATM withdrawal', () => {
        const sms = 'Bancolombia le informa retiro por $100.000 en ATM BANCOLOMBIA. Saldo: $900.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(100000);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });
    });

    describe('transfer sent (transferencia enviada)', () => {
      it('parses transfer to person (simple format)', () => {
        const sms =
          'Bancolombia le informa transferencia enviada por $300.000 a MARIA LOPEZ. Saldo: $700.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('transfer_out');
          expect(result.transaction.amount).toBe(300000);
          expect(result.transaction.balanceAfter).toBe(700000);
        }
      });
    });
  });

  describe('Nequi', () => {
    const sender = 'Nequi';
    const senderCode = '85432';

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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.merchant).toBe(expected.merchant);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });

      it('parses from numeric sender code 85432', () => {
        const sms = 'Nequi: Pagaste $30.000 en EXITO. Saldo: $70.000';
        const result = parser.parse(sms, senderCode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('nequi');
        }
      });
    });

    describe('withdrawal (Retiraste/Sacaste)', () => {
      it('parses withdrawal at ATM', () => {
        const sms = 'Nequi: Retiraste $100.000 en CAJERO SERVIBANCA. Saldo: $50.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(100000);
        }
      });

      it('parses withdrawal with Sacaste format', () => {
        const sms = 'Nequi: Sacaste $200.000 en CORRESPONSAL EXITO. Disponible: $300.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(200000);
          expect(result.transaction.balanceAfter).toBe(300000);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });
    });
  });

  describe('Davivienda', () => {
    const sender = 'Davivienda';
    const senderCode = '85327';

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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });

      it('parses from numeric sender code 85327', () => {
        const sms = 'Davivienda: compra por $80.000 en ALMACEN. Disponible: $420.000';
        const result = parser.parse(sms, senderCode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('davivienda');
        }
      });
    });

    describe('withdrawal', () => {
      it('parses ATM withdrawal', () => {
        const sms = 'Davivienda: retiro por $300.000 en CAJERO DAVIVIENDA. Saldo: $700.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(300000);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });
    });

    describe('transfer sent', () => {
      it('parses outgoing transfer', () => {
        const sms = 'Davivienda: transferencia enviada por $200.000 a CARLOS GOMEZ. Saldo: $800.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('transfer_out');
          expect(result.transaction.amount).toBe(200000);
          expect(result.transaction.balanceAfter).toBe(800000);
        }
      });
    });
  });

  describe('Daviplata', () => {
    const sender = 'DaviPlata';
    const senderCode = '85255';

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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.merchant).toBe(expected.merchant);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });

      it('parses from numeric sender code 85255', () => {
        const sms = 'DaviPlata: Pago $15.000 en TIENDA. Saldo: $85.000';
        const result = parser.parse(sms, senderCode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('daviplata');
        }
      });
    });

    describe('withdrawal', () => {
      it('parses withdrawal at ATM', () => {
        const sms = 'DaviPlata: Retiro $150.000 en CAJERO SERVIBANCA. Saldo: $50.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(150000);
        }
      });

      it('parses withdrawal with por format', () => {
        const sms = 'DaviPlata: Retiro por $100.000 en CORRESPONSAL. Disponible: $200.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(100000);
          expect(result.transaction.balanceAfter).toBe(200000);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
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
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe(expected.type);
          expect(result.transaction.amount).toBe(expected.amount);
          expect(result.transaction.balanceAfter).toBe(expected.balance);
        }
      });
    });
  });

  describe('BBVA', () => {
    const sender = 'BBVA';
    const senderCode = '87703';

    describe('purchase/payment', () => {
      it('parses purchase without account', () => {
        const sms = 'BBVA: compra por $45.000 en RESTAURANTE. Disponible: $455.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(45000);
          expect(result.transaction.balanceAfter).toBe(455000);
        }
      });

      it('parses from numeric sender code 87703', () => {
        const sms = 'BBVA: compra por $60.000 en SUPERMERCADO. Disponible: $340.000';
        const result = parser.parse(sms, senderCode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.bank.code).toBe('bbva');
        }
      });
    });

    describe('withdrawal', () => {
      it('parses ATM withdrawal', () => {
        const sms = 'BBVA: retiro por $250.000 en CAJERO. Saldo: $750.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('expense');
          expect(result.transaction.amount).toBe(250000);
        }
      });
    });

    describe('transfer received', () => {
      it('parses transfer received', () => {
        const sms = 'BBVA: transferencia recibida por $600.000 de EMPRESA TECH. Saldo: $1.600.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('income');
          expect(result.transaction.amount).toBe(600000);
          expect(result.transaction.balanceAfter).toBe(1600000);
        }
      });

      it('parses abono format', () => {
        const sms = 'BBVA: abono por $2.500.000 de NOMINA. Disponible: $3.000.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('income');
          expect(result.transaction.amount).toBe(2500000);
          expect(result.transaction.balanceAfter).toBe(3000000);
        }
      });
    });

    describe('transfer sent', () => {
      it('parses outgoing transfer', () => {
        const sms = 'BBVA: transferencia enviada por $350.000 a PROVEEDOR SAS. Saldo: $650.000';
        const result = parser.parse(sms, sender);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.type).toBe('transfer_out');
          expect(result.transaction.amount).toBe(350000);
          expect(result.transaction.balanceAfter).toBe(650000);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    describe('amount formats', () => {
      const amountCases = [
        { sms: 'Nequi: Pagaste $5.000 en TIENDA. Saldo: $95.000', amount: 5000 },
        { sms: 'Nequi: Pagaste $50.000 en TIENDA. Saldo: $950.000', amount: 50000 },
        { sms: 'Nequi: Pagaste $500.000 en TIENDA. Saldo: $9.500.000', amount: 500000 },
        { sms: 'Nequi: Pagaste $5.000.000 en TIENDA. Saldo: $95.000.000', amount: 5000000 },
      ];

      it.each(amountCases)('parses $amount correctly', ({ sms, amount }) => {
        const result = parser.parse(sms, 'Nequi');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.amount).toBe(amount);
        }
      });
    });

    describe('merchant name variations', () => {
      const merchantCases = [
        { merchant: 'EXITO', sms: 'Nequi: Pagaste $10.000 en EXITO. Saldo: $90.000' },
        { merchant: 'EXITO COLOMBIA', sms: 'Nequi: Pagaste $10.000 en EXITO COLOMBIA. Saldo: $90.000' },
        { merchant: 'RAPPI SAS', sms: 'Nequi: Pagaste $10.000 en RAPPI SAS. Saldo: $90.000' },
        { merchant: 'D1', sms: 'Nequi: Pagaste $10.000 en D1. Saldo: $90.000' },
        { merchant: 'CC SANTAFE', sms: 'Nequi: Pagaste $10.000 en CC SANTAFE. Saldo: $90.000' },
      ];

      it.each(merchantCases)('extracts merchant "$merchant"', ({ merchant, sms }) => {
        const result = parser.parse(sms, 'Nequi');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.transaction.merchant).toBe(merchant);
        }
      });
    });

    describe('balance format variations', () => {
      it('handles "Saldo:" prefix', () => {
        const sms = 'Nequi: Pagaste $10.000 en TIENDA. Saldo: $90.000';
        const result = parser.parse(sms, 'Nequi');
        expect(result.success && result.transaction.balanceAfter).toBe(90000);
      });

      it('handles "Disponible:" prefix', () => {
        const sms = 'Nequi: Pagaste $10.000 en TIENDA. Disponible: $90.000';
        const result = parser.parse(sms, 'Nequi');
        expect(result.success && result.transaction.balanceAfter).toBe(90000);
      });

      it('handles "Disp:" prefix', () => {
        const sms = 'Bancolombia le informa compra por $10.000 en TIENDA. Disp: $90.000';
        const result = parser.parse(sms, 'Bancolombia');
        expect(result.success && result.transaction.balanceAfter).toBe(90000);
      });
    });

    describe('case insensitivity', () => {
      it('parses lowercase sender', () => {
        const sms = 'Nequi: Pagaste $10.000 en TIENDA. Saldo: $90.000';
        const result = parser.parse(sms, 'nequi');
        expect(result.success).toBe(true);
      });

      it('parses uppercase sender', () => {
        const sms = 'Nequi: Pagaste $10.000 en TIENDA. Saldo: $90.000';
        const result = parser.parse(sms, 'NEQUI');
        expect(result.success).toBe(true);
      });

      it('parses mixed case sender', () => {
        const sms = 'Bancolombia le informa compra por $10.000 en TIENDA. Saldo: $90.000';
        const result = parser.parse(sms, 'BanColombia');
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Cases', () => {
    describe('unknown sender', () => {
      it('rejects messages from unknown senders', () => {
        const sms = 'Tu banco: Compra por $50.000 en TIENDA. Saldo: $450.000';
        const result = parser.parse(sms, 'UnknownBank');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Unknown sender');
        }
      });

      it('rejects messages from numeric unknown senders', () => {
        const sms = 'Banco: Compra por $50.000';
        const result = parser.parse(sms, '99999');
        expect(result.success).toBe(false);
      });
    });

    describe('unrecognized format', () => {
      it('rejects promotional messages', () => {
        const sms = 'Bancolombia: Aprovecha nuestras promociones especiales. Aplica TyC.';
        const result = parser.parse(sms, 'Bancolombia');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('not recognized');
        }
      });

      it('rejects security alerts', () => {
        const sms = 'Bancolombia: Por seguridad tu tarjeta ha sido bloqueada temporalmente.';
        const result = parser.parse(sms, 'Bancolombia');
        expect(result.success).toBe(false);
      });

      it('rejects OTP messages', () => {
        const sms = 'Bancolombia: Para autorizar la transaccion, ingresa el codigo 123456';
        const result = parser.parse(sms, 'Bancolombia');
        expect(result.success).toBe(false);
      });
    });

    describe('malformed messages', () => {
      it('handles empty SMS', () => {
        const result = parser.parse('', 'Bancolombia');
        expect(result.success).toBe(false);
      });

      it('handles whitespace-only SMS', () => {
        const result = parser.parse('   ', 'Bancolombia');
        expect(result.success).toBe(false);
      });

      it('preserves raw SMS in error response', () => {
        const sms = 'Some random text';
        const result = parser.parse(sms, 'Unknown');
        expect(result.rawSms).toBe(sms);
      });
    });
  });

  describe('Transaction Date Extraction', () => {
    it('uses current date when no date in message', () => {
      const sms = 'Nequi: Pagaste $25.000 en RAPPI. Saldo: $75.000';
      const result = parser.parse(sms, 'Nequi');
      expect(result.success).toBe(true);
      if (result.success) {
        const now = new Date();
        expect(result.transaction.transactionDate.getDate()).toBe(now.getDate());
      }
    });
  });

  describe('Account Number Extraction', () => {
    it('extracts account last 4 digits from Bancolombia T.* format', () => {
      const sms = 'Bancolombia le informa compra por $50.000 en EXITO. T.*4521. Saldo: $500.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.accountNumber).toBe('4521');
      }
    });

    it('extracts account last 4 digits from Bancolombia Cta.* format', () => {
      const sms = 'Bancolombia le informa retiro por $100.000 en CAJERO. Cta.*5678. Saldo: $900.000';
      const result = parser.parse(sms, 'Bancolombia');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.accountNumber).toBe('5678');
      }
    });
  });
});
