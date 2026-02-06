const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
    public onClick: (() => void) | null = null

    @property(cc.Sprite)
    private sprite: cc.Sprite = null;

    public setFrame(frame: cc.SpriteFrame) {
        this.sprite.spriteFrame = frame;
    }

    public setVisible(value: boolean) {
        this.sprite.enabled = value;
    }

    public onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.handleClick, this)
    }

    public onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.handleClick, this)
    }

    private handleClick() {
        this.onClick?.()
    }
}
