import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
export class SaveCommand extends Command {
  override execute(session: EditorSession): readonly string[] {
    this.args.expect(0, 1);
    return session.save(this.args.length ? this.args.text(0) : undefined);
  }
}
