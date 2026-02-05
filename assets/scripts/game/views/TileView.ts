const {ccclass, property} = cc._decorator;

@ccclass
export class TileView extends cc.Component {

    @property(cc.Sprite)
    sprite: cc.Sprite = null;

    public setFrame(frame: cc.SpriteFrame) {
        this.sprite.spriteFrame = frame;
    }
}
