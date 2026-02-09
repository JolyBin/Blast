import { BoardView } from "../views/BoardView";
import { TileFactory } from "./TileFactory";
import { BaseTile } from "../models/BaseTile";
import { CellPos, UniqueCellPosSet } from "../models/CellPos";
import { delay } from "../../utils/Utils";
import { SuperTileRules } from "./SuperTileRules";
import { NormalTile } from "../models/NormalTile";

export class BoardController {
    private tiles: BaseTile[][];
    private isBusy = false;
    private uniqSuperTiles: UniqueCellPosSet
    private uniqTiles: UniqueCellPosSet

    constructor(
        public readonly rows: number,
        public readonly cols: number,
        private readonly spawnTiles: number[],
        private readonly tileFactory: TileFactory,
        private readonly superTileRules: SuperTileRules,
        private readonly boardView: BoardView,
        private readonly framesById: Map<number, cc.SpriteFrame>
    ) { }

    public start() {
        this.generate();
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
        if (this.isBusy) return

        let group = this.tiles[cellPoss.r][cellPoss.c].getAffected(this.tiles, cellPoss)

        if (group.length < this.superTileRules.minGroupToDestroy)
            return

        this.isBusy = true

        let superId: number | null = null

        if (this.tiles[cellPoss.r][cellPoss.c] instanceof NormalTile) {
            superId = this.superTileRules.pickSpawnId(group.length)
        }
        else {
            this.uniqSuperTiles = new UniqueCellPosSet(this.cols)
            this.uniqTiles = new UniqueCellPosSet(this.cols)
            this.activeteOtherSuperTiles(group, cellPoss)
            group = this.uniqTiles.toArray()
        }

        // 3) СНАЧАЛА анимация исчезновения (await)
        await this.boardView.hideTilesAnimated(group)

        // 4) Теперь меняем модель (после анимации)
        group.forEach(p => {
            this.tiles[p.r][p.c] = null
        })

        // 5) Спавним супертайл
        if (superId) {
            this.tiles[cellPoss.r][cellPoss.c] = this.tileFactory.createTile(superId)
            this.boardView.createTileInPlace(cellPoss, this.framesById.get(superId))
        }

        // 6) Дальше у тебя будет падение (позже тоже анимируем)
        const moves = this.moveTileDown()
        await this.boardView.moveTilesAnimated(moves, 0.2)

        // можно оставить маленькую паузу если хочется
        
        let newTiles = this.addNewTiles();
        this.boardView.renderTilesAnimated(newTiles);
        await delay(80) 

        this.isBusy = false
    }


    private addNewTiles(): CellPos[] {
        const result: CellPos[] = [];
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c]) {
                    const randomTileId: number = this.randomId();
                    this.tiles[r][c] = this.tileFactory.createTile(randomTileId);
                    result.push({r, c});
                    this.boardView.createTile({r, c}, this.framesById.get(randomTileId));
                }
            }
        }
        return result;
    }

    private updateViews() {
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c]) {
                    
                }
                else {
                    this.boardView.setFrameTile({ r, c }, this.framesById.get(this.tiles[r][c].id));
                }
            }
        }
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
}
