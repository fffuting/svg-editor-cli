import { GeometryShape } from "./GeometryShape.js";
export class Text extends GeometryShape {
  constructor(
    id: string,
    x: number,
    y: number,
    private text: string,
  ) {
    super(id, { x, y }, []);
  }
  override get tag(): string {
    return "text";
  }
  override move(dx: number, dy: number): void {
    this.shift(["x"], ["y"], dx, dy);
  }
  override set(attr: string, value: string): void {
    if (attr === "text") this.text = value;
    else super.set(attr, value);
  }
  protected override content(): string {
    return this.text;
  }
  override clone(): Text {
    const copy = new Text(this.id, this.value("x"), this.value("y"), this.text);
    this.copyStyleTo(copy);
    return copy;
  }
  override summary(): string {
    return (
      this.label +
      " (" +
      this.value("x") +
      "," +
      this.value("y") +
      ") " +
      JSON.stringify(this.text) +
      (this.styleSummary() ? " " + this.styleSummary() : "")
    );
  }
  override details(): string {
    return super.details() + " text=" + JSON.stringify(this.text);
  }
}
