// Tile model shared by every variant.
//
// Tiles are numbers 0..33:
//   0-8   Characters 萬 1-9
//   9-17  Dots       筒 1-9
//   18-26 Bamboo     條 1-9
//   27-30 Winds      East, South, West, North
//   31-33 Dragons    Red 中, Green 發, White 白
// Bonus tiles (flowers/seasons) are numbered separately 0..7:
//   0-3 Flowers  梅 蘭 菊 竹 (numbered 1-4)
//   4-7 Seasons  春 夏 秋 冬 (numbered 1-4)

export type Tile = number;
export type Bonus = number;
export type Suit = 0 | 1 | 2;
export type Wind = 0 | 1 | 2 | 3;

export const TILE_COUNT = 34;
export const EAST = 27;
export const RED = 31;
export const GREEN = 32;
export const WHITE = 33;

export const SUITS = [
  { key: 'm', en: 'Characters', zh: '萬' },
  { key: 'p', en: 'Dots', zh: '筒' },
  { key: 's', en: 'Bamboo', zh: '條' },
] as const;

export const WINDS = [
  { en: 'East', zh: '東' },
  { en: 'South', zh: '南' },
  { en: 'West', zh: '西' },
  { en: 'North', zh: '北' },
] as const;

export const DRAGONS = [
  { en: 'Red Dragon', zh: '中' },
  { en: 'Green Dragon', zh: '發' },
  { en: 'White Dragon', zh: '白' },
] as const;

export const BONUS = [
  { en: 'Plum', zh: '梅', n: 1 },
  { en: 'Orchid', zh: '蘭', n: 2 },
  { en: 'Chrysanthemum', zh: '菊', n: 3 },
  { en: 'Bamboo', zh: '竹', n: 4 },
  { en: 'Spring', zh: '春', n: 1 },
  { en: 'Summer', zh: '夏', n: 2 },
  { en: 'Autumn', zh: '秋', n: 3 },
  { en: 'Winter', zh: '冬', n: 4 },
] as const;

const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

export const isSuited = (t: Tile) => t < 27;
export const isHonor = (t: Tile) => t >= 27;
export const isWind = (t: Tile) => t >= 27 && t <= 30;
export const isDragon = (t: Tile) => t >= 31;
export const suitOf = (t: Tile) => Math.floor(t / 9) as Suit;
export const rankOf = (t: Tile) => (t % 9) + 1;
export const isTerminal = (t: Tile) => isSuited(t) && (rankOf(t) === 1 || rankOf(t) === 9);
export const isTermOrHonor = (t: Tile) => isHonor(t) || isTerminal(t);
export const tileOf = (suit: Suit, rank: number): Tile => suit * 9 + rank - 1;
export const windTile = (w: Wind): Tile => EAST + w;

export function tileName(t: Tile): string {
  if (isSuited(t)) return `${rankOf(t)} ${SUITS[suitOf(t)].en}`;
  if (isWind(t)) return `${WINDS[t - 27].en} Wind`;
  return DRAGONS[t - 31].en;
}

export function tileNameZh(t: Tile): string {
  if (isSuited(t)) return `${ZH_NUM[rankOf(t) - 1]}${SUITS[suitOf(t)].zh}`;
  if (isWind(t)) return `${WINDS[t - 27].zh}風`;
  return DRAGONS[t - 31].zh;
}

/** Short label used in explanations, e.g. "5 Dots", "East Wind". */
export const short = tileName;

export const ALL_TILES: Tile[] = Array.from({ length: TILE_COUNT }, (_, i) => i);
export const ALL_BONUS: Bonus[] = [0, 1, 2, 3, 4, 5, 6, 7];

export function sortTiles(ts: Tile[]): Tile[] {
  return [...ts].sort((a, b) => a - b);
}
