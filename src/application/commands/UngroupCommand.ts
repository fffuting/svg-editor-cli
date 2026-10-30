import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  override perform(doc: SvgDocument): string { this.args.expect(1); const id=this.args.text(0); doc.ungroup(id); return 'g#' + id + ' ungrouped'; }
}
