import { SuperRuleDTO, SuperRulesDTO } from "../configs/TileConfig"

export class SuperTileRules {
  public readonly minGroupToDestroy: number
  private readonly rules: SuperRuleDTO[]

  constructor(dto: SuperRulesDTO) {
    this.minGroupToDestroy = dto.minGroupToDestroy
    this.rules = dto.rules.slice().sort((a, b) => b.minGroup - a.minGroup)
  }

  pickSpawnId(groupSize: number): number | null {
    for (const rule of this.rules) {
      if (groupSize >= rule.minGroup) {
        const ids = rule.spawnIds
        const idx = Math.floor(Math.random() * ids.length)
        return ids[idx]
      }
    }
    return null
  }
}
