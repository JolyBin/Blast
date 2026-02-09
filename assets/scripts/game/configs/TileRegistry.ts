import { TileConfig, TileType } from "./TileConfig";
export class TileRegistry {
  private byId = new Map<number, TileConfig>();
  constructor(tiles: TileConfig[]) {
    for (const d of tiles) this.byId.set(d.id, d);
  }
  public getTileConfigById(id: number): TileConfig {
    const config = this.byId.get(id);
    if (!config) throw new Error(`No Tile for id=${id}`);
    return config;
  }
  public getSpawnTiles(): number[] {
    const out: number[] = [];
    this.byId.forEach(d => {
      if (d.kind === "normal") out.push(d.id)
    });
    if(out.length === 0) {
      throw new Error("No normal tiles to spawn (tile_catalog.json)")
    }
    return out;
  }
  public getAllTile(): number[]{
    return Array.from(this.byId.keys());
  }
}
