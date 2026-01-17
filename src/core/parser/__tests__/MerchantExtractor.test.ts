import {
  extractMerchant,
  normalizeMerchant,
  categorizeMerchant,
  isKnownMerchant,
  extractDescription,
  extractReference,
  type MerchantCategory,
} from '../MerchantExtractor';

describe('MerchantExtractor', () => {
  describe('extractMerchant', () => {
    describe('basic extraction', () => {
      it('extracts simple merchant name', () => {
        const result = extractMerchant('EXITO');
        expect(result?.value).toBe('Exito');
        expect(result?.raw).toBe('EXITO');
      });

      it('extracts multi-word merchant name', () => {
        const result = extractMerchant('EXITO COLOMBIA');
        expect(result?.value).toBe('Exito Colombia');
      });

      it('handles two-letter company suffixes', () => {
        const result = extractMerchant('RAPPI');
        expect(result?.value).toBe('Rappi');
      });

      it('handles single digit in merchant name', () => {
        const result = extractMerchant('TIENDA D1');
        expect(result?.value).toBe('Tienda D1');
      });
    });

    describe('noise removal', () => {
      it('removes S.A.S. suffix', () => {
        const result = extractMerchant('EMPRESA S.A.S.');
        expect(result?.value).toBe('Empresa');
      });

      it('removes LTDA suffix', () => {
        const result = extractMerchant('COMPAÑIA LTDA');
        expect(result?.value).toBe('Compañia');
      });

      it('removes S.A. suffix', () => {
        const result = extractMerchant('BANCO S.A.');
        expect(result?.value).toBe('Banco');
      });

      it('removes NIT information', () => {
        const result = extractMerchant('EMPRESA NIT 900123456-1');
        expect(result?.value).toBe('Empresa');
      });

      it('removes phone information', () => {
        const result = extractMerchant('TIENDA TEL 3001234567');
        expect(result?.value).toBe('Tienda');
      });

      it('removes multiple asterisks', () => {
        const result = extractMerchant('***EXITO***');
        expect(result?.value).toBe('Exito');
      });

      it('normalizes multiple spaces', () => {
        const result = extractMerchant('EXITO    COLOMBIA');
        expect(result?.value).toBe('Exito Colombia');
      });
    });

    describe('edge cases', () => {
      it('returns null for empty string', () => {
        expect(extractMerchant('')).toBeNull();
      });

      it('returns null for null input', () => {
        expect(extractMerchant(null as unknown as string)).toBeNull();
      });

      it('returns null for undefined input', () => {
        expect(extractMerchant(undefined)).toBeNull();
      });

      it('returns null for string with only spaces', () => {
        expect(extractMerchant('   ')).toBeNull();
      });

      it('returns null for single character after cleaning', () => {
        expect(extractMerchant('*')).toBeNull();
      });

      it('handles merchant name with leading/trailing spaces', () => {
        const result = extractMerchant('  EXITO  ');
        expect(result?.value).toBe('Exito');
      });

      it('handles merchant with special characters', () => {
        const result = extractMerchant('H&M');
        expect(result?.value).toBe('H&m');
      });
    });

    describe('result structure', () => {
      it('returns complete result object for supermarket', () => {
        const result = extractMerchant('EXITO COLOMBIA');
        expect(result).toEqual({
          value: 'Exito Colombia',
          raw: 'EXITO COLOMBIA',
          normalized: 'Exito Colombia',
          category: 'supermarket',
        });
      });

      it('includes category when merchant is recognized', () => {
        const result = extractMerchant('RAPPI');
        expect(result?.category).toBe('restaurant');
      });

      it('excludes category when merchant is not recognized', () => {
        const result = extractMerchant('TIENDA DESCONOCIDA');
        expect(result?.category).toBeUndefined();
      });
    });
  });

  describe('normalizeMerchant', () => {
    it('returns normalized string for valid input', () => {
      expect(normalizeMerchant('EXITO COLOMBIA')).toBe('Exito Colombia');
    });

    it('returns empty string for invalid input', () => {
      expect(normalizeMerchant('')).toBe('');
      expect(normalizeMerchant(undefined)).toBe('');
    });
  });

  describe('categorizeMerchant', () => {
    describe('supermarket category', () => {
      const supermarkets = [
        'EXITO',
        'CARULLA',
        'JUMBO',
        'OLIMPICA',
        'D1',
        'ARA',
        'ALKOSTO',
        'MAKRO',
      ];

      it.each(supermarkets)('categorizes "%s" as supermarket', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('supermarket');
      });
    });

    describe('restaurant category', () => {
      const restaurants = [
        'RAPPI',
        'MCDONALDS',
        'BURGER KING',
        'PIZZA HUT',
        'KFC',
        'SUBWAY',
        'JUAN VALDEZ',
        'STARBUCKS',
        'FRISBY',
        'KOKORIKO',
      ];

      it.each(restaurants)('categorizes "%s" as restaurant', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('restaurant');
      });
    });

    describe('transport category', () => {
      const transport = [
        'UBER',
        'DIDI',
        'BEAT',
        'CABIFY',
        'TAXI',
        'TERPEL',
        'TEXACO',
        'TRANSMILENIO',
      ];

      it.each(transport)('categorizes "%s" as transport', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('transport');
      });
    });

    describe('utilities category', () => {
      const utilities = ['EPM', 'CODENSA', 'ENEL', 'CLARO', 'MOVISTAR', 'TIGO', 'WOM', 'ETB'];

      it.each(utilities)('categorizes "%s" as utilities', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('utilities');
      });
    });

    describe('entertainment category', () => {
      const entertainment = [
        'NETFLIX',
        'SPOTIFY',
        'DISNEY',
        'HBO',
        'YOUTUBE',
        'CINEMARK',
        'PROCINAL',
      ];

      it.each(entertainment)('categorizes "%s" as entertainment', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('entertainment');
      });
    });

    describe('health category', () => {
      const health = [
        'DROGUERIA',
        'FARMACIA',
        'LA REBAJA',
        'CRUZ VERDE',
        'COLSUBSIDIO',
        'HOSPITAL',
      ];

      it.each(health)('categorizes "%s" as health', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('health');
      });
    });

    describe('education category', () => {
      const education = [
        'UNIVERSIDAD',
        'COLEGIO',
        'INSTITUTO',
        'ICETEX',
        'LIBRERIA',
        'PANAMERICANA',
      ];

      it.each(education)('categorizes "%s" as education', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('education');
      });
    });

    describe('shopping category', () => {
      const shopping = [
        'FALABELLA',
        'HOMECENTER',
        'KTRONIX',
        'ADIDAS',
        'NIKE',
        'MERCADO LIBRE',
        'AMAZON',
      ];

      it.each(shopping)('categorizes "%s" as shopping', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('shopping');
      });
    });

    describe('transfer category', () => {
      const transfers = ['TRANSFERENCIA', 'TRANSFIYA', 'PSE', 'NEQUI', 'DAVIPLATA'];

      it.each(transfers)('categorizes "%s" as transfer', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('transfer');
      });
    });

    describe('atm category', () => {
      const atms = ['CAJERO', 'ATM', 'RETIRO', 'EFECTIVO'];

      it.each(atms)('categorizes "%s" as atm', (merchant) => {
        expect(categorizeMerchant(merchant)).toBe('atm');
      });
    });

    describe('unknown merchants', () => {
      it('returns "other" for unknown merchant', () => {
        expect(categorizeMerchant('TIENDA DESCONOCIDA')).toBe('other');
      });

      it('returns "other" for invalid input', () => {
        expect(categorizeMerchant('')).toBe('other');
        expect(categorizeMerchant(undefined)).toBe('other');
      });
    });
  });

  describe('isKnownMerchant', () => {
    it('returns true for known merchants', () => {
      expect(isKnownMerchant('EXITO')).toBe(true);
      expect(isKnownMerchant('RAPPI')).toBe(true);
      expect(isKnownMerchant('UBER')).toBe(true);
    });

    it('returns false for unknown merchants', () => {
      expect(isKnownMerchant('TIENDA DESCONOCIDA')).toBe(false);
    });

    it('returns false for invalid input', () => {
      expect(isKnownMerchant('')).toBe(false);
      expect(isKnownMerchant(undefined)).toBe(false);
    });
  });

  describe('extractDescription', () => {
    describe('concepto patterns', () => {
      it('extracts description from "concepto:" pattern (capitalizes all words)', () => {
        const sms = 'Pago recibido concepto: Pago de arriendo mensual. Saldo disponible';
        const result = extractDescription(sms);
        expect(result).toBeDefined();
        expect(result?.toLowerCase()).toContain('pago');
        expect(result?.toLowerCase()).toContain('arriendo');
      });

      it('extracts description from "descripcion:" pattern', () => {
        const sms = 'Transferencia exitosa descripcion: Cuota carro. Ref: 12345';
        expect(extractDescription(sms)).toBe('Cuota Carro');
      });

      it('extracts description from "detalle:" pattern', () => {
        const sms = 'Pago procesado detalle: Servicios profesionales';
        expect(extractDescription(sms)).toBe('Servicios Profesionales');
      });
    });

    describe('edge cases', () => {
      it('returns undefined when no description found', () => {
        const sms = 'Pago exitoso por $50.000. Saldo: $100.000';
        expect(extractDescription(sms)).toBeUndefined();
      });

      it('returns undefined for empty string', () => {
        expect(extractDescription('')).toBeUndefined();
      });

      it('returns undefined for invalid input', () => {
        expect(extractDescription(null as unknown as string)).toBeUndefined();
      });

      it('ignores descriptions shorter than 3 characters', () => {
        const sms = 'Pago concepto: ab';
        expect(extractDescription(sms)).toBeUndefined();
      });
    });
  });

  describe('extractReference', () => {
    describe('reference patterns', () => {
      it('extracts reference from "Ref:" pattern', () => {
        const sms = 'Pago exitoso Ref: ABC123456. Saldo: $100.000';
        expect(extractReference(sms)).toBe('ABC123456');
      });

      it('extracts reference from "Referencia:" pattern', () => {
        const sms = 'Transferencia Referencia: TRF789012';
        expect(extractReference(sms)).toBe('TRF789012');
      });

      it('extracts reference from "Ref." pattern', () => {
        const sms = 'Compra exitosa Ref. XYZ999';
        expect(extractReference(sms)).toBe('XYZ999');
      });
    });

    describe('comprobante patterns', () => {
      it('extracts reference from "comprobante:" pattern', () => {
        const sms = 'Pago procesado comprobante: 1234567890';
        expect(extractReference(sms)).toBe('1234567890');
      });

      it('extracts reference from "nro:" pattern', () => {
        const sms = 'Transaccion aprobada nro: 9876543';
        expect(extractReference(sms)).toBe('9876543');
      });

      it('extracts reference from "numero:" pattern', () => {
        const sms = 'Compra realizada numero: COMP2024';
        expect(extractReference(sms)).toBe('COMP2024');
      });
    });

    describe('aprobacion patterns', () => {
      it('extracts reference from "aprobacion:" pattern', () => {
        const sms = 'Transaccion aprobacion: APR123';
        expect(extractReference(sms)).toBe('APR123');
      });

      it('extracts reference from "aprobado:" pattern', () => {
        const sms = 'Pago aprobado: OK999';
        expect(extractReference(sms)).toBe('OK999');
      });
    });

    describe('edge cases', () => {
      it('returns undefined when no reference found', () => {
        const sms = 'Pago exitoso por $50.000';
        expect(extractReference(sms)).toBeUndefined();
      });

      it('returns undefined for empty string', () => {
        expect(extractReference('')).toBeUndefined();
      });

      it('returns undefined for invalid input', () => {
        expect(extractReference(null as unknown as string)).toBeUndefined();
      });

      it('returns uppercase reference', () => {
        const sms = 'Compra Ref: abc123';
        expect(extractReference(sms)).toBe('ABC123');
      });
    });
  });

  describe('Colombian merchant recognition', () => {
    describe('supermarket chains', () => {
      const colombianSupermarkets: Array<{ name: string; category: MerchantCategory }> = [
        { name: 'EXITO', category: 'supermarket' },
        { name: 'EXITO EXPRESS', category: 'supermarket' },
        { name: 'CARULLA', category: 'supermarket' },
        { name: 'CARULLA FRESMARKET', category: 'supermarket' },
        { name: 'JUMBO', category: 'supermarket' },
        { name: 'METRO JUMBO', category: 'supermarket' },
        { name: 'OLIMPICA', category: 'supermarket' },
        { name: 'SAO OLIMPICA', category: 'supermarket' },
        { name: 'D1', category: 'supermarket' },
        { name: 'TIENDAS D1', category: 'supermarket' },
        { name: 'ARA', category: 'supermarket' },
        { name: 'SUPERMERCADOS ARA', category: 'supermarket' },
        { name: 'ALKOSTO', category: 'supermarket' },
        { name: 'MAKRO', category: 'supermarket' },
      ];

      it.each(colombianSupermarkets)('recognizes "$name" as $category', ({ name, category }) => {
        expect(categorizeMerchant(name)).toBe(category);
      });
    });

    describe('Colombian restaurant chains', () => {
      const colombianRestaurants: Array<{ name: string; category: MerchantCategory }> = [
        { name: 'JUAN VALDEZ', category: 'restaurant' },
        { name: 'CREPES Y WAFFLES', category: 'restaurant' },
        { name: 'FRISBY', category: 'restaurant' },
        { name: 'KOKORIKO', category: 'restaurant' },
        { name: 'WOK', category: 'restaurant' },
      ];

      it.each(colombianRestaurants)('recognizes "$name" as $category', ({ name, category }) => {
        expect(categorizeMerchant(name)).toBe(category);
      });
    });

    describe('Colombian utility companies', () => {
      const colombianUtilities: Array<{ name: string; category: MerchantCategory }> = [
        { name: 'EPM', category: 'utilities' },
        { name: 'EPM ENERGIA', category: 'utilities' },
        { name: 'CODENSA', category: 'utilities' },
        { name: 'ENEL', category: 'utilities' },
        { name: 'ENEL CODENSA', category: 'utilities' },
        { name: 'GAS NATURAL', category: 'utilities' },
        { name: 'VANTI', category: 'utilities' },
        { name: 'VANTI GAS', category: 'utilities' },
        { name: 'CLARO', category: 'utilities' },
        { name: 'MOVISTAR', category: 'utilities' },
        { name: 'TIGO', category: 'utilities' },
        { name: 'WOM', category: 'utilities' },
        { name: 'ETB', category: 'utilities' },
      ];

      it.each(colombianUtilities)('recognizes "$name" as $category', ({ name, category }) => {
        expect(categorizeMerchant(name)).toBe(category);
      });
    });

    describe('Colombian pharmacies', () => {
      const colombianPharmacies: Array<{ name: string; category: MerchantCategory }> = [
        { name: 'DROGUERIA LA REBAJA', category: 'health' },
        { name: 'LA REBAJA', category: 'health' },
        { name: 'CRUZ VERDE', category: 'health' },
        { name: 'DROGAS LA REBAJA', category: 'health' },
        { name: 'COLSUBSIDIO', category: 'health' },
        { name: 'DROGUERIA COLSUBSIDIO', category: 'health' },
      ];

      it.each(colombianPharmacies)('recognizes "$name" as $category', ({ name, category }) => {
        expect(categorizeMerchant(name)).toBe(category);
      });
    });
  });
});
