import { Command } from './Command.js';
import type { EditorSession } from '../EditorSession.js';
export class TreeCommand extends Command {
  override execute(session: EditorSession): readonly string[] { this.args.expect(0,1); return session.tree(this.args.length ? this.args.text(0) : undefined); }
}
