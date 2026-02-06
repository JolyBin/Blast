import { SuperRulesLoader } from "./configs/SuperRulesLoader"
import { TileCatalogLoader } from "./configs/TileCatalogLoader"
import { BoardController } from "./controllers/BoardController"
import { SuperTileRules } from "./controllers/SuperTileRules"
import { TileFactory } from "./controllers/TileFactory"
import { BoardView } from "./views/BoardView"

const { ccclass, property } = cc._decorator

@ccclass
export class GameInstaller extends cc.Component {
  @property(BoardView) boardView: BoardView = null
  @property rows: number = 8
  @property cols: number = 8
  @property catalogPath: string = "configs/tile_catalog"
  @property superRulesPath: string = "configs/super_rules"

  async start(): Promise<void> {
    // 1) грузим JSON
    const registry = await TileCatalogLoader.loadRegistry(this.catalogPath)
    const superRulesDto = await SuperRulesLoader.load(this.superRulesPath);

    // 2) готовим список ID для спавна (только normal)
    const spawnTiles = registry.getSpawnTiles();
    const superTileRules = new SuperTileRules(superRulesDto);

    // 3) грузим SpriteFrame для каждого id и складываем в map
    const framesById = new Map<number, cc.SpriteFrame>();
    for (const id of registry.getAllTile()) {
      const tile = registry.getTileConfigById(id);
      const frame = await this.loadSpriteFrame(tile.sprite);
      framesById.set(id, frame);
    }

    const tileFactory: TileFactory = new TileFactory(registry);
    // 4) генерим модель
    const controller = new BoardController(this.rows, this.cols, spawnTiles, tileFactory, superTileRules, this.boardView, framesById)
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
