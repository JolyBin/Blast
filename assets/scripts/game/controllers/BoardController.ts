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
        this.boardView.init(this.rows, this.cols)
        this.generate();
        this.boardView.onCellClick = (cellPos) => { this.tryCollectTiles(cellPos) };
    }

    public stop() {

    }

    private generate() {
        this.tiles = [];
        for (let r = 0; r < this.rows; r++) {
            const row: BaseTile[] = [];
            for (let c = 0; c < this.cols; c++) {
                const randomTileId: number = this.randomId();
                row.push(this.tileFactory.createTile(randomTileId));
                this.boardView.createTile({ r: r, c: c }, this.framesById.get(randomTileId))
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
            if(!(this.tiles[cellPos.r][cellPos.c] instanceof NormalTile) && !this.uniqSuperTiles.has(cellPos)) {
                this.activeteOtherSuperTiles(this.tiles[cellPos.r][cellPos.c].getAffected(this.tiles, cellPos), cellPos);
            }
        });
    }

    private async tryCollectTiles(cellPoss: CellPos) {
        let group = this.tiles[cellPoss.r][cellPoss.c].getAffected(this.tiles, cellPoss);

        if (group.length < this.superTileRules.minGroupToDestroy || this.isBusy)
            return;
        this.isBusy = true;

        let superId;
        if (this.tiles[cellPoss.r][cellPoss.c] instanceof NormalTile) {
            superId = this.superTileRules.pickSpawnId(group.length);
        }
        else{
            this.uniqSuperTiles = new UniqueCellPosSet(this.cols);
            this.uniqTiles = new UniqueCellPosSet(this.cols);
            this.activeteOtherSuperTiles(group, cellPoss);
            group = this.uniqTiles.toArray();
        }

        group.forEach(cellPoss => {
            this.boardView.setVisibleTile(cellPoss, false);
            this.tiles[cellPoss.r][cellPoss.c] = null;
        });

        await delay(200);
        if (superId) {
            this.tiles[cellPoss.r][cellPoss.c] = this.tileFactory.createTile(superId);
            this.boardView.setFrameTile({ r: cellPoss.r, c: cellPoss.c }, this.framesById.get(superId));
        }
        this.moveTileDown();
        this.updateViews();
        await delay(200);


        this.addNewTiles();
        this.isBusy = false;
    }

    private addNewTiles() {
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c]) {
                    const randomTileId: number = this.randomId();
                    this.tiles[r][c] = this.tileFactory.createTile(randomTileId);
                    this.boardView.setFrameTile({ r, c }, this.framesById.get(randomTileId));
                }
            }
        }
    }

    private updateViews() {
        for (let r = 0; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c]) {
                    this.boardView.setVisibleTile({ r, c }, false);
                }
                else {
                    this.boardView.setFrameTile({ r, c }, this.framesById.get(this.tiles[r][c].id));
                }
            }
        }
    }

    private moveTileDown() {
        if (this.tiles.length < 2)
            return;
        for (let r = 1; r < this.tiles.length; r++) {
            for (let c = 0; c < this.tiles.length; c++) {
                if (!this.tiles[r][c])
                    continue;
                let tempR = r;
                while (tempR > 0 && !this.tiles[tempR - 1][c]) {
                    this.tiles[tempR - 1][c] = this.tiles[tempR][c];
                    this.tiles[tempR][c] = null;
                    tempR--;
                }
            }
        }
    }
}
