import { BaseTile } from "./BaseTile";
import { CellPos, UniqueCellPosSet } from "./CellPos";


export class NormalTile extends BaseTile {

    private uniqCell: UniqueCellPosSet;
    public getAffected(allTiles: BaseTile[][], currentTile: CellPos): CellPos[] {
        this.uniqCell = new UniqueCellPosSet(allTiles[0].length);
        return this.getNeighbours(allTiles, currentTile);
    }

    private getNeighbours(allTiles: BaseTile[][], currentTilePos: CellPos): CellPos[] {
        const result: CellPos[] = [];
        this.uniqCell.add(currentTilePos);
        result.push(currentTilePos);

        if (currentTilePos.r - 1 >= 0 && !this.uniqCell.has({r: currentTilePos.r - 1, c: currentTilePos.c}) && allTiles[currentTilePos.r][currentTilePos.c].id === allTiles[currentTilePos.r - 1][currentTilePos.c].id) {
            result.push(...this.getNeighbours(allTiles, { r: currentTilePos.r - 1, c: currentTilePos.c }));
        }
        if (currentTilePos.r + 1 < allTiles.length && !this.uniqCell.has({r: currentTilePos.r + 1, c: currentTilePos.c}) && allTiles[currentTilePos.r][currentTilePos.c].id === allTiles[currentTilePos.r + 1][currentTilePos.c].id) {
            result.push(...this.getNeighbours(allTiles, { r: currentTilePos.r + 1, c: currentTilePos.c }));
        }
        if (currentTilePos.c - 1 >= 0 && !this.uniqCell.has({r: currentTilePos.r, c: currentTilePos.c - 1}) && allTiles[currentTilePos.r][currentTilePos.c].id === allTiles[currentTilePos.r][currentTilePos.c - 1].id) {
            result.push(...this.getNeighbours(allTiles, { r: currentTilePos.r, c: currentTilePos.c - 1 }));
        }
        if (currentTilePos.c + 1 < allTiles[currentTilePos.r].length && !this.uniqCell.has({r: currentTilePos.r, c: currentTilePos.c + 1}) && allTiles[currentTilePos.r][currentTilePos.c].id === allTiles[currentTilePos.r][currentTilePos.c + 1].id) {
            result.push(...this.getNeighbours(allTiles, { r: currentTilePos.r, c: currentTilePos.c + 1 }));
        }

        return result;
    }
}


