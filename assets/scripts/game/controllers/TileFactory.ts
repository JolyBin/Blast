import { TileConfig } from "../configs/TileConfig";
import { TileRegistry } from "../configs/TileRegistry";
import { BaseTile } from "../models/BaseTile";
import { BombTile } from "../models/BombTile";
import { NormalTile } from "../models/NormalTile";
import { RocketColTile } from "../models/RocketColTile";
import { RocketRowTile } from "../models/RocketRowTile";
// import { RocketRowTile } ...
// import { RocketColTile } ...
export class TileFactory {
  constructor(private readonly registry: TileRegistry) {}
  public createTile(tileId: number): BaseTile {
    const tileConfig: TileConfig = this.registry.getTileConfigById(tileId);
    switch (tileConfig.kind) {
      case "normal":
        return new NormalTile(tileConfig.id);
      case "bomb":
        // return new BombTile(def.id)
        return new BombTile(tileConfig.id, tileConfig.radius); // РІСЂРµРјРµРЅРЅРѕ
      case "rocketRow":
        // return new RocketRowTile(def.id)
        return new RocketRowTile(tileConfig.id); // РІСЂРµРјРµРЅРЅРѕ
      case "rocketCol":
        // return new RocketColTile(def.id)
        return new RocketColTile(tileConfig.id);
    }
  }
}
