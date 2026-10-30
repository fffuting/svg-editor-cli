import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  override perform(doc: SvgDocument): string { this.args.expect(3); const id=this.args.text(0), attr=this.args.text(1), value=this.args.text(2); doc.set(id,attr,value); return doc.find(id).label + ' updated: ' + attr + '=' + JSON.stringify(value); }
}
