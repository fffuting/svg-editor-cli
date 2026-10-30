import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import type { DocumentStore } from '../src/application/ports/DocumentStore.js';
class MemoryStore implements DocumentStore {
  private files = new Map<string,SvgDocument>();
  read(path: string) { const doc = this.files.get(path); if (!doc) throw new Error('cannot read file: ' + path); return {document:doc.clone(),warnings:[]}; }
  write(path: string,document: SvgDocument): void { if (path === 'fail.svg') throw new Error('cannot write file: ' + path); this.files.set(path,document.clone()); }
}
const setup = () => { const session = new EditorSession(new MemoryStore()); return {session,cli:new CommandDispatcher(session)}; };
test('tokenizer handles comments, hex colors, quoted text and paths', () => {
  const tokenizer = new Tokenizer(); assert.deepEqual(tokenizer.tokenize('  # comment'),[]);
  assert.deepEqual(tokenizer.tokenize('set r fill #abc').map(t=>t.value),['set','r','fill','#abc']);
  assert.deepEqual(tokenizer.tokenize('create text t 0 0 "hello \\"world\\""').at(-1)?.value,'hello "world"');
  assert.equal(tokenizer.tokenize('read "C:\\Users\\demo.svg"')[1]?.value,'C:\\Users\\demo.svg');
  assert.throws(()=>tokenizer.tokenize('set t text "unclosed'),/unterminated/);
});
test('no-document error and help available before initialization', () => {
  const {cli} = setup(); assert.match(cli.execute('tree')[0]!,/^error: no document/); assert.match(cli.execute('help')[0]!,/create ellipse/);
});
test('each edit is one history unit; new successful edit clears redo', () => {
  const {cli,session} = setup(); cli.execute('init'); cli.execute('create rect r 1 2 3 4'); const original = session.current().tree();
  cli.execute('move r 5 6'); assert.equal(session.current().find('r').attributes().x,'6'); cli.execute('undo'); assert.equal(session.current().tree(),original);
  cli.execute('redo'); assert.equal(session.current().find('r').attributes().x,'6'); cli.execute('undo'); cli.execute('set r fill blue'); assert.equal(cli.execute('redo')[0],'error: nothing to redo');
});
test('all document barriers and queries obey undo rules', () => {
  const {cli} = setup(); cli.execute('init'); assert.equal(cli.execute('undo')[0],'error: undo not allowed after io command');
  cli.execute('create g g'); cli.execute('tree'); cli.execute('show g'); cli.execute('canvas'); cli.execute('help'); assert.match(cli.execute('undo')[0]!,/undone/);
  cli.execute('redo'); cli.execute('save doc.svg'); assert.equal(cli.execute('redo')[0],'error: undo not allowed after io command');
  cli.execute('create g h'); cli.execute('canvas 100 200'); assert.match(cli.execute('undo')[0]!,/undo not allowed/);
  cli.execute('create g i'); cli.execute('read doc.svg'); assert.match(cli.execute('undo')[0]!,/undo not allowed/);
  cli.execute('create g j'); cli.execute('undo'); assert.equal(cli.execute('undo')[0],'error: nothing to undo');
});
test('failed edits and IO preserve document and redo stack', () => {
  const {cli,session} = setup(); cli.execute('init'); cli.execute('create circle c 1 2 3'); cli.execute('move c 10 0'); cli.execute('undo');
  const snapshot = session.current().tree();
  for (const command of ['scale c 0','set c r -2','create circle c 0 0 2','read missing.svg','save fail.svg','canvas -1 20','init -1','group bad c missing']) {
    assert.match(cli.execute(command)[0]!,/^error:/,command); assert.equal(session.current().tree(),snapshot,command);
  }
  cli.execute('redo'); assert.equal(session.current().find('c').attributes().cx,'11');
});
test('group/delete/ungroup restore entire hierarchy and order', () => {
  const {cli,session} = setup(); for (const cmd of ['init','create g scene','create rect a 0 0 1 1 in scene','create circle b 1 1 1 in scene','create text t 0 0 "in" in scene']) assert.doesNotMatch(cli.execute(cmd).join('\n'),/^error:/);
  const initial = session.current().tree(); cli.execute('group combined b a'); const grouped = session.current().tree();
  cli.execute('undo'); assert.equal(session.current().tree(),initial); cli.execute('redo'); assert.equal(session.current().tree(),grouped);
  cli.execute('ungroup combined'); assert.equal(session.current().tree(),initial); cli.execute('undo'); assert.equal(session.current().tree(),grouped);
  cli.execute('delete scene'); assert.equal(session.current().all().length,0); cli.execute('undo'); assert.equal(session.current().tree(),grouped);
});
test('overflow midway through recursive edit never leaks partial mutation', () => {
  const {cli,session} = setup(); for (const cmd of ['init','create g g','create rect a 1 1 2 2 in g','create circle b 1e308 0 1 in g']) cli.execute(cmd);
  const before = session.current().tree(); assert.match(cli.execute('scale g 2')[0]!,/^error:/); assert.equal(session.current().tree(),before);
  cli.execute('undo'); assert.equal(session.current().has('b'),false);
});
