import { BoardView } from "../views/BoardView";

export class BoardController {
    private tile: number[][]

    constructor(
        public readonly rows: number,
        public readonly cols: number,
        private readonly spawnIds: number[],
        private readonly boardView: BoardView,
        private readonly framesById: Map<number, cc.SpriteFrame>
    ) { }

    public start() {
        this.generate();
        this.boardView.init(this.rows, this.cols)
        this.boardView.render(this.tile, this.framesById)
    }
    private generate() {
        this.tile = [];
        for (let r = 0; r < this.rows; r++) {
            const row: number[] = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(this.randomId());
            }
            this.tile.push(row);
        }
    }  

    private randomId(): number {
        const i = Math.floor(Math.random() * this.spawnIds.length);
        return this.spawnIds[i];
    }
}
