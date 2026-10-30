import { EditCommand } from "./EditCommand.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
export class ScaleCommand extends EditCommand {
  override perform(doc: SvgDocument): string {
    this.args.expect(2);
    const id = this.args.text(0),
      factor = this.args.number(1, "scale factor");
    doc.scale(id, factor);
    return doc.find(id).label + " scaled by " + factor;
  }
}
