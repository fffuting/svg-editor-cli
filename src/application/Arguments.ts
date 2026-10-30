import { Numbers } from '../domain/Numbers.js';
export interface ArgumentToken { readonly value: string; readonly quoted: boolean; }
export class Arguments {
  constructor(private readonly tokens: readonly ArgumentToken[]) {}
  get length(): number { return this.tokens.length; }
  expect(min: number,max = min): void { if (this.length < min || this.length > max) throw new Error('invalid argument count: expected ' + (min === max ? min : min + '..' + max) + ', got ' + this.length); }
  text(index: number): string { const token = this.tokens[index]; if (!token) throw new Error('missing argument ' + (index + 1)); return token.value; }
  number(index: number,label: string): number { return Numbers.parse(this.text(index),label); }
  values(start = 0,end = this.length): string[] { return this.tokens.slice(start,end).map(t => t.value); }
  keyword(index: number,word: string): boolean { return this.tokens[index]?.value === word && !this.tokens[index]?.quoted; }
}
