import type { BankCode, FileReadResult, StatementMetadata, StatementParser } from './types';

export interface BankDetectionResult {
  bankCode: BankCode;
  parser: StatementParser;
  confidence: 'high' | 'medium' | 'low';
}

export class StatementParserRegistry {
  private parsers: Map<BankCode, StatementParser[]> = new Map();

  register(parser: StatementParser): void {
    const existing = this.parsers.get(parser.bankCode) ?? [];
    existing.push(parser);
    this.parsers.set(parser.bankCode, existing);
  }

  registerAll(parsers: StatementParser[]): void {
    for (const parser of parsers) {
      this.register(parser);
    }
  }

  getParser(bankCode: BankCode): StatementParser | undefined {
    const parsers = this.parsers.get(bankCode);
    return parsers?.[0];
  }

  getParsersForBank(bankCode: BankCode): StatementParser[] {
    return this.parsers.get(bankCode) ?? [];
  }

  getAllParsers(): StatementParser[] {
    const allParsers: StatementParser[] = [];
    for (const parsers of this.parsers.values()) {
      allParsers.push(...parsers);
    }
    return allParsers;
  }

  getBankCodes(): BankCode[] {
    return Array.from(this.parsers.keys());
  }

  findParser(metadata: StatementMetadata): StatementParser | undefined {
    if (metadata.bankCode) {
      const parsers = this.getParsersForBank(metadata.bankCode);
      return parsers.find((parser) => parser.canParse(metadata));
    }

    for (const parsers of this.parsers.values()) {
      const match = parsers.find((parser) => parser.canParse(metadata));
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  detectBank(
    metadata: StatementMetadata,
    fileContent?: FileReadResult
  ): BankDetectionResult | undefined {
    if (metadata.bankCode) {
      const parser = this.findParser(metadata);
      if (parser) {
        return {
          bankCode: metadata.bankCode,
          parser,
          confidence: 'high',
        };
      }
    }

    const fileNameMatch = this.detectFromFileName(metadata);
    if (fileNameMatch) {
      return fileNameMatch;
    }

    if (fileContent) {
      const contentMatch = this.detectFromContent(metadata, fileContent);
      if (contentMatch) {
        return contentMatch;
      }
    }

    return undefined;
  }

  private detectFromFileName(metadata: StatementMetadata): BankDetectionResult | undefined {
    const fileName = metadata.fileName.toLowerCase();

    const bankPatterns: Array<{
      bankCode: BankCode;
      patterns: RegExp[];
      confidence: 'high' | 'medium';
    }> = [
      {
        bankCode: 'bancolombia',
        patterns: [
          /bancolombia/i,
          /cuentas?\s*de?\s*ahorro/i,
          /mastercard.*detallado/i,
          /amex.*detallado/i,
        ],
        confidence: 'high',
      },
      {
        bankCode: 'nequi',
        patterns: [/nequi/i, /extracto.*nequi/i],
        confidence: 'high',
      },
      {
        bankCode: 'davivienda',
        patterns: [/davivienda/i],
        confidence: 'high',
      },
      {
        bankCode: 'daviplata',
        patterns: [/daviplata/i],
        confidence: 'high',
      },
      {
        bankCode: 'bbva',
        patterns: [/bbva/i],
        confidence: 'high',
      },
    ];

    for (const { bankCode, patterns, confidence } of bankPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(fileName)) {
          const parser = this.findParser({ ...metadata, bankCode });
          if (parser) {
            return { bankCode, parser, confidence };
          }
        }
      }
    }

    return undefined;
  }

  private detectFromContent(
    metadata: StatementMetadata,
    fileContent: FileReadResult
  ): BankDetectionResult | undefined {
    const contentIndicators: Array<{ bankCode: BankCode; indicators: string[] }> = [
      {
        bankCode: 'bancolombia',
        indicators: ['bancolombia', 'grupo bancolombia', 'sucursal virtual'],
      },
      {
        bankCode: 'nequi',
        indicators: ['nequi', 'nequi colombia'],
      },
      {
        bankCode: 'davivienda',
        indicators: ['davivienda', 'grupo davivienda'],
      },
      {
        bankCode: 'daviplata',
        indicators: ['daviplata'],
      },
      {
        bankCode: 'bbva',
        indicators: ['bbva', 'bbva colombia'],
      },
    ];

    const textContent = this.extractTextFromContent(fileContent);
    const lowerContent = textContent.toLowerCase();

    for (const { bankCode, indicators } of contentIndicators) {
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          const parser = this.findParser({ ...metadata, bankCode });
          if (parser) {
            return { bankCode, parser, confidence: 'medium' };
          }
        }
      }
    }

    return undefined;
  }

  private extractTextFromContent(fileContent: FileReadResult): string {
    const textParts: string[] = [];

    for (const sheet of fileContent.sheets) {
      for (const row of sheet.rows.slice(0, 20)) {
        for (const cell of row) {
          if (typeof cell === 'string') {
            textParts.push(cell);
          }
        }
      }
    }

    return textParts.join(' ');
  }

  clear(): void {
    this.parsers.clear();
  }
}

export const statementParserRegistry = new StatementParserRegistry();
