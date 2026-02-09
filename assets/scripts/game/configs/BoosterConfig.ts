export type BoosterKind = "swap" | "super";

export interface BaseBoosterConfig {
  id: string;
  kind: BoosterKind;
  charges: number;
}

export interface SwapBoosterConfig extends BaseBoosterConfig {
  kind: "swap";
}

export interface SuperBoosterConfig extends BaseBoosterConfig {
  kind: "super";
  superTileId: number;
}

export type BoosterConfig = SwapBoosterConfig | SuperBoosterConfig;

export interface BoostersConfig {
  boosters: BoosterConfig[];
}
