export class GridLayout {
  constructor(
    public readonly rows: number,
    public readonly cols: number,
    public readonly tileWidth: number,
    public readonly tileHeight: number,
    public readonly spacingX: number,
    public readonly spacingY: number,
  ) {}

  public getCellLocalPosition(r: number, c: number): cc.Vec2 {
    const gridWidth =
      this.cols * this.tileWidth + (this.cols - 1) * this.spacingX;
    const gridHeight =
      this.rows * this.tileHeight + (this.rows - 1) * this.spacingY;
    const originX = -gridWidth / 2 + this.tileWidth / 2;
    const originY = -gridHeight / 2 + this.tileHeight / 2;
    const x = originX + c * (this.tileWidth + this.spacingX);
    const y = originY + r * (this.tileHeight + this.spacingY);
    return cc.v2(x, y);
  }

  public applyToCellNode(node: cc.Node, r: number, c: number): void {
    node.width = this.tileWidth;
    node.height = this.tileHeight;
    node.setPosition(this.getCellLocalPosition(r, c));
  }

  public getCellLocalPositionByPos(pos: { r: number; c: number }): cc.Vec2 {
    return this.getCellLocalPosition(pos.r, pos.c);
  }
}
