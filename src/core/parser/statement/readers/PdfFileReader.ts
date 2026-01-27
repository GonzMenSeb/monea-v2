import { PDFParse, PasswordException } from 'pdf-parse';

import type {
  FileReadMetadata,
  FileReadResult,
  FileReader,
  RawRow,
  SheetData,
  StatementFileType,
} from '../types';

export class PdfPasswordRequiredError extends Error {
  constructor(message = 'PDF requires password') {
    super(message);
    this.name = 'PdfPasswordRequiredError';
  }
}

export class PdfInvalidPasswordError extends Error {
  constructor(message = 'Invalid PDF password') {
    super(message);
    this.name = 'PdfInvalidPasswordError';
  }
}

export class PdfFileReader implements FileReader {
  readonly supportedTypes: StatementFileType[] = ['pdf'];

  canRead(fileType: StatementFileType): boolean {
    return this.supportedTypes.includes(fileType);
  }

  async read(data: Buffer, fileName: string, password?: string): Promise<FileReadResult> {
    const parser = new PDFParse({
      data: new Uint8Array(data),
      password,
    });

    try {
      const textResult = await parser.getText({
        pageJoiner: '',
        lineEnforce: true,
        cellSeparator: '\t',
      });

      const sheets = this.convertPagesToSheets(textResult.pages);
      const metadata = this.buildMetadata(fileName, data.length, textResult.total);

      return { metadata, sheets };
    } catch (error) {
      if (error instanceof PasswordException) {
        if (password) {
          throw new PdfInvalidPasswordError();
        }
        throw new PdfPasswordRequiredError();
      }
      throw error;
    } finally {
      await parser.destroy();
    }
  }

  private convertPagesToSheets(pages: Array<{ num: number; text: string }>): SheetData[] {
    return pages.map((page) => {
      const rows = this.textToRows(page.text);
      const dimensions = this.getSheetDimensions(rows);

      return {
        name: `Page ${page.num}`,
        rows,
        rowCount: dimensions.rowCount,
        columnCount: dimensions.columnCount,
      };
    });
  }

  private textToRows(text: string): RawRow[] {
    const lines = text.split('\n');

    return lines
      .map((line) => this.lineToRow(line))
      .filter((row) => row.length > 0 && row.some((cell) => cell !== null));
  }

  private lineToRow(line: string): RawRow {
    const cells = line.split('\t');

    return cells.map((cell) => this.normalizeCell(cell));
  }

  private normalizeCell(cell: string): string | null {
    const trimmed = cell.trim();
    return trimmed === '' ? null : trimmed;
  }

  private getSheetDimensions(rows: RawRow[]): { rowCount: number; columnCount: number } {
    const rowCount = rows.length;
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    return { rowCount, columnCount };
  }

  private buildMetadata(fileName: string, fileSize: number, pageCount: number): FileReadMetadata {
    const pageNames = Array.from({ length: pageCount }, (_, i) => `Page ${i + 1}`);

    return {
      fileName,
      fileType: 'pdf',
      fileSize,
      sheetCount: pageCount,
      sheetNames: pageNames,
    };
  }
}
