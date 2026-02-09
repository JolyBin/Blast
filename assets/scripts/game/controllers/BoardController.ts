import { BoardView } from "../views/BoardView";
import { TileFactory } from "./TileFactory";
import { BaseTile } from "../models/BaseTile";
import { CellPos, UniqueCellPosSet } from "../models/CellPos";
import { delay } from "../../utils/Utils";
import { SuperTileRules } from "./SuperTileRules";
import { NormalTile } from "../models/NormalTile";
import { ProgressController } from "./ProgressController";

export class BoardController {
    private tiles: BaseTile[][];
    private isBusy = false;
    private isGameOver = false;
    private uniqSuperTiles: UniqueCellPosSet
    private uniqTiles: UniqueCellPosSet
    private progress: ProgressController;

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

    public start() {
        this.isGameOver = false;
        this.progress.init(this.startMoves, this.targetScore);
        this.generate();
        if (!this.hasAnyMove()) {
            this.endGame(false);
            return;
        }
        this.boardView.onCellClick = (cellPos) => { this.tryCollectTiles(cellPos) };
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

        if (!this.hasAnyMove()) {
            this.endGame(false);
            this.isBusy = false;
            return;
        }

        this.isBusy = false
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

    private endGame(isWin: boolean): void {
        this.isGameOver = true;
        this.boardView.onCellClick = null;
        this.progress.showResult(isWin ? "WIN" : "LOSE");
    }

    private hasAnyMove(): boolean {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.tiles[r][c];
                if (!tile) continue;
                if (!(tile instanceof NormalTile)) return true;
            }
        }

        const visited: boolean[][] = new Array(this.rows);
        for (let r = 0; r < this.rows; r++) {
            visited[r] = new Array(this.cols).fill(false);
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (visited[r][c]) continue;
                const tile = this.tiles[r][c];
                if (!tile || !(tile instanceof NormalTile)) continue;
                const count = this.countGroupSize(r, c, tile.id, visited);
                if (count >= this.superTileRules.minGroupToDestroy) return true;
            }
        }
        return false;
    }

    private countGroupSize(sr: number, sc: number, id: number, visited: boolean[][]): number {
        let count = 0;
        const stack: CellPos[] = [{ r: sr, c: sc }];
        while (stack.length > 0) {
            const p = stack.pop();
            if (visited[p.r][p.c]) continue;
            visited[p.r][p.c] = true;
            const tile = this.tiles[p.r][p.c];
            if (!tile || !(tile instanceof NormalTile) || tile.id !== id) continue;
            count++;
            if (p.r > 0) stack.push({ r: p.r - 1, c: p.c });
            if (p.r + 1 < this.rows) stack.push({ r: p.r + 1, c: p.c });
            if (p.c > 0) stack.push({ r: p.r, c: p.c - 1 });
            if (p.c + 1 < this.cols) stack.push({ r: p.r, c: p.c + 1 });
        }
        return count;
    }
}
