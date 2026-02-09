import { BaseTile } from "../models/BaseTile";
import { CellPos, UniqueCellPosSet } from "../models/CellPos";
import { NormalTile } from "../models/NormalTile";
import { SuperTileRules } from "./SuperTileRules";

export class BoardRules {
  private uniqSuperTiles: UniqueCellPosSet;
  private uniqTiles: UniqueCellPosSet;
  constructor(
    private readonly superTileRules: SuperTileRules,
    private readonly cols: number,
  ) {}

  public canCollect(isNormal: boolean, groupSize: number): boolean {
    if (!isNormal) return true;
    return groupSize >= this.superTileRules.minGroupToDestroy;
  }

  public pickSuperId(groupSize: number): number | null {
    return this.superTileRules.pickSpawnId(groupSize);
  }

  public expandSuperGroup(
    tiles: (BaseTile | null)[][],
    group: CellPos[],
    currentTile: CellPos,
  ): CellPos[] {
    this.uniqSuperTiles = new UniqueCellPosSet(this.cols);
    this.uniqTiles = new UniqueCellPosSet(this.cols);
    this.activateOtherSuperTiles(tiles, group, currentTile);
    return this.uniqTiles.toArray();
  }

  private activateOtherSuperTiles(
    tiles: (BaseTile | null)[][],
    activeTiles: CellPos[],
    currentTile: CellPos,
  ) {
    this.uniqSuperTiles.add(currentTile);
    activeTiles.forEach((cellPos) => {
      this.uniqTiles.add(cellPos);
      const tile = tiles[cellPos.r][cellPos.c];
      if (!tile) return;
      if (!(tile instanceof NormalTile) && !this.uniqSuperTiles.has(cellPos)) {
        this.activateOtherSuperTiles(
          tiles,
          tile.getAffected(tiles, cellPos),
          cellPos,
        );
      }
    });
  }

  public hasAnyMove(
    tiles: (BaseTile | null)[][],
    rows: number,
    cols: number,
  ): boolean {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = tiles[r][c];
        if (!tile) continue;
        const count = tile.getAffected(tiles, { r, c }).length;
        if (count >= this.superTileRules.minGroupToDestroy) return true;
      }
    }
    return false;
  }
}
