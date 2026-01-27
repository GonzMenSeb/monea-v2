import { PdfFileReader, PdfPasswordRequiredError, PdfInvalidPasswordError } from '../PdfFileReader';

jest.mock('pdf-parse', () => {
  const mockDestroy = jest.fn().mockResolvedValue(undefined);

  const mockGetText = jest.fn();

  class MockPDFParse {
    private options: { data?: Uint8Array; password?: string };

    constructor(options: { data?: Uint8Array; password?: string }) {
      this.options = options;
    }

    getText = mockGetText;
    destroy = mockDestroy;
  }

  class MockPasswordException extends Error {
    constructor(message = 'Password required') {
      super(message);
      this.name = 'PasswordException';
    }
  }

  return {
    PDFParse: MockPDFParse,
    PasswordException: MockPasswordException,
    __mockGetText: mockGetText,
    __mockDestroy: mockDestroy,
    __MockPasswordException: MockPasswordException,
  };
});

const pdfParseMock = jest.requireMock('pdf-parse');

describe('PdfFileReader', () => {
  let reader: PdfFileReader;

  beforeEach(() => {
    reader = new PdfFileReader();
    jest.clearAllMocks();
  });

  describe('canRead', () => {
    it('returns true for pdf file type', () => {
      expect(reader.canRead('pdf')).toBe(true);
    });

    it('returns false for xlsx file type', () => {
      expect(reader.canRead('xlsx')).toBe(false);
    });

    it('returns false for csv file type', () => {
      expect(reader.canRead('csv')).toBe(false);
    });
  });

  describe('supportedTypes', () => {
    it('only includes pdf', () => {
      expect(reader.supportedTypes).toEqual(['pdf']);
    });
  });

  describe('read', () => {
    it('reads basic PDF data and returns structured result', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [
          { num: 1, text: 'Header1\tHeader2\nValue1\tValue2' },
          { num: 2, text: 'Page2Line1\tData' },
        ],
        text: 'Header1\tHeader2\nValue1\tValue2\nPage2Line1\tData',
        total: 2,
      });

      const buffer = Buffer.from('fake pdf content');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets).toHaveLength(2);
      expect(result.sheets[0]!.name).toBe('Page 1');
      expect(result.sheets[0]!.rows).toEqual([
        ['Header1', 'Header2'],
        ['Value1', 'Value2'],
      ]);
      expect(result.sheets[1]!.name).toBe('Page 2');
      expect(result.sheets[1]!.rows).toEqual([['Page2Line1', 'Data']]);
    });

    it('returns correct metadata', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [
          { num: 1, text: 'Line1' },
          { num: 2, text: 'Line2' },
          { num: 3, text: 'Line3' },
        ],
        text: 'Line1\nLine2\nLine3',
        total: 3,
      });

      const buffer = Buffer.from('pdf content');
      const result = await reader.read(buffer, 'my-statement.pdf');

      expect(result.metadata.fileName).toBe('my-statement.pdf');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.fileSize).toBe(buffer.length);
      expect(result.metadata.sheetCount).toBe(3);
      expect(result.metadata.sheetNames).toEqual(['Page 1', 'Page 2', 'Page 3']);
    });

    it('calculates correct row and column counts', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'A\tB\tC\tD\nE\tF\nG\tH\tI' }],
        text: 'A\tB\tC\tD\nE\tF\nG\tH\tI',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rowCount).toBe(3);
      expect(result.sheets[0]!.columnCount).toBe(4);
    });

    it('normalizes empty strings and whitespace to null', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'A\t\tB\n  \tC\t   ' }],
        text: 'A\t\tB\n  \tC\t   ',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rows[0]).toEqual(['A', null, 'B']);
      expect(result.sheets[0]!.rows[1]).toEqual([null, 'C', null]);
    });

    it('trims whitespace from cell values', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: '  Padded  \tNormal\t  Left\nRight  \tBoth  ' }],
        text: '  Padded  \tNormal\t  Left\nRight  \tBoth  ',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rows[0]).toEqual(['Padded', 'Normal', 'Left']);
      expect(result.sheets[0]!.rows[1]).toEqual(['Right', 'Both']);
    });

    it('filters out empty rows', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'Data\n\n\t\t\nMore Data' }],
        text: 'Data\n\n\t\t\nMore Data',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rows).toEqual([['Data'], ['More Data']]);
      expect(result.sheets[0]!.rowCount).toBe(2);
    });

    it('handles empty pages', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [
          { num: 1, text: '' },
          { num: 2, text: 'Some content' },
        ],
        text: '\nSome content',
        total: 2,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rows).toEqual([]);
      expect(result.sheets[0]!.rowCount).toBe(0);
      expect(result.sheets[0]!.columnCount).toBe(0);
      expect(result.sheets[1]!.rows).toEqual([['Some content']]);
    });

    it('handles special characters', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'José García\tCafé & Restaurant\nAño 2024\tCompra ñoño' }],
        text: 'José García\tCafé & Restaurant\nAño 2024\tCompra ñoño',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      const result = await reader.read(buffer, 'test.pdf');

      expect(result.sheets[0]!.rows[0]).toEqual(['José García', 'Café & Restaurant']);
      expect(result.sheets[0]!.rows[1]).toEqual(['Año 2024', 'Compra ñoño']);
    });

    it('calls destroy on parser after successful read', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'Test' }],
        text: 'Test',
        total: 1,
      });

      const buffer = Buffer.from('pdf');
      await reader.read(buffer, 'test.pdf');

      expect(pdfParseMock.__mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('calls destroy on parser after error', async () => {
      pdfParseMock.__mockGetText.mockRejectedValue(new Error('Parse error'));

      const buffer = Buffer.from('pdf');

      await expect(reader.read(buffer, 'test.pdf')).rejects.toThrow('Parse error');
      expect(pdfParseMock.__mockDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('password-protected PDFs', () => {
    it('reads password-protected PDF with correct password', async () => {
      pdfParseMock.__mockGetText.mockResolvedValue({
        pages: [{ num: 1, text: 'Protected content' }],
        text: 'Protected content',
        total: 1,
      });

      const buffer = Buffer.from('encrypted pdf');
      const result = await reader.read(buffer, 'protected.pdf', 'secret123');

      expect(result.sheets[0]!.rows).toEqual([['Protected content']]);
    });

    it('throws PdfPasswordRequiredError when PDF requires password and none provided', async () => {
      pdfParseMock.__mockGetText.mockRejectedValue(
        new pdfParseMock.__MockPasswordException('Password required')
      );

      const buffer = Buffer.from('encrypted pdf');

      await expect(reader.read(buffer, 'protected.pdf')).rejects.toThrow(PdfPasswordRequiredError);
    });

    it('throws PdfInvalidPasswordError when wrong password provided', async () => {
      pdfParseMock.__mockGetText.mockRejectedValue(
        new pdfParseMock.__MockPasswordException('Incorrect password')
      );

      const buffer = Buffer.from('encrypted pdf');

      await expect(reader.read(buffer, 'protected.pdf', 'wrong')).rejects.toThrow(
        PdfInvalidPasswordError
      );
    });

    it('throws PdfPasswordRequiredError with correct error name', async () => {
      pdfParseMock.__mockGetText.mockRejectedValue(new pdfParseMock.__MockPasswordException());

      const buffer = Buffer.from('encrypted pdf');

      try {
        await reader.read(buffer, 'protected.pdf');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PdfPasswordRequiredError);
        expect((error as Error).name).toBe('PdfPasswordRequiredError');
      }
    });

    it('throws PdfInvalidPasswordError with correct error name', async () => {
      pdfParseMock.__mockGetText.mockRejectedValue(new pdfParseMock.__MockPasswordException());

      const buffer = Buffer.from('encrypted pdf');

      try {
        await reader.read(buffer, 'protected.pdf', 'wrong');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PdfInvalidPasswordError);
        expect((error as Error).name).toBe('PdfInvalidPasswordError');
      }
    });
  });

  describe('error handling', () => {
    it('propagates non-password errors', async () => {
      const customError = new Error('PDF is corrupted');
      pdfParseMock.__mockGetText.mockRejectedValue(customError);

      const buffer = Buffer.from('corrupted pdf');

      await expect(reader.read(buffer, 'bad.pdf')).rejects.toThrow('PDF is corrupted');
    });
  });
});
