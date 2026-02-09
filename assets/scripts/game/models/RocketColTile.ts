import { BaseTile } from "./BaseTile";
import { CellPos } from "./CellPos";
export class RocketColTile extends BaseTile {
  getAffected(
    allTiles: (BaseTile | null)[][],
    currentTile: CellPos,
  ): CellPos[] {
    let c = currentTile.c;
    const result: CellPos[] = [];
    for (let r = 0; r < allTiles.length; r++) {
      if (!allTiles[r][c]) continue;
      result.push({ r, c });
    }
    return result;
  }
}
