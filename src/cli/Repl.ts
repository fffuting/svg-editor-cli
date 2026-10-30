import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandDispatcher } from './CommandDispatcher.js';
export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher) {}
  async run(input: Readable,output: Writable,interactive: boolean): Promise<void> {
    output.write("svg-editor 1.0 — type 'help' for commands\n");
    const reader = createInterface({input,crlfDelay:Infinity,terminal:false});
    if (interactive) output.write('svg> ');
    for await (const line of reader) {
      if (!interactive) output.write('svg> ');
      const messages = this.dispatcher.execute(line);
      for (const message of messages) output.write(message + '\n');
      if (interactive) output.write('svg> ');
    }
  }
}
