import { BoardView } from "../ui/BoardView";
import { TileFactory } from "../core/logic/TileFactory";
import { BaseTile } from "../core/models/BaseTile";
import { BoardModel } from "../core/models/BoardModel";
import { CellPos } from "../core/models/CellPos";
import { SuperTileRules } from "../core/logic/SuperTileRules";
import { ProgressController } from "./ProgressController";
import { TileView } from "../ui/TileView";
import { BoardOps } from "../core/logic/BoardOps";
import { BoardRules } from "../core/logic/BoardRules";
import { BoardAction } from "../core/logic/BoardAction";
export class BoardController {
  private tiles: (BaseTile | null)[][];
  private board: BoardModel;
  private isBusy = false;
  private isGameOver = false;
  private progress: ProgressController;
  private reshufflesLeft = 3;
  private ops: BoardOps;
  private rules: BoardRules;
  private actions: BoardAction;
  constructor(
    public readonly rows: number,
    public readonly cols: number,
    private readonly spawnTiles: number[],
    private readonly tileFactory: TileFactory,
    private readonly superTileRules: SuperTileRules,
    private readonly boardView: BoardView,
    private readonly framesById: Map<number, cc.SpriteFrame>,
    private readonly startMoves: number,
    private readonly targetScore: number,
    private readonly scorePerTile: number,
    private readonly reshuffles: number,
    progress: ProgressController,
  ) {
    this.progress = progress;
  }
  public async start() {
    this.isGameOver = false;
    this.reshufflesLeft = this.reshuffles;
    this.progress.init(this.startMoves, this.targetScore);
    this.generate();
    if (await this.tryShuffleToGetMove()) {
      this.endGame(false);
      return;
    }
    this.boardView.onCellClick = null;
  }
  public isBusyOrOver(): boolean {
    return this.isBusy || this.isGameOver;
  }
  public async handleBoardClick(cellPos: CellPos): Promise<void> {
    if (this.isBusy || this.isGameOver) return;
    this.isBusy = true;
    const result = await this.actions.handleBoardClick(
      cellPos,
      () => this.checkEndConditions(),
      () => this.afterBoardAction(),
    );
    if (result === "no_moves") this.endGame(false);
    this.isBusy = false;
  }
  public setSelection(pos: CellPos, selected: boolean): void {
    this.boardView.setSelected(pos, selected);
  }
  public stop() {}
  private generate() {
    this.board = new BoardModel(this.rows, this.cols);
    this.tiles = this.board.getGrid();
    this.ops = new BoardOps(this.board, this.tiles, this.tileFactory, () =>
      this.randomId(),
    );
    this.rules = new BoardRules(this.superTileRules, this.cols);
    this.actions = new BoardAction(
      this.board,
      this.tiles,
      this.tileFactory,
      this.framesById,
      this.boardView,
      this.rules,
      this.ops,
      this.progress,
      this.scorePerTile,
    );
    this.boardView.init(this.rows, this.cols);
    const created = this.ops.generate(this.rows, this.cols);
    created.forEach((t) => {
      this.boardView.setFrameTile(t.pos, this.framesById.get(t.id));
    });
  }
  private randomId(): number {
    const i = Math.floor(Math.random() * this.spawnTiles.length);
    return this.spawnTiles[i];
  }
  public getTileId(pos: CellPos): number | null {
    const t = this.tiles[pos.r]?.[pos.c];
    return t ? t.id : null;
  }
  public async swapTiles(a: CellPos, b: CellPos): Promise<void> {
    if (this.isBusy || this.isGameOver) return;
    const ta = this.tiles[a.r]?.[a.c];
    const tb = this.tiles[b.r]?.[b.c];
    if (!ta || !tb) return;
    this.isBusy = true;
    this.board.swap(a, b);
    await this.boardView.swapTilesAnimated(a, b);
    if (!(await this.afterBoardAction())) return;
    this.isBusy = false;
  }
  public async activateSuperAt(pos: CellPos, superId: number): Promise<void> {
    if (this.isBusy || this.isGameOver) return;
    this.isBusy = true;
    const result = await this.actions.activateSuperAt(
      pos,
      superId,
      () => this.checkEndConditions(),
      () => this.afterBoardAction(),
    );
    if (result === "no_moves") this.endGame(false);
    this.isBusy = false;
  }
  private checkEndConditions(): boolean {
    if (this.progress.isWin()) {
      this.endGame(true);
      return true;
    }
    if (this.progress.getMoves() <= 0) {
      this.endGame(false);
      return true;
    }
    return false;
  }
  private async afterBoardAction(): Promise<boolean> {
    if (this.checkEndConditions()) return false;
    if (await this.tryShuffleToGetMove()) {
      this.endGame(false);
      return false;
    }
    return true;
  }
  private async tryShuffleToGetMove(): Promise<boolean> {
    if (!this.rules.hasAnyMove(this.tiles, this.rows, this.cols)) {
      this.reshufflesLeft -= 1;
      let newPos = this.shuffleTilesAnimated();
      let checkLoop = 1000;
      while (!this.rules.hasAnyMove(this.tiles, this.rows, this.cols) && checkLoop > 0) {
        checkLoop--;
        newPos = this.shuffleTilesAnimated();
      }
      await this.boardView.animateViewsToPositions(newPos);
    }
    return this.reshufflesLeft < 0;
  }
  private shuffleTilesAnimated(): { view: TileView; to: CellPos }[] {
    return this.ops.shuffleTiles(
      this.rows,
      this.cols,
      (pos) => this.boardView.getTileView(pos),
      (pos, view) => this.boardView.setTileView(pos, view),
    );
  }
  private endGame(isWin: boolean): void {
    this.isGameOver = true;
    this.boardView.onCellClick = null;
    this.progress.showResult(isWin ? "Победа" : "Поражение");
  }
}
