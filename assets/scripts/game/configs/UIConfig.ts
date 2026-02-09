export interface BoardViewConfig {
  spawnFallDuration?: number;
  spawnFadeDuration?: number;
  moveDuration?: number;
}

export interface TileViewConfig {
  spawnScaleDuration?: number;
  spawnFadeDuration?: number;
  hideScaleDuration?: number;
  hideFadeDuration?: number;
}

export interface HudViewConfig {
  fadeDuration?: number;
  fadeDelay?: number;
}

export interface UIConfig {
  board?: BoardViewConfig;
  tile?: TileViewConfig;
  hud?: HudViewConfig;
}
