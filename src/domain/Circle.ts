import { GeometryShape } from "./GeometryShape.js";
export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ["r"]);
  }
  override get tag(): string {
    return "circle";
  }
  override move(dx: number, dy: number): void {
    this.shift(["cx"], ["cy"], dx, dy);
  }
  override clone(): Circle {
    const copy = new Circle(
      this.id,
      this.value("cx"),
      this.value("cy"),
      this.value("r"),
    );
    this.copyStyleTo(copy);
    return copy;
  }
  override summary(): string {
    return this.formatted({});
  }
}
