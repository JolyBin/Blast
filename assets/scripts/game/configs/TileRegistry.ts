import { Tile } from "./Tile";

export class TileRegistry {
  private byId = new Map<number, Tile>();

  constructor(defs: Tile[]) {
    for (const d of defs) this.byId.set(d.id, d);
  }

  public getTile(id: number): Tile {
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
