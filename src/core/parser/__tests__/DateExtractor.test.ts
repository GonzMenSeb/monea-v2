import {
  extractDate,
  parseDate,
  parseTimeOnly,
  isValidDateString,
  isValidTimeString,
  formatCODate,
  formatCODateTime,
} from '../DateExtractor';

describe('DateExtractor', () => {
  describe('extractDate', () => {
    describe('DD/MM/YYYY format (Colombian standard)', () => {
      it('parses standard Colombian date format', () => {
        const result = extractDate('15/01/2024');
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getMonth()).toBe(0);
        expect(result?.value.getFullYear()).toBe(2024);
      });

      it('parses single-digit day and month', () => {
        const result = extractDate('5/3/2024');
        expect(result?.value.getDate()).toBe(5);
        expect(result?.value.getMonth()).toBe(2);
        expect(result?.value.getFullYear()).toBe(2024);
      });

      it('preserves raw input', () => {
        const result = extractDate('15/01/2024');
        expect(result?.raw).toBe('15/01/2024');
      });

      it('formats output consistently', () => {
        const result = extractDate('5/3/2024');
        expect(result?.formatted).toBe('05/03/2024');
      });
    });

    describe('DD-MM-YYYY format', () => {
      it('parses dash-separated dates', () => {
        const result = extractDate('15-01-2024');
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getMonth()).toBe(0);
        expect(result?.value.getFullYear()).toBe(2024);
      });
    });

    describe('DD.MM.YYYY format', () => {
      it('parses dot-separated dates', () => {
        const result = extractDate('15.01.2024');
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getMonth()).toBe(0);
        expect(result?.value.getFullYear()).toBe(2024);
      });
    });

    describe('YYYY-MM-DD format (ISO)', () => {
      it('parses ISO date format', () => {
        const result = extractDate('2024-01-15');
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getMonth()).toBe(0);
        expect(result?.value.getFullYear()).toBe(2024);
      });
    });

    describe('YYYY/MM/DD format', () => {
      it('parses slash-separated ISO-like dates', () => {
        const result = extractDate('2024/01/15');
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getMonth()).toBe(0);
        expect(result?.value.getFullYear()).toBe(2024);
      });
    });

    describe('two-digit year handling', () => {
      it('interprets years 00-69 as 2000s', () => {
        const result = extractDate('15/01/24');
        expect(result?.value.getFullYear()).toBe(2024);
      });

      it('interprets years 70-99 as 1900s', () => {
        const result = extractDate('15/01/95');
        expect(result?.value.getFullYear()).toBe(1995);
      });
    });

    describe('Spanish month names', () => {
      const monthTests = [
        { input: '15 ene 2024', month: 0 },
        { input: '15 feb 2024', month: 1 },
        { input: '15 mar 2024', month: 2 },
        { input: '15 abr 2024', month: 3 },
        { input: '15 may 2024', month: 4 },
        { input: '15 jun 2024', month: 5 },
        { input: '15 jul 2024', month: 6 },
        { input: '15 ago 2024', month: 7 },
        { input: '15 sep 2024', month: 8 },
        { input: '15 oct 2024', month: 9 },
        { input: '15 nov 2024', month: 10 },
        { input: '15 dic 2024', month: 11 },
      ];

      it.each(monthTests)('parses "$input" with month index $month', ({ input, month }) => {
        const result = extractDate(input);
        expect(result?.value.getMonth()).toBe(month);
        expect(result?.value.getDate()).toBe(15);
        expect(result?.value.getFullYear()).toBe(2024);
      });

      it('handles month abbreviation with dot', () => {
        const result = extractDate('15 ene. 2024');
        expect(result?.value.getMonth()).toBe(0);
      });

      it('is case-insensitive for month names', () => {
        const result = extractDate('15 ENE 2024');
        expect(result?.value.getMonth()).toBe(0);
      });
    });

    describe('with time', () => {
      it('parses date with 24-hour time', () => {
        const result = extractDate('15/01/2024', '14:30');
        expect(result?.value.getHours()).toBe(14);
        expect(result?.value.getMinutes()).toBe(30);
        expect(result?.hasTime).toBe(true);
      });

      it('parses date with time including seconds', () => {
        const result = extractDate('15/01/2024', '14:30:45');
        expect(result?.value.getHours()).toBe(14);
        expect(result?.value.getMinutes()).toBe(30);
        expect(result?.value.getSeconds()).toBe(45);
      });

      it('parses date with 12-hour time (PM)', () => {
        const result = extractDate('15/01/2024', '2:30 pm');
        expect(result?.value.getHours()).toBe(14);
        expect(result?.value.getMinutes()).toBe(30);
      });

      it('parses date with 12-hour time (AM)', () => {
        const result = extractDate('15/01/2024', '9:30 am');
        expect(result?.value.getHours()).toBe(9);
        expect(result?.value.getMinutes()).toBe(30);
      });

      it('handles 12:00 PM correctly (noon)', () => {
        const result = extractDate('15/01/2024', '12:00 pm');
        expect(result?.value.getHours()).toBe(12);
      });

      it('handles 12:00 AM correctly (midnight)', () => {
        const result = extractDate('15/01/2024', '12:00 am');
        expect(result?.value.getHours()).toBe(0);
      });

      it('handles a.m./p.m. format', () => {
        const result = extractDate('15/01/2024', '2:30 p.m.');
        expect(result?.value.getHours()).toBe(14);
      });

      it('combines date and time in raw output', () => {
        const result = extractDate('15/01/2024', '14:30');
        expect(result?.raw).toBe('15/01/2024 14:30');
      });

      it('includes time in formatted output when time is present', () => {
        const result = extractDate('15/01/2024', '14:30');
        expect(result?.formatted).toBe('15/01/2024 14:30');
      });
    });

    describe('invalid time handling', () => {
      it('ignores invalid time and returns date-only result', () => {
        const result = extractDate('15/01/2024', 'invalid');
        expect(result?.value.getHours()).toBe(0);
        expect(result?.hasTime).toBe(false);
      });

      it('ignores out-of-range time values', () => {
        const result = extractDate('15/01/2024', '25:00');
        expect(result?.hasTime).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns null for empty string', () => {
        expect(extractDate('')).toBeNull();
      });

      it('returns null for null input', () => {
        expect(extractDate(null as unknown as string)).toBeNull();
      });

      it('returns null for undefined input', () => {
        expect(extractDate(undefined)).toBeNull();
      });

      it('returns null for invalid date format', () => {
        expect(extractDate('not-a-date')).toBeNull();
      });

      it('returns null for invalid date values', () => {
        expect(extractDate('32/01/2024')).toBeNull();
        expect(extractDate('15/13/2024')).toBeNull();
        expect(extractDate('00/01/2024')).toBeNull();
      });

      it('handles whitespace around value', () => {
        const result = extractDate('  15/01/2024  ');
        expect(result?.value.getDate()).toBe(15);
      });

      it('validates February 29 in leap years', () => {
        expect(extractDate('29/02/2024')).not.toBeNull();
        expect(extractDate('29/02/2023')).toBeNull();
      });

      it('validates month-specific day limits', () => {
        expect(extractDate('31/01/2024')).not.toBeNull();
        expect(extractDate('31/04/2024')).toBeNull();
      });
    });
  });

  describe('parseDate', () => {
    it('returns Date object for valid input', () => {
      const result = parseDate('15/01/2024');
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('returns current date for invalid input', () => {
      const now = new Date();
      const result = parseDate('');
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getFullYear()).toBe(now.getFullYear());
    });

    it('returns current date for undefined input', () => {
      const now = new Date();
      const result = parseDate(undefined);
      expect(result.getDate()).toBe(now.getDate());
    });

    it('includes time when provided', () => {
      const result = parseDate('15/01/2024', '14:30');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('parseTimeOnly', () => {
    it('parses 24-hour time', () => {
      const result = parseTimeOnly('14:30');
      expect(result).toEqual({ hours: 14, minutes: 30, seconds: 0 });
    });

    it('parses time with seconds', () => {
      const result = parseTimeOnly('14:30:45');
      expect(result).toEqual({ hours: 14, minutes: 30, seconds: 45 });
    });

    it('parses 12-hour PM time', () => {
      const result = parseTimeOnly('2:30 pm');
      expect(result).toEqual({ hours: 14, minutes: 30, seconds: 0 });
    });

    it('parses 12-hour AM time', () => {
      const result = parseTimeOnly('9:30 am');
      expect(result).toEqual({ hours: 9, minutes: 30, seconds: 0 });
    });

    it('returns null for invalid time', () => {
      expect(parseTimeOnly('')).toBeNull();
      expect(parseTimeOnly('invalid')).toBeNull();
      expect(parseTimeOnly('25:00')).toBeNull();
      expect(parseTimeOnly('12:60')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseTimeOnly(null as unknown as string)).toBeNull();
    });
  });

  describe('isValidDateString', () => {
    it('returns true for valid dates', () => {
      expect(isValidDateString('15/01/2024')).toBe(true);
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('15 ene 2024')).toBe(true);
    });

    it('returns false for invalid dates', () => {
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('32/01/2024')).toBe(false);
    });
  });

  describe('isValidTimeString', () => {
    it('returns true for valid times', () => {
      expect(isValidTimeString('14:30')).toBe(true);
      expect(isValidTimeString('2:30 pm')).toBe(true);
      expect(isValidTimeString('00:00')).toBe(true);
      expect(isValidTimeString('23:59')).toBe(true);
    });

    it('returns false for invalid times', () => {
      expect(isValidTimeString('')).toBe(false);
      expect(isValidTimeString('25:00')).toBe(false);
      expect(isValidTimeString('12:60')).toBe(false);
      expect(isValidTimeString('invalid')).toBe(false);
    });
  });

  describe('formatCODate', () => {
    it('formats date in Colombian style', () => {
      const date = new Date(2024, 0, 15);
      expect(formatCODate(date)).toBe('15/01/2024');
    });

    it('pads single-digit day and month', () => {
      const date = new Date(2024, 2, 5);
      expect(formatCODate(date)).toBe('05/03/2024');
    });
  });

  describe('formatCODateTime', () => {
    it('formats date and time in Colombian style', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      expect(formatCODateTime(date)).toBe('15/01/2024 14:30');
    });

    it('pads single-digit hours and minutes', () => {
      const date = new Date(2024, 0, 15, 9, 5);
      expect(formatCODateTime(date)).toBe('15/01/2024 09:05');
    });
  });

  describe('real SMS date/time patterns', () => {
    const realPatterns = [
      {
        dateStr: '15/01/2024',
        timeStr: '14:30',
        expectedDate: 15,
        expectedMonth: 0,
        expectedHour: 14,
      },
      {
        dateStr: '01/12/2023',
        timeStr: '09:15',
        expectedDate: 1,
        expectedMonth: 11,
        expectedHour: 9,
      },
      {
        dateStr: '28/02/2024',
        timeStr: '23:59',
        expectedDate: 28,
        expectedMonth: 1,
        expectedHour: 23,
      },
      {
        dateStr: '31/12/2024',
        timeStr: undefined,
        expectedDate: 31,
        expectedMonth: 11,
        expectedHour: 0,
      },
    ];

    it.each(realPatterns)(
      'parses "$dateStr $timeStr" correctly',
      ({ dateStr, timeStr, expectedDate, expectedMonth, expectedHour }) => {
        const result = extractDate(dateStr, timeStr);
        expect(result?.value.getDate()).toBe(expectedDate);
        expect(result?.value.getMonth()).toBe(expectedMonth);
        expect(result?.value.getHours()).toBe(expectedHour);
      }
    );
  });
});
