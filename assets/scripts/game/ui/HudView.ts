import { HudViewConfig } from "../configs/UIConfig";
const { ccclass, property } = cc._decorator;
@ccclass
export class HudView extends cc.Component {
  @property(cc.Label) scoreLabel: cc.Label = null;
  @property(cc.Label) movesLabel: cc.Label = null;
  @property(cc.Label) resultLabel: cc.Label = null;
  @property(cc.Node) resultOverlay: cc.Node = null;
  @property(cc.Button) restartButton: cc.Button = null;
  @property(cc.Node) startFadeOverlay: cc.Node = null;
  public fadeDuration: number = 0.4;
  public fadeDelay: number = 0.05;
  public onRestart: (() => void) | null = null;
  public applyConfig(cfg?: HudViewConfig): void {
    if (!cfg) return;
    if (typeof cfg.fadeDuration === "number") {
      this.fadeDuration = cfg.fadeDuration;
    }
    if (typeof cfg.fadeDelay === "number") {
      this.fadeDelay = cfg.fadeDelay;
    }
  }
  protected onEnable(): void {
    if (this.restartButton) {
      this.restartButton.node.on(
        cc.Node.EventType.TOUCH_END,
        this.restart,
        this,
      );
    }
  }
  protected onDisable(): void {
    if (this.restartButton) {
      this.restartButton.node.off(
        cc.Node.EventType.TOUCH_END,
        this.restart,
        this,
      );
    }
  }
  public setScore(score: number, target: number): void {
    if (this.scoreLabel) this.scoreLabel.string = `${score}/${target}`;
  }
  public setMoves(moves: number): void {
    if (this.movesLabel) this.movesLabel.string = `${moves}`;
  }
  public showResult(text: string): void {
    if (this.resultLabel) this.resultLabel.string = text;
    if (this.resultLabel) this.resultLabel.node.active = true;
    if (this.resultOverlay) this.resultOverlay.active = true;
  }
  public hideResult(): void {
    if (this.resultLabel) this.resultLabel.node.active = false;
    if (this.resultOverlay) this.resultOverlay.active = false;
  }
  public playStartFade(): void {
    if (!this.startFadeOverlay) return;
    const node = this.startFadeOverlay;
    node.stopAllActions();
    node.active = true;
    node.opacity = 255;
    cc.tween(node)
      .delay(this.fadeDelay)
      .to(this.fadeDuration, { opacity: 0 })
      .call(() => {
        node.active = false;
      })
      .start();
  }
  public restart(): void {
    this.onRestart?.();
  }
}
