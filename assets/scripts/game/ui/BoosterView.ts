const { ccclass, property } = cc._decorator;
@ccclass
export class BoosterView extends cc.Component {
  @property([cc.Node]) boosterButtons: cc.Node[] = [];
  @property([cc.Label]) boosterCounts: cc.Label[] = [];
  @property([cc.String]) boosterIds: string[] = [];
  public onToggle: ((id: string) => void) | null = null;
  protected onEnable(): void {
    for (let i = 0; i < this.boosterButtons.length; i++) {
      const btn = this.boosterButtons[i];
      if (!btn) continue;
      btn.on(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }
  }
  protected onDisable(): void {
    for (let i = 0; i < this.boosterButtons.length; i++) {
      const btn = this.boosterButtons[i];
      if (!btn) continue;
      btn.off(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }
  }
  private handleClick(event: cc.Event.EventTouch): void {
    const target = event.target as cc.Node;
    const idx = this.boosterButtons.indexOf(target);
    if (idx < 0) return;
    this.toggleByIndex(idx);
  }
  public toggleByIndex(index: number): void {
    const id = this.boosterIds[index];
    if (!id) return;
    this.onToggle?.(id);
  }
  public setCharges(charges: Record<string, number>): void {
    for (let i = 0; i < this.boosterIds.length; i++) {
      const id = this.boosterIds[i];
      const label = this.boosterCounts[i];
      if (!label) continue;
      const value = charges[id];
      if (typeof value === "number") label.string = `${value}`;
    }
  }
  public setActive(id: string | null): void {
    for (let i = 0; i < this.boosterIds.length; i++) {
      const btn = this.boosterButtons[i];
      if (!btn) continue;
      btn.opacity = this.boosterIds[i] === id ? 255 : 160;
    }
  }
}
