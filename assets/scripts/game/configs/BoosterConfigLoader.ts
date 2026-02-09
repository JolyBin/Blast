import { BoostersConfig } from "./BoosterConfig";
export class BoosterConfigLoader {
  static load(pathInResources: string): Promise<BoostersConfig> {
    return new Promise((resolve, reject) => {
      cc.resources.load(
        pathInResources,
        cc.JsonAsset,
        (err, asset: cc.JsonAsset) => {
          if (err) return reject(err);
          resolve(asset.json as BoostersConfig);
        },
      );
    });
  }
}
