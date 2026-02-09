import { TileViewConfig } from "../configs/UIConfig";
const { ccclass, property } = cc._decorator;
@ccclass
export class TileView extends cc.Component {
  public onClick: (() => void) | null = null;
  @property(cc.Sprite)
  private sprite: cc.Sprite = null;
  private spawnScaleDuration = 0.5;
  private spawnFadeDuration = 0.5;
  private hideScaleDuration = 0.5;
  private hideFadeDuration = 0.5;
  public applyConfig(cfg?: TileViewConfig): void {
    if (!cfg) return;
    if (typeof cfg.spawnScaleDuration === "number") {
      this.spawnScaleDuration = cfg.spawnScaleDuration;
    }
    if (typeof cfg.spawnFadeDuration === "number") {
      this.spawnFadeDuration = cfg.spawnFadeDuration;
    }
    if (typeof cfg.hideScaleDuration === "number") {
      this.hideScaleDuration = cfg.hideScaleDuration;
    }
    if (typeof cfg.hideFadeDuration === "number") {
      this.hideFadeDuration = cfg.hideFadeDuration;
    }
  }
  public setFrame(frame: cc.SpriteFrame) {
    this.sprite.spriteFrame = frame;
    this.node.active = true;
  }
  public hide() {
    this.node.active = false;
  }
  public onEnable() {
    this.node.on(cc.Node.EventType.TOUCH_END, this.handleClick, this);
  }
  public onDisable() {
    this.node.off(cc.Node.EventType.TOUCH_END, this.handleClick, this);
  }
  private handleClick() {
    this.onClick?.();
  }
  playSpawn(onDone?: () => void): void {
    this.node.stopAllActions();
    this.node.active = true;
    this.node.scale = 0;
    const scale = cc
      .scaleTo(this.spawnScaleDuration, 1)
      .easing(cc.easeBackIn());
    const fade = cc.fadeTo(this.spawnFadeDuration, 255);
    const anim = cc.spawn(scale, fade);
    const seq = cc.sequence(
      anim,
      cc.callFunc(() => {
        this.node.active = true;
        this.node.opacity = 255;
        onDone?.();
      }),
    );
    this.node.runAction(seq);
  }
  playHide(onDone?: () => void): void {
    this.node.stopAllActions();
    const scale = cc
      .scaleTo(this.hideScaleDuration, 0.1)
      .easing(cc.easeBackIn());
    const fade = cc.fadeTo(this.hideFadeDuration, 0);
    const anim = cc.spawn(scale, fade);
    const seq = cc.sequence(
      anim,
      cc.callFunc(() => {
        this.node.active = false;
        this.node.opacity = 255;
        this.node.scale = 1;
        onDone?.();
      }),
    );
    this.node.runAction(seq);
  }
}
