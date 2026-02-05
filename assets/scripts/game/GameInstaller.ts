import { TileCatalogLoader } from "./configs/TileCatalogLoader"
import { BoardController } from "./controllers/BoardController"
import { BoardView } from "./views/BoardView"

const { ccclass, property } = cc._decorator

@ccclass
export class GameInstaller extends cc.Component {
  @property(BoardView) boardView: BoardView = null
  @property rows: number = 8
  @property cols: number = 8
  @property catalogPath: string = "configs/tile_catalog"

  async start(): Promise<void> {
    // 1) грузим JSON
    const registry = await TileCatalogLoader.loadRegistry(this.catalogPath)

    // 2) готовим список ID для спавна (только normal)
    const spawnIds = registry.getSpawnTiles()

    // 3) грузим SpriteFrame для каждого id и складываем в map
    const framesById = new Map<number, cc.SpriteFrame>()
    for (const id of spawnIds) {
      const def = registry.getTile(id)
      const frame = await this.loadSpriteFrame(def.sprite)
      framesById.set(id, frame)
    }

    // 4) генерим модель
    const controller = new BoardController(this.rows, this.cols, spawnIds, this.boardView, framesById)
    const ids = controller.start()
  }

  private loadSpriteFrame(pathInResources: string): Promise<cc.SpriteFrame> {
    return new Promise((resolve, reject) => {
      cc.resources.load(pathInResources, cc.SpriteFrame, (err, asset) => {
        if (err) return reject(err)
        resolve(asset)
      })
    })
  }
}
