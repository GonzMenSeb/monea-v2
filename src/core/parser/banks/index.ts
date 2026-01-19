import { ParserRegistry } from '../ParserRegistry';
import { BancolombiaParser } from './bancolombia';
import { BancoomevaParser } from './bancoomeva';
import { BbvaParser } from './bbva';
import { DaviplataParser } from './daviplata';
import { DaviviendaParser } from './davivienda';
import { NequiParser } from './nequi';

export { BancolombiaParser, BANCOLOMBIA_PATTERNS } from './bancolombia';
export { BancoomevaParser, BANCOOMEVA_PATTERNS } from './bancoomeva';
export { BbvaParser, BBVA_PATTERNS } from './bbva';
export { DaviplataParser, DAVIPLATA_PATTERNS } from './daviplata';
export { DaviviendaParser, DAVIVIENDA_PATTERNS } from './davivienda';
export { NequiParser, NEQUI_PATTERNS } from './nequi';

export function createDefaultRegistry(): ParserRegistry {
  const registry = new ParserRegistry();

  registry.register(new BancolombiaParser());
  registry.register(new DaviviendaParser());
  registry.register(new BbvaParser());
  registry.register(new NequiParser());
  registry.register(new DaviplataParser());
  registry.register(new BancoomevaParser());

  return registry;
}
