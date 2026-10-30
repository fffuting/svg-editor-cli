import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
export class ReadCommand extends Command {
  override execute(session: EditorSession): readonly string[] {
    this.args.expect(1);
    return session.read(this.args.text(0));
  }
}
