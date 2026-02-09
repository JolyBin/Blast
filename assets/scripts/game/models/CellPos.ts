export interface CellPos {
  r: number;
  c: number;
}
export class UniqueCellPosSet {
  private map = new Map<number, CellPos>();
  constructor(private readonly cols: number) {}
  private key(p: CellPos): number {
    return p.r * this.cols + p.c;
  }
  add(p: CellPos): void {
    this.map.set(this.key(p), { r: p.r, c: p.c });
  }
  has(p: CellPos): boolean {
    return this.map.has(this.key(p));
  }
  delete(p: CellPos): boolean {
    return this.map.delete(this.key(p));
  }
  clear(): void {
    this.map.clear();
  }
  get size(): number {
    return this.map.size;
  }
  toArray(): CellPos[] {
    return Array.from(this.map.values());
  }
  values(): IterableIterator<CellPos> {
    return this.map.values();
  }
}
