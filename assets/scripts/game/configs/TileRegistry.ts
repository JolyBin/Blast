import { TileConfig } from "./TileConfig";

export class TileRegistry {
  private byId = new Map<number, TileConfig>();

  constructor(tiles: TileConfig[]) {
    for (const d of tiles) this.byId.set(d.id, d);
  }

  public getTileConfig(id: number): TileConfig {
    const d = this.byId.get(id);
    if (!d) throw new Error(`No Tile for id=${id}`);
    return d;
  }

  public getSpawnTiles(): number[] {
    const out: number[] = [];
    this.byId.forEach(d => { 
      if (d.kind === "normal") out.push(d.id)
    });
    if(out.length === 0) {
      throw new Error("No normal tiles to spawn (tile_catalog.json)")
    }
    return Array.from(this.byId.keys());
  }
}
