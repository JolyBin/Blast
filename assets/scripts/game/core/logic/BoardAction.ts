import { BaseTile } from "../models/BaseTile";
import { BoardModel } from "../models/BoardModel";
import { CellPos } from "../models/CellPos";
import { NormalTile } from "../models/NormalTile";
import { BoardOps } from "./BoardOps";
import { BoardRules } from "./BoardRules";
import { ProgressController } from "../../app/ProgressController";
import { TileFactory } from "./TileFactory";
import { BoardView } from "../../ui/BoardView";

export type ActionResult = "ignored" | "no_moves" | "done" | "stopped";

export class BoardAction {
  constructor(
    private readonly board: BoardModel,
    private readonly tiles: (BaseTile | null)[][],
    private readonly tileFactory: TileFactory,
    private readonly framesById: Map<number, cc.SpriteFrame>,
    private readonly boardView: BoardView,
    private readonly rules: BoardRules,
    private readonly ops: BoardOps,
    private readonly progress: ProgressController,
    private readonly scorePerTile: number,
  ) {}

  public async handleBoardClick(
    cellPos: CellPos,
    checkEnd: () => boolean,
    afterAction: () => Promise<boolean>,
  ): Promise<ActionResult> {
    const clickedTile = this.tiles[cellPos.r][cellPos.c];
    if (!clickedTile) return "ignored";
    let group = clickedTile.getAffected(this.tiles, cellPos);
    const isNormal = clickedTile instanceof NormalTile;
    if (!this.rules.canCollect(isNormal, group.length)) return "ignored";
    if (!this.progress.canSpendMove()) return "no_moves";
    this.progress.spendMove();
    let superId: number | null = null;
    if (isNormal) {
      superId = this.rules.pickSuperId(group.length);
    } else {
      group = this.rules.expandSuperGroup(this.tiles, group, cellPos);
    }
    const ok = await this.resolveAfterDestroy(
      group,
      superId ? { pos: cellPos, id: superId } : null,
      checkEnd,
      afterAction,
    );
    return ok ? "done" : "stopped";
  }

  public async activateSuperAt(
    pos: CellPos,
    superId: number,
    checkEnd: () => boolean,
    afterAction: () => Promise<boolean>,
  ): Promise<ActionResult> {
    const superTile = this.tileFactory.createTile(superId);
    this.board.set(pos, superTile);
    this.boardView.createTileInPlace(pos, this.framesById.get(superId));
    let group = superTile.getAffected(this.tiles, pos);
    group = this.rules.expandSuperGroup(this.tiles, group, pos);
    if (group.length === 0) return "ignored";
    const ok = await this.resolveAfterDestroy(group, null, checkEnd, afterAction);
    return ok ? "done" : "stopped";
  }

  private addScore(groupSize: number): void {
    const gained = groupSize * this.scorePerTile;
    this.progress.addScore(gained);
  }

  private async resolveAfterDestroy(
    group: CellPos[],
    spawnSuper: { pos: CellPos; id: number } | null,
    checkEnd: () => boolean,
    afterAction: () => Promise<boolean>,
  ): Promise<boolean> {
    await this.boardView.hideTilesAnimated(group);
    this.addScore(group.length);
    group.forEach((p) => {
      this.board.set(p, null);
    });
    if (spawnSuper) {
      this.board.set(spawnSuper.pos, this.tileFactory.createTile(spawnSuper.id));
      this.boardView.createTileInPlace(
        spawnSuper.pos,
        this.framesById.get(spawnSuper.id),
      );
    }
    const moves = this.ops.moveDown(this.tiles.length, this.tiles[0].length);
    await this.boardView.moveTilesAnimated(moves);
    const newTiles = this.ops.fillEmpty(this.tiles.length, this.tiles[0].length);
    newTiles.forEach((t) => {
      this.boardView.createTile(t.pos, this.framesById.get(t.id));
    });
    await this.boardView.renderTilesAnimated(newTiles.map((t) => t.pos));
    if (checkEnd()) return false;
    return await afterAction();
  }
}
