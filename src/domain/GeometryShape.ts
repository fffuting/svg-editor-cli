import { Shape } from "./Shape.js";
import { Numbers } from "./Numbers.js";
export abstract class GeometryShape extends Shape {
  private readonly values: Map<string, number>;
  constructor(
    id: string,
    geometry: Record<string, number>,
    private readonly sizes: readonly string[],
  ) {
    super(id);
    this.values = new Map();
    for (const [key, value] of Object.entries(geometry))
      this.values.set(key, this.validate(key, value));
  }
  protected value(key: string): number {
    const value = this.values.get(key);
    if (value === undefined) throw new Error("unknown geometry: " + key);
    return value;
  }
  private validate(key: string, value: number): number {
    return this.sizes.includes(key)
      ? Numbers.nonnegative(value, key)
      : Numbers.finite(value, key);
  }
  protected shift(
    xs: readonly string[],
    ys: readonly string[],
    dx: number,
    dy: number,
  ): void {
    Numbers.finite(dx, "dx");
    Numbers.finite(dy, "dy");
    const next = new Map(this.values);
    for (const key of xs)
      next.set(key, Numbers.finite(this.value(key) + dx, key));
    for (const key of ys)
      next.set(key, Numbers.finite(this.value(key) + dy, key));
    for (const [key, value] of next) this.values.set(key, value);
  }
  override scale(factor: number): void {
    Numbers.positive(factor, "scale factor");
    const next = [...this.values].map(
      ([key, value]) => [key, this.validate(key, value * factor)] as const,
    );
    for (const [key, value] of next) this.values.set(key, value);
  }
  override set(attr: string, value: string): void {
    if (this.values.has(attr))
      this.values.set(attr, this.validate(attr, Numbers.parse(value, attr)));
    else super.set(attr, value);
  }
  protected override geometry(): Record<string, string> {
    return Object.fromEntries([...this.values].map(([k, v]) => [k, String(v)]));
  }
  protected formatted(names: Readonly<Record<string, string>> = {}): string {
    return [
      this.label,
      ...[...this.values].map(([k, v]) => (names[k] ?? k) + "=" + v),
      this.styleSummary(),
    ]
      .filter(Boolean)
      .join(" ");
  }
}
