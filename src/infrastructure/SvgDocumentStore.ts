import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync, statSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore, ReadResult } from '../application/ports/DocumentStore.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';
export class SvgDocumentStore implements DocumentStore {
  private readonly codec = new SvgCodec();
  read(path: string): ReadResult {
    let source: string;
    try { source = readFileSync(path,'utf8'); } catch { throw new Error('cannot read file: ' + path); }
    return this.codec.decode(source);
  }
  write(path: string,document: SvgDocument): void {
    let temporary: string | undefined;
    try {
      if (existsSync(path) && !statSync(path).isFile()) throw new Error('not a regular file');
      const xml = this.codec.encode(document);
      temporary = join(dirname(path),'.' + basename(path) + '.' + randomUUID() + '.tmp');
      writeFileSync(temporary,xml,{encoding:'utf8',flag:'wx'});
      renameSync(temporary,path);
    } catch { throw new Error('cannot write file: ' + path); }
    finally { if (temporary && existsSync(temporary)) { try { unlinkSync(temporary); } catch { /* Failed cleanup must not mask original IO error. */ } } }
  }
}
