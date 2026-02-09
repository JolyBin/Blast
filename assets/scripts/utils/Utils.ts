export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}
