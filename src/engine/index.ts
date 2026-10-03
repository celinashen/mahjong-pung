import type { HandInput, WinContext } from './hand';
import { scoreHk, HK_DEFAULTS } from './hk';
import type { HkOptions } from './hk';
import { scoreMcr } from './mcr';
import type { ScoreResult, Variant } from './types';

export * from './hand';
export * from './tiles';
export * from './types';
export { HK_DEFAULTS, HK_POINTS, HK_LIMIT, HK_FANS } from './hk';
export type { HkOptions } from './hk';
export { MCR_MINIMUM, MCR_FANS } from './mcr';

export function score(variant: Variant, hand: HandInput, ctx: WinContext, hk: HkOptions = HK_DEFAULTS): ScoreResult {
  return variant === 'hk' ? scoreHk(hand, ctx, hk) : scoreMcr(hand, ctx);
}

/** Parse compact notation like "123m456p789s11z" (z: 1-4 = E S W N, 5-7 = Red Green White). */
export function parseTiles(s: string): number[] {
  const bases: Record<string, number> = { m: 0, p: 9, s: 18, z: 27 };
  const out: number[] = [];
  let digits: number[] = [];
  for (const ch of s.replace(/\s+/g, '')) {
    if (/\d/.test(ch)) digits.push(Number(ch));
    else {
      const base = bases[ch];
      if (base === undefined) throw new Error(`Bad suit ${ch}`);
      for (const d of digits) out.push(base + d - 1);
      digits = [];
    }
  }
  return out;
}
