import { PdfFileReader, PdfPasswordRequiredError, XlsxFileReader } from './readers';
import { statementParserRegistry } from './StatementParserRegistry';

import type { StatementParserRegistry } from './StatementParserRegistry';
import type {
  FileReader,
  FileReadResult,
  StatementFileType,
  StatementMetadata,
  StatementParseError,
  StatementParseOutcome,
  StatementParser as StatementParserInterface,
} from './types';

export interface StatementParserOptions {
  registry?: StatementParserRegistry;
}

export class StatementParser {
  private readonly registry: StatementParserRegistry;
  private readonly readers: Map<StatementFileType, FileReader>;

  constructor(options: StatementParserOptions = {}) {
    this.registry = options.registry ?? statementParserRegistry;
    this.readers = this.initializeReaders();
  }

  async parse(data: Buffer, metadata: StatementMetadata): Promise<StatementParseOutcome> {
    try {
      this.validateInput(data, metadata);

      const fileContent = await this.readFile(data, metadata);
      const parser = this.findParser(metadata, fileContent);

      if (!parser) {
        return this.createError(
          `No parser found for file: ${metadata.fileName}`,
          metadata.fileName
        );
      }

      const result = await parser.parseStatement(data, metadata);
      return { success: true, result };
    } catch (error) {
      return this.handleError(error, metadata.fileName);
    }
  }

  async parseMultiple(
    files: Array<{ data: Buffer; metadata: StatementMetadata }>
  ): Promise<StatementParseOutcome[]> {
    return Promise.all(files.map(({ data, metadata }) => this.parse(data, metadata)));
  }

  canParse(metadata: StatementMetadata): boolean {
    return this.registry.findParser(metadata) !== undefined;
  }

  detectBank(
    metadata: StatementMetadata,
    fileContent?: FileReadResult
  ): ReturnType<StatementParserRegistry['detectBank']> {
    return this.registry.detectBank(metadata, fileContent);
  }

  async readFileContent(data: Buffer, metadata: StatementMetadata): Promise<FileReadResult> {
    return this.readFile(data, metadata);
  }

  getReader(fileType: StatementFileType): FileReader | undefined {
    return this.readers.get(fileType);
  }

  getSupportedFileTypes(): StatementFileType[] {
    return Array.from(this.readers.keys());
  }

  private initializeReaders(): Map<StatementFileType, FileReader> {
    const readers = new Map<StatementFileType, FileReader>();

    const xlsxReader = new XlsxFileReader();
    readers.set('xlsx', xlsxReader);

    const pdfReader = new PdfFileReader();
    readers.set('pdf', pdfReader);

    return readers;
  }

  private validateInput(data: Buffer, metadata: StatementMetadata): void {
    if (!data || data.length === 0) {
      throw new Error('File data is empty');
    }

    if (!metadata.fileName) {
      throw new Error('File name is required');
    }

    if (!metadata.fileType) {
      throw new Error('File type is required');
    }
  }

  private async readFile(data: Buffer, metadata: StatementMetadata): Promise<FileReadResult> {
    const reader = this.readers.get(metadata.fileType);

    if (!reader) {
      throw new Error(`Unsupported file type: ${metadata.fileType}`);
    }

    return reader.read(data, metadata.fileName, metadata.password);
  }

  private findParser(
    metadata: StatementMetadata,
    fileContent: FileReadResult
  ): StatementParserInterface | undefined {
    const detectionResult = this.registry.detectBank(metadata, fileContent);

    if (detectionResult) {
      return detectionResult.parser;
    }

    return this.registry.findParser(metadata);
  }

  private handleError(error: unknown, fileName: string): StatementParseError {
    if (error instanceof PdfPasswordRequiredError) {
      return this.createError('PDF requires password', fileName);
    }

    if (error instanceof Error) {
      return this.createError(error.message, fileName);
    }

    return this.createError('Unknown error occurred during parsing', fileName);
  }

  private createError(error: string, rawFileName: string): StatementParseError {
    return { success: false, error, rawFileName };
  }
}

export function createStatementParser(options?: StatementParserOptions): StatementParser {
  return new StatementParser(options);
}

export const defaultStatementParser = new StatementParser();
