import { TileCatalogDTO } from "./TileConfig";
import { TileRegistry } from "./TileRegistry";
export class TileCatalogLoader {
  static loadRegistry(pathInResources: string): Promise<TileRegistry> {
    return new Promise((resolve, reject) => {
      cc.resources.load(
        pathInResources,
        cc.JsonAsset,
        (err, asset: cc.JsonAsset) => {
          if (err) return reject(err);
          const dto = asset.json as TileCatalogDTO;
          resolve(new TileRegistry(dto.tiles));
        },
      );
    });
  }
}
