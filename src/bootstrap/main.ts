import { EditorSession } from '../application/EditorSession.js';
import { SvgDocumentStore } from '../infrastructure/SvgDocumentStore.js';
import { CommandDispatcher } from '../cli/CommandDispatcher.js';
import { Repl } from '../cli/Repl.js';
const session = new EditorSession(new SvgDocumentStore());
await new Repl(new CommandDispatcher(session)).run(process.stdin,process.stdout,Boolean(process.stdin.isTTY));
