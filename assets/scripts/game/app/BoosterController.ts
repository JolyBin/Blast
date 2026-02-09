import { CellPos } from "../core/models/CellPos";
import { BoardController } from "./BoardController";
import { BoosterView } from "../ui/BoosterView";
import { BoosterConfig, BoostersConfig } from "../configs/BoosterConfig";
interface IBooster {
  readonly id: string;
  onCellClick(pos: CellPos): Promise<boolean>;
  reset(): void;
}
class SwapBooster implements IBooster {
  public readonly id: string;
  private first: CellPos | null = null;
  constructor(
    private readonly board: BoardController,
    id: string,
  ) {
    this.id = id;
  }
  public async onCellClick(pos: CellPos): Promise<boolean> {
    if (!this.first) {
      this.first = { r: pos.r, c: pos.c };
      this.board.setSelection(this.first, true);
      return false;
    }
    const a = this.first;
    this.first = null;
    if (a.r === pos.r && a.c === pos.c) {
      this.board.setSelection(a, false);
      return false;
    }
    const idA = this.board.getTileId(a);
    const idB = this.board.getTileId(pos);
    if (idA === null || idB === null) {
      this.board.setSelection(a, false);
      return false;
    }
    if (idA === idB) {
      this.board.setSelection(a, false);
      return false;
    }
    this.board.setSelection(a, false);
    await this.board.swapTiles(a, pos);
    return true;
  }
  public reset(): void {
    if (this.first) this.board.setSelection(this.first, false);
    this.first = null;
  }
}
class SuperBooster implements IBooster {
  public readonly id: string;
  constructor(
    private readonly board: BoardController,
    id: string,
    private readonly superTileId: number,
  ) {
    this.id = id;
  }
  public async onCellClick(pos: CellPos): Promise<boolean> {
    await this.board.activateSuperAt(pos, this.superTileId);
    return true;
  }
  public reset(): void {}
}
export class BoosterController {
  private activeId: string | null = null;
  private charges = new Map<string, number>();
  private boosters: Map<string, IBooster>;
  private config: BoostersConfig;
  constructor(
    private readonly board: BoardController,
    private readonly view: BoosterView | undefined,
    config: BoostersConfig,
  ) {
    this.config = config;
    this.boosters = new Map<string, IBooster>();
    for (const entry of this.config.boosters) {
      const booster = this.createBooster(entry);
      if (booster) this.boosters.set(entry.id, booster);
    }
    this.view?.setActive(null);
  }
  public initCharges(): void {
    const chargesById: Record<string, number> = {};
    for (const entry of this.config.boosters) {
      this.charges.set(entry.id, entry.charges);
      chargesById[entry.id] = entry.charges;
    }
    this.view?.setCharges(chargesById);
  }
  private buildChargesMap(): Record<string, number> {
    const out: Record<string, number> = {};
    this.charges.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  public setActive(id: string | null): void {
    this.activeId = id;
    if (id === null) this.boosters.forEach((b) => b.reset());
    this.view?.setActive(id);
  }
  public toggle(id: string): void {
    if (this.activeId === id) this.setActive(null);
    else this.setActive(id);
  }
  public async handleCellClick(pos: CellPos): Promise<void> {
    if (this.board.isBusyOrOver()) return;
    if (!this.activeId) {
      await this.board.handleBoardClick(pos);
      return;
    }
    const chargesLeft = this.charges.get(this.activeId) ?? 0;
    if (chargesLeft <= 0) {
      this.setActive(null);
      return;
    }
    const booster = this.boosters.get(this.activeId);
    if (!booster) return;
    let consumed = false;
    try {
      consumed = await booster.onCellClick(pos);
    } catch (e) {
      cc.error("Booster error", e);
      consumed = false;
    }
    if (consumed) {
      this.charges.set(this.activeId, chargesLeft - 1);
      this.view?.setCharges(this.buildChargesMap());
      this.setActive(null);
    }
  }
  private createBooster(entry: BoosterConfig): IBooster | null {
    switch (entry.kind) {
      case "swap":
        return new SwapBooster(this.board, entry.id);
      case "super":
        return new SuperBooster(this.board, entry.id, entry.superTileId);
      default:
        return null;
    }
  }
}
