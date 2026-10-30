import { EditCommand } from "./EditCommand.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class AddToCommand extends EditCommand {
  override perform(doc: SvgDocument): string {
    this.args.expect(2);
    const group = this.args.text(0),
      id = this.args.text(1);
    doc.addTo(group, id);
    return doc.find(id).label + " added to g#" + group;
  }
}
