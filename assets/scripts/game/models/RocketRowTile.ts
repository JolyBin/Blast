import { BaseTile } from "./BaseTile";
import { CellPos } from "./CellPos";
export class RocketRowTile extends BaseTile {
  getAffected(
    allTiles: (BaseTile | null)[][],
    currentTile: CellPos,
  ): CellPos[] {
    let r = currentTile.r;
    const result: CellPos[] = [];
    for (let c = 0; c < allTiles[r].length; c++) {
      if (!allTiles[r][c]) continue;
      result.push({ r, c });
    }
    return result;
  }
}
