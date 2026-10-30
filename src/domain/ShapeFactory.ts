import { Shape } from "./Shape.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { Text } from "./Text.js";
import { Group } from "./Group.js";
import { Numbers } from "./Numbers.js";
type Definition = {
  readonly keys: readonly string[];
  readonly text?: boolean;
  readonly style?: string;
  readonly make: (id: string, n: readonly number[], text: string) => Shape;
};
export class ShapeFactory {
  // The only shape-name dispatch point; replace with providers in the plugin phase.
  private readonly definitions = new Map<string, Definition>([
    [
      "rect",
      {
        keys: ["x", "y", "width", "height"],
        style: "fill",
        make: (id, n) => new Rect(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "circle",
      {
        keys: ["cx", "cy", "r"],
        style: "fill",
        make: (id, n) => new Circle(id, n[0]!, n[1]!, n[2]!),
      },
    ],
    [
      "ellipse",
      {
        keys: ["cx", "cy", "rx", "ry"],
        style: "fill",
        make: (id, n) => new Ellipse(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "line",
      {
        keys: ["x1", "y1", "x2", "y2"],
        style: "stroke",
        make: (id, n) => new Line(id, n[0]!, n[1]!, n[2]!, n[3]!),
      },
    ],
    [
      "text",
      {
        keys: ["x", "y"],
        text: true,
        make: (id, n, text) => new Text(id, n[0]!, n[1]!, text),
      },
    ],
    ["g", { keys: [], make: (id) => new Group(id) }],
  ]);
  private definition(type: string): Definition {
    const def = this.definitions.get(type);
    if (!def)
      throw new Error(
        "unknown shape type: " + type + " (is the plugin loaded?)",
      );
    return def;
  }
  create(type: string, id: string, args: readonly string[]): Shape {
    const def = this.definition(type);
    const minimum = def.keys.length + (def.text ? 1 : 0);
    if (args.length < minimum || args.length > minimum + (def.style ? 1 : 0))
      throw new Error("invalid arguments for create " + type);
    const numbers = def.keys.map((key, i) => Numbers.parse(args[i]!, key));
    const shape = def.make(id, numbers, def.text ? args[def.keys.length]! : "");
    if (def.style && args.length > minimum)
      shape.set(def.style, args[minimum]!);
    return shape;
  }
  fromAttributes(
    type: string,
    id: string,
    attributes: Readonly<Record<string, string>>,
    text: string,
  ): Shape {
    const def = this.definition(type);
    const shape = def.make(
      id,
      def.keys.map((key) => Numbers.parse(attributes[key] ?? "0", key)),
      text,
    );
    for (const key of ["fill", "stroke", "stroke-width"])
      if (attributes[key] !== undefined) shape.set(key, attributes[key]!);
    return shape;
  }
}
