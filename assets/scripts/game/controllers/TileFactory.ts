import { TileConfig } from "../configs/TileConfig"
import { TileRegistry } from "../configs/TileRegistry"
import { BaseTile } from "../models/BaseTile"
import { NormalTile } from "../models/NormalTile"
// import { RocketRowTile } ...
// import { RocketColTile } ...

export class TileFactory {
    constructor(private readonly registry: TileRegistry) { }

    public createTile(tileId: number): BaseTile {
        const tileConfig: TileConfig = this.registry.getTileConfig(tileId);
        switch (tileConfig.kind) {
            case "normal":
                return new NormalTile(tileConfig.id)
            case "bomb":
                // return new BombTile(def.id)
                return new NormalTile(tileConfig.id) // временно
            case "rocketRow":
                // return new RocketRowTile(def.id)
                return new NormalTile(tileConfig.id) // временно
            case "rocketCol":
                // return new RocketColTile(def.id)
                return new NormalTile(tileConfig.id)
        }
    }
}
