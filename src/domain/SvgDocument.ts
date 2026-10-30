import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { Numbers } from './Numbers.js';
import type { SvgElement } from './SvgElement.js';
export class SvgDocument {
  private root = new Group('__document_root__');
  private viewport: string;
  constructor(private width = 800, private height = 600, viewBox?: string) {
    Numbers.positive(width, 'canvas width'); Numbers.positive(height, 'canvas height');
    this.viewport = viewBox ?? `0 0 ${width} ${height}`;
  }
  size(): string { return `${this.width}x${this.height}`; }
  resize(width: number, height: number): void {
    Numbers.positive(width, 'canvas width'); Numbers.positive(height, 'canvas height');
    this.width = width; this.height = height; this.viewport = `0 0 ${width} ${height}`;
  }
  all(): readonly Shape[] {
    const visit = (parent: Shape): Shape[] => parent.children().flatMap(child => [child, ...visit(child)]);
    return visit(this.root);
  }
  find(id: string): Shape { const node = this.all().find(shape => shape.id === id); if (!node) throw new Error('no such shape: ' + id); return node; }
  has(id: string): boolean { return this.all().some(shape => shape.id === id); }
  private parentOf(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(node => node.children().includes(shape));
    if (!parent) throw new Error('detached shape: ' + shape.id);
    return parent.asContainer();
  }
  private container(id?: string): Group {
    if (id === undefined) return this.root;
    if (!this.has(id)) throw new Error('no such container: ' + id);
    return this.find(id).asContainer();
  }
  add(shape: Shape, parentId?: string): void {
    const collect = (node: Shape): Shape[] => [node, ...node.children().flatMap(collect)];
    const ids = new Set(this.all().map(node => node.id));
    for (const node of collect(shape)) { if (ids.has(node.id)) throw new Error('id already exists: ' + node.id); ids.add(node.id); }
    this.container(parentId).insert(shape);
  }
  delete(id: string): void { const node = this.find(id); this.parentOf(node).remove(node); }
  move(id: string, dx: number, dy: number): void { this.find(id).move(dx, dy); }
  scale(id: string, factor: number): void { this.find(id).scale(factor); }
  set(id: string, attr: string, value: string): void { this.find(id).set(attr, value); }
  group(id: string, ids: readonly string[]): void {
    if (this.has(id)) throw new Error('id already exists: ' + id);
    if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const requested = ids.map(item => this.find(item));
    for (const ancestor of requested) if (requested.some(other => ancestor !== other && ancestor.descendantsContain(other))) throw new Error('cannot group a container into its own descendant: ' + ancestor.id);
    // Stable document order, independent of the order of CLI arguments.
    const selected = this.all().filter(node => requested.includes(node));
    const chain = (node: Shape): Group[] => { const result: Group[] = []; let parent = this.parentOf(node); result.push(parent); while (parent !== this.root) { parent = this.parentOf(parent); result.push(parent); } return result; };
    const chains = selected.map(chain);
    const common = chains[0]!.find(candidate => chains.every(ancestors => ancestors.includes(candidate)))!;
    let firstBranch: Shape = selected[0]!;
    while (this.parentOf(firstBranch) !== common) firstBranch = this.parentOf(firstBranch);
    const index = common.children().indexOf(firstBranch);
    const group = new Group(id);
    for (const node of selected) { this.parentOf(node).remove(node); group.insert(node); }
    common.insert(group, index);
  }
  ungroup(id: string): void {
    const group = this.find(id).asContainer(); const parent = this.parentOf(group);
    if (parent === this.root) throw new Error('cannot ungroup top-level container: ' + id);
    const index = parent.remove(group);
    for (const [offset,child] of group.children().entries()) { group.remove(child); parent.insert(child,index + offset); }
  }
  addTo(groupId: string, id: string): void {
    const target = this.container(groupId); const node = this.find(id);
    if (target === node || node.descendantsContain(target)) throw new Error('cannot move a container into its own descendant: ' + id);
    this.parentOf(node).remove(node); target.insert(node);
  }
  reorder(id: string, front: boolean): void {
    const node = this.find(id); const parent = this.parentOf(node); parent.remove(node);
    parent.insert(node, front ? parent.children().length : 0);
  }
  tree(id?: string): string {
    const start = id === undefined ? this.root : this.find(id);
    const lines = [start === this.root ? `svg (${this.size()})` : start.summary()];
    const visit = (node: Shape,prefix: string): void => node.children().forEach((child,i,children) => {
      const last = i === children.length - 1; lines.push(prefix + (last ? '└── ' : '├── ') + child.summary()); visit(child,prefix + (last ? '    ' : '│   '));
    });
    visit(start,''); return lines.join('\n');
  }
  show(id: string): string { const node = this.find(id); const parent = this.parentOf(node); return `${node.label}  parent=${parent === this.root ? 'svg' : parent.label}\n  ${node.details()}`; }
  clone(): SvgDocument { const copy = new SvgDocument(this.width,this.height,this.viewport); copy.root = this.root.clone(); return copy; }
  toElement(): SvgElement { return {tag:'svg',attributes:{xmlns:'http://www.w3.org/2000/svg',width:String(this.width),height:String(this.height),viewBox:this.viewport},text:'',children:this.root.children().map(child => child.toElement())}; }
}
