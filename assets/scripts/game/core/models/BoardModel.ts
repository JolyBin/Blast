import { BaseTile } from "./BaseTile";
import { CellPos } from "./CellPos";

export class BoardModel {
  private grid: (BaseTile | null)[][];
  constructor(
    public readonly rows: number,
    public readonly cols: number,
  ) {
    this.grid = new Array(rows);
    for (let r = 0; r < rows; r++) {
      this.grid[r] = new Array(cols).fill(null);
    }
  }
  public get(pos: CellPos): BaseTile | null {
    return this.grid[pos.r]?.[pos.c] ?? null;
  }
  public set(pos: CellPos, tile: BaseTile | null): void {
    if (!this.grid[pos.r]) return;
    this.grid[pos.r][pos.c] = tile;
  }
  public swap(a: CellPos, b: CellPos): void {
    const ta = this.get(a);
    const tb = this.get(b);
    this.set(a, tb);
    this.set(b, ta);
  }
  public getGrid(): (BaseTile | null)[][] {
    return this.grid;
  }
}
