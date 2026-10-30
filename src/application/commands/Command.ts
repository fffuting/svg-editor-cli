import type { EditorSession } from "../EditorSession.js";
import { Arguments } from "../Arguments.js";
export abstract class Command {
  constructor(protected readonly args: Arguments) {}
  abstract execute(session: EditorSession): readonly string[];
}
