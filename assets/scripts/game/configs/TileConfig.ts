export type TileType = "normal" | "bomb" | "rocketRow" | "rocketCol";
export interface BaseTileConfig {
  id: number;
  kind: TileType;
  sprite: string;
}
export interface NormalTileConfig extends BaseTileConfig {
  kind: "normal";
}
export interface BombTileConfig extends BaseTileConfig {
  kind: "bomb";
  radius: number;
}
export interface RocketRowTileConfig extends BaseTileConfig {
  kind: "rocketRow";
}
export interface RocketColTile extends BaseTileConfig {
  kind: "rocketCol";
}
export type TileConfig =
  | NormalTileConfig
  | BombTileConfig
  | RocketRowTileConfig
  | RocketColTile;
export interface TileCatalogDTO {
  tiles: TileConfig[];
}
export interface SuperRuleDTO {
  minGroup: number;
  spawnIds: number[]; // ["rocketRow","rocketCol"] РёР»Рё ["bomb"]
}
export interface SuperRulesDTO {
  minGroupToDestroy: number;
  rules: SuperRuleDTO[];
}
