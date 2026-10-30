import { EditCommand } from './EditCommand.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class CreateCommand extends EditCommand {
  override perform(doc: SvgDocument): string {
    this.args.expect(2,10); let end = this.args.length; let parent: string | undefined;
    if (this.args.keyword(end-2,'in')) { parent = this.args.text(end-1); end -= 2; }
    const shape = new ShapeFactory().create(this.args.text(0),this.args.text(1),this.args.values(2,end));
    doc.add(shape,parent); return shape.label + ' created' + (parent === undefined ? '' : ' in g#' + parent);
  }
}
