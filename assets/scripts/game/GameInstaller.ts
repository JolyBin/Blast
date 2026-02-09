import { SuperRulesLoader } from "./configs/SuperRulesLoader"
import { BoosterConfigLoader } from "./configs/BoosterConfigLoader"
import { TileCatalogLoader } from "./configs/TileCatalogLoader"
import { BoardController } from "./controllers/BoardController"
import { SuperTileRules } from "./controllers/SuperTileRules"
import { TileFactory } from "./controllers/TileFactory"
import { BoardView } from "./views/BoardView"
import { HudView } from "./views/HudView"
import { ProgressController } from "./controllers/ProgressController"
import { BoosterController } from "./controllers/BoosterController"
import { BoosterView } from "./views/BoosterView"

const { ccclass, property } = cc._decorator

@ccclass
export class GameInstaller extends cc.Component {
  @property(BoardView) boardView: BoardView = null
  @property(HudView) hudView: HudView = null
  @property(BoosterView) boosterView: BoosterView = null
  @property startMoves: number = 30
  @property targetScore: number = 500
  @property rows: number = 8
  @property cols: number = 8
  @property catalogPath: string = "configs/tile_catalog"
  @property superRulesPath: string = "configs/super_rules"
  @property boostersPath: string = "configs/boosters"

  async start(): Promise<void> {

    const registry = await TileCatalogLoader.loadRegistry(this.catalogPath)
    const superRulesDto = await SuperRulesLoader.load(this.superRulesPath);


    const spawnTiles = registry.getSpawnTiles();
    const superTileRules = new SuperTileRules(superRulesDto);


    const framesById = new Map<number, cc.SpriteFrame>();
    for (const id of registry.getAllTile()) {
      const tile = registry.getTileConfigById(id);
      const frame = await this.loadSpriteFrame(tile.sprite);
      framesById.set(id, frame);
    }

    const boostersConfig = await BoosterConfigLoader.load(this.boostersPath);
    const tileFactory: TileFactory = new TileFactory(registry);

    const progress = new ProgressController(this.hudView ?? undefined);
    if (this.hudView) {
      this.hudView.onRestart = () => {
        const scene = cc.director.getScene();
        if (scene) cc.director.loadScene(scene.name);
      };
    }
    const controller = new BoardController(
      this.rows,
      this.cols,
      spawnTiles,
      tileFactory,
      superTileRules,
      this.boardView,
      framesById,
      this.startMoves,
      this.targetScore,
      progress
    );
    controller.start()

    const booster = new BoosterController(
      controller,
      this.boosterView ?? undefined,
      boostersConfig
    );
    booster.initCharges();
    if (this.boosterView) {
      this.boosterView.onToggle = (id) => booster.toggle(id);
    }
    this.boardView.onCellClick = (pos) => { booster.handleCellClick(pos); };
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
