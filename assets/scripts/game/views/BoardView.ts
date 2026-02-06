import { TileView } from "./TileView"
import { CellPos } from "../models/CellPos";

const { ccclass, property } = cc._decorator

@ccclass
export class BoardView extends cc.Component {
    public onCellClick: ((pos: CellPos) => void) | null = null;

    @property(cc.Node)
    private tilesRoot: cc.Node = null;
    @property(cc.Prefab)
    private tilePrefab: cc.Prefab = null;

    private tileViews: TileView[][];

    public init(rows: number, cols: number): void {
        this.tileViews = new Array(rows);
        for (let i = 0; i < this.tileViews.length; i++) {
            this.tileViews[i] = new Array(cols);
        }
        this.tilesRoot.removeAllChildren()
    }

    public createTile(cellPos: CellPos, frame: cc.SpriteFrame): void {
        const node = cc.instantiate(this.tilePrefab);
        node.parent = this.tilesRoot;

        const tv = node.getComponent(TileView);
        tv.onClick = () => { this.onCellClick(cellPos); };
        this.tileViews[cellPos.r][cellPos.c] = tv;
        this.setFrameTile(cellPos, frame);
    }

    public setFrameTile(cellPos: CellPos, frame: cc.SpriteFrame) {
        this.tileViews[cellPos.r][cellPos.c].setFrame(frame);
        this.tileViews[cellPos.r][cellPos.c].setVisible(true);
    }

    public setVisibleTile(cellPos: CellPos, value: boolean) {
        this.tileViews[cellPos.r][cellPos.c].setVisible(value);
    }
}

