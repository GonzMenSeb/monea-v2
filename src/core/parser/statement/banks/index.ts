import { StatementParserRegistry } from '../StatementParserRegistry';
import { BancolombiaCardParser, BancolombiaSavingsParser } from './bancolombia';

export function createDefaultStatementRegistry(): StatementParserRegistry {
  const registry = new StatementParserRegistry();

  registry.register(new BancolombiaSavingsParser());
  registry.register(new BancolombiaCardParser());

  return registry;
}

export * from './bancolombia';
