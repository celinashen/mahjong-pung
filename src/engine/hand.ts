import { Bonus, Tile, TILE_COUNT, Wind, isHonor, isSuited, rankOf, suitOf, isTermOrHonor } from './tiles';
import { Lang, MESSAGES } from './i18n';

export type MeldKind = 'chow' | 'pung' | 'kong';

/** A set the player has declared/exposed. Chows use their lowest tile. */
export interface Meld {
  kind: MeldKind;
  tile: Tile;
  /** Only meaningful for kongs: a concealed kong keeps the hand concealed. */
  concealed: boolean;
}

export interface HandInput {
  /** Tiles still in the hand (not part of a declared meld), including the winning tile. */
  tiles: Tile[];
  melds: Meld[];
  /** The tile that completed the hand. Must be one of `tiles`. */
  winningTile: Tile | null;
  flowers: Bonus[];
}

export interface WinContext {
  selfDrawn: boolean;
  seatWind: Wind;
  roundWind: Wind;
  /** Won on the last tile of the wall (self-drawn) or the last discard. */
  lastTile: boolean;
  kongReplacement: boolean;
  doubleKongReplacement: boolean;
  robbingKong: boolean;
  /** MCR "Last Tile": winning tile was the last of its kind. */
  lastOfKind: boolean;
  heavenly: boolean;
  earthly: boolean;
  humanly: boolean;
}

export type SetKind = 'chow' | 'pung' | 'kong' | 'pair';

export interface TileSet {
  kind: SetKind;
  tile: Tile;
  /** True if formed without claiming a discard (concealed kongs count as concealed). */
  concealed: boolean;
  /** True if this came from a declared meld rather than the hidden hand. */
  declared: boolean;
}

export type HandForm =
  | 'standard'
  | 'sevenPairs'
  | 'thirteenOrphans'
  | 'honorsKnitted'
  | 'knittedStraight';

export interface Decomposition {
  form: HandForm;
  /** Sets incl. the pair (standard / knittedStraight). For sevenPairs: the 7 pairs. */
  sets: TileSet[];
  /** Index into `sets` holding the winning tile, or -1 if not in a set (special forms). */
  winSet: number;
  /** knittedStraight: suit for 1-4-7, 2-5-8, 3-6-9 respectively. */
  knitSuits?: [number, number, number];
}

export const meldSize = (m: Meld) => (m.kind === 'kong' ? 4 : 3);

/** Every tile the hand uses, kongs counted as 4. */
export function allTiles(hand: HandInput): Tile[] {
  const out = [...hand.tiles];
  for (const m of hand.melds) {
    if (m.kind === 'chow') out.push(m.tile, m.tile + 1, m.tile + 2);
    else for (let i = 0; i < meldSize(m); i++) out.push(m.tile);
  }
  return out;
}

export function counts(tiles: Tile[]): number[] {
  const c = new Array(TILE_COUNT).fill(0);
  for (const t of tiles) c[t]++;
  return c;
}

/** Tiles needed in the hidden hand for the current number of melds. */
export const expectedHidden = (hand: HandInput) => 14 - 3 * hand.melds.length;

export function validate(hand: HandInput, lang: Lang = 'en'): string | null {
  const M = MESSAGES[lang];
  const need = expectedHidden(hand);
  if (hand.melds.length > 4) return M.tooManySets;
  if (hand.tiles.length !== need) return M.needTiles(need, hand.tiles.length);
  const c = counts(allTiles(hand));
  if (c.some((n) => n > 4)) return M.tooManyCopies;
  if (hand.winningTile === null || !hand.tiles.includes(hand.winningTile)) return M.markWinning;
  return null;
}

/** Hand is "concealed" if no sets were claimed from discards (concealed kongs are fine). */
export const isConcealed = (hand: HandInput) =>
  hand.melds.every((m) => m.kind === 'kong' && m.concealed);

// ---------------------------------------------------------------------------
// Decomposition

/** All ways to split `c` into `n` sets (chow/pung). Each result is a list of [kind, tile]. */
function splitSets(c: number[], n: number): Array<Array<['chow' | 'pung', Tile]>> {
  if (n === 0) return c.every((x) => x === 0) ? [[]] : [];
  const i = c.findIndex((x) => x > 0);
  if (i < 0) return [];
  const out: Array<Array<['chow' | 'pung', Tile]>> = [];
  if (c[i] >= 3) {
    c[i] -= 3;
    for (const rest of splitSets(c, n - 1)) out.push([['pung', i], ...rest]);
    c[i] += 3;
  }
  if (isSuited(i) && rankOf(i) <= 7 && c[i + 1] > 0 && c[i + 2] > 0) {
    c[i]--; c[i + 1]--; c[i + 2]--;
    for (const rest of splitSets(c, n - 1)) out.push([['chow', i], ...rest]);
    c[i]++; c[i + 1]++; c[i + 2]++;
  }
  return out;
}

/** Ways to make `n` sets + one pair from hidden-tile counts. */
function standardSplits(c: number[], n: number): Array<{ pair: Tile; sets: Array<['chow' | 'pung', Tile]> }> {
  const out: Array<{ pair: Tile; sets: Array<['chow' | 'pung', Tile]> }> = [];
  for (let p = 0; p < TILE_COUNT; p++) {
    if (c[p] < 2) continue;
    c[p] -= 2;
    for (const sets of splitSets(c, n)) out.push({ pair: p, sets });
    c[p] += 2;
  }
  return out;
}

const ORPHANS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

export function isThirteenOrphans(c: number[]): boolean {
  let pair = 0;
  for (let t = 0; t < TILE_COUNT; t++) {
    if (ORPHANS.includes(t)) {
      if (c[t] === 0 || c[t] > 2) return false;
      if (c[t] === 2) pair++;
    } else if (c[t] > 0) return false;
  }
  return pair === 1;
}

/** Seven pairs; `allowQuads` lets 4 identical tiles count as two pairs (MCR). */
export function sevenPairs(c: number[], allowQuads: boolean): Tile[] | null {
  const pairs: Tile[] = [];
  for (let t = 0; t < TILE_COUNT; t++) {
    if (c[t] === 2) pairs.push(t);
    else if (c[t] === 4 && allowQuads) pairs.push(t, t);
    else if (c[t] !== 0) return null;
  }
  return pairs.length === 7 ? pairs : null;
}

const KNIT_PERMS: Array<[number, number, number]> = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
];

/** Tiles of a knitted straight: suit perm[k] holds ranks k+1, k+4, k+7. */
function knitTiles(perm: [number, number, number]): Tile[] {
  const out: Tile[] = [];
  perm.forEach((suit, k) => [k + 1, k + 4, k + 7].forEach((r) => out.push(suit * 9 + r - 1)));
  return out;
}

/** 14 distinct tiles drawn only from honours + one knitted pattern (MCR honours & knitted). */
export function honorsKnitted(c: number[]): { greater: boolean; perm: [number, number, number] } | null {
  if (c.some((x) => x > 1)) return null;
  if (c.reduce((a, b) => a + b, 0) !== 14) return null;
  for (const perm of KNIT_PERMS) {
    const allowed = new Set(knitTiles(perm));
    let ok = true;
    for (let t = 0; t < 27; t++) if (c[t] && !allowed.has(t)) ok = false;
    if (ok) {
      const honors = c.slice(27).filter(Boolean).length;
      return { greater: honors === 7, perm };
    }
  }
  return null;
}

export interface DecomposeOptions {
  allowQuadPairs: boolean; // seven pairs may use 4 identical tiles
  knitted: boolean; // MCR knitted forms
}

/**
 * Every structural reading of a hand, including which set the winning tile
 * landed in (that affects concealed pungs and wait types).
 */
export function decompose(hand: HandInput, ctx: WinContext, opts: DecomposeOptions): Decomposition[] {
  const c = counts(hand.tiles);
  const win = hand.winningTile!;
  const needSets = 4 - hand.melds.length;
  const out: Decomposition[] = [];

  const declared: TileSet[] = hand.melds.map((m) => ({
    kind: m.kind,
    tile: m.tile,
    concealed: m.kind === 'kong' && m.concealed,
    declared: true,
  }));

  /** Push one decomposition per distinct set the winning tile could complete. */
  const pushVariants = (form: HandForm, hidden: TileSet[], extra?: Partial<Decomposition>) => {
    const seen = new Set<string>();
    hidden.forEach((s, i) => {
      if (!setContains(s, win)) return;
      const key = `${s.kind}:${s.tile}`;
      if (seen.has(key)) return;
      seen.add(key);
      const sets = hidden.map((x, j) =>
        // A pung completed by a discard counts as melded (not concealed).
        j === i && !ctx.selfDrawn && x.kind === 'pung' ? { ...x, concealed: false } : { ...x },
      );
      out.push({ form, sets: [...declared, ...sets], winSet: declared.length + i, ...extra });
    });
    if (seen.size === 0) out.push({ form, sets: [...declared, ...hidden], winSet: -1, ...extra });
  };

  for (const { pair, sets } of standardSplits(c, needSets)) {
    const hidden: TileSet[] = [
      ...sets.map(([kind, tile]) => ({ kind, tile, concealed: true, declared: false }) as TileSet),
      { kind: 'pair', tile: pair, concealed: true, declared: false },
    ];
    pushVariants('standard', hidden);
  }

  if (hand.melds.length === 0) {
    const pairs = sevenPairs(c, opts.allowQuadPairs);
    if (pairs) {
      out.push({
        form: 'sevenPairs',
        sets: pairs.map((tile) => ({ kind: 'pair', tile, concealed: true, declared: false })),
        winSet: pairs.indexOf(win),
      });
    }
    if (isThirteenOrphans(c)) out.push({ form: 'thirteenOrphans', sets: [], winSet: -1 });
    if (opts.knitted && honorsKnitted(c)) out.push({ form: 'honorsKnitted', sets: [], winSet: -1 });
  }

  if (opts.knitted && hand.melds.length <= 1) {
    for (const perm of KNIT_PERMS) {
      const knit = knitTiles(perm);
      if (!knit.every((t) => c[t] > 0)) continue;
      const rest = [...c];
      knit.forEach((t) => rest[t]--);
      // If the winning tile is only in the knitted part, no set holds it.
      for (const { pair, sets } of standardSplits(rest, 1 - hand.melds.length)) {
        const hidden: TileSet[] = [
          ...sets.map(([kind, tile]) => ({ kind, tile, concealed: true, declared: false }) as TileSet),
          { kind: 'pair', tile: pair, concealed: true, declared: false },
        ];
        const winInKnit = knit.includes(win);
        if (winInKnit) {
          out.push({ form: 'knittedStraight', sets: [...declared, ...hidden], winSet: -1, knitSuits: perm });
        }
        pushVariants('knittedStraight', hidden, { knitSuits: perm });
      }
    }
  }

  return out;
}

export function setContains(s: TileSet, t: Tile): boolean {
  if (s.kind === 'chow') return t >= s.tile && t <= s.tile + 2;
  return s.tile === t;
}

export function setTiles(s: TileSet): Tile[] {
  switch (s.kind) {
    case 'chow': return [s.tile, s.tile + 1, s.tile + 2];
    case 'pung': return [s.tile, s.tile, s.tile];
    case 'kong': return [s.tile, s.tile, s.tile, s.tile];
    case 'pair': return [s.tile, s.tile];
  }
}

/** Is the hidden hand (with `melds` sets declared) a complete hand in any form? */
function isComplete(c: number[], meldCount: number, opts: DecomposeOptions): boolean {
  if (standardSplits(c, 4 - meldCount).length > 0) return true;
  if (meldCount === 0) {
    if (sevenPairs(c, opts.allowQuadPairs) || isThirteenOrphans(c)) return true;
    if (opts.knitted && honorsKnitted(c)) return true;
  }
  if (opts.knitted && meldCount <= 1) {
    for (const perm of KNIT_PERMS) {
      const knit = knitTiles(perm);
      if (!knit.every((t) => c[t] > 0)) continue;
      const rest = [...c];
      knit.forEach((t) => rest[t]--);
      if (standardSplits(rest, 1 - meldCount).length > 0) return true;
    }
  }
  return false;
}

/** Tiles the hand was waiting on before the winning tile arrived. */
export function waitingTiles(hand: HandInput, opts: DecomposeOptions): Tile[] {
  const before = [...hand.tiles];
  before.splice(before.indexOf(hand.winningTile!), 1);
  const c = counts(before);
  const total = counts(allTiles(hand));
  total[hand.winningTile!]--;
  const waits: Tile[] = [];
  for (let t = 0; t < TILE_COUNT; t++) {
    if (total[t] >= 4) continue;
    c[t]++;
    if (isComplete(c, hand.melds.length, opts)) waits.push(t);
    c[t]--;
  }
  return waits;
}

export type WaitKind = 'edge' | 'closed' | 'single' | null;

export function waitKind(d: Decomposition, win: Tile): WaitKind {
  if (d.winSet < 0) return null;
  const s = d.sets[d.winSet];
  if (s.kind === 'pair') return 'single';
  if (s.kind !== 'chow') return null;
  if (win === s.tile + 1) return 'closed';
  const r = rankOf(s.tile);
  if ((r === 1 && win === s.tile + 2) || (r === 7 && win === s.tile)) return 'edge';
  return null;
}

// ---------------------------------------------------------------------------
// Small helpers used by the scorers

export const isPungLike = (s: TileSet) => s.kind === 'pung' || s.kind === 'kong';

export function suitsUsed(tiles: Tile[]): Set<number> {
  return new Set(tiles.filter(isSuited).map(suitOf));
}

export const hasHonor = (tiles: Tile[]) => tiles.some(isHonor);
export const allTermOrHonor = (tiles: Tile[]) => tiles.every(isTermOrHonor);
