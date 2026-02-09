import { TileView } from "./TileView"
import { CellPos } from "../models/CellPos";

const { ccclass, property } = cc._decorator

@ccclass
export class BoardView extends cc.Component {
    public onCellClick: ((pos: CellPos) => void) | null = null;

    @property
    public spawnFallDuration: number = 0.25;
    @property
    public spawnFadeDuration: number = 0.25;
    @property
    public moveDuration: number = 0.2;

    @property(cc.Node)
    private tilesRoot: cc.Node = null;
    @property(cc.Prefab)
    private tilePrefab: cc.Prefab = null;
    @property(cc.Prefab)
    private cellPrefab: cc.Prefab = null;

    private tileViews: { view: TileView, pos: cc.Node }[][];
    private syncScheduled = false;

    public init(rows: number, cols: number): void {
        this.tileViews = new Array(rows);
        for (let i = 0; i < this.tileViews.length; i++) {
            this.tileViews[i] = new Array(cols);
        }
        this.tilesRoot.removeAllChildren();
        this.syncScheduled = false;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = cc.instantiate(this.cellPrefab);
                cell.parent = this.tilesRoot;

                const node = cc.instantiate(this.tilePrefab);
                node.parent = this.node;
                node.width = cell.width;
                node.height = cell.height;

                const tv = node.getComponent(TileView);
                this.bindClick(tv, { r, c });
                this.tileViews[r][c] = { view: tv, pos: cell };
            }
        }

        this.requestSyncPositions();
    }

    public createTile(cellPos: CellPos, frame: cc.SpriteFrame): void {
        this.setFrameTile(cellPos, frame);
        this.renderTileAnimated(cellPos);
    }

    public createTileInPlace(cellPos: CellPos, frame: cc.SpriteFrame): void {
        this.setFrameTile(cellPos, frame);
        this.renderTileAnimatedInPlace(cellPos);
    }

    public setFrameTile(cellPos: CellPos, frame: cc.SpriteFrame) {
        const entry = this.tileViews[cellPos.r][cellPos.c];
        if (!entry) return;
        entry.view.setFrame(frame);
        entry.view.node.active = true;
        entry.view.node.opacity = 255;
        this.setPosition(cellPos);
    }

    public renderTileAnimated(pos: CellPos): Promise<void> {
        const tv = this.tileViews[pos.r][pos.c]
        if (!tv) return Promise.resolve()

        const target = this.getCellLocalPos(pos);
        const start = cc.v2(target.x, target.y + tv.pos.height * 2);

        return new Promise(resolve => {
            const node = tv.view.node;
            node.stopAllActions();
            node.active = true;
            node.opacity = 0;
            node.setPosition(start);
            const move = cc.moveTo(this.spawnFallDuration, target);
            const fade = cc.fadeTo(this.spawnFadeDuration, 255);
            const anim = cc.spawn(move, fade);
            const seq = cc.sequence(anim, cc.callFunc(() => resolve()));
            node.runAction(seq);
        })
    }

    public renderTileAnimatedInPlace(pos: CellPos): Promise<void> {
        const tv = this.tileViews[pos.r][pos.c]
        if (!tv) return Promise.resolve()

        const node = tv.view.node;
        node.stopAllActions();
        node.active = true;
        node.opacity = 255;
        this.setPosition(pos);

        return new Promise(resolve => {
            tv.view.playSpawn(resolve);
        });
    }

    public renderTilesAnimated(cells: CellPos[]): Promise<void> {
        return Promise.all(cells.map(p => this.renderTileAnimated(p))).then(() => { })
    }

    public hideTileAnimated(pos: CellPos): Promise<void> {
        const tv = this.tileViews[pos.r][pos.c]
        if (!tv) return Promise.resolve()

        return new Promise(resolve => {
            tv.view.playHide(resolve)
        })
    }

    public hideTilesAnimated(cells: CellPos[]): Promise<void> {
        return Promise.all(cells.map(p => this.hideTileAnimated(p))).then(() => { })
    }

    public moveTilesAnimated(moves: { from: CellPos; to: CellPos }[], duration: number = this.moveDuration): Promise<void> {
        if (moves.length === 0) return Promise.resolve();
        return Promise.all(moves.map(m => this.moveTileAnimated(m.from, m.to, duration))).then(() => { });
    }

    private setPosition(pos: CellPos): void {
        const entry = this.tileViews[pos.r][pos.c];
        if (!entry) return;
        const viewNode = entry.view.node;
        viewNode.setPosition(this.getCellLocalPos(pos));
    }

    private getCellLocalPos(pos: CellPos): cc.Vec2 {
        const entry = this.tileViews[pos.r][pos.c];
        if (!entry) return cc.v2(0, 0);
        const cellNode = entry.pos;
        const world = cellNode.parent.convertToWorldSpaceAR(cellNode.position);
        const local = this.node.convertToNodeSpaceAR(world);
        return cc.v2(local.x, local.y);
    }

    private moveTileAnimated(from: CellPos, to: CellPos, duration: number): Promise<void> {
        const fromEntry = this.tileViews[from.r][from.c];
        const toEntry = this.tileViews[to.r][to.c];
        if (!fromEntry || !toEntry) return Promise.resolve();

        const movingView = fromEntry.view;
        fromEntry.view = toEntry.view;
        toEntry.view = movingView;
        this.bindClick(toEntry.view, to);
        this.bindClick(fromEntry.view, from);

        const cellNode = toEntry.pos;
        const viewNode = toEntry.view.node;
        const targetWorld = cellNode.parent.convertToWorldSpaceAR(cellNode.position);
        const targetLocal = viewNode.parent.convertToNodeSpaceAR(targetWorld);
        const targetPos = cc.v2(targetLocal.x, targetLocal.y);

        // from-cell becomes empty after the move: park and hide its view
        this.setPosition(from);
        fromEntry.view.node.active = false;

        return new Promise(resolve => {
            viewNode.stopAllActions();
            viewNode.active = true;
            viewNode.opacity = 255;
            const move = cc.moveTo(duration, targetPos);
            const seq = cc.sequence(move, cc.callFunc(() => resolve()));
            viewNode.runAction(seq);
        });
    }

    private requestSyncPositions(): void {
        if (this.syncScheduled) return;
        this.syncScheduled = true;
        this.scheduleOnce(() => {
            this.syncScheduled = false;
            const layout = this.tilesRoot.getComponent(cc.Layout);
            if (layout) layout.updateLayout();
            this.syncAllPositions();
        }, 0);
    }

    private syncAllPositions(): void {
        for (let r = 0; r < this.tileViews.length; r++) {
            for (let c = 0; c < this.tileViews[r].length; c++) {
                if (this.tileViews[r][c]) {
                    this.setPosition({ r, c });
                }
            }
        }
    }

    private bindClick(view: TileView, pos: CellPos): void {
        view.onClick = () => { this.onCellClick?.({ r: pos.r, c: pos.c }); };
    }
}
