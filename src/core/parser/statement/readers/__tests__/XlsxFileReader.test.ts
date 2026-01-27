import * as XLSX from 'xlsx';

import { XlsxFileReader } from '../XlsxFileReader';

describe('XlsxFileReader', () => {
  let reader: XlsxFileReader;

  beforeEach(() => {
    reader = new XlsxFileReader();
  });

  describe('canRead', () => {
    it('returns true for xlsx file type', () => {
      expect(reader.canRead('xlsx')).toBe(true);
    });

    it('returns false for pdf file type', () => {
      expect(reader.canRead('pdf')).toBe(false);
    });

    it('returns false for csv file type', () => {
      expect(reader.canRead('csv')).toBe(false);
    });
  });

  describe('supportedTypes', () => {
    it('only includes xlsx', () => {
      expect(reader.supportedTypes).toEqual(['xlsx']);
    });
  });

  describe('read', () => {
    const createTestWorkbook = (data: unknown[][]): Buffer => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TestSheet');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    };

    const createMultiSheetWorkbook = (sheets: Record<string, unknown[][]>): Buffer => {
      const workbook = XLSX.utils.book_new();
      Object.entries(sheets).forEach(([name, data]) => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      });
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    };

    it('reads basic xlsx data', async () => {
      const testData = [
        ['Header1', 'Header2', 'Header3'],
        ['Value1', 'Value2', 'Value3'],
        ['A', 'B', 'C'],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0]!.name).toBe('TestSheet');
      expect(result.sheets[0]!.rows).toEqual(testData);
    });

    it('returns correct metadata', async () => {
      const testData = [
        ['A', 'B'],
        ['C', 'D'],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'my-statement.xlsx');

      expect(result.metadata.fileName).toBe('my-statement.xlsx');
      expect(result.metadata.fileType).toBe('xlsx');
      expect(result.metadata.fileSize).toBe(buffer.length);
      expect(result.metadata.sheetCount).toBe(1);
      expect(result.metadata.sheetNames).toEqual(['TestSheet']);
    });

    it('handles multiple sheets', async () => {
      const buffer = createMultiSheetWorkbook({
        Sheet1: [['A1', 'B1']],
        Sheet2: [
          ['A2', 'B2'],
          ['C2', 'D2'],
        ],
        Sheet3: [['X', 'Y', 'Z']],
      });

      const result = await reader.read(buffer, 'multi.xlsx');

      expect(result.sheets).toHaveLength(3);
      expect(result.metadata.sheetCount).toBe(3);
      expect(result.metadata.sheetNames).toEqual(['Sheet1', 'Sheet2', 'Sheet3']);

      expect(result.sheets[0]!.name).toBe('Sheet1');
      expect(result.sheets[0]!.rowCount).toBe(1);
      expect(result.sheets[0]!.columnCount).toBe(2);

      expect(result.sheets[1]!.name).toBe('Sheet2');
      expect(result.sheets[1]!.rowCount).toBe(2);
      expect(result.sheets[1]!.columnCount).toBe(2);

      expect(result.sheets[2]!.name).toBe('Sheet3');
      expect(result.sheets[2]!.rowCount).toBe(1);
      expect(result.sheets[2]!.columnCount).toBe(3);
    });

    it('handles numeric values', async () => {
      const testData = [
        ['Amount', 'Balance'],
        [1000.5, 5000],
        [-200, 4800],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'numbers.xlsx');

      expect(result.sheets[0]!.rows[0]).toEqual(['Amount', 'Balance']);
      expect(result.sheets[0]!.rows[1]![0]).toBe('1000.5');
      expect(result.sheets[0]!.rows[1]![1]).toBe('5000');
      expect(result.sheets[0]!.rows[2]![0]).toBe('-200');
    });

    it('normalizes empty strings to null', async () => {
      const testData = [
        ['A', '', 'B'],
        ['C', '  ', 'D'],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.rows[0]).toEqual(['A', null, 'B']);
      expect(result.sheets[0]!.rows[1]).toEqual(['C', null, 'D']);
    });

    it('trims whitespace from strings', async () => {
      const testData = [
        ['  Padded  ', 'Normal', '  Left'],
        ['Right  ', '   ', 'Both  '],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.rows[0]).toEqual(['Padded', 'Normal', 'Left']);
      expect(result.sheets[0]!.rows[1]).toEqual(['Right', null, 'Both']);
    });

    it('handles null and undefined cells', async () => {
      const testData = [
        ['A', null, 'B'],
        [undefined, 'C', null],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.rows[0]).toEqual(['A', null, 'B']);
      expect(result.sheets[0]!.rows[1]).toEqual([null, 'C', null]);
    });

    it('calculates correct row and column counts', async () => {
      const testData = [
        ['A', 'B', 'C', 'D'],
        ['1', '2'],
        ['X', 'Y', 'Z'],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.rowCount).toBe(3);
      expect(result.sheets[0]!.columnCount).toBe(4);
    });

    it('handles empty sheets', async () => {
      const buffer = createMultiSheetWorkbook({
        Empty: [],
        NotEmpty: [['Data']],
      });

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.name).toBe('Empty');
      expect(result.sheets[0]!.rows).toEqual([]);
      expect(result.sheets[0]!.rowCount).toBe(0);
      expect(result.sheets[0]!.columnCount).toBe(0);

      expect(result.sheets[1]!.name).toBe('NotEmpty');
      expect(result.sheets[1]!.rows).toEqual([['Data']]);
    });

    it('handles boolean values', async () => {
      const testData = [
        ['Active', 'Verified'],
        [true, false],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'test.xlsx');

      expect(result.sheets[0]!.rows[1]).toEqual(['TRUE', 'FALSE']);
    });

    it('handles date values', async () => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Date', 'Description'],
        [new Date('2024-01-15'), 'Transaction 1'],
        [new Date('2024-12-31'), 'Transaction 2'],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dates');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const result = await reader.read(buffer, 'dates.xlsx');

      const row1 = result.sheets[0]!.rows[1];
      const row2 = result.sheets[0]!.rows[2];

      expect(typeof row1![0]).toBe('string');
      expect(typeof row2![0]).toBe('string');
      expect(row1![0]).toBeTruthy();
      expect(row2![0]).toBeTruthy();
    });

    it('handles special characters in cell values', async () => {
      const testData = [
        ['Name', 'Description'],
        ['José García', 'Café & Restaurant'],
        ['Año 2024', 'Compra ñoño'],
      ];
      const buffer = createTestWorkbook(testData);

      const result = await reader.read(buffer, 'special.xlsx');

      expect(result.sheets[0]!.rows[1]).toEqual(['José García', 'Café & Restaurant']);
      expect(result.sheets[0]!.rows[2]).toEqual(['Año 2024', 'Compra ñoño']);
    });
  });
});
