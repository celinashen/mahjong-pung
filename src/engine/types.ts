import type { Decomposition } from './hand';

export type Variant = 'hk' | 'mcr';

export interface ScoredFan {
  id: string;
  en: string;
  zh: string;
  /** Points (MCR) or fan (HK) for one occurrence. */
  points: number;
  count: number;
  /** Why the hand earned it, in plain English. */
  why: string;
}

export interface ScoreResult {
  variant: Variant;
  error?: string;
  fans: ScoredFan[];
  /** Total fan (HK, after limit) or points (MCR). */
  total: number;
  /** Uncapped sum, for HK hands over the limit. */
  rawTotal: number;
  unit: 'fan' | 'points';
  minimum: number;
  meetsMinimum: boolean;
  decomposition?: Decomposition;
  /** Payment lines, e.g. "Each other player pays you 16". */
  payout: string[];
  notes: string[];
}

export const fanTotal = (fans: ScoredFan[]) => fans.reduce((a, f) => a + f.points * f.count, 0);
