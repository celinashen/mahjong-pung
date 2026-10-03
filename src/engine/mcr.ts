// Chinese Official (MCR / Guobiao) scoring, following the WMO 2006
// "Mahjong Competition Rules" (81 fan, 8-point minimum, flowers excluded from the minimum).

import {
  Decomposition, HandInput, WinContext, allTiles, counts, decompose, isConcealed,
  isPungLike, setTiles, suitsUsed, validate, waitKind, waitingTiles,
} from './hand';
import {
  GREEN, Tile, WHITE, isDragon, isHonor, isSuited, isTermOrHonor, isTerminal, isWind,
  rankOf, suitOf, tileName, windTile,
} from './tiles';
import { ScoreResult, ScoredFan, fanTotal } from './types';

interface FanDef { en: string; zh: string; pts: number; desc: string }

export const MCR_FANS = {
  bigFourWinds: { en: 'Big Four Winds', zh: '大四喜', pts: 88, desc: 'Pungs or kongs of all four winds.' },
  bigThreeDragons: { en: 'Big Three Dragons', zh: '大三元', pts: 88, desc: 'Pungs or kongs of all three dragons.' },
  allGreen: { en: 'All Green', zh: '綠一色', pts: 88, desc: 'Only 2, 3, 4, 6, 8 Bamboo and Green Dragon.' },
  nineGates: { en: 'Nine Gates', zh: '九蓮寶燈', pts: 88, desc: 'Held 1112345678999 of one suit, waiting on any tile of that suit.' },
  fourKongs: { en: 'Four Kongs', zh: '四槓', pts: 88, desc: 'Four kongs.' },
  sevenShiftedPairs: { en: 'Seven Shifted Pairs', zh: '連七對', pts: 88, desc: 'Seven consecutive pairs in one suit.' },
  thirteenOrphans: { en: 'Thirteen Orphans', zh: '十三么', pts: 88, desc: 'One of every terminal and honour, plus a pair of one of them.' },
  allTerminals: { en: 'All Terminals', zh: '清么九', pts: 64, desc: 'Only 1s and 9s, no honours.' },
  littleFourWinds: { en: 'Little Four Winds', zh: '小四喜', pts: 64, desc: 'Three wind pungs plus a pair of the fourth wind.' },
  littleThreeDragons: { en: 'Little Three Dragons', zh: '小三元', pts: 64, desc: 'Two dragon pungs plus a pair of the third dragon.' },
  allHonors: { en: 'All Honours', zh: '字一色', pts: 64, desc: 'Only winds and dragons.' },
  fourConcealedPungs: { en: 'Four Concealed Pungs', zh: '四暗刻', pts: 64, desc: 'Four pungs/kongs formed without claiming discards.' },
  pureTerminalChows: { en: 'Pure Terminal Chows', zh: '一色雙龍會', pts: 64, desc: 'Two 1-2-3 and two 7-8-9 chows in one suit, with a pair of 5s in that suit.' },
  quadrupleChow: { en: 'Quadruple Chow', zh: '一色四同順', pts: 48, desc: 'Four identical chows in one suit.' },
  fourPureShiftedPungs: { en: 'Four Pure Shifted Pungs', zh: '一色四節高', pts: 48, desc: 'Four pungs in one suit, each one higher than the last.' },
  fourPureShiftedChows: { en: 'Four Pure Shifted Chows', zh: '一色四步高', pts: 32, desc: 'Four chows in one suit, each shifted up by 1 (or each by 2).' },
  threeKongs: { en: 'Three Kongs', zh: '三槓', pts: 32, desc: 'Three kongs.' },
  allTermHonors: { en: 'All Terminals and Honours', zh: '混么九', pts: 32, desc: 'Only 1s, 9s and honours.' },
  sevenPairs: { en: 'Seven Pairs', zh: '七對', pts: 24, desc: 'Seven pairs.' },
  greaterHonorsKnitted: { en: 'Greater Honours and Knitted Tiles', zh: '七星不靠', pts: 24, desc: 'All seven honours plus knitted 1-4-7 / 2-5-8 / 3-6-9 singles.' },
  allEvenPungs: { en: 'All Even Pungs', zh: '全雙刻', pts: 24, desc: 'Pungs and pair of 2, 4, 6, 8 only.' },
  fullFlush: { en: 'Full Flush', zh: '清一色', pts: 24, desc: 'Every tile from one suit.' },
  pureTripleChow: { en: 'Pure Triple Chow', zh: '一色三同順', pts: 24, desc: 'Three identical chows in one suit.' },
  pureShiftedPungs: { en: 'Pure Shifted Pungs', zh: '一色三節高', pts: 24, desc: 'Three pungs in one suit, each one higher than the last.' },
  upperTiles: { en: 'Upper Tiles', zh: '全大', pts: 24, desc: 'Only 7, 8 and 9 tiles.' },
  middleTiles: { en: 'Middle Tiles', zh: '全中', pts: 24, desc: 'Only 4, 5 and 6 tiles.' },
  lowerTiles: { en: 'Lower Tiles', zh: '全小', pts: 24, desc: 'Only 1, 2 and 3 tiles.' },
  pureStraight: { en: 'Pure Straight', zh: '清龍', pts: 16, desc: '1-2-3, 4-5-6, 7-8-9 in one suit.' },
  threeSuitedTerminalChows: { en: 'Three-Suited Terminal Chows', zh: '三色雙龍會', pts: 16, desc: '1-2-3 + 7-8-9 in two suits, with a pair of 5s in the third.' },
  pureShiftedChows: { en: 'Pure Shifted Chows', zh: '一色三步高', pts: 16, desc: 'Three chows in one suit, each shifted up by 1 (or each by 2).' },
  allFives: { en: 'All Fives', zh: '全帶五', pts: 16, desc: 'Every set and the pair contains a 5.' },
  triplePung: { en: 'Triple Pung', zh: '三同刻', pts: 16, desc: 'Pungs of the same number in all three suits.' },
  threeConcealedPungs: { en: 'Three Concealed Pungs', zh: '三暗刻', pts: 16, desc: 'Three pungs/kongs formed without claiming discards.' },
  lesserHonorsKnitted: { en: 'Lesser Honours and Knitted Tiles', zh: '全不靠', pts: 12, desc: '14 unrelated singles: honours plus knitted 1-4-7 / 2-5-8 / 3-6-9 tiles.' },
  knittedStraight: { en: 'Knitted Straight', zh: '組合龍', pts: 12, desc: '1-4-7, 2-5-8, 3-6-9 each in a different suit.' },
  upperFour: { en: 'Upper Four', zh: '大於五', pts: 12, desc: 'Only 6, 7, 8 and 9 tiles.' },
  lowerFour: { en: 'Lower Four', zh: '小於五', pts: 12, desc: 'Only 1, 2, 3 and 4 tiles.' },
  bigThreeWinds: { en: 'Big Three Winds', zh: '三風刻', pts: 12, desc: 'Pungs of three winds.' },
  mixedStraight: { en: 'Mixed Straight', zh: '花龍', pts: 8, desc: '1-2-3, 4-5-6, 7-8-9, each in a different suit.' },
  reversibleTiles: { en: 'Reversible Tiles', zh: '推不倒', pts: 8, desc: 'Only tiles that look the same upside down (1234589 Dots, 245689 Bamboo, White Dragon).' },
  mixedTripleChow: { en: 'Mixed Triple Chow', zh: '三色三同順', pts: 8, desc: 'The same chow in all three suits.' },
  mixedShiftedPungs: { en: 'Mixed Shifted Pungs', zh: '三色三節高', pts: 8, desc: 'Pungs in three suits, each one number higher.' },
  chickenHand: { en: 'Chicken Hand', zh: '無番和', pts: 8, desc: 'A hand that scores nothing else (flowers aside).' },
  lastTileDraw: { en: 'Last Tile Draw', zh: '妙手回春', pts: 8, desc: 'Won by drawing the very last tile of the wall.' },
  lastTileClaim: { en: 'Last Tile Claim', zh: '海底撈月', pts: 8, desc: 'Won on the final discard of the game.' },
  outWithReplacement: { en: 'Out with Replacement Tile', zh: '槓上開花', pts: 8, desc: 'Won on the replacement tile drawn after a kong.' },
  robbingKong: { en: 'Robbing the Kong', zh: '搶槓和', pts: 8, desc: 'Won on a tile another player added to their pung to make a kong.' },
  twoConcealedKongs: { en: 'Two Concealed Kongs', zh: '雙暗槓', pts: 8, desc: 'Two concealed kongs.' },
  allPungs: { en: 'All Pungs', zh: '碰碰和', pts: 6, desc: 'Four pungs/kongs and a pair.' },
  halfFlush: { en: 'Half Flush', zh: '混一色', pts: 6, desc: 'One suit plus honours.' },
  mixedShiftedChows: { en: 'Mixed Shifted Chows', zh: '三色三步高', pts: 6, desc: 'Chows in three suits, each shifted up by one.' },
  allTypes: { en: 'All Types', zh: '五門齊', pts: 6, desc: 'Characters, Dots, Bamboo, Winds and Dragons all present.' },
  meldedHand: { en: 'Melded Hand', zh: '全求人', pts: 6, desc: 'All four sets claimed, then won on a discard for the pair.' },
  twoDragonPungs: { en: 'Two Dragon Pungs', zh: '雙箭刻', pts: 6, desc: 'Pungs of two dragons.' },
  meldedConcealedKongs: { en: 'Melded and Concealed Kong', zh: '明暗槓', pts: 6, desc: 'One melded kong and one concealed kong.' },
  outsideHand: { en: 'Outside Hand', zh: '全帶么', pts: 4, desc: 'Every set and the pair contains a terminal or honour.' },
  fullyConcealed: { en: 'Fully Concealed Hand', zh: '不求人', pts: 4, desc: 'No claimed sets, and won by self-draw.' },
  twoMeldedKongs: { en: 'Two Melded Kongs', zh: '雙明槓', pts: 4, desc: 'Two melded kongs.' },
  lastTile: { en: 'Last Tile', zh: '和絕張', pts: 4, desc: 'Won on the last remaining copy of a tile.' },
  dragonPung: { en: 'Dragon Pung', zh: '箭刻', pts: 2, desc: 'A pung of dragons.' },
  prevalentWind: { en: 'Prevalent Wind', zh: '圈風刻', pts: 2, desc: 'A pung of the round (prevalent) wind.' },
  seatWind: { en: 'Seat Wind', zh: '門風刻', pts: 2, desc: 'A pung of your seat wind.' },
  concealedHand: { en: 'Concealed Hand', zh: '門前清', pts: 2, desc: 'No claimed sets, won on a discard.' },
  allChows: { en: 'All Chows', zh: '平和', pts: 2, desc: 'Four chows and a non-honour pair.' },
  tileHog: { en: 'Tile Hog', zh: '四歸一', pts: 2, desc: 'All four copies of a tile used, but not as a kong.' },
  doublePung: { en: 'Double Pung', zh: '雙同刻', pts: 2, desc: 'Pungs of the same number in two suits.' },
  twoConcealedPungs: { en: 'Two Concealed Pungs', zh: '雙暗刻', pts: 2, desc: 'Two pungs/kongs formed without claiming discards.' },
  concealedKong: { en: 'Concealed Kong', zh: '暗槓', pts: 2, desc: 'A concealed kong.' },
  allSimples: { en: 'All Simples', zh: '斷么', pts: 2, desc: 'No 1s, 9s or honours.' },
  pureDoubleChow: { en: 'Pure Double Chow', zh: '一般高', pts: 1, desc: 'Two identical chows in one suit.' },
  mixedDoubleChow: { en: 'Mixed Double Chow', zh: '喜相逢', pts: 1, desc: 'The same chow in two suits.' },
  shortStraight: { en: 'Short Straight', zh: '連六', pts: 1, desc: 'Two chows in one suit forming a 6-tile run.' },
  twoTerminalChows: { en: 'Two Terminal Chows', zh: '老少副', pts: 1, desc: '1-2-3 and 7-8-9 in the same suit.' },
  pungTermHonor: { en: 'Pung of Terminals or Honours', zh: '么九刻', pts: 1, desc: 'A pung of 1s, 9s, or a non-scoring wind.' },
  meldedKong: { en: 'Melded Kong', zh: '明槓', pts: 1, desc: 'A melded kong.' },
  oneVoidedSuit: { en: 'One Voided Suit', zh: '缺一門', pts: 1, desc: 'One of the three suits is missing.' },
  noHonors: { en: 'No Honours', zh: '無字', pts: 1, desc: 'No winds or dragons.' },
  edgeWait: { en: 'Edge Wait', zh: '邊張', pts: 1, desc: 'Waited only on a 3 for 1-2-3 or a 7 for 7-8-9.' },
  closedWait: { en: 'Closed Wait', zh: '嵌張', pts: 1, desc: 'Waited only on the middle tile of a chow.' },
  singleWait: { en: 'Single Wait', zh: '單釣將', pts: 1, desc: 'Waited only on the tile to make your pair.' },
  selfDrawn: { en: 'Self-Drawn', zh: '自摸', pts: 1, desc: 'Won with a tile drawn from the wall.' },
  flowerTiles: { en: 'Flower Tiles', zh: '花牌', pts: 1, desc: '1 point per flower or season (does not count toward the 8-point minimum).' },
} satisfies Record<string, FanDef>;

export type McrFan = keyof typeof MCR_FANS;

/** "Does not combine with" — a fan listed on the left suppresses those on the right. */
const EXCLUDES: Partial<Record<McrFan, McrFan[]>> = {
  bigFourWinds: ['bigThreeWinds', 'littleFourWinds', 'allPungs', 'prevalentWind', 'seatWind', 'pungTermHonor'],
  bigThreeDragons: ['littleThreeDragons', 'twoDragonPungs', 'dragonPung'],
  nineGates: ['fullFlush', 'concealedHand', 'pungTermHonor', 'noHonors'],
  fourKongs: ['threeKongs', 'twoConcealedKongs', 'meldedConcealedKongs', 'twoMeldedKongs', 'concealedKong', 'meldedKong', 'singleWait', 'allPungs'],
  sevenShiftedPairs: ['sevenPairs', 'fullFlush', 'concealedHand', 'singleWait', 'noHonors'],
  thirteenOrphans: ['allTypes', 'concealedHand', 'singleWait'],
  allTerminals: ['allTermHonors', 'allPungs', 'outsideHand', 'pungTermHonor', 'noHonors'],
  littleFourWinds: ['bigThreeWinds'],
  littleThreeDragons: ['twoDragonPungs', 'dragonPung'],
  allHonors: ['allTermHonors', 'allPungs', 'outsideHand', 'pungTermHonor'],
  fourConcealedPungs: ['threeConcealedPungs', 'twoConcealedPungs', 'allPungs', 'concealedHand'],
  pureTerminalChows: ['sevenPairs', 'fullFlush', 'allChows', 'pureDoubleChow', 'twoTerminalChows', 'noHonors'],
  quadrupleChow: ['pureTripleChow', 'pureShiftedPungs', 'tileHog', 'pureDoubleChow'],
  fourPureShiftedPungs: ['pureShiftedPungs', 'pureTripleChow', 'allPungs'],
  fourPureShiftedChows: ['pureShiftedChows', 'shortStraight'],
  threeKongs: ['twoConcealedKongs', 'meldedConcealedKongs', 'twoMeldedKongs', 'concealedKong', 'meldedKong'],
  allTermHonors: ['allPungs', 'pungTermHonor', 'outsideHand'],
  sevenPairs: ['concealedHand', 'singleWait'],
  greaterHonorsKnitted: ['lesserHonorsKnitted', 'allTypes', 'concealedHand', 'singleWait'],
  allEvenPungs: ['allPungs', 'allSimples', 'noHonors'],
  fullFlush: ['noHonors'],
  pureTripleChow: ['pureShiftedPungs', 'pureDoubleChow'],
  pureShiftedPungs: ['pureTripleChow'],
  upperTiles: ['upperFour', 'noHonors'],
  middleTiles: ['allSimples', 'noHonors'],
  lowerTiles: ['lowerFour', 'noHonors'],
  threeSuitedTerminalChows: ['pureDoubleChow', 'mixedDoubleChow', 'twoTerminalChows', 'allChows', 'noHonors'],
  allFives: ['allSimples', 'noHonors'],
  triplePung: ['doublePung'],
  threeConcealedPungs: ['twoConcealedPungs'],
  lesserHonorsKnitted: ['allTypes', 'concealedHand', 'singleWait'],
  upperFour: ['noHonors'],
  lowerFour: ['noHonors'],
  reversibleTiles: ['oneVoidedSuit'],
  lastTileDraw: ['selfDrawn'],
  outWithReplacement: ['selfDrawn'],
  robbingKong: ['lastTile'],
  twoConcealedKongs: ['concealedKong', 'twoConcealedPungs'],
  meldedConcealedKongs: ['concealedKong', 'meldedKong'],
  meldedHand: ['singleWait'],
  twoDragonPungs: ['dragonPung'],
  fullyConcealed: ['selfDrawn', 'concealedHand'],
  twoMeldedKongs: ['meldedKong'],
  allChows: ['noHonors'],
  allSimples: ['noHonors'],
};

type Found = Map<McrFan, { count: number; why: string[] }>;

function add(found: Found, id: McrFan, why?: string) {
  const f = found.get(id) ?? { count: 0, why: [] };
  f.count++;
  if (why) f.why.push(why);
  found.set(id, f);
}

const chowName = (t: Tile) => `${rankOf(t)}-${rankOf(t) + 1}-${rankOf(t) + 2} ${suitName(t)}`;
const suitName = (t: Tile) => ['Characters', 'Dots', 'Bamboo'][suitOf(t)];

// ---------------------------------------------------------------------------
// Chow / pung combination fans with the "account once" and "non-identical" principles.

interface Combo { fans: Array<[McrFan, string]> }

function twoChowFan(a: Tile, b: Tile): McrFan | null {
  const [sa, sb, ra, rb] = [suitOf(a), suitOf(b), rankOf(a), rankOf(b)];
  if (sa === sb && ra === rb) return 'pureDoubleChow';
  if (sa !== sb && ra === rb) return 'mixedDoubleChow';
  if (sa === sb && Math.abs(ra - rb) === 3) return 'shortStraight';
  if (sa === sb && Math.min(ra, rb) === 1 && Math.max(ra, rb) === 7) return 'twoTerminalChows';
  return null;
}

function threeChowFan(ts: Tile[]): McrFan | null {
  const s = ts.map(suitOf);
  const r = ts.map(rankOf).sort((x, y) => x - y);
  const oneSuit = s[0] === s[1] && s[1] === s[2];
  const threeSuits = new Set(s).size === 3;
  const step = r[1] - r[0] === r[2] - r[1] ? r[1] - r[0] : -1;
  if (oneSuit && r.join() === '1,4,7') return 'pureStraight';
  if (oneSuit && step === 0) return 'pureTripleChow';
  if (oneSuit && (step === 1 || step === 2)) return 'pureShiftedChows';
  if (threeSuits && r.join() === '1,4,7') return 'mixedStraight';
  if (threeSuits && step === 0) return 'mixedTripleChow';
  if (threeSuits && step === 1) return 'mixedShiftedChows';
  return null;
}

function fourChowFan(ts: Tile[], pair: Tile | null): McrFan | null {
  const s = ts.map(suitOf);
  const r = ts.map(rankOf).sort((x, y) => x - y);
  const oneSuit = new Set(s).size === 1;
  if (oneSuit && r[0] === r[3]) return 'quadrupleChow';
  if (oneSuit) {
    const d = r[1] - r[0];
    if ((d === 1 || d === 2) && r[2] - r[1] === d && r[3] - r[2] === d) return 'fourPureShiftedChows';
  }
  if (pair !== null && isSuited(pair) && rankOf(pair) === 5) {
    if (oneSuit && r.join() === '1,1,7,7' && suitOf(pair) === s[0]) return 'pureTerminalChows';
    // 1-2-3 + 7-8-9 in two suits, pair of 5s in the third
    const bySuit = new Map<number, number[]>();
    ts.forEach((t) => bySuit.set(suitOf(t), [...(bySuit.get(suitOf(t)) ?? []), rankOf(t)]));
    if (
      bySuit.size === 2 && !bySuit.has(suitOf(pair)) &&
      [...bySuit.values()].every((v) => v.sort().join() === '1,7')
    ) return 'threeSuitedTerminalChows';
  }
  return null;
}

/** Best acyclic set of pairwise fans (each set links to the group at most once, no repeated fan per set). */
function bestEdges(items: Tile[], fanOf: (a: Tile, b: Tile) => McrFan | null, describe: (a: Tile, b: Tile) => string): Combo {
  const edges: Array<{ i: number; j: number; fan: McrFan }> = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const fan = fanOf(items[i], items[j]);
      if (fan) edges.push({ i, j, fan });
    }
  let best: typeof edges = [];
  let bestScore = 0;
  for (let mask = 1; mask < 1 << edges.length; mask++) {
    const chosen = edges.filter((_, k) => mask & (1 << k));
    // acyclic (union-find)
    const parent = items.map((_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    let ok = true;
    for (const e of chosen) {
      const [a, b] = [find(e.i), find(e.j)];
      if (a === b) { ok = false; break; }
      parent[a] = b;
    }
    if (!ok) continue;
    // non-identical: a set may not be used twice for the same fan
    const used = new Set<string>();
    for (const e of chosen) {
      for (const k of [`${e.i}:${e.fan}`, `${e.j}:${e.fan}`]) {
        if (used.has(k)) ok = false;
        used.add(k);
      }
    }
    if (!ok) continue;
    const score = chosen.reduce((a, e) => a + MCR_FANS[e.fan].pts, 0);
    if (score > bestScore) { bestScore = score; best = chosen; }
  }
  return { fans: best.map((e) => [e.fan, describe(items[e.i], items[e.j])]) };
}

const comboScore = (c: Combo) => c.fans.reduce((a, [f]) => a + MCR_FANS[f].pts, 0);

function chowCombos(chows: Tile[], pair: Tile | null): Combo {
  const options: Combo[] = [];
  const describe2 = (a: Tile, b: Tile) => `${chowName(a)} and ${chowName(b)}`;
  if (chows.length === 4) {
    const f4 = fourChowFan(chows, pair);
    if (f4) options.push({ fans: [[f4, chows.map(chowName).join(', ')]] });
  }
  if (chows.length >= 3) {
    for (let skip = 0; skip < chows.length; skip++) {
      const trio = chows.length === 4 ? chows.filter((_, i) => i !== skip) : chows;
      const f3 = threeChowFan(trio);
      if (!f3) { if (chows.length === 3) break; continue; }
      const combo: Combo = { fans: [[f3, trio.map(chowName).join(', ')]] };
      if (chows.length === 4) {
        // The leftover chow may combine once with one chow already used.
        let bestFan: McrFan | null = null;
        let partner = -1;
        trio.forEach((t, k) => {
          const f = twoChowFan(chows[skip], t);
          if (f && (!bestFan || MCR_FANS[f].pts > MCR_FANS[bestFan].pts)) { bestFan = f; partner = k; }
        });
        if (bestFan) combo.fans.push([bestFan, describe2(chows[skip], trio[partner])]);
      }
      options.push(combo);
      if (chows.length === 3) break;
    }
  }
  if (chows.length >= 2) options.push(bestEdges(chows, twoChowFan, describe2));
  return options.reduce((a, b) => (comboScore(b) > comboScore(a) ? b : a), { fans: [] });
}

function threePungFan(ts: Tile[]): McrFan | null {
  const s = ts.map(suitOf);
  const r = ts.map(rankOf).sort((x, y) => x - y);
  const oneSuit = s[0] === s[1] && s[1] === s[2];
  const threeSuits = new Set(s).size === 3;
  const consecutive = r[1] - r[0] === 1 && r[2] - r[1] === 1;
  if (oneSuit && consecutive) return 'pureShiftedPungs';
  if (threeSuits && r[0] === r[2]) return 'triplePung';
  if (threeSuits && consecutive) return 'mixedShiftedPungs';
  return null;
}

function pungCombos(pungs: Tile[]): Combo {
  const name = (t: Tile) => `${rankOf(t)}s of ${suitName(t)}`;
  const options: Combo[] = [];
  const doublePung = (a: Tile, b: Tile): McrFan | null =>
    suitOf(a) !== suitOf(b) && rankOf(a) === rankOf(b) ? 'doublePung' : null;
  const describe2 = (a: Tile, b: Tile) => `pungs of ${name(a)} and ${name(b)}`;
  if (pungs.length === 4) {
    const r = pungs.map(rankOf).sort((x, y) => x - y);
    if (new Set(pungs.map(suitOf)).size === 1 && r[1] - r[0] === 1 && r[2] - r[1] === 1 && r[3] - r[2] === 1)
      options.push({ fans: [['fourPureShiftedPungs', pungs.map(name).join(', ')]] });
  }
  if (pungs.length >= 3) {
    const trios = pungs.length === 4 ? pungs.map((_, skip) => skip) : [-1];
    for (const skip of trios) {
      const trio = pungs.filter((_, i) => i !== skip);
      const f3 = threePungFan(trio);
      if (!f3) continue;
      const combo: Combo = { fans: [[f3, trio.map(name).join(', ')]] };
      if (skip >= 0) {
        const k = trio.findIndex((t) => doublePung(pungs[skip], t));
        if (k >= 0) combo.fans.push(['doublePung', describe2(pungs[skip], trio[k])]);
      }
      options.push(combo);
    }
  }
  if (pungs.length >= 2) options.push(bestEdges(pungs, doublePung, describe2));
  return options.reduce((a, b) => (comboScore(b) > comboScore(a) ? b : a), { fans: [] });
}

// ---------------------------------------------------------------------------

const REVERSIBLE = new Set([9, 10, 11, 12, 13, 16, 17, 19, 21, 22, 23, 25, 26, WHITE]);
const GREENS = new Set([19, 20, 21, 23, 25, GREEN]);

function scoreDecomposition(hand: HandInput, ctx: WinContext, d: Decomposition, uniqueWait: boolean): Found {
  const found: Found = new Map();
  const tiles = allTiles(hand);
  const win = hand.winningTile!;
  const concealed = isConcealed(hand);
  const sets = d.sets.filter((s) => s.kind !== 'pair');
  const pairSet = d.form === 'standard' || d.form === 'knittedStraight' ? d.sets.find((s) => s.kind === 'pair') : undefined;
  const pair = pairSet?.tile ?? null;
  const pungs = sets.filter(isPungLike);
  const chows = sets.filter((s) => s.kind === 'chow');
  const seat = windTile(ctx.seatWind);
  const round = windTile(ctx.roundWind);

  // ---- special forms
  if (d.form === 'thirteenOrphans') add(found, 'thirteenOrphans');
  if (d.form === 'honorsKnitted') {
    const greater = tiles.filter(isHonor).length === 7;
    add(found, greater ? 'greaterHonorsKnitted' : 'lesserHonorsKnitted');
    if (!greater && hasKnittedStraight(tiles)) add(found, 'knittedStraight', 'All nine knitted tiles are present.');
  }
  if (d.form === 'knittedStraight') add(found, 'knittedStraight');
  if (d.form === 'sevenPairs') {
    const pairs = d.sets.map((s) => s.tile);
    const r = pairs.map(rankOf);
    const oneSuit = pairs.every((t) => isSuited(t) && suitOf(t) === suitOf(pairs[0]));
    const shifted = oneSuit && new Set(r).size === 7 && Math.max(...r) - Math.min(...r) === 6;
    add(found, shifted ? 'sevenShiftedPairs' : 'sevenPairs');
  }

  // ---- honours
  const windPungs = pungs.filter((s) => isWind(s.tile));
  const dragonPungs = pungs.filter((s) => isDragon(s.tile));
  if (windPungs.length === 4) add(found, 'bigFourWinds');
  else if (windPungs.length === 3 && pair !== null && isWind(pair)) add(found, 'littleFourWinds');
  else if (windPungs.length === 3) add(found, 'bigThreeWinds', windPungs.map((s) => tileName(s.tile)).join(', '));
  const windFanUsesAll = windPungs.length >= 3;

  if (dragonPungs.length === 3) add(found, 'bigThreeDragons');
  else if (dragonPungs.length === 2 && pair !== null && isDragon(pair)) add(found, 'littleThreeDragons');
  else if (dragonPungs.length === 2) add(found, 'twoDragonPungs', dragonPungs.map((s) => tileName(s.tile)).join(' and '));
  else if (dragonPungs.length === 1) add(found, 'dragonPung', `Pung of ${tileName(dragonPungs[0].tile)}.`);

  if (pungs.some((s) => s.tile === round)) add(found, 'prevalentWind', `Pung of ${tileName(round)}, the round wind.`);
  if (pungs.some((s) => s.tile === seat)) add(found, 'seatWind', `Pung of ${tileName(seat)}, your seat wind.`);

  for (const s of pungs) {
    if (isTerminal(s.tile)) add(found, 'pungTermHonor', `Pung of ${tileName(s.tile)}.`);
    else if (isWind(s.tile) && !windFanUsesAll && s.tile !== seat && s.tile !== round)
      add(found, 'pungTermHonor', `Pung of ${tileName(s.tile)} (not your seat or round wind).`);
  }

  // ---- kongs & concealed pungs
  const kongs = sets.filter((s) => s.kind === 'kong');
  const ck = kongs.filter((s) => s.concealed).length;
  const mk = kongs.length - ck;
  if (kongs.length === 4) add(found, 'fourKongs');
  else if (kongs.length === 3) add(found, 'threeKongs');
  else if (ck === 2) add(found, 'twoConcealedKongs');
  else if (mk === 2) add(found, 'twoMeldedKongs');
  else if (ck === 1 && mk === 1) add(found, 'meldedConcealedKongs');
  else if (ck === 1) add(found, 'concealedKong', `Concealed kong of ${tileName(kongs[0].tile)}.`);
  else if (mk === 1) add(found, 'meldedKong', `Melded kong of ${tileName(kongs[0].tile)}.`);

  const concealedPungs = pungs.filter((s) => s.concealed);
  const cpWhy = concealedPungs.map((s) => tileName(s.tile)).join(', ');
  if (concealedPungs.length === 4) add(found, 'fourConcealedPungs', cpWhy);
  else if (concealedPungs.length === 3) add(found, 'threeConcealedPungs', cpWhy);
  else if (concealedPungs.length === 2) add(found, 'twoConcealedPungs', cpWhy);

  // ---- structure
  if (pungs.length === 4) add(found, 'allPungs');
  if ((d.form === 'standard' || d.form === 'knittedStraight') && pungs.length === 0 && pair !== null && isSuited(pair))
    add(found, 'allChows');

  // ---- chow and pung combinations
  for (const [fan, why] of chowCombos(chows.map((s) => s.tile), pair).fans) add(found, fan, why);
  for (const [fan, why] of pungCombos(pungs.filter((s) => isSuited(s.tile)).map((s) => s.tile)).fans) add(found, fan, why);

  // ---- suits
  const suits = suitsUsed(tiles);
  const honors = tiles.some(isHonor);
  if (suits.size === 1 && !honors) add(found, 'fullFlush', `Every tile is ${suitName(tiles[0])}.`);
  if (suits.size === 1 && honors) add(found, 'halfFlush', `${suitName(tiles.find(isSuited)!)} plus honours.`);
  if (suits.size === 2) {
    const missing = [0, 1, 2].find((x) => !suits.has(x))!;
    add(found, 'oneVoidedSuit', `No ${['Characters', 'Dots', 'Bamboo'][missing]}.`);
  }
  if (!honors) add(found, 'noHonors');
  if (suits.size === 3 && tiles.some(isWind) && tiles.some(isDragon)) add(found, 'allTypes');

  // ---- numbers
  const suited = tiles.filter(isSuited).map(rankOf);
  if (!honors) {
    if (suited.every((r) => r >= 7)) add(found, 'upperTiles');
    else if (suited.every((r) => r >= 6)) add(found, 'upperFour');
    if (suited.every((r) => r >= 4 && r <= 6)) add(found, 'middleTiles');
    if (suited.every((r) => r <= 3)) add(found, 'lowerTiles');
    else if (suited.every((r) => r <= 4)) add(found, 'lowerFour');
  }
  if (tiles.every((t) => !isTermOrHonor(t))) add(found, 'allSimples');
  if (tiles.every((t) => REVERSIBLE.has(t))) add(found, 'reversibleTiles');
  if (tiles.every((t) => GREENS.has(t))) add(found, 'allGreen');
  if (
    d.form === 'standard' && pungs.length === 4 && pair !== null &&
    [...pungs.map((s) => s.tile), pair].every((t) => isSuited(t) && rankOf(t) % 2 === 0)
  ) add(found, 'allEvenPungs');
  if (d.form === 'standard' && d.sets.every((s) => setTiles(s).some((t) => isSuited(t) && rankOf(t) === 5)))
    add(found, 'allFives');

  // ---- terminals / honours
  // These are defined over pungs and pairs, so Thirteen Orphans doesn't qualify.
  if (d.form === 'standard' || d.form === 'sevenPairs') {
    if (tiles.every(isTerminal)) add(found, 'allTerminals');
    else if (tiles.every(isHonor)) add(found, 'allHonors');
    else if (tiles.every(isTermOrHonor)) add(found, 'allTermHonors');
  }
  if (d.form === 'standard' && d.sets.every((s) => setTiles(s).some(isTermOrHonor))) add(found, 'outsideHand');

  // ---- tile hog: four of a tile used outside a kong
  const nonKong = counts(tiles.filter((t) => !kongs.some((k) => k.tile === t)));
  nonKong.forEach((n, t) => { if (n === 4 && isSuited(t)) add(found, 'tileHog', `All four ${tileName(t)}.`); });

  // ---- nine gates
  if (hand.melds.length === 0 && suits.size === 1 && !honors) {
    const before = counts(hand.tiles);
    before[win]--;
    const s = suitOf(win) * 9;
    const shape = before.slice(s, s + 9).join('');
    if (shape === '311111113') add(found, 'nineGates');
  }

  // ---- how you won
  if (ctx.selfDrawn) add(found, 'selfDrawn');
  if (concealed && ctx.selfDrawn) add(found, 'fullyConcealed');
  if (concealed && !ctx.selfDrawn) add(found, 'concealedHand');
  if (!ctx.selfDrawn && hand.melds.length === 4 && hand.melds.every((m) => !(m.kind === 'kong' && m.concealed)))
    add(found, 'meldedHand');
  if (ctx.lastTile) add(found, ctx.selfDrawn ? 'lastTileDraw' : 'lastTileClaim');
  if (ctx.kongReplacement) add(found, 'outWithReplacement');
  if (ctx.robbingKong) add(found, 'robbingKong');
  if (ctx.lastOfKind) add(found, 'lastTile', `${tileName(win)} was the last one available.`);

  // ---- waits (only when the hand was waiting on exactly one tile)
  if (uniqueWait) {
    const w = waitKind(d, win);
    if (w === 'edge') add(found, 'edgeWait', `Won on ${tileName(win)}.`);
    if (w === 'closed') add(found, 'closedWait', `Won on ${tileName(win)}.`);
    if (w === 'single') add(found, 'singleWait', `Won on ${tileName(win)} for the pair.`);
  }

  applyExclusions(found);
  if (total(found) === 0) add(found, 'chickenHand');
  return found;
}

function hasKnittedStraight(tiles: Tile[]): boolean {
  const set = new Set(tiles);
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  return perms.some((p) => p.every((suit, k) => [k + 1, k + 4, k + 7].every((r) => set.has(suit * 9 + r - 1))));
}

function applyExclusions(found: Found) {
  const order = [...found.keys()].sort((a, b) => MCR_FANS[b].pts - MCR_FANS[a].pts);
  for (const id of order) {
    if (!found.has(id)) continue;
    for (const ex of EXCLUDES[id] ?? []) found.delete(ex);
  }
}

const total = (found: Found) => [...found].reduce((a, [id, f]) => a + MCR_FANS[id].pts * f.count, 0);

export const MCR_MINIMUM = 8;

export function scoreMcr(hand: HandInput, ctx: WinContext): ScoreResult {
  const base: ScoreResult = {
    variant: 'mcr', fans: [], total: 0, rawTotal: 0, unit: 'points',
    minimum: MCR_MINIMUM, meetsMinimum: false, payout: [], notes: [],
  };
  const err = validate(hand);
  if (err) return { ...base, error: err };

  const opts = { allowQuadPairs: true, knitted: true };
  const decomps = decompose(hand, ctx, opts);
  if (decomps.length === 0) {
    return { ...base, error: "These tiles don't form a winning hand. Check for a missing or extra tile." };
  }
  const uniqueWait = waitingTiles(hand, opts).length === 1;

  let best: { d: Decomposition; found: Found; score: number } | null = null;
  for (const d of decomps) {
    const found = scoreDecomposition(hand, ctx, d, uniqueWait);
    const score = total(found);
    if (!best || score > best.score) best = { d, found, score };
  }
  const { d, found } = best!;

  const fans: ScoredFan[] = [...found]
    .map(([id, f]) => ({
      id, en: MCR_FANS[id].en, zh: MCR_FANS[id].zh, points: MCR_FANS[id].pts, count: f.count,
      why: f.why.length ? `${MCR_FANS[id].desc} ${dedupe(f.why).join(' ')}` : MCR_FANS[id].desc,
    }))
    .sort((a, b) => b.points - a.points);

  const flowers = hand.flowers.length;
  if (flowers) fans.push({ id: 'flowerTiles', ...pick(MCR_FANS.flowerTiles), points: 1, count: flowers, why: MCR_FANS.flowerTiles.desc });

  const withoutFlowers = fanTotal(fans) - flowers;
  const totalPts = fanTotal(fans);
  const meets = withoutFlowers >= MCR_MINIMUM;
  const notes: string[] = [];
  if (!meets) notes.push(`MCR needs at least ${MCR_MINIMUM} points (not counting flowers) to declare a win. This hand has ${withoutFlowers}.`);

  const payout = ctx.selfDrawn
    ? [`Each of the other 3 players pays you ${totalPts} + 8 = ${totalPts + 8}.`, `You collect ${(totalPts + 8) * 3} in total.`]
    : [`The discarder pays you ${totalPts} + 8 = ${totalPts + 8}.`, 'The other two players pay you 8 each.', `You collect ${totalPts + 24} in total.`];

  return { ...base, fans, total: totalPts, rawTotal: totalPts, meetsMinimum: meets, decomposition: d, payout, notes };
}

const dedupe = (xs: string[]) => [...new Set(xs)];
const pick = (f: FanDef) => ({ en: f.en, zh: f.zh });
