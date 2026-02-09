import { BoardView } from "../views/BoardView";
import { TileFactory } from "./TileFactory";
import { BaseTile } from "../models/BaseTile";
import { CellPos, UniqueCellPosSet } from "../models/CellPos";
import { delay } from "../../utils/Utils";
import { SuperTileRules } from "./SuperTileRules";
import { NormalTile } from "../models/NormalTile";
import { ProgressController } from "./ProgressController";
import { TileView } from "../views/TileView";

export class BoardController {
    private tiles: BaseTile[][];
    private isBusy = false;
    private isGameOver = false;
    private uniqSuperTiles: UniqueCellPosSet
    private uniqTiles: UniqueCellPosSet
    private progress: ProgressController;
    private reshufflesLeft = 3;

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
        progress: ProgressController
    ) {
        this.progress = progress;
    }

    public async start() {
        this.isGameOver = false;
        this.reshufflesLeft = 3;
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
        await this.tryCollectTiles(cellPos);
    }

    public setSelection(pos: CellPos, selected: boolean): void {
        this.boardView.setSelected(pos, selected);
    }

    public stop() {

    }

    private generate() {
        this.tiles = [];
        this.boardView.init(this.rows, this.cols);
        for (let r = 0; r < this.rows; r++) {
            const row: BaseTile[] = [];
            for (let c = 0; c < this.cols; c++) {
                const randomTileId: number = this.randomId();
                row.push(this.tileFactory.createTile(randomTileId));
                this.boardView.setFrameTile({ r: r, c: c }, this.framesById.get(randomTileId))
            }
            this.tiles.push(row);
        }
    }

    private randomId(): number {
        const i = Math.floor(Math.random() * this.spawnTiles.length);
        return this.spawnTiles[i];
    }

    private activeteOtherSuperTiles(activeTiles: CellPos[], currentTile: CellPos) {
        this.uniqSuperTiles.add(currentTile);

        activeTiles.forEach(cellPos => {
            this.uniqTiles.add(cellPos);
            if (!(this.tiles[cellPos.r][cellPos.c] instanceof NormalTile) && !this.uniqSuperTiles.has(cellPos)) {
                this.activeteOtherSuperTiles(this.tiles[cellPos.r][cellPos.c].getAffected(this.tiles, cellPos), cellPos);
            }
        });
    }

    private async tryCollectTiles(cellPoss: CellPos) {
        if (this.isBusy || this.isGameOver) return

        const clickedTile = this.tiles[cellPoss.r][cellPoss.c];
        let group = clickedTile.getAffected(this.tiles, cellPoss)

        const isNormal = clickedTile instanceof NormalTile;
        if (isNormal && group.length < this.superTileRules.minGroupToDestroy)
            return

        if (!this.progress.canSpendMove()) {
            this.endGame(false);
            return;
        }
        this.progress.spendMove();
        this.isBusy = true

        let superId: number | null = null

        if (isNormal) {
            superId = this.superTileRules.pickSpawnId(group.length)
        }
        else {
            this.uniqSuperTiles = new UniqueCellPosSet(this.cols)
            this.uniqTiles = new UniqueCellPosSet(this.cols)
            this.activeteOtherSuperTiles(group, cellPoss)
            group = this.uniqTiles.toArray()
        }

        // 3) РЎРќРђР§РђР›Рђ Р°РЅРёРјР°С†РёСЏ РёСЃС‡РµР·РЅРѕРІРµРЅРёСЏ (await)
        await this.boardView.hideTilesAnimated(group)
        this.addScore(group.length);

        // 4) РўРµРїРµСЂСЊ РјРµРЅСЏРµРј РјРѕРґРµР»СЊ (РїРѕСЃР»Рµ Р°РЅРёРјР°С†РёРё)
        group.forEach(p => {
            this.tiles[p.r][p.c] = null
        })

        // 5) РЎРїР°РІРЅРёРј СЃСѓРїРµСЂС‚Р°Р№Р»
        if (superId) {
            this.tiles[cellPoss.r][cellPoss.c] = this.tileFactory.createTile(superId)
            this.boardView.createTileInPlace(cellPoss, this.framesById.get(superId))
        }

        // 6) Р”Р°Р»СЊС€Рµ Сѓ С‚РµР±СЏ Р±СѓРґРµС‚ РїР°РґРµРЅРёРµ (РїРѕР·Р¶Рµ С‚РѕР¶Рµ Р°РЅРёРјРёСЂСѓРµРј)
        const moves = this.moveTileDown()
        await this.boardView.moveTilesAnimated(moves)

        // РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РјР°Р»РµРЅСЊРєСѓСЋ РїР°СѓР·Сѓ РµСЃР»Рё С…РѕС‡РµС‚СЃСЏ

        let newTiles = this.addNewTiles();
        this.boardView.renderTilesAnimated(newTiles);
        await delay(80)

        if (this.checkEndConditions()) {
            this.isBusy = false;
            return;
        }

        if (!await this.afterBoardAction()) return;
        this.isBusy = false;
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
        this.tiles[a.r][a.c] = tb;
        this.tiles[b.r][b.c] = ta;
        await this.boardView.swapTilesAnimated(a, b);
        if (!await this.afterBoardAction()) return;
        this.isBusy = false;
    }

    public async activateSuperAt(pos: CellPos, superId: number): Promise<void> {
        if (this.isBusy || this.isGameOver) return;
        this.isBusy = true;
        const superTile = this.tileFactory.createTile(superId);
        this.tiles[pos.r][pos.c] = superTile;
        this.boardView.createTileInPlace(pos, this.framesById.get(superId));

        let group = superTile.getAffected(this.tiles, pos);
        if (group.length === 0) {
            this.isBusy = false;
            return;
        }

        await this.boardView.hideTilesAnimated(group)
        this.addScore(group.length);
        group.forEach(p => {
            this.tiles[p.r][p.c] = null
        })

        const moves = this.moveTileDown()
        await this.boardView.moveTilesAnimated(moves)
        let newTiles = this.addNewTiles();
        this.boardView.renderTilesAnimated(newTiles);
        await delay(80)

        if (this.checkEndConditions()) {
            this.isBusy = false;
            return;
        }
        if (!await this.afterBoardAction()) return;
        this.isBusy = false;
    }


    private addNewTiles(): CellPos[] {
        const result: CellPos[] = [];
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c]) {
                    const randomTileId: number = this.randomId();
                    this.tiles[r][c] = this.tileFactory.createTile(randomTileId);
                    result.push({ r, c });
                    this.boardView.createTile({ r, c }, this.framesById.get(randomTileId));
                }
            }
        }
        return result;
    }

    private moveTileDown(): { from: CellPos; to: CellPos }[] {
        const moves: { from: CellPos; to: CellPos }[] = [];
        if (this.tiles.length < 2) return moves;

        for (let c = 0; c < this.cols; c++) {
            let write = 0;
            for (let r = 0; r < this.rows; r++) {
                const tile = this.tiles[r][c];
                if (!tile) continue;
                if (r !== write) {
                    moves.push({ from: { r, c }, to: { r: write, c } });
                    this.tiles[write][c] = tile;
                    this.tiles[r][c] = null;
                }
                write++;
            }
        }

        return moves;
    }

    private addScore(groupSize: number): void {
        const gained = groupSize * 10;
        this.progress.addScore(gained);
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
        if (this.checkEndConditions()) {
            this.isBusy = false;
            return false;
        }
        if (await this.tryShuffleToGetMove()) {
            this.endGame(false);
            this.isBusy = false;
            return false;
        }
        return true;
    }

    private async tryShuffleToGetMove(): Promise<boolean> {
        if (!this.hasAnyMove()) {
            this.reshufflesLeft -= 1;
            let newPos = this.shuffleTilesAnimated();
            let checkLoop = 1000;
            while (!this.hasAnyMove() && checkLoop > 0) {
                checkLoop--;
                newPos = this.shuffleTilesAnimated();
            }

            await this.boardView.animateViewsToPositions(newPos);
        }
        return this.reshufflesLeft < 0;
    }

    private shuffleTilesAnimated(): { view: TileView, to: CellPos }[] {
        const positions: CellPos[] = [];
        const tiles: BaseTile[] = [];
        const views: TileView[] = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                positions.push({ r, c });
                tiles.push(this.tiles[r][c]);
                views.push(this.boardView.getTileView({ r, c }));
            }
        }

        const indices = positions.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }

        const assignments: { view: TileView; to: CellPos }[] = [];
        for (let i = 0; i < positions.length; i++) {
            const fromIndex = indices[i];
            const pos = positions[i];
            const tile = tiles[fromIndex];
            const view = views[fromIndex];
            this.tiles[pos.r][pos.c] = tile;
            if (view) {
                this.boardView.setTileView(pos, view);
                assignments.push({ view, to: pos });
            }
        }
        return assignments;
    }

    private endGame(isWin: boolean): void {
        this.isGameOver = true;
        this.boardView.onCellClick = null;
        this.progress.showResult(isWin ? "Победа" : "Поражение");
    }

    private hasAnyMove(): boolean {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.tiles[r][c];
                if (!tile) continue;
                const count = tile.getAffected(this.tiles, { r, c }).length;
                if (count >= this.superTileRules.minGroupToDestroy)
                    return true;
            }
        }
        return false;
    }
}
