import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export abstract class EditCommand extends Command {
  private before?: SvgDocument;
  private after?: SvgDocument;
  override execute(session: EditorSession): readonly string[] {
    return session.edit(this);
  }
  abstract perform(document: SvgDocument): string;
  capture(before: SvgDocument, after: SvgDocument): void {
    this.before = before.clone();
    this.after = after.clone();
  }
  undo(): SvgDocument {
    if (!this.before) throw new Error("command not executed");
    return this.before.clone();
  }
  redo(): SvgDocument {
    if (!this.after) throw new Error("command not executed");
    return this.after.clone();
  }
  get name(): string {
    return this.constructor.name.replace(/Command$/, "").toLowerCase();
  }
}
