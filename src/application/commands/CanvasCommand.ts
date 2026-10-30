import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
export class CanvasCommand extends Command {
  override execute(session: EditorSession): readonly string[] {
    if (this.args.length !== 0 && this.args.length !== 2)
      throw new Error("canvas requires width and height");
    return session.canvas(
      this.args.length ? this.args.number(0, "width") : undefined,
      this.args.length ? this.args.number(1, "height") : undefined,
    );
  }
}
