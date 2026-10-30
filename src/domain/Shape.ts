import { Numbers } from "./Numbers.js";
import type { SvgElement } from "./SvgElement.js";
export abstract class Shape {
  private readonly presentation = new Map<string, string>();
  private readonly styles = new Map<string, string>();
  constructor(private readonly shapeId: string) {
    if (!shapeId || /[\s<>"'&]/u.test(shapeId))
      throw new Error("invalid id: " + shapeId);
  }
  get id(): string {
    return this.shapeId;
  }
  abstract get tag(): string;
  get label(): string {
    return this.tag + "#" + this.id;
  }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  protected abstract geometry(): Record<string, string>;
  protected content(): string {
    return "";
  }
  children(): readonly Shape[] {
    return [];
  }
  asContainer(): import("./Group.js").Group {
    throw new Error("not a container: " + this.id);
  }
  set(attr: string, value: string): void {
    if (!["fill", "stroke", "stroke-width"].includes(attr))
      throw new Error("unknown attribute: " + attr);
    if (attr === "stroke-width")
      value = String(Numbers.nonnegative(Numbers.parse(value, attr), attr));
    this.styles.set(attr, value);
  }
  importPresentation(attr: string, value: string): void {
    if (
      ![
        "font-size",
        "font-family",
        "font-weight",
        "text-anchor",
        "opacity",
        "fill-opacity",
        "stroke-opacity",
        "stroke-linecap",
        "stroke-linejoin",
      ].includes(attr)
    )
      throw new Error("unsupported SVG attribute: " + attr);
    this.presentation.set(attr, value);
  }
  attributes(): Readonly<Record<string, string>> {
    return {
      id: this.id,
      ...this.geometry(),
      ...Object.fromEntries(this.styles),
      ...Object.fromEntries(this.presentation),
    };
  }
  protected copyStyleTo(target: Shape): void {
    for (const [key, value] of this.styles) target.set(key, value);
    for (const [key, value] of this.presentation)
      target.importPresentation(key, value);
  }
  protected styleSummary(): string {
    return [...this.styles].map(([key, value]) => key + "=" + value).join(" ");
  }
  descendantsContain(target: Shape): boolean {
    return this.children().some(
      (child) => child === target || child.descendantsContain(target),
    );
  }
  abstract summary(): string;
  details(): string {
    return Object.entries({
      ...this.geometry(),
      ...Object.fromEntries(this.styles),
    })
      .map(([k, v]) => k + "=" + v)
      .join(" ");
  }
  toElement(): SvgElement {
    return {
      tag: this.tag,
      attributes: this.attributes(),
      text: this.content(),
      children: this.children().map((child) => child.toElement()),
    };
  }
}
