import { EditCommand } from "./EditCommand.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class FrontCommand extends EditCommand {
  override perform(doc: SvgDocument): string {
    this.args.expect(1);
    const id = this.args.text(0);
    doc.reorder(id, true);
    return doc.find(id).label + " moved to front";
  }
}
