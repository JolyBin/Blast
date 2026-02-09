const { ccclass, property } = cc._decorator;

@ccclass
export default class FitGameWindow extends cc.Component {
    @property
    designWidth = 1080;

    @property
    designHeight = 1920;

    onEnable() {
        this.applyScale();
        cc.view.on('canvas-resize', this.applyScale, this);
    }

    onDisable() {
        cc.view.off('canvas-resize', this.applyScale, this);
    }

    private applyScale() {
        const size = cc.view.getVisibleSize();
        const scale = Math.min(size.width / this.designWidth, size.height / this.designHeight);
        this.node.scale = scale;
    }
}
