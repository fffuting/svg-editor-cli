import { Arguments } from '../application/Arguments.js';
import type { Command } from '../application/commands/Command.js';
import type { EditorSession } from '../application/EditorSession.js';
import { Tokenizer } from './Tokenizer.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';
import { UndoCommand } from '../application/commands/UndoCommand.js';
import { RedoCommand } from '../application/commands/RedoCommand.js';
export class CommandDispatcher {
  private readonly tokenizer = new Tokenizer();
  // Only command-name dispatch point; registration is a later extension.
  private readonly commands = new Map<string,new (args: Arguments) => Command>([
    ['init',InitCommand],
    ['read',ReadCommand],
    ['save',SaveCommand],
    ['canvas',CanvasCommand],
    ['create',CreateCommand],
    ['delete',DeleteCommand],
    ['move',MoveCommand],
    ['scale',ScaleCommand],
    ['set',SetCommand],
    ['group',GroupCommand],
    ['ungroup',UngroupCommand],
    ['addto',AddToCommand],
    ['front',FrontCommand],
    ['back',BackCommand],
    ['tree',TreeCommand],
    ['show',ShowCommand],
    ['help',HelpCommand],
    ['undo',UndoCommand],
    ['redo',RedoCommand]
  ]);
  constructor(private readonly session: EditorSession) {}
  execute(line: string): readonly string[] {
    try {
      const tokens = this.tokenizer.tokenize(line); if (!tokens.length) return [];
      const name = tokens[0]!.value; const Type = this.commands.get(name);
      if (!Type) throw new Error('unknown command: ' + name);
      if (!['init','read','help'].includes(name)) this.session.current();
      return new Type(new Arguments(tokens.slice(1))).execute(this.session);
    } catch (error: unknown) { return ['error: ' + (error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g,' ')]; }
  }
}
