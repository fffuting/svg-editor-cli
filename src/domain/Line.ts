import { GeometryShape } from "./GeometryShape.js";
export class Line extends GeometryShape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, { x1, y1, x2, y2 }, []);
  }
  override get tag(): string {
    return "line";
  }
  override move(dx: number, dy: number): void {
    this.shift(["x1", "x2"], ["y1", "y2"], dx, dy);
  }
  override clone(): Line {
    const copy = new Line(
      this.id,
      this.value("x1"),
      this.value("y1"),
      this.value("x2"),
      this.value("y2"),
    );
    this.copyStyleTo(copy);
    return copy;
  }
  override summary(): string {
    return (
      this.label +
      " (" +
      this.value("x1") +
      "," +
      this.value("y1") +
      ") -> (" +
      this.value("x2") +
      "," +
      this.value("y2") +
      ")" +
      (this.styleSummary() ? " " + this.styleSummary() : "")
    );
  }
}
