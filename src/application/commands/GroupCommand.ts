import { EditCommand } from "./EditCommand.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class GroupCommand extends EditCommand {
  override perform(doc: SvgDocument): string {
    this.args.expect(2, Number.MAX_SAFE_INTEGER);
    const id = this.args.text(0);
    doc.group(id, this.args.values(1));
    return "g#" + id + " created with " + (this.args.length - 1) + " children";
  }
}
