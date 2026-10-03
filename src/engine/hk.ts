// Hong Kong (Cantonese) scoring, following the HKMJ Cheat Sheet 1.0.
// "Indented" features replace their parent (e.g. Full Flush replaces Mixed Flush).

import {
  Decomposition, HandInput, WinContext, allTiles, counts, decompose, isConcealed, isPungLike, validate,
} from './hand';
import { isDragon, isHonor, isSuited, isTermOrHonor, isTerminal, isWind, suitOf, windTile } from './tiles';
import { Lang, MESSAGES, Messages } from './i18n';
import { HK_DESC_ZH } from './descZh';
import { ScoreResult, ScoredFan, fanTotal } from './types';

interface FanDef { en: string; zh: string; fan: number; desc: string }

export const HK_FANS = {
  selfPick: { en: 'Self-Pick', zh: '自摸', fan: 1, desc: 'You drew the winning tile from the wall.' },
  kongReplacement: { en: 'Win by Kong Replacement', zh: '槓上開花', fan: 2, desc: 'The winning tile was the replacement drawn after a kong (replaces Self-Pick).' },
  doubleKongReplacement: { en: 'Double Kong Replacement', zh: '槓上槓', fan: 9, desc: 'Won on the replacement tile of a second kong declared back-to-back (replaces Self-Pick).' },
  concealedHand: { en: 'Concealed Hand', zh: '門前清', fan: 1, desc: 'You did not claim any sets from other players.' },
  robbingKong: { en: 'Robbing the Kong', zh: '搶槓', fan: 1, desc: 'You won on the tile another player used to upgrade a pung to a kong.' },
  moonUnderSea: { en: 'Moon Under the Sea', zh: '海底撈月', fan: 1, desc: 'Your winning tile was the last tile of the wall or the last discard.' },
  dragon: { en: 'Dragon', zh: '三元牌', fan: 1, desc: 'A triplet of dragons (1 fan each).' },
  smallThreeDragons: { en: 'Small Three Dragons', zh: '小三元', fan: 5, desc: 'Two dragon triplets and a pair of the third dragon.' },
  bigThreeDragons: { en: 'Big Three Dragons', zh: '大三元', fan: 8, desc: 'Triplets of all three dragons.' },
  seatWind: { en: 'Seat Wind', zh: '門風', fan: 1, desc: 'A triplet of your seat wind.' },
  roundWind: { en: 'Round Wind', zh: '圈風', fan: 1, desc: 'A triplet of the round wind.' },
  smallFourWinds: { en: 'Small Four Winds', zh: '小四喜', fan: 6, desc: 'Three wind triplets and a pair of the fourth wind.' },
  bigFourWinds: { en: 'Big Four Winds', zh: '大四喜', fan: 13, desc: 'Triplets of all four winds.' },
  mixedFlush: { en: 'Mixed Flush', zh: '混一色', fan: 3, desc: 'Only one suit plus honours.' },
  fullFlush: { en: 'Full Flush', zh: '清一色', fan: 7, desc: 'Only one suit, no honours.' },
  allSequences: { en: 'All Sequences', zh: '平糊', fan: 1, desc: 'All four sets are sequences (chows).' },
  allTriplets: { en: 'All Triplets', zh: '對對糊', fan: 3, desc: 'All four sets are triplets or kongs.' },
  allConcealedTriplets: { en: 'All Concealed Triplets', zh: '坎坎糊', fan: 8, desc: 'All four sets are triplets you formed yourself; a discard only completed the pair.' },
  mixedTerminals: { en: 'Mixed Terminals', zh: '花么九', fan: 4, desc: 'Only 1s, 9s and honours (includes the 3 fan for All Triplets).' },
  allHonours: { en: 'All Honours', zh: '字一色', fan: 10, desc: 'Only winds and dragons (includes the 3 fan for All Triplets).' },
  allTerminals: { en: 'All Terminals', zh: '清么九', fan: 13, desc: 'Only 1s and 9s (includes the 3 fan for All Triplets).' },
  allQuadruplets: { en: 'All Quadruplets', zh: '十八羅漢', fan: 13, desc: 'All four sets are kongs.' },
  noFlowers: { en: 'No Flowers or Seasons', zh: '無花', fan: 1, desc: 'You have no flowers or seasons.' },
  seatFlower: { en: 'Seat Flower or Season', zh: '正花', fan: 1, desc: '1 fan for each flower or season matching your seat number.' },
  fullFlowerSet: { en: 'All Flowers or All Seasons', zh: '一台花', fan: 2, desc: 'You hold all four flowers or all four seasons.' },
  sevenFlowers: { en: 'Seven Flowers', zh: '七搶一', fan: 3, desc: 'Won immediately by declaring a 7th flower/season.' },
  eightFlowers: { en: 'Eight Flowers', zh: '八仙過海', fan: 8, desc: 'You hold all eight flowers and seasons.' },
  heavenly: { en: 'Blessing of Heaven', zh: '天糊', fan: 13, desc: 'As dealer, your starting hand was already a win.' },
  earthly: { en: 'Blessing of Earth', zh: '地糊', fan: 13, desc: "As a non-dealer, you won on the dealer's first discard." },
  humanly: { en: 'Blessing of Man', zh: '人糊', fan: 13, desc: 'As a non-dealer, you self-picked a win on your first turn.' },
  nineGates: { en: 'Nine Gates', zh: '九子連環', fan: 13, desc: '1112345678999 of one suit plus any 14th tile of that suit.' },
  thirteenOrphans: { en: 'Thirteen Orphans', zh: '十三么', fan: 13, desc: 'One of each 1, 9, wind and dragon, plus a duplicate of one.' },
  sevenPairs: { en: 'Seven Pairs', zh: '七對子', fan: 4, desc: 'Seven different pairs.' },
} satisfies Record<string, FanDef>;

export type HkFan = keyof typeof HK_FANS;

export const HK_LIMIT = 13;
/** Payment table (new style): points for 0..13 fan. */
export const HK_POINTS = [1, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384];

export interface HkOptions {
  minimumFan: number;
  allowSevenPairs: boolean;
}

export const HK_DEFAULTS: HkOptions = { minimumFan: 3, allowSevenPairs: true };

type Item = { id: HkFan; fan: number; count: number; why?: string };

function scoreDecomposition(hand: HandInput, ctx: WinContext, d: Decomposition, M: Messages): Item[] {
  const items: Item[] = [];
  const push = (id: HkFan, why?: string, fan = HK_FANS[id].fan, count = 1) => items.push({ id, fan, count, why });
  const tiles = allTiles(hand);
  const sets = d.sets.filter((s) => s.kind !== 'pair');
  const pair = d.form === 'standard' ? d.sets.find((s) => s.kind === 'pair')!.tile : null;
  const pungs = sets.filter(isPungLike);
  const seatT = windTile(ctx.seatWind);
  const roundT = windTile(ctx.roundWind);

  // ---- special hands
  if (d.form === 'thirteenOrphans') push('thirteenOrphans');
  if (d.form === 'sevenPairs') push('sevenPairs');
  if (hand.melds.length === 0) {
    const suits = new Set(tiles.map((t) => (isSuited(t) ? suitOf(t) : 9)));
    if (suits.size === 1 && isSuited(tiles[0])) {
      const before = counts(hand.tiles);
      before[hand.winningTile!]--;
      const s = suitOf(tiles[0]) * 9;
      if (before.slice(s, s + 9).join('') === '311111113') push('nineGates');
    }
  }
  if (ctx.heavenly) push('heavenly');
  if (ctx.earthly) push('earthly');
  if (ctx.humanly) push('humanly');

  // ---- win actions
  if (ctx.doubleKongReplacement) push('doubleKongReplacement');
  else if (ctx.kongReplacement) push('kongReplacement');
  else if (ctx.selfDrawn) push('selfPick');
  if (ctx.robbingKong) push('robbingKong');
  if (ctx.lastTile) push('moonUnderSea');
  if (d.form === 'standard' && isConcealed(hand)) push('concealedHand');

  // ---- dragons
  const dragonPungs = pungs.filter((s) => isDragon(s.tile));
  if (dragonPungs.length === 3) push('bigThreeDragons');
  else if (dragonPungs.length === 2 && pair !== null && isDragon(pair)) push('smallThreeDragons');
  else dragonPungs.forEach((s) => push('dragon', M.tripletOf(s.tile)));

  // ---- winds
  const windPungs = pungs.filter((s) => isWind(s.tile));
  if (windPungs.length === 4) push('bigFourWinds');
  else if (windPungs.length === 3 && pair !== null && isWind(pair)) push('smallFourWinds');
  else {
    if (windPungs.some((s) => s.tile === seatT)) push('seatWind', M.tripletOf(seatT));
    if (windPungs.some((s) => s.tile === roundT)) push('roundWind', M.tripletOf(roundT));
  }

  // ---- flush
  const suits = new Set(tiles.filter(isSuited).map(suitOf));
  const honors = tiles.some(isHonor);
  if (suits.size === 1 && !honors) push('fullFlush');
  else if (suits.size === 1 && honors) push('mixedFlush');

  // ---- set types
  if (d.form === 'standard' && sets.every((s) => s.kind === 'chow')) push('allSequences');

  if (d.form === 'standard' && pungs.length === 4) {
    if (sets.every((s) => s.kind === 'kong')) push('allQuadruplets');
    const allConcealed = pungs.every((s) => s.concealed);
    if (allConcealed) push('allConcealedTriplets');
    const typeFan: HkFan | null = tiles.every(isTerminal) ? 'allTerminals'
      : tiles.every(isHonor) ? 'allHonours'
      : tiles.every(isTermOrHonor) ? 'mixedTerminals' : null;
    if (typeFan) {
      // Each of these already includes All Triplets' 3 fan; don't count it twice.
      if (allConcealed) push(typeFan, M.allTripletsInside, HK_FANS[typeFan].fan - 3);
      else push(typeFan);
    } else if (!allConcealed && !sets.every((s) => s.kind === 'kong')) {
      push('allTriplets');
    }
  } else if (d.form === 'sevenPairs' && tiles.every(isHonor)) {
    push('allHonours');
  }

  // ---- flowers
  const fl = hand.flowers;
  if (fl.length === 8) push('eightFlowers');
  else if (fl.length === 0) push('noFlowers');
  else {
    for (const [group, isFlower] of [[[0, 1, 2, 3], true], [[4, 5, 6, 7], false]] as const) {
      const held = fl.filter((b) => (group as readonly number[]).includes(b));
      if (held.length === 4) push('fullFlowerSet', M.allFourBonus(isFlower));
      else if (held.includes(group[ctx.seatWind])) push('seatFlower', M.seatBonus(ctx.seatWind, isFlower));
    }
  }

  return items;
}

export function scoreHk(hand: HandInput, ctx: WinContext, options: HkOptions = HK_DEFAULTS, lang: Lang = 'en'): ScoreResult {
  const M = MESSAGES[lang];
  const base: ScoreResult = {
    variant: 'hk', fans: [], total: 0, rawTotal: 0, unit: 'fan',
    minimum: options.minimumFan, meetsMinimum: false, payout: [], notes: [],
  };

  // Winning by declaring the 7th/8th flower doesn't need a complete hand.
  const flowerWin = hand.flowers.length >= 7 && hand.tiles.length + hand.melds.length * 3 < 14;
  let items: Item[];
  let decomposition: Decomposition | undefined;
  if (flowerWin) {
    const id: HkFan = hand.flowers.length === 8 ? 'eightFlowers' : 'sevenFlowers';
    items = [{ id, fan: HK_FANS[id].fan, count: 1 }];
  } else {
    const err = validate(hand, lang);
    if (err) return { ...base, error: err };
    const decomps = decompose(hand, ctx, { allowQuadPairs: false, knitted: false })
      .filter((d) => d.form !== 'sevenPairs' || options.allowSevenPairs);
    if (decomps.length === 0) {
      return { ...base, error: M.notAWin };
    }
    let best: { d: Decomposition; items: Item[]; score: number } | null = null;
    for (const d of decomps) {
      const its = scoreDecomposition(hand, ctx, d, M);
      const score = its.reduce((a, i) => a + i.fan * i.count, 0);
      if (!best || score > best.score) best = { d, items: its, score };
    }
    items = best!.items;
    decomposition = best!.d;
  }

  // Merge repeated items (e.g. two dragon triplets) into one line with a count.
  const merged = new Map<string, ScoredFan>();
  for (const it of items) {
    const key = `${it.id}:${it.fan}`;
    const def = HK_FANS[it.id];
    const desc = lang === 'zh' ? HK_DESC_ZH[it.id] : def.desc;
    const prev = merged.get(key);
    if (prev) {
      prev.count += it.count;
      if (it.why) prev.why += `${M.sentenceGap}${it.why}`;
    } else {
      merged.set(key, { id: it.id, en: def.en, zh: def.zh, points: it.fan, count: it.count, why: it.why ? `${desc}${M.sentenceGap}${it.why}` : desc });
    }
  }
  const fans = [...merged.values()].sort((a, b) => b.points - a.points);
  const raw = fanTotal(fans);
  const totalFan = Math.min(raw, HK_LIMIT);
  const pts = HK_POINTS[totalFan];
  const notes: string[] = [];
  if (raw > HK_LIMIT) notes.push(M.capped(raw, HK_LIMIT));
  if (raw === 0) notes.push(M.chicken);
  const meets = totalFan >= options.minimumFan;
  if (!meets) notes.push(M.hkMinimum(options.minimumFan, totalFan));

  const payout = ctx.selfDrawn
    ? M.hkSelfPick(pts)
    : M.hkDiscard(pts);

  return { ...base, fans, total: totalFan, rawTotal: raw, meetsMinimum: meets, decomposition, payout, notes };
}
