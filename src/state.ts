import { useEffect, useReducer } from 'react';
import {
  Bonus, HK_DEFAULTS, HandInput, HkOptions, Meld, Tile, Variant, WinContext, Wind, allTiles, counts,
} from './engine';

export type PickMode = 'tile' | 'chow' | 'pung' | 'kong' | 'ckong';

export interface WinFlags {
  selfDrawn: boolean;
  lastTile: boolean;
  kongReplacement: boolean;
  doubleKongReplacement: boolean;
  robbingKong: boolean;
  lastOfKind: boolean;
  heavenly: boolean;
  earthly: boolean;
  humanly: boolean;
}

/** Survives "New hand" and reloads. */
export interface Prefs {
  variant: Variant;
  seatWind: Wind;
  roundWind: Wind;
  hk: HkOptions;
}

/** Cleared by "New hand". */
export interface HandState {
  tiles: Tile[];
  winning: Tile | null;
  melds: Meld[];
  flowers: Bonus[];
  win: WinFlags;
}

export interface AppState {
  prefs: Prefs;
  hand: HandState;
  mode: PickMode;
}

const NO_FLAGS: WinFlags = {
  selfDrawn: false, lastTile: false, kongReplacement: false, doubleKongReplacement: false,
  robbingKong: false, lastOfKind: false, heavenly: false, earthly: false, humanly: false,
};

export const EMPTY_HAND: HandState = { tiles: [], winning: null, melds: [], flowers: [], win: NO_FLAGS };
const DEFAULT_PREFS: Prefs = { variant: 'hk', seatWind: 0, roundWind: 0, hk: HK_DEFAULTS };

export type Action =
  | { type: 'variant'; variant: Variant }
  | { type: 'prefs'; patch: Partial<Prefs> }
  | { type: 'hkOptions'; patch: Partial<HkOptions> }
  | { type: 'mode'; mode: PickMode }
  | { type: 'pick'; tile: Tile }
  | { type: 'removeTiles'; indices: number[]; winning: boolean }
  | { type: 'makeWinning'; index: number }
  | { type: 'removeMeld'; index: number }
  | { type: 'toggleFlower'; bonus: Bonus }
  | { type: 'flag'; key: keyof WinFlags; value: boolean }
  | { type: 'newHand' };

export function toHandInput(h: HandState): HandInput {
  return {
    tiles: h.winning === null ? h.tiles : [...h.tiles, h.winning],
    melds: h.melds,
    winningTile: h.winning,
    flowers: h.flowers,
  };
}

export function toContext(s: AppState): WinContext {
  return { ...s.hand.win, seatWind: s.prefs.seatWind, roundWind: s.prefs.roundWind };
}

/** Hidden tiles still needed (beyond declared sets) for a 14-tile hand. */
export const hiddenNeeded = (h: HandState) => 14 - 3 * h.melds.length;
export const hiddenCount = (h: HandState) => h.tiles.length + (h.winning === null ? 0 : 1);

/** How many more copies of each tile can still be used. */
export function remaining(h: HandState): number[] {
  return counts(allTiles(toHandInput(h))).map((n) => 4 - n);
}

/** Can `tile` be added in the current mode? */
export function canPick(h: HandState, mode: PickMode, tile: Tile): boolean {
  const left = remaining(h);
  if (mode === 'tile') return left[tile] >= 1 && hiddenCount(h) < hiddenNeeded(h);
  // A new set needs room for 3 more tiles within the 14.
  if (h.melds.length >= 4 || hiddenCount(h) > hiddenNeeded(h) - 3) return false;
  if (mode === 'chow') {
    return tile < 27 && (tile % 9) <= 6 && left[tile] >= 1 && left[tile + 1] >= 1 && left[tile + 2] >= 1;
  }
  if (mode === 'pung') return left[tile] >= 3;
  return left[tile] >= 4; // kong / concealed kong
}

function setFlag(win: WinFlags, key: keyof WinFlags, value: boolean): WinFlags {
  const w = { ...win, [key]: value };
  if (!value) {
    if (key === 'kongReplacement') w.doubleKongReplacement = false;
    return w;
  }
  // Keep combinations physically possible.
  switch (key) {
    case 'doubleKongReplacement':
      w.kongReplacement = true; w.selfDrawn = true; w.robbingKong = false; break;
    case 'kongReplacement':
    case 'heavenly':
    case 'humanly':
      w.selfDrawn = true; w.robbingKong = false; break;
    case 'robbingKong':
    case 'earthly':
      w.selfDrawn = false; w.kongReplacement = false; w.doubleKongReplacement = false; break;
  }
  return w;
}

export function reducer(s: AppState, a: Action): AppState {
  const h = s.hand;
  switch (a.type) {
    case 'variant':
      return { ...s, prefs: { ...s.prefs, variant: a.variant } };
    case 'prefs':
      return { ...s, prefs: { ...s.prefs, ...a.patch } };
    case 'hkOptions':
      return { ...s, prefs: { ...s.prefs, hk: { ...s.prefs.hk, ...a.patch } } };
    case 'mode':
      return { ...s, mode: a.mode };
    case 'pick': {
      if (!canPick(h, s.mode, a.tile)) return s;
      if (s.mode === 'tile') {
        // The tile that completes the hand is assumed to be the winning tile.
        const completes = hiddenCount(h) + 1 === hiddenNeeded(h) && h.winning === null;
        return { ...s, hand: completes ? { ...h, winning: a.tile } : { ...h, tiles: [...h.tiles, a.tile] } };
      }
      const meld: Meld = {
        kind: s.mode === 'ckong' ? 'kong' : s.mode,
        tile: a.tile,
        concealed: s.mode === 'ckong',
      };
      return { ...s, hand: { ...h, melds: [...h.melds, meld] } };
    }
    case 'removeTiles':
      return {
        ...s,
        hand: { ...h, tiles: h.tiles.filter((_, i) => !a.indices.includes(i)), winning: a.winning ? null : h.winning },
      };
    case 'makeWinning': {
      const tiles = [...h.tiles];
      const [picked] = tiles.splice(a.index, 1);
      if (h.winning !== null) tiles.push(h.winning);
      return { ...s, hand: { ...h, tiles, winning: picked } };
    }
    case 'removeMeld':
      return { ...s, hand: { ...h, melds: h.melds.filter((_, i) => i !== a.index) } };
    case 'toggleFlower': {
      const has = h.flowers.includes(a.bonus);
      const flowers = has ? h.flowers.filter((b) => b !== a.bonus) : [...h.flowers, a.bonus].sort();
      return { ...s, hand: { ...h, flowers } };
    }
    case 'flag':
      return { ...s, hand: { ...h, win: setFlag(h.win, a.key, a.value) } };
    case 'newHand':
      return { ...s, hand: EMPTY_HAND, mode: 'tile' };
  }
}

// ---------------------------------------------------------------------------
// Persistence: prefs in localStorage (kept across sessions), the in-progress
// hand too so an accidental refresh doesn't lose it.

const KEY = 'pung.v1';

function load(): AppState {
  const fallback: AppState = { prefs: DEFAULT_PREFS, hand: EMPTY_HAND, mode: 'tile' };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      prefs: { ...DEFAULT_PREFS, ...saved.prefs, hk: { ...HK_DEFAULTS, ...saved.prefs?.hk } },
      hand: { ...EMPTY_HAND, ...saved.hand, win: { ...NO_FLAGS, ...saved.hand?.win } },
      mode: 'tile',
    };
  } catch {
    return fallback;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ prefs: state.prefs, hand: state.hand }));
    } catch {
      /* storage unavailable (private mode) — app still works */
    }
  }, [state.prefs, state.hand]);
  return [state, dispatch] as const;
}
