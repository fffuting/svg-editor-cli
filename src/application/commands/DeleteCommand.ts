import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  override perform(doc: SvgDocument): string { this.args.expect(1); const id=this.args.text(0); const label=doc.find(id).label; doc.delete(id); return label + ' deleted'; }
}
