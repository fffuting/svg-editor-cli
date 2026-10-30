import { GeometryShape } from "./GeometryShape.js";
export class Rect extends GeometryShape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ["width", "height"]);
  }
  override get tag(): string {
    return "rect";
  }
  override move(dx: number, dy: number): void {
    this.shift(["x"], ["y"], dx, dy);
  }
  override clone(): Rect {
    const copy = new Rect(
      this.id,
      this.value("x"),
      this.value("y"),
      this.value("width"),
      this.value("height"),
    );
    this.copyStyleTo(copy);
    return copy;
  }
  override summary(): string {
    return this.formatted({ width: "w", height: "h" });
  }
}
