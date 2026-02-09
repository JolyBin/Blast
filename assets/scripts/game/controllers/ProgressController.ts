import { HudView } from "../views/HudView";

export class ProgressController {
    private movesLeft: number = 0;
    private score: number = 0;
    private target: number = 0;
    private hud: HudView | null = null;

    constructor(hud?: HudView) {
        this.hud = hud ?? null;
    }

    public setHud(hud?: HudView): void {
        this.hud = hud ?? null;
    }

    public init(startMoves: number, targetScore: number): void {
        this.movesLeft = Math.max(0, startMoves);
        this.score = 0;
        this.target = Math.max(0, targetScore);
        this.hud?.hideResult();
        this.hud?.setMoves(this.movesLeft);
        this.hud?.setScore(this.score, this.target);
    }

    public canSpendMove(): boolean {
        return this.movesLeft > 0;
    }

    public spendMove(): void {
        if (this.movesLeft <= 0) return;
        this.movesLeft -= 1;
        this.hud?.setMoves(this.movesLeft);
    }

    public addScore(points: number): void {
        if (points <= 0) return;
        this.score += points;
        this.hud?.setScore(this.score, this.target);
    }

    public getMoves(): number {
        return this.movesLeft;
    }

    public isWin(): boolean {
        return this.score >= this.target;
    }

    public showResult(text: string): void {
        this.hud?.showResult(text);
    }
}
