import { useEffect, useReducer } from 'react';
import { defaultLang } from './i18n';
import {
  Bonus, HK_DEFAULTS, HandInput, HandReading, HkOptions, Lang, Meld, ScoreResult, Tile, Variant, WinContext, Wind,
  allTiles, counts, readHand, readingHas, score,
} from './engine';

export const VARIANTS: Array<{ id: Variant; en: string; zh: string }> = [
  { id: 'hk', en: 'Hong Kong', zh: '港式' },
  { id: 'mcr', en: 'Chinese', zh: '國標' },
];

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
  lang: Lang;
  seatWind: Wind;
  roundWind: Wind;
  hk: HkOptions;
  /** Game mode: does this table count flowers / winds? */
  flowers: boolean;
  winds: boolean;
}

/** Cleared by "New hand". */
export interface HandState {
  /** Every tile in the hand, kongs as four. Sets are worked out after submitting. */
  tiles: Tile[];
  /** Sets the player says were claimed from others. Anything else stays concealed. */
  revealed: Meld[];
  winning: Tile | null;
  flowers: Bonus[];
  win: WinFlags;
}

export interface AppState {
  prefs: Prefs;
  hand: HandState;
}

const NO_FLAGS: WinFlags = {
  selfDrawn: false, lastTile: false, kongReplacement: false, doubleKongReplacement: false,
  robbingKong: false, lastOfKind: false, heavenly: false, earthly: false, humanly: false,
};

export const EMPTY_HAND: HandState = { tiles: [], revealed: [], winning: null, flowers: [], win: NO_FLAGS };
const DEFAULT_PREFS: Prefs = {
  variant: 'hk', lang: 'en', seatWind: 0, roundWind: 0, hk: HK_DEFAULTS, flowers: true, winds: true,
};

export type Action =
  | { type: 'variant'; variant: Variant }
  | { type: 'prefs'; patch: Partial<Prefs> }
  | { type: 'hkOptions'; patch: Partial<HkOptions> }
  | { type: 'addTile'; tile: Tile }
  | { type: 'removeTile'; tile: Tile }
  | { type: 'revealed'; set: Meld; on: boolean }
  | { type: 'winning'; tile: Tile }
  | { type: 'toggleFlower'; bonus: Bonus }
  | { type: 'flag'; key: keyof WinFlags; value: boolean }
  | { type: 'newHand' };

/** Every way this table can read the hand; empty if it isn't a winning shape. */
export function readings(h: HandState, prefs: Prefs): HandReading[] {
  const mcr = prefs.variant === 'mcr';
  return readHand(h.tiles, { allowQuadPairs: mcr, knitted: mcr })
    .filter((r) => mcr || r.form !== 'sevenPairs' || prefs.hk.allowSevenPairs);
}

/** The inputs left to score: more than one only when it's unclear which four-of-a-kind is the kong. */
export function toHandInputs(h: HandState, prefs: Prefs): HandInput[] {
  const flowers = prefs.flowers ? h.flowers : [];
  const fits = readings(h, prefs).filter((r) => readingHas(r, h.revealed));
  // Not a complete hand: a win on 7 or 8 flowers, or something for the engine to reject.
  if (fits.length === 0) return [{ tiles: h.tiles, melds: h.revealed, winningTile: h.winning, flowers }];

  const out = new Map<string, HandInput>();
  for (const r of fits) {
    const hiddenKongs: Meld[] = r.sets
      .filter((s) => s.kind === 'kong' && !h.revealed.some((m) => m.kind === 'kong' && m.tile === s.tile))
      .map((s) => ({ kind: 'kong', tile: s.tile, concealed: true }));
    const melds = [...h.revealed, ...hiddenKongs];
    const tiles = [...h.tiles];
    for (const t of allTiles({ tiles: [], melds, winningTile: null, flowers: [] })) tiles.splice(tiles.indexOf(t), 1);
    out.set(tiles.sort((a, b) => a - b).join(), { tiles, melds, winningTile: h.winning, flowers });
  }
  return [...out.values()];
}

/** Tiles that could have won the hand: anything not locked into a revealed set or kong. */
export function winningChoices(h: HandState, prefs: Prefs): Tile[] {
  const tiles = toHandInputs(h, prefs).flatMap((i) => i.tiles);
  return [...new Set(tiles)].sort((a, b) => a - b);
}

export function toContext(s: AppState): WinContext {
  const { seatWind, roundWind, flowers, winds } = s.prefs;
  return { ...s.hand.win, seatWind, roundWind, ignoreFlowers: !flowers, ignoreWinds: !winds };
}

/** Score the hand, taking the best result if the kongs can be read more than one way. */
export function scoreHand(s: AppState, lang: Lang): ScoreResult {
  const { hand, prefs } = s;
  const inputs = toHandInputs(hand, prefs);
  const usable = inputs.filter((i) => hand.winning === null || i.tiles.includes(hand.winning));
  return (usable.length > 0 ? usable : inputs)
    .map((i) => score(prefs.variant, i, toContext(s), prefs.hk, lang))
    .reduce((best, r) => (r.total > best.total ? r : best));
}

/** Can `tile` join the hand? Past 14 tiles, each extra one must belong to a kong. */
export function canAdd(tiles: Tile[], tile: Tile): boolean {
  const c = counts([...tiles, tile]);
  return c[tile] <= 4 && tiles.length + 1 <= 14 + c.filter((n) => n === 4).length;
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

/** Answers tied to the exact tiles or sets no longer hold once those change. */
const clearAnswers = (h: HandState): HandState => ({ ...h, revealed: [], winning: null });

export function reducer(s: AppState, a: Action): AppState {
  const h = s.hand;
  switch (a.type) {
    case 'variant':
      return { ...s, prefs: { ...s.prefs, variant: a.variant }, hand: clearAnswers(h) };
    case 'prefs':
      return { ...s, prefs: { ...s.prefs, ...a.patch } };
    case 'hkOptions':
      return { ...s, prefs: { ...s.prefs, hk: { ...s.prefs.hk, ...a.patch } } };
    case 'addTile':
      if (!canAdd(h.tiles, a.tile)) return s;
      return { ...s, hand: { ...clearAnswers(h), tiles: [...h.tiles, a.tile] } };
    case 'removeTile': {
      const i = h.tiles.indexOf(a.tile);
      if (i < 0) return s;
      return { ...s, hand: { ...clearAnswers(h), tiles: h.tiles.filter((_, j) => j !== i) } };
    }
    case 'revealed': {
      const i = h.revealed.findIndex((m) => m.kind === a.set.kind && m.tile === a.set.tile);
      const revealed = a.on ? [...h.revealed, a.set] : h.revealed.filter((_, j) => j !== i);
      return { ...s, hand: { ...h, revealed, winning: null } };
    }
    case 'winning':
      return { ...s, hand: { ...h, winning: a.tile } };
    case 'toggleFlower': {
      const has = h.flowers.includes(a.bonus);
      const flowers = has ? h.flowers.filter((b) => b !== a.bonus) : [...h.flowers, a.bonus].sort();
      return { ...s, hand: { ...h, flowers } };
    }
    case 'flag':
      return { ...s, hand: { ...h, win: setFlag(h.win, a.key, a.value) } };
    case 'newHand':
      return { ...s, hand: EMPTY_HAND };
  }
}

// ---------------------------------------------------------------------------
// Persistence: prefs in localStorage (kept across sessions), the in-progress
// hand too so an accidental refresh doesn't lose it.

const KEY = 'pung.v1';

function load(): AppState {
  const fallback: AppState = { prefs: { ...DEFAULT_PREFS, lang: defaultLang() }, hand: EMPTY_HAND };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      prefs: { ...fallback.prefs, ...saved.prefs, hk: { ...HK_DEFAULTS, ...saved.prefs?.hk } },
      // Hands saved before tiles went flat have no `revealed`; keep the prefs, drop the hand.
      hand: saved.hand?.revealed
        ? { ...EMPTY_HAND, ...saved.hand, win: { ...NO_FLAGS, ...saved.hand.win } }
        : EMPTY_HAND,
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
