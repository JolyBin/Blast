import { CellPos } from "./CellPos";
export abstract class BaseTile {
  constructor(public readonly id: number) {}
  public abstract getAffected(
    allTiles: (BaseTile | null)[][],
    currentTile: CellPos,
  ): CellPos[];
}
