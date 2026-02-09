import { SuperRulesDTO } from "./TileConfig";
export class SuperRulesLoader {
  static load(pathInResources: string): Promise<SuperRulesDTO> {
    return new Promise((resolve, reject) => {
      cc.resources.load(
        pathInResources,
        cc.JsonAsset,
        (err, asset: cc.JsonAsset) => {
          if (err) return reject(err);
          resolve(asset.json as SuperRulesDTO);
        },
      );
    });
  }
}
