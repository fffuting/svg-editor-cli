import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class MoveCommand extends EditCommand {
  override perform(doc: SvgDocument): string { this.args.expect(3); const id=this.args.text(0), dx=this.args.number(1,'dx'), dy=this.args.number(2,'dy'); doc.move(id,dx,dy); return doc.find(id).label + ' moved by (' + dx + ',' + dy + ')'; }
}
