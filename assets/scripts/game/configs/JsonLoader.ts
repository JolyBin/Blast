export class JsonLoader {
  static load<T>(pathInResources: string): Promise<T> {
    return new Promise((resolve, reject) => {
      cc.resources.load(
        pathInResources,
        cc.JsonAsset,
        (err, asset: cc.JsonAsset) => {
          if (err) return reject(err);
          resolve(asset.json as T);
        },
      );
    });
  }
}
