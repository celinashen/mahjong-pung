import { describe, expect, it } from 'vitest';
import { HandInput, Meld, WinContext, parseTiles, score } from './index';

const ctx = (o: Partial<WinContext> = {}): WinContext => ({
  selfDrawn: false, seatWind: 0, roundWind: 0, lastTile: false, kongReplacement: false,
  doubleKongReplacement: false, robbingKong: false, lastOfKind: false,
  heavenly: false, earthly: false, humanly: false, ...o,
});

const t = (s: string) => parseTiles(s)[0];

function hand(tiles: string, win: string, melds: Meld[] = [], flowers: number[] = []): HandInput {
  return { tiles: parseTiles(tiles), winningTile: t(win), melds, flowers };
}

const ids = (r: ReturnType<typeof score>) => Object.fromEntries(r.fans.map((f) => [f.id, f.count]));

describe('MCR', () => {
  it('pure straight with full flush', () => {
    const r = score('mcr', hand('12345678923455m', '9m'), ctx());
    expect(r.error).toBeUndefined();
    const f = ids(r);
    expect(f.pureStraight).toBe(1);
    expect(f.fullFlush).toBe(1);
    expect(f.allChows).toBe(1);
    expect(f.concealedHand).toBe(1);
    expect(f.noHonors).toBeUndefined();
  });

  it('melded hand with a non-scoring wind pung', () => {
    const melds: Meld[] = [
      { kind: 'chow', tile: t('2m'), concealed: false },
      { kind: 'chow', tile: t('5p'), concealed: false },
      { kind: 'pung', tile: t('3z'), concealed: false }, // West; seat South, round East
    ];
    const r = score('mcr', { ...hand('67899s', '6s'), melds }, ctx({ seatWind: 1 }));
    expect(r.error).toBeUndefined();
    expect(ids(r).pungTermHonor).toBe(1);
    expect(r.meetsMinimum).toBe(false);
  });

  it('big three dragons excludes dragon pungs', () => {
    const r = score('mcr', hand('555666777z123m99p', '9p'), ctx({ selfDrawn: true }));
    const f = ids(r);
    expect(f.bigThreeDragons).toBe(1);
    expect(f.dragonPung).toBeUndefined();
    expect(f.twoDragonPungs).toBeUndefined();
    expect(f.threeConcealedPungs).toBe(1);
    expect(f.fullyConcealed).toBe(1);
    expect(f.selfDrawn).toBeUndefined();
  });

  it('seven pairs', () => {
    const f = ids(score('mcr', hand('1133m5577p2288s11z', '1z'), ctx()));
    expect(f.sevenPairs).toBe(1);
    expect(f.singleWait).toBeUndefined();
    expect(f.concealedHand).toBeUndefined();
  });

  it('thirteen orphans', () => {
    const r = score('mcr', hand('19m19p19s12345677z', '7z'), ctx());
    expect(ids(r).thirteenOrphans).toBe(1);
    expect(r.total).toBe(88);
  });

  it('mixed triple chow + one double chow, not both', () => {
    const f = ids(score('mcr', hand('778899m789p78999s', '9s'), ctx()));
    expect(f.upperTiles).toBe(1);
    expect(f.mixedTripleChow).toBe(1);
    expect((f.pureDoubleChow ?? 0) + (f.mixedDoubleChow ?? 0)).toBe(1);
    expect(f.allChows).toBe(1);
  });

  it('knitted straight', () => {
    const r = score('mcr', hand('147m258p369s55511z', '1z'), ctx({ selfDrawn: true }));
    expect(r.error).toBeUndefined();
    expect(ids(r).knittedStraight).toBe(1);
  });

  it('greater honours and knitted tiles', () => {
    expect(ids(score('mcr', hand('147m25p36s1234567z', '7z'), ctx())).greaterHonorsKnitted).toBe(1);
  });

  it('edge wait only when waiting on one tile', () => {
    expect(ids(score('mcr', hand('123m456789p23455s', '3m'), ctx())).edgeWait).toBe(1);
  });
});

describe('Hong Kong', () => {
  it('mixed flush + dragon + self pick', () => {
    const r = score('hk', hand('123456m999m555z11z', '1z'), ctx({ selfDrawn: true }));
    const f = ids(r);
    expect(f.mixedFlush).toBe(1);
    expect(f.dragon).toBe(1);
    expect(f.selfPick).toBe(1);
    expect(f.concealedHand).toBe(1);
    expect(f.noFlowers).toBe(1);
    expect(r.total).toBe(7);
  });

  it('all concealed triplets beats all triplets', () => {
    const f = ids(score('hk', hand('111m222p333s444s55z', '5z'), ctx()));
    expect(f.allConcealedTriplets).toBe(1);
    expect(f.allTriplets).toBeUndefined();
  });

  it('discard completing a triplet is not all-concealed', () => {
    const f = ids(score('hk', hand('111m222p333s444s55z', '4s'), ctx()));
    expect(f.allTriplets).toBe(1);
    expect(f.allConcealedTriplets).toBeUndefined();
  });

  it('limit caps at 13', () => {
    const r = score('hk', hand('11122233344455z', '5z'), ctx({ selfDrawn: true }));
    expect(r.total).toBe(13);
    expect(r.rawTotal).toBeGreaterThan(13);
  });

  it('seat flower and a full flower set', () => {
    const f = ids(score('hk', hand('123m456p789s234s55z', '5z', [], [0, 1, 2, 3, 5]), ctx({ seatWind: 1 })));
    expect(f.fullFlowerSet).toBe(1);
    expect(f.seatFlower).toBe(1);
  });

  it('claimed sets make the hand open', () => {
    const f = ids(score('hk', hand('456p789s234s66z', '6z', [{ kind: 'pung', tile: 31, concealed: false }]), ctx()));
    expect(f.concealedHand).toBeUndefined();
    expect(f.dragon).toBe(1);
  });

  it('rejects incomplete hands', () => {
    expect(score('hk', hand('123m456p789s234s56z', '6z'), ctx()).error).toBeDefined();
  });
});

describe('Chinese output', () => {
  it('localises explanations, notes and payouts', () => {
    const r = score('hk', hand('123456m999m555z11z', '1z'), ctx({ selfDrawn: true }), undefined, 'zh');
    expect(r.fans.find((f) => f.id === 'dragon')!.why).toContain('紅中刻子');
    expect(r.payout[0]).toContain('其他三家');
    const m = score('mcr', hand('12345678923455m', '9m'), ctx(), undefined, 'zh');
    expect(m.fans.find((f) => f.id === 'fullFlush')!.why).toContain('萬子');
    expect(score('mcr', hand('123m', '1m'), ctx(), undefined, 'zh').error).toMatch(/暗牌/);
  });
});
