import { BoardView } from "../views/BoardView";
import { TileFactory } from "./TileFactory";
import { BaseTile } from "../models/BaseTile";
import { CellPos } from "../models/CellPos";
import { delay } from "../../utils/Deley";

export class BoardController {
    private tile: BaseTile[][];
    private isBusy = false;

    constructor(
        public readonly rows: number,
        public readonly cols: number,
        private readonly spawnTiles: number[],
        private readonly tileFactory: TileFactory,
        private readonly boardView: BoardView,
        private readonly framesById: Map<number, cc.SpriteFrame>
    ) { }

    public start() {
        this.boardView.init(this.rows, this.cols)
        this.generate();
        this.boardView.onCellClick = (cellPos) => { this.tryCollectTiles(cellPos) };
    }

    public stop() {

    }

    private generate() {
        this.tile = [];
        for (let r = 0; r < this.rows; r++) {
            const row: BaseTile[] = [];
            for (let c = 0; c < this.cols; c++) {
                const randomTileId: number = this.randomId();
                row.push(this.tileFactory.createTile(randomTileId));
                this.boardView.createTile({ r: r, c: c }, this.framesById.get(randomTileId))
            }
            this.tile.push(row);
        }
    }

    private randomId(): number {
        const i = Math.floor(Math.random() * this.spawnTiles.length);
        return this.spawnTiles[i];
    }

    private async tryCollectTiles(cellPoss: CellPos) {
        const group = this.tile[cellPoss.r][cellPoss.c].getAffected(this.tile, cellPoss);
        if (group.length < 2 || this.isBusy)
            return;
        this.isBusy = true;
        group.forEach(cellPoss => {
            this.boardView.setVisibleTile(cellPoss, false);
            this.tile[cellPoss.r][cellPoss.c] = null;
        });
        await delay(200);
        this.moveTileDown();
        this.updateViews();
        await delay(200);
        this.addNewTiles();
        this.isBusy = false;
    }

    private addNewTiles() {
        for (let r = 0; r < this.tile.length; r++) {
            for (let c = 0; c < this.tile.length; c++) {
                if (this.tile[r][c] == null) {
                    const randomTileId: number = this.randomId();
                    this.tile[r][c] = this.tileFactory.createTile(randomTileId);
                    this.boardView.setFrameTile({ r: r, c: c }, this.framesById.get(randomTileId));
                }
            }
        }
    }

    private updateViews() {
        for (let r = 0; r < this.tile.length; r++) {
            for (let c = 0; c < this.tile.length; c++) {
                if (this.tile[r][c] == null) {
                    this.boardView.setVisibleTile({ r: r, c: c }, false);
                }
                else {
                    this.boardView.setFrameTile({ r: r, c: c }, this.framesById.get(this.tile[r][c].id));
                }
            }
        }
    }

    private moveTileDown() {
        if (this.tile.length < 2)
            return;
        for (let r = 1; r < this.tile.length; r++) {
            for (let c = 0; c < this.tile.length; c++) {
                if (this.tile[r][c] == null)
                    continue;
                let tempR = r;
                while (tempR > 0 && this.tile[tempR - 1][c] == null) {
                    this.tile[tempR - 1][c] = this.tile[tempR][c];
                    this.tile[tempR][c] = null;
                    tempR--;
                }
            }
        }
    }
}
