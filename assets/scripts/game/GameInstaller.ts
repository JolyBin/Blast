import { JsonLoader } from "./configs/JsonLoader";
import { TileCatalogDTO, SuperRulesDTO } from "./configs/TileConfig";
import { TileRegistry } from "./configs/TileRegistry";
import { BoostersConfig } from "./configs/BoosterConfig";
import { UIConfig } from "./configs/UIConfig";
import { GameplayConfig } from "./configs/GameplayConfig";
import { BoardController } from "./controllers/BoardController";
import { SuperTileRules } from "./controllers/SuperTileRules";
import { TileFactory } from "./controllers/TileFactory";
import { BoardView } from "./views/BoardView";
import { HudView } from "./views/HudView";
import { ProgressController } from "./controllers/ProgressController";
import { BoosterController } from "./controllers/BoosterController";
import { BoosterView } from "./views/BoosterView";
const { ccclass, property } = cc._decorator;
@ccclass
export class GameInstaller extends cc.Component {
  @property(BoardView) boardView: BoardView = null;
  @property(HudView) hudView: HudView = null;
  @property(BoosterView) boosterView: BoosterView = null;
  public startMoves: number = 30;
  public targetScore: number = 500;
  public rows: number = 8;
  public cols: number = 8;
  @property catalogPath: string = "configs/tile_catalog";
  @property superRulesPath: string = "configs/super_rules";
  @property boostersPath: string = "configs/boosters";
  @property uiConfigPath: string = "configs/ui";
  @property gameplayConfigPath: string = "configs/gameplay";
  async start(): Promise<void> {
    const catalogDto = await JsonLoader.load<TileCatalogDTO>(this.catalogPath);
    const registry = new TileRegistry(catalogDto.tiles);
    const superRulesDto = await JsonLoader.load<SuperRulesDTO>(
      this.superRulesPath,
    );
    const uiConfig = await JsonLoader.load<UIConfig>(this.uiConfigPath);
    const gameplayConfig = await JsonLoader.load<GameplayConfig>(
      this.gameplayConfigPath,
    );
    this.startMoves = gameplayConfig.startMoves;
    this.targetScore = gameplayConfig.targetScore;
    this.rows = gameplayConfig.rows;
    this.cols = gameplayConfig.cols;
    const spawnTiles = registry.getSpawnTiles();
    const superTileRules = new SuperTileRules(superRulesDto);
    const framesById = new Map<number, cc.SpriteFrame>();
    for (const id of registry.getAllTile()) {
      const tile = registry.getTileConfigById(id);
      const frame = await this.loadSpriteFrame(tile.sprite);
      framesById.set(id, frame);
    }
    const boostersConfig = await JsonLoader.load<BoostersConfig>(
      this.boostersPath,
    );
    const tileFactory: TileFactory = new TileFactory(registry);
    const progress = new ProgressController(this.hudView ?? undefined);
    if (this.hudView) {
      this.hudView.onRestart = () => {
        const scene = cc.director.getScene();
        if (scene) cc.director.loadScene(scene.name);
      };
    }
    if (this.boardView) {
      this.boardView.applyGridConfig({
        tileWidth: gameplayConfig.tileWidth,
        tileHeight: gameplayConfig.tileHeight,
        spacingX: gameplayConfig.spacingX,
        spacingY: gameplayConfig.spacingY,
      });
      this.boardView.applyConfig(uiConfig?.board);
      this.boardView.applyTileConfig(uiConfig?.tile);
    }
    if (this.hudView) {
      this.hudView.applyConfig(uiConfig?.hud);
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
      progress,
    );
    await controller.start();
    const booster = new BoosterController(
      controller,
      this.boosterView ?? undefined,
      boostersConfig,
    );
    booster.initCharges();
    if (this.boosterView) {
      this.boosterView.onToggle = (id) => booster.toggle(id);
    }
    this.boardView.onCellClick = (pos) => {
      booster.handleCellClick(pos);
    };
    this.hudView?.playStartFade();
  }
  private loadSpriteFrame(pathInResources: string): Promise<cc.SpriteFrame> {
    return new Promise((resolve, reject) => {
      cc.resources.load(pathInResources, cc.SpriteFrame, (err, asset) => {
        if (err) return reject(err);
        resolve(asset);
      });
    });
  }
}
