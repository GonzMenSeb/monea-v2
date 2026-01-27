import * as XLSX from 'xlsx';

import type {
  CellValue,
  FileReadMetadata,
  FileReadResult,
  FileReader,
  RawRow,
  SheetData,
  StatementFileType,
} from '../types';

export class XlsxFileReader implements FileReader {
  readonly supportedTypes: StatementFileType[] = ['xlsx'];

  canRead(fileType: StatementFileType): boolean {
    return this.supportedTypes.includes(fileType);
  }

  read(data: Buffer, fileName: string): Promise<FileReadResult> {
    const workbook = XLSX.read(data, {
      type: 'buffer',
      cellDates: true,
      cellNF: true,
      cellText: false,
    });

    const sheets = this.extractSheets(workbook);
    const metadata = this.buildMetadata(fileName, data.length, workbook);

    return Promise.resolve({ metadata, sheets });
  }

  private extractSheets(workbook: XLSX.WorkBook): SheetData[] {
    return workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        return {
          name: sheetName,
          rows: [],
          rowCount: 0,
          columnCount: 0,
        };
      }

      const rows = this.extractRows(worksheet);
      const dimensions = this.getSheetDimensions(rows);

      return {
        name: sheetName,
        rows,
        rowCount: dimensions.rowCount,
        columnCount: dimensions.columnCount,
      };
    });
  }

  private extractRows(worksheet: XLSX.WorkSheet): RawRow[] {
    const rawData = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    return rawData.map((row) => this.normalizeRow(row));
  }

  private normalizeRow(row: CellValue[]): RawRow {
    return row.map((cell) => this.normalizeCell(cell));
  }

  private normalizeCell(cell: CellValue): CellValue {
    if (cell === undefined || cell === '') {
      return null;
    }

    if (typeof cell === 'string') {
      const trimmed = cell.trim();
      return trimmed === '' ? null : trimmed;
    }

    return cell;
  }

  private getSheetDimensions(rows: RawRow[]): { rowCount: number; columnCount: number } {
    const rowCount = rows.length;
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    return { rowCount, columnCount };
  }

  private buildMetadata(
    fileName: string,
    fileSize: number,
    workbook: XLSX.WorkBook
  ): FileReadMetadata {
    return {
      fileName,
      fileType: 'xlsx',
      fileSize,
      sheetCount: workbook.SheetNames.length,
      sheetNames: [...workbook.SheetNames],
    };
  }
}
