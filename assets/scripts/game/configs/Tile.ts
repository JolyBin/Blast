export type TileType = "normal" | "bomb" | "rocketRow" | "rocketCol"

export interface BaseTile {
  id: number;
  kind: TileType;
  sprite: string; // путь в resources без расширения
}

export interface NormalTile extends BaseTile {
  kind: "normal";
}

export interface BombTile extends BaseTile {
  kind: "bomb";
  radius: number; // обязателен только у bomb
}

export interface RocketRowTile extends BaseTile {
  kind: "rocketRow";
}

export interface RocketColTile extends BaseTile {
  kind: "rocketCol";
}

export type Tile = NormalTile | BombTile | RocketRowTile | RocketColTile

export interface TileCatalogDTO {
  tiles: Tile[];
}
