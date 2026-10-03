// Localised strings produced by the scoring engine (errors, explanations, payouts).
// Chinese is Traditional, matching the tiles and the HK rule sheet.

import { Tile, isSuited, isWind, rankOf, suitOf } from './tiles';

export type Lang = 'en' | 'zh';

const SUIT_EN = ['Characters', 'Dots', 'Bamboo'];
const SUIT_ZH = ['萬', '筒', '條'];
const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WIND_EN = ['East', 'South', 'West', 'North'];
const WIND_ZH = ['東', '南', '西', '北'];
const DRAGON_EN = ['Red Dragon', 'Green Dragon', 'White Dragon'];
const DRAGON_ZH = ['紅中', '青發', '白板'];

export function tileLabel(t: Tile, lang: Lang): string {
  if (isSuited(t)) return lang === 'en' ? `${rankOf(t)} ${SUIT_EN[suitOf(t)]}` : `${ZH_NUM[rankOf(t) - 1]}${SUIT_ZH[suitOf(t)]}`;
  if (isWind(t)) return lang === 'en' ? `${WIND_EN[t - 27]} Wind` : `${WIND_ZH[t - 27]}風`;
  return lang === 'en' ? DRAGON_EN[t - 31] : DRAGON_ZH[t - 31];
}

export const suitLabel = (s: number, lang: Lang) => (lang === 'en' ? SUIT_EN[s] : `${SUIT_ZH[s]}子`);
export const windLabel = (w: number, lang: Lang) => (lang === 'en' ? WIND_EN[w] : WIND_ZH[w]);

const chowEn = (t: Tile) => `${rankOf(t)}-${rankOf(t) + 1}-${rankOf(t) + 2} ${SUIT_EN[suitOf(t)]}`;
const chowZh = (t: Tile) => `${ZH_NUM[rankOf(t) - 1]}${ZH_NUM[rankOf(t)]}${ZH_NUM[rankOf(t) + 1]}${SUIT_ZH[suitOf(t)]}`;

const en = {
  needTiles: (need: number, have: number) =>
    `Your hand needs ${need} concealed tile${need === 1 ? '' : 's'} (besides revealed sets) — you have ${have}.`,
  tooManySets: 'A hand can have at most 4 sets.',
  tooManyCopies: 'You have more than 4 copies of a tile.',
  markWinning: 'Select a tile in your hand and mark it as the winning tile.',
  notAWin: "These tiles don't form a winning hand. Check for a missing or extra tile.",
  list: (xs: string[]) => xs.join(', '),
  sentenceGap: ' ',
  and: (a: string, b: string) => `${a} and ${b}`,

  // shared explanations
  pungOf: (t: Tile) => `Pung of ${tileLabel(t, 'en')}.`,
  tripletOf: (t: Tile) => `Triplet of ${tileLabel(t, 'en')}.`,
  roundWindPung: (t: Tile) => `Pung of ${tileLabel(t, 'en')}, the round wind.`,
  seatWindPung: (t: Tile) => `Pung of ${tileLabel(t, 'en')}, your seat wind.`,
  otherWindPung: (t: Tile) => `Pung of ${tileLabel(t, 'en')} (not your seat or round wind).`,
  concealedKong: (t: Tile) => `Concealed kong of ${tileLabel(t, 'en')}.`,
  meldedKong: (t: Tile) => `Melded kong of ${tileLabel(t, 'en')}.`,
  everyTile: (s: number) => `Every tile is ${SUIT_EN[s]}.`,
  suitPlusHonours: (s: number) => `${SUIT_EN[s]} plus honours.`,
  noSuit: (s: number) => `No ${SUIT_EN[s]}.`,
  allFour: (t: Tile) => `All four ${tileLabel(t, 'en')}.`,
  lastOne: (t: Tile) => `${tileLabel(t, 'en')} was the last one available.`,
  wonOn: (t: Tile) => `Won on ${tileLabel(t, 'en')}.`,
  wonOnPair: (t: Tile) => `Won on ${tileLabel(t, 'en')} for the pair.`,
  knittedPresent: 'All nine knitted tiles are present.',
  chow: chowEn,
  pungsOf: (t: Tile) => `${rankOf(t)}s of ${SUIT_EN[suitOf(t)]}`,
  twoChows: (a: Tile, b: Tile) => `${chowEn(a)} and ${chowEn(b)}`,
  twoPungs: (a: Tile, b: Tile) => `Pungs of ${rankOf(a)}s of ${SUIT_EN[suitOf(a)]} and ${rankOf(b)}s of ${SUIT_EN[suitOf(b)]}`,

  // HK
  allTripletsInside: 'All Triplets is already counted inside All Concealed Triplets.',
  allFourBonus: (flowers: boolean) => `All four ${flowers ? 'flowers' : 'seasons'}.`,
  seatBonus: (seat: number, flowers: boolean) =>
    `Your seat is ${WIND_EN[seat]} (#${seat + 1}) and you hold ${flowers ? 'flower' : 'season'} #${seat + 1}.`,
  capped: (raw: number, limit: number) => `Hand is worth ${raw} fan, capped at the ${limit}-fan limit.`,
  chicken: 'Chicken hand (雞糊) — a win with no scoring features.',
  hkMinimum: (min: number, has: number) => `Your table needs at least ${min} fan to declare a win. This hand has ${has}.`,
  hkSelfPick: (pts: number) => [`Self-pick: each of the other 3 players pays you ${pts}.`, `You collect ${pts * 3} in total.`],
  hkDiscard: (pts: number) => [`Discarder pays all: the player who discarded pays you ${pts * 2} (2 × ${pts}).`],

  // MCR
  mcrMinimum: (min: number, has: number) =>
    `MCR needs at least ${min} points (not counting flowers) to declare a win. This hand has ${has}.`,
  mcrSelf: (pts: number) => [`Each of the other 3 players pays you ${pts} + 8 = ${pts + 8}.`, `You collect ${(pts + 8) * 3} in total.`],
  mcrDiscard: (pts: number) => [
    `The discarder pays you ${pts} + 8 = ${pts + 8}.`,
    'The other two players pay you 8 each.',
    `You collect ${pts + 24} in total.`,
  ],
};

export type Messages = typeof en;

const zh: Messages = {
  needTiles: (need, have) => `暗牌（不計明牌）需要 ${need} 張，你現在有 ${have} 張。`,
  tooManySets: '一副牌最多只有 4 組。',
  tooManyCopies: '同一張牌不能多過 4 張。',
  markWinning: '請在手牌中選一張牌，設為和牌的那一張。',
  notAWin: '這副牌未能組成和牌，請檢查是否多了或少了一張。',
  list: (xs) => xs.join('、'),
  sentenceGap: '',
  and: (a, b) => `${a}及${b}`,

  pungOf: (t) => `${tileLabel(t, 'zh')}刻子。`,
  tripletOf: (t) => `${tileLabel(t, 'zh')}刻子。`,
  roundWindPung: (t) => `${tileLabel(t, 'zh')}刻子，是圈風。`,
  seatWindPung: (t) => `${tileLabel(t, 'zh')}刻子，是你的門風。`,
  otherWindPung: (t) => `${tileLabel(t, 'zh')}刻子（不是門風或圈風）。`,
  concealedKong: (t) => `${tileLabel(t, 'zh')}暗槓。`,
  meldedKong: (t) => `${tileLabel(t, 'zh')}明槓。`,
  everyTile: (s) => `全部都是${SUIT_ZH[s]}子。`,
  suitPlusHonours: (s) => `${SUIT_ZH[s]}子加字牌。`,
  noSuit: (s) => `沒有${SUIT_ZH[s]}子。`,
  allFour: (t) => `四張${tileLabel(t, 'zh')}全用上。`,
  lastOne: (t) => `${tileLabel(t, 'zh')}是最後一張。`,
  wonOn: (t) => `和${tileLabel(t, 'zh')}。`,
  wonOnPair: (t) => `單釣${tileLabel(t, 'zh')}做眼。`,
  knittedPresent: '九張組合龍的牌齊全。',
  chow: chowZh,
  pungsOf: (t) => `${ZH_NUM[rankOf(t) - 1]}${SUIT_ZH[suitOf(t)]}`,
  twoChows: (a, b) => `${chowZh(a)}及${chowZh(b)}`,
  twoPungs: (a, b) => `${ZH_NUM[rankOf(a) - 1]}${SUIT_ZH[suitOf(a)]}刻及${ZH_NUM[rankOf(b) - 1]}${SUIT_ZH[suitOf(b)]}刻`,

  allTripletsInside: '對對糊的番數已包括在坎坎糊內。',
  allFourBonus: (flowers) => `四隻${flowers ? '花' : '季'}齊全。`,
  seatBonus: (seat, flowers) => `你坐${WIND_ZH[seat]}位（${seat + 1} 號），有 ${seat + 1} 號${flowers ? '花' : '季'}。`,
  capped: (raw, limit) => `這副牌值 ${raw} 番，以 ${limit} 番爆棚計。`,
  chicken: '雞糊 —— 沒有任何番數的和牌。',
  hkMinimum: (min, has) => `你們規定最少 ${min} 番起糊，這副牌只有 ${has} 番。`,
  hkSelfPick: (pts) => [`自摸：其他三家各付你 ${pts}。`, `合共收 ${pts * 3}。`],
  hkDiscard: (pts) => [`出銃包：出銃的一家付你 ${pts * 2}（2 × ${pts}）。`],

  mcrMinimum: (min, has) => `國標麻將最少要 ${min} 分（花牌不計）才可和牌，這副牌有 ${has} 分。`,
  mcrSelf: (pts) => [`其他三家各付你 ${pts} + 8 = ${pts + 8}。`, `合共收 ${(pts + 8) * 3}。`],
  mcrDiscard: (pts) => [`點炮的一家付你 ${pts} + 8 = ${pts + 8}。`, '另外兩家各付你 8。', `合共收 ${pts + 24}。`],
};

export const MESSAGES: Record<Lang, Messages> = { en, zh };
