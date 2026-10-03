import { BONUS, Bonus, Tile, isSuited, isWind, rankOf, suitOf, tileName } from '../engine';

// Tile faces are drawn as SVG on a 60×80 canvas so they look like real tiles
// (dot circles, bamboo sticks, 萬 characters) at any size. A small index in the
// corner keeps them readable for players who don't read Chinese numerals.

const C = { red: '#a20000', green: '#1f8a5b', blue: '#1f5fb4', ink: '#1d1b26', gold: '#c98a12' };
const ZH_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WIND_ZH = ['東', '南', '西', '北'];
const WIND_EN = ['E', 'S', 'W', 'N'];
const HAN = "'Noto Serif SC', 'Songti SC', serif";

type Pt = [number, number, string];

// ---- dots (筒)
const R = C.red, G = C.green, B = C.blue;
const DOTS: Record<number, { r: number; pts: Pt[] }> = {
  2: { r: 12, pts: [[30, 22, G], [30, 58, B]] },
  3: { r: 10, pts: [[15, 16, B], [30, 40, R], [45, 64, G]] },
  4: { r: 11, pts: [[17, 22, B], [43, 22, G], [17, 58, G], [43, 58, B]] },
  5: { r: 9.5, pts: [[15, 17, B], [45, 17, G], [30, 40, R], [15, 63, G], [45, 63, B]] },
  6: { r: 9.5, pts: [[18, 14, G], [42, 14, G], [18, 42, R], [42, 42, R], [18, 66, R], [42, 66, R]] },
  7: { r: 7.5, pts: [[13, 11, G], [30, 19, G], [47, 27, G], [19, 49, R], [41, 49, R], [19, 68, R], [41, 68, R]] },
  8: { r: 7.5, pts: [[19, 10, B], [41, 10, B], [19, 30, B], [41, 30, B], [19, 50, B], [41, 50, B], [19, 70, B], [41, 70, B]] },
  9: { r: 8, pts: [[12, 14, B], [30, 14, B], [48, 14, B], [12, 40, R], [30, 40, R], [48, 40, R], [12, 66, G], [30, 66, G], [48, 66, G]] },
};

function Dot({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x} cy={y} r={r * 0.68} fill="#fffaf0" />
      <circle cx={x} cy={y} r={r * 0.42} fill={color} />
    </g>
  );
}

function OneDot() {
  return (
    <g>
      <circle cx={30} cy={40} r={22} fill={C.green} />
      <circle cx={30} cy={40} r={18} fill="#fffaf0" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={30 + Math.cos(a) * 14} cy={40 + Math.sin(a) * 14} r={2.4} fill={C.blue} />;
      })}
      <circle cx={30} cy={40} r={9} fill={C.red} />
      <circle cx={30} cy={40} r={4} fill="#fffaf0" />
    </g>
  );
}

// ---- bamboo (條)
function Stick({ x, y, h = 22, color = C.green }: { x: number; y: number; h?: number; color?: string }) {
  const w = 7;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3.5} fill={color} />
      <rect x={x - w / 2 - 0.8} y={y - 1.3} width={w + 1.6} height={2.6} rx={1.3} fill={color} />
      <line x1={x} y1={y - h / 2 + 3} x2={x} y2={y + h / 2 - 3} stroke="#fffaf0" strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
    </g>
  );
}

const BAMBOO: Record<number, Array<[number, number, string?]>> = {
  2: [[30, 22], [30, 58]],
  3: [[30, 22], [19, 58], [41, 58]],
  4: [[19, 22], [41, 22], [19, 58], [41, 58]],
  5: [[15, 22], [45, 22], [30, 40, C.red], [15, 58], [45, 58]],
  6: [[14, 22], [30, 22], [46, 22], [14, 58], [30, 58], [46, 58]],
  7: [[30, 13, C.red], [14, 40], [30, 40], [46, 40], [14, 67], [30, 67], [46, 67]],
  8: [[12, 22], [24, 22], [36, 22], [48, 22], [12, 58], [24, 58], [36, 58], [48, 58]],
  9: [[14, 13, C.red], [30, 13, C.blue], [46, 13, C.red], [14, 40, C.red], [30, 40, C.blue], [46, 40, C.red], [14, 67, C.red], [30, 67, C.blue], [46, 67, C.red]],
};

/** 1 Bamboo is traditionally a bird. A friendly one. */
function Bird() {
  return (
    <g>
      <path d="M22 50 C 10 62, 14 74, 26 72 C 22 66, 24 60, 30 56 Z" fill={C.blue} />
      <path d="M26 54 C 18 66, 28 76, 36 70 C 30 66, 30 60, 34 56 Z" fill={C.green} />
      <ellipse cx={34} cy={42} rx={14} ry={13} fill={C.green} />
      <circle cx={40} cy={26} r={9} fill={C.green} />
      <path d="M48 25 L 56 27 L 48 30 Z" fill={C.gold} />
      <circle cx={42} cy={24} r={2.2} fill="#fffaf0" />
      <circle cx={42.5} cy={24} r={1.1} fill={C.ink} />
      <path d="M36 17 C 34 10, 40 8, 41 13 C 43 8, 48 11, 44 17 Z" fill={C.red} />
      <path d="M26 42 C 30 36, 40 38, 42 46 C 36 44, 30 46, 26 42 Z" fill="#fffaf0" opacity={0.5} />
    </g>
  );
}

function Corner({ text, color = C.ink }: { text: string | number; color?: string }) {
  return (
    <text x={4.5} y={12} fontSize={10.5} fontWeight={800} fill={color} fontFamily="Nunito, sans-serif">{text}</text>
  );
}

function Han({ ch, y, size, color }: { ch: string; y: number; size: number; color: string }) {
  return (
    <text x={30} y={y} fontSize={size} fontWeight={900} fill={color} textAnchor="middle" dominantBaseline="central" fontFamily={HAN}>{ch}</text>
  );
}

function faceFor(tile: Tile) {
  if (isSuited(tile)) {
    const r = rankOf(tile);
    const suit = suitOf(tile);
    if (suit === 0) {
      return (
        <>
          <Han ch={ZH_NUM[r - 1]} y={24} size={26} color={C.ink} />
          <Han ch="萬" y={57} size={30} color={C.red} />
          <Corner text={r} color={C.red} />
        </>
      );
    }
    if (suit === 1) {
      return r === 1 ? <OneDot /> : <>{DOTS[r].pts.map(([x, y, c], i) => <Dot key={i} x={x} y={y} r={DOTS[r].r} color={c} />)}</>;
    }
    if (r === 1) return <Bird />;
    const h = r >= 7 ? 20 : 26;
    return <>{BAMBOO[r].map(([x, y, c], i) => <Stick key={i} x={x} y={y} h={h} color={c} />)}</>;
  }
  if (isWind(tile)) {
    const w = tile - 27;
    return (
      <>
        <Han ch={WIND_ZH[w]} y={42} size={40} color={C.ink} />
        <Corner text={WIND_EN[w]} color={C.blue} />
      </>
    );
  }
  const d = tile - 31;
  if (d === 0) return <Han ch="中" y={41} size={44} color={C.red} />;
  if (d === 1) return <Han ch="發" y={41} size={40} color={C.green} />;
  return (
    <>
      <rect x={11} y={13} width={38} height={54} rx={4} fill="none" stroke={C.blue} strokeWidth={4} />
      <rect x={18} y={20} width={24} height={40} rx={2} fill="none" stroke={C.blue} strokeWidth={2} />
    </>
  );
}

interface Props {
  tile: Tile;
  size?: 'sm' | 'md';
  highlight?: boolean;
}

export function TileFace({ tile, size = 'md', highlight }: Props) {
  return (
    <span className={`tile tile-${size}${highlight ? ' tile-win' : ''}`} role="img" aria-label={tileName(tile)}>
      <svg viewBox="0 0 60 80" aria-hidden>{faceFor(tile)}</svg>
    </span>
  );
}

const BONUS_COLOR = ['#d6457a', '#8a4fc2', '#c98a12', '#1f8a5b', '#1f8a5b', '#a20000', '#d9711c', '#1f5fb4'];

export function BonusFace({ bonus, size = 'md', active }: { bonus: Bonus; size?: 'sm' | 'md'; active?: boolean }) {
  const b = BONUS[bonus];
  const color = BONUS_COLOR[bonus];
  return (
    <span className={`tile tile-${size}${active === false ? ' tile-off' : ''}`} role="img" aria-label={`${b.en} (${b.n})`}>
      <svg viewBox="0 0 60 80" aria-hidden>
        <circle cx={30} cy={44} r={20} fill={color} opacity={0.12} />
        <Han ch={b.zh} y={44} size={34} color={color} />
        <Corner text={b.n} color={color} />
      </svg>
    </span>
  );
}
