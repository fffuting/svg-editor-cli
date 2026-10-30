import { Numbers } from "../domain/Numbers.js";
import type { Shape } from "../domain/Shape.js";
export class SvgTransform {
  private factor = 1;
  private dx = 0;
  private dy = 0;
  constructor(source: string) {
    let rest = source.trim();
    while (rest) {
      const match = /^(translate|scale)\s*\(([^)]*)\)\s*,?\s*/.exec(rest);
      if (!match) throw new Error("unsupported SVG transform: " + source);
      const args = match[2]!
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((value) => Numbers.parse(value, "transform"));
      if (args.length < 1 || args.length > 2)
        throw new Error("invalid SVG transform: " + source);
      if (match[1] === "translate") {
        this.dx += this.factor * args[0]!;
        this.dy += this.factor * (args[1] ?? 0);
      } else {
        if (args.length === 2 && args[0] !== args[1])
          throw new Error("only uniform SVG scaling is supported");
        this.factor *= Numbers.positive(args[0]!, "scale factor");
      }
      rest = rest.slice(match[0].length);
    }
  }
  apply(shape: Shape): void {
    if (this.factor !== 1) shape.scale(this.factor);
    if (this.dx !== 0 || this.dy !== 0) shape.move(this.dx, this.dy);
  }
}
