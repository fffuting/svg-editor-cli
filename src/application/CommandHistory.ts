import type { EditCommand } from './commands/EditCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class CommandHistory {
  private past: EditCommand[] = [];
  private future: EditCommand[] = [];
  private blocked = true;
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  record(command: EditCommand): void { this.past.push(command); this.future = []; this.blocked = false; }
  private allowed(): void { if (this.blocked) throw new Error('undo not allowed after io command'); }
  undo(): {document: SvgDocument; message: string} {
    this.allowed(); const command = this.past.at(-1); if (!command) throw new Error('nothing to undo');
    const document = command.undo(); this.past.pop(); this.future.push(command); return {document,message:'undone: ' + command.name};
  }
  redo(): {document: SvgDocument; message: string} {
    this.allowed(); const command = this.future.at(-1); if (!command) throw new Error('nothing to redo');
    const document = command.redo(); this.future.pop(); this.past.push(command); return {document,message:'redone: ' + command.name};
  }
}
