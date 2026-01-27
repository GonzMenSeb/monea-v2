import { StatementParserRegistry } from '../StatementParserRegistry';
import { BancolombiaCardParser, BancolombiaSavingsParser } from './bancolombia';
import { NequiStatementParser } from './nequi';

export function createDefaultStatementRegistry(): StatementParserRegistry {
  const registry = new StatementParserRegistry();

  registry.register(new BancolombiaSavingsParser());
  registry.register(new BancolombiaCardParser());
  registry.register(new NequiStatementParser());

  return registry;
}

export * from './bancolombia';
export * from './nequi';
