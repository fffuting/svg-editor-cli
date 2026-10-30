import type { Token } from './Token.js';
export class Tokenizer {
  tokenize(line: string): readonly Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = []; let i = 0;
    while (i < line.length) {
      if (/\s/u.test(line[i]!)) { i++; continue; }
      const quoted = line[i] === '"'; let value = '';
      if (quoted) {
        i++; let closed = false;
        while (i < line.length) {
          const ch = line[i++]!;
          if (ch === '"') { closed = true; break; }
          if (ch === '\\' && ['"','\\','n','r','t'].includes(line[i] ?? '')) {
            const escape = line[i++]!; value += ({n:'\n',r:'\r',t:'\t'} as Record<string,string>)[escape] ?? escape;
          } else value += ch;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (i < line.length && !/\s/u.test(line[i]!)) throw new Error('expected whitespace after quoted argument');
      } else {
        while (i < line.length && !/\s/u.test(line[i]!)) { if (line[i] === '"') throw new Error('quote must start an argument'); value += line[i++]!; }
      }
      tokens.push({value,quoted});
    }
    return tokens;
  }
}
