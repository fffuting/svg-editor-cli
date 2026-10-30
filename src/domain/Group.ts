import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';
export class Group extends Shape {
  private nodes: Shape[] = [];
  override get tag(): string { return 'g'; }
  override children(): readonly Shape[] { return [...this.nodes]; }
  override asContainer(): Group { return this; }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || shape.descendantsContain(this)) throw new Error('cannot move a container into its own descendant: ' + shape.id);
    if (this.nodes.includes(shape)) throw new Error('shape already attached: ' + shape.id);
    this.nodes.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error('shape not attached: ' + shape.id);
    this.nodes.splice(index, 1); return index;
  }
  override move(dx: number, dy: number): void { Numbers.finite(dx,'dx'); Numbers.finite(dy,'dy'); for (const node of this.nodes) node.move(dx,dy); }
  override scale(factor: number): void { Numbers.positive(factor,'scale factor'); for (const node of this.nodes) node.scale(factor); }
  protected override geometry(): Record<string,string> { return {}; }
  override clone(): Group { const copy = new Group(this.id); this.copyStyleTo(copy); for (const child of this.nodes) copy.insert(child.clone()); return copy; }
  override summary(): string { return [this.label,this.styleSummary()].filter(Boolean).join(' '); }
}
