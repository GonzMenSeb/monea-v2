import { extractAmount, formatCOP, isValidCOPAmount, parseAmount } from '../AmountExtractor';

describe('AmountExtractor', () => {
  describe('extractAmount', () => {
    describe('basic COP formats', () => {
      it('parses plain numbers', () => {
        expect(extractAmount('50000')?.value).toBe(50000);
      });

      it('parses with peso sign', () => {
        expect(extractAmount('$50000')?.value).toBe(50000);
      });

      it('parses with peso sign and space', () => {
        expect(extractAmount('$ 50000')?.value).toBe(50000);
      });

      it('parses with thousands separators (dots)', () => {
        expect(extractAmount('1.234.567')?.value).toBe(1234567);
      });

      it('parses with peso sign and thousands separators', () => {
        expect(extractAmount('$1.234.567')?.value).toBe(1234567);
      });

      it('parses common transaction amounts', () => {
        expect(extractAmount('$50.000')?.value).toBe(50000);
        expect(extractAmount('$150.000')?.value).toBe(150000);
        expect(extractAmount('$1.500.000')?.value).toBe(1500000);
      });
    });

    describe('decimal handling', () => {
      it('parses amounts with decimal centavos (comma)', () => {
        expect(extractAmount('50.000,50')?.value).toBe(50001);
      });

      it('parses small decimal amounts', () => {
        expect(extractAmount('1.234,99')?.value).toBe(1235);
      });

      it('rounds decimal values', () => {
        expect(extractAmount('100,49')?.value).toBe(100);
        expect(extractAmount('100,50')?.value).toBe(101);
      });
    });

    describe('edge cases', () => {
      it('returns null for empty string', () => {
        expect(extractAmount('')).toBeNull();
      });

      it('returns null for null input', () => {
        expect(extractAmount(null as unknown as string)).toBeNull();
      });

      it('returns null for undefined input', () => {
        expect(extractAmount(undefined as unknown as string)).toBeNull();
      });

      it('returns null for string with no digits', () => {
        expect(extractAmount('$')).toBeNull();
        expect(extractAmount('abc')).toBeNull();
      });

      it('handles whitespace around value', () => {
        expect(extractAmount('  $50.000  ')?.value).toBe(50000);
      });

      it('handles internal whitespace', () => {
        expect(extractAmount('$ 50 000')?.value).toBe(50000);
      });
    });

    describe('result structure', () => {
      it('returns complete extraction result', () => {
        const result = extractAmount('$1.234.567');
        expect(result).toEqual({
          value: 1234567,
          raw: '$1.234.567',
          formatted: '$1.234.567',
        });
      });

      it('preserves raw input', () => {
        const result = extractAmount('  $50.000  ');
        expect(result?.raw).toBe('  $50.000  ');
      });
    });
  });

  describe('parseAmount', () => {
    it('returns numeric value for valid input', () => {
      expect(parseAmount('$50.000')).toBe(50000);
    });

    it('returns 0 for invalid input', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('abc')).toBe(0);
    });

    it('handles all COP formats', () => {
      expect(parseAmount('1234567')).toBe(1234567);
      expect(parseAmount('$1.234.567')).toBe(1234567);
      expect(parseAmount('1.234.567,89')).toBe(1234568);
    });
  });

  describe('formatCOP', () => {
    it('formats with peso sign and thousands separators', () => {
      expect(formatCOP(50000)).toBe('$50.000');
    });

    it('formats large amounts', () => {
      expect(formatCOP(1234567)).toBe('$1.234.567');
    });

    it('formats small amounts', () => {
      expect(formatCOP(100)).toBe('$100');
    });

    it('formats zero', () => {
      expect(formatCOP(0)).toBe('$0');
    });

    it('rounds decimal input', () => {
      expect(formatCOP(50000.7)).toBe('$50.001');
    });
  });

  describe('isValidCOPAmount', () => {
    it('returns true for valid amounts', () => {
      expect(isValidCOPAmount('$50.000')).toBe(true);
      expect(isValidCOPAmount('1234567')).toBe(true);
    });

    it('returns false for invalid amounts', () => {
      expect(isValidCOPAmount('')).toBe(false);
      expect(isValidCOPAmount('abc')).toBe(false);
      expect(isValidCOPAmount('$')).toBe(false);
    });
  });

  describe('real SMS amount patterns', () => {
    const realPatterns = [
      { input: '50.000', expected: 50000 },
      { input: '$150.000', expected: 150000 },
      { input: '$1.234.567', expected: 1234567 },
      { input: '25.500,00', expected: 25500 },
      { input: '$3.500', expected: 3500 },
      { input: '999.999.999', expected: 999999999 },
      { input: '$10.000.000', expected: 10000000 },
    ];

    it.each(realPatterns)('parses "$input" as $expected', ({ input, expected }) => {
      expect(parseAmount(input)).toBe(expected);
    });
  });
});
