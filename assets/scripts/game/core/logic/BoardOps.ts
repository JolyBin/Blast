import { BaseTile } from "../models/BaseTile";
import { BoardModel } from "../models/BoardModel";
import { CellPos } from "../models/CellPos";
import { TileFactory } from "./TileFactory";
import { TileView } from "../../ui/TileView";

export class BoardOps {
  constructor(
    private readonly board: BoardModel,
    private readonly tiles: (BaseTile | null)[][],
    private readonly tileFactory: TileFactory,
    private readonly randomId: () => number,
  ) {}

  public generate(rows: number, cols: number): { pos: CellPos; id: number }[] {
    const created: { pos: CellPos; id: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = this.randomId();
        this.board.set({ r, c }, this.tileFactory.createTile(id));
        created.push({ pos: { r, c }, id });
      }
    }
    return created;
  }

  public moveDown(rows: number, cols: number): { from: CellPos; to: CellPos }[] {
    const moves: { from: CellPos; to: CellPos }[] = [];
    if (this.tiles.length < 2) return moves;
    
    for (let c = 0; c < cols; c++) {
      let write = 0;
      for (let r = 0; r < rows; r++) {
        const tile = this.tiles[r][c];
        if (!tile) continue;
        if (r !== write) {
          moves.push({ from: { r, c }, to: { r: write, c } });
          this.board.set({ r: write, c }, tile);
          this.board.set({ r, c }, null);
        }
        write++;
      }
    }
    return moves;
  }

  public fillEmpty(rows: number, cols: number): { pos: CellPos; id: number }[] {
    const created: { pos: CellPos; id: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!this.tiles[r][c]) {
          const id = this.randomId();
          this.board.set({ r, c }, this.tileFactory.createTile(id));
          created.push({ pos: { r, c }, id });
        }
      }
    }
    return created;
  }

  public shuffleIndices(count: number): number[] {
    const indices = Array.from({ length: count }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    return indices;
  }

  public shuffleTiles(
    rows: number,
    cols: number,
    getView: (pos: CellPos) => TileView | null,
    setView: (pos: CellPos, view: TileView) => void,
  ): { view: TileView; to: CellPos }[] {
    const positions: CellPos[] = [];
    const tiles: (BaseTile | null)[] = [];
    const views: (TileView | null)[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({ r, c });
        tiles.push(this.tiles[r][c]);
        views.push(getView({ r, c }));
      }
    }
    const indices = this.shuffleIndices(positions.length);
    const assignments: { view: TileView; to: CellPos }[] = [];
    for (let i = 0; i < positions.length; i++) {
      const fromIndex = indices[i];
      const pos = positions[i];
      const tile = tiles[fromIndex];
      const view = views[fromIndex];
      this.board.set(pos, tile);
      if (view) {
        setView(pos, view);
        assignments.push({ view, to: pos });
      }
    }
    return assignments;
  }
}
