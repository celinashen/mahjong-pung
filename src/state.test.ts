import { describe, expect, it } from 'vitest';
import { HK_DEFAULTS, parseTiles } from './engine';
import { AppState, EMPTY_HAND, Prefs, canAdd, reducer, scoreHand, toHandInputs, winningChoices } from './state';

const prefs: Prefs = { variant: 'hk', lang: 'en', seatWind: 0, roundWind: 0, hk: HK_DEFAULTS, flowers: true, winds: true };
const stateWith = (tiles: string, o: Partial<AppState['hand']> = {}, p: Partial<Prefs> = {}): AppState => ({
  prefs: { ...prefs, ...p },
  hand: { ...EMPTY_HAND, tiles: parseTiles(tiles), ...o },
});
const ids = (s: AppState) => scoreHand(s, 'en').fans.map((f) => f.id);

describe('canAdd', () => {
  it('stops at 14 tiles unless the tile makes a kong', () => {
    const full = parseTiles('111m456p789s111z99p');
    expect(canAdd(full.slice(0, 13), 5)).toBe(true);
    expect(canAdd(full, 5)).toBe(false);
    expect(canAdd(full, 0)).toBe(true);
  });

  it('never allows a fifth copy', () => {
    expect(canAdd(parseTiles('1111m'), 0)).toBe(false);
  });
});

describe('reducer', () => {
  it('forgets answers tied to the tiles when the tiles change', () => {
    const s = stateWith('123m456p789s111z99p', { winning: 10, revealed: [{ kind: 'chow', tile: 0, concealed: false }] });
    const next = reducer(s, { type: 'removeTile', tile: 0 });
    expect(next.hand.tiles).toHaveLength(13);
    expect(next.hand.revealed).toEqual([]);
    expect(next.hand.winning).toBeNull();
  });

  it('removes one copy at a time', () => {
    const s = reducer(stateWith('111m'), { type: 'removeTile', tile: 0 });
    expect(s.hand.tiles).toEqual([0, 0]);
  });

  it('removes one of two identical revealed sets', () => {
    const set = { kind: 'chow', tile: 0, concealed: false } as const;
    const s = reducer(stateWith('123123m', { revealed: [set, set] }), { type: 'revealed', set, on: false });
    expect(s.hand.revealed).toEqual([set]);
  });
});

describe('scoring a flat hand', () => {
  const win = parseTiles('9p')[0];

  it('nothing revealed: a concealed hand', () => {
    expect(ids(stateWith('123m456p789s111z99p', { winning: win }))).toContain('concealedHand');
  });

  it('a revealed set opens the hand and locks its tiles', () => {
    const s = stateWith('123m456p789s111z99p', { winning: win, revealed: [{ kind: 'pung', tile: 27, concealed: false }] });
    expect(ids(s)).not.toContain('concealedHand');
    expect(winningChoices(s.hand, s.prefs)).not.toContain(27);
  });

  it('an unselected kong stays concealed, a selected one opens the hand', () => {
    const tiles = '1111m456p789s111z99p';
    const hidden = stateWith(tiles, { winning: win });
    expect(toHandInputs(hidden.hand, hidden.prefs)[0].melds).toEqual([{ kind: 'kong', tile: 0, concealed: true }]);
    expect(ids(hidden)).toContain('concealedHand');
    expect(winningChoices(hidden.hand, hidden.prefs)).not.toContain(0);
    const open = stateWith(tiles, { winning: win, revealed: [{ kind: 'kong', tile: 0, concealed: false }] });
    expect(ids(open)).not.toContain('concealedHand');
  });

  it('flowers are ignored when the table does not count them', () => {
    const s = stateWith('123m456p789s111z99p', { winning: win, flowers: [0, 1] }, { flowers: false });
    expect(ids(s)).not.toContain('seatFlower');
    expect(ids(s)).not.toContain('noFlowers');
  });

  it('still scores a win on 7 flowers without a complete hand', () => {
    const r = scoreHand(stateWith('123m', { flowers: [0, 1, 2, 3, 4, 5, 6] }), 'en');
    expect(r.error).toBeUndefined();
    expect(r.fans.map((f) => f.id)).toContain('sevenFlowers');
  });
});
