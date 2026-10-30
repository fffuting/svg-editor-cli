import { SvgDocument } from "../domain/SvgDocument.js";
import { CommandHistory } from "./CommandHistory.js";
import type { DocumentStore } from "./ports/DocumentStore.js";
import type { EditCommand } from "./commands/EditCommand.js";
export class EditorSession {
  private document?: SvgDocument;
  private path: string | undefined;
  private readonly history = new CommandHistory();
  constructor(private readonly store: DocumentStore) {}
  current(): SvgDocument {
    if (!this.document)
      throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }
  init(width = 800, height = 600): readonly string[] {
    const doc = new SvgDocument(width, height);
    this.document = doc;
    this.path = undefined;
    this.history.barrier();
    return ["canvas " + doc.size() + " created"];
  }
  read(path: string): readonly string[] {
    const result = this.store.read(path);
    this.document = result.document;
    this.path = path;
    this.history.barrier();
    return [
      ...result.warnings,
      "read " + path + " (" + result.document.all().length + " elements)",
    ];
  }
  save(path?: string): readonly string[] {
    const doc = this.current();
    const target = path ?? this.path;
    if (!target) throw new Error("no file path. use save <file.svg>");
    this.store.write(target, doc);
    this.path = target;
    this.history.barrier();
    return ["saved to " + target + " (" + doc.all().length + " elements)"];
  }
  canvas(width?: number, height?: number): readonly string[] {
    const doc = this.current();
    if (width === undefined && height === undefined)
      return ["canvas " + doc.size()];
    if (width === undefined || height === undefined)
      throw new Error("canvas requires width and height");
    const changed = doc.clone();
    changed.resize(width, height);
    this.document = changed;
    this.history.barrier();
    return ["canvas resized to " + changed.size()];
  }
  edit(command: EditCommand): readonly string[] {
    const before = this.current();
    const working = before.clone();
    const message = command.perform(working);
    command.capture(before, working);
    this.document = working;
    this.history.record(command);
    return [message];
  }
  undo(): readonly string[] {
    this.current();
    const result = this.history.undo();
    this.document = result.document;
    return [result.message];
  }
  redo(): readonly string[] {
    this.current();
    const result = this.history.redo();
    this.document = result.document;
    return [result.message];
  }
  tree(id?: string): readonly string[] {
    return [this.current().tree(id)];
  }
  show(id: string): readonly string[] {
    return [this.current().show(id)];
  }
}
