import { clamp } from "../../utils/Utils";
import { BaseTile } from "./BaseTile";
import { CellPos } from "./CellPos";
export class BombTile extends BaseTile {
  constructor(
    id: number,
    private readonly radius: number,
  ) {
    super(id);
  }
  public getAffected(
    allTiles: (BaseTile | null)[][],
    currentTile: CellPos,
  ): CellPos[] {
    const rows = allTiles.length;
    const cols = rows > 0 ? allTiles[0].length : 0;
    const r0 = clamp(currentTile.r - this.radius, 0, rows - 1);
    const r1 = clamp(currentTile.r + this.radius, 0, rows - 1);
    const c0 = clamp(currentTile.c - this.radius, 0, cols - 1);
    const c1 = clamp(currentTile.c + this.radius, 0, cols - 1);
    const result: CellPos[] = [];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!allTiles[r][c]) continue;
        result.push({ r, c });
      }
    }
    return result;
  }
}
