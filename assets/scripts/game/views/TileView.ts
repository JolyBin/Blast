const { ccclass, property } = cc._decorator;
@ccclass
export class TileView extends cc.Component {
  public onClick: (() => void) | null = null;
  @property(cc.Sprite)
  private sprite: cc.Sprite = null;
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
    const scale = cc.scaleTo(0.5, 1).easing(cc.easeBackIn());
    const fade = cc.fadeTo(0.5, 255);
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
    const scale = cc.scaleTo(0.5, 0.1).easing(cc.easeBackIn());
    const fade = cc.fadeTo(0.5, 0);
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
