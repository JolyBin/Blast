import { TileView } from "./TileView"

const { ccclass, property } = cc._decorator

@ccclass
export class BoardView extends cc.Component {
  @property(cc.Node) tilesRoot: cc.Node = null
  @property(cc.Prefab) tilePrefab: cc.Prefab = null

  private rows = 0
  private cols = 0

  public init(rows: number, cols: number): void {
    this.rows = rows
    this.cols = cols
  }

  public render(ids: number[][], framesById: Map<number, cc.SpriteFrame>): void {
    this.tilesRoot.removeAllChildren()

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const id = ids[r][c]

        const frame = framesById.get(id)
        if (!frame) throw new Error(`BoardView: missing SpriteFrame for id=${id}`)

        const node = cc.instantiate(this.tilePrefab)
        node.parent = this.tilesRoot

        const tv = node.getComponent(TileView)
        tv.setFrame(frame)
      }
    }
  }
}

