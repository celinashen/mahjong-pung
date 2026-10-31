import { PointerEvent, useRef, useState } from 'react';
import { SUITS, Tile, counts, tileLabel } from '../engine';
import { useLang } from '../i18n';
import { canAdd } from '../state';
import { useTileDrag } from '../useTileDrag';
import { Bi } from './Bi';
import { TileFace } from './TileFace';

const GROUPS: Array<{ en: string; zh: string; tiles: Tile[] }> = [
  ...SUITS.map((s, i) => ({ en: s.en, zh: s.zh, tiles: Array.from({ length: 9 }, (_, r) => i * 9 + r) })),
  { en: 'Honours', zh: '字', tiles: [27, 28, 29, 30, 31, 32, 33] },
];

interface Props {
  tiles: Tile[];
  pointerDown: ReturnType<typeof useTileDrag>['pointerDown'];
  onAdd: (tile: Tile) => void;
}

export function TilePicker({ tiles, pointerDown, onAdd }: Props) {
  const { lang, tx } = useLang();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const used = counts(tiles);

  const sections = () => [...(railRef.current?.children ?? [])] as HTMLElement[];
  const jumpTo = (i: number) => railRef.current?.scrollTo({ left: sections()[i].offsetLeft, behavior: 'smooth' });

  // The tabs follow the rail. The last section may be too short to reach the left edge.
  const onScroll = () => {
    const rail = railRef.current!;
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    const reached = sections().filter((s) => s.offsetLeft <= rail.scrollLeft + rail.clientWidth / 3).length - 1;
    setActive(atEnd ? GROUPS.length - 1 : Math.max(0, reached));
  };

  return (
    <section className="card" aria-label={tx('Add tiles', '選牌')}>
      <div className="segmented suit-tabs" role="tablist" aria-label={tx('Suit', '花色')}>
        {GROUPS.map((g, i) => (
          <button key={g.en} role="tab" aria-selected={active === i} className={active === i ? 'on' : ''} onClick={() => jumpTo(i)}>
            <Bi en={g.en} zh={g.zh} />
          </button>
        ))}
      </div>

      <div className="rail" ref={railRef} onScroll={onScroll}>
        {GROUPS.map((g) => (
          <div className="rail-section" key={g.en}>
            {g.tiles.map((t) => (
              <button
                key={t}
                className="tile-btn"
                disabled={!canAdd(tiles, t)}
                aria-label={tx(`Add ${tileLabel(t, lang)}`, `加入${tileLabel(t, lang)}`)}
                onPointerDown={(e: PointerEvent) => pointerDown(e, { tile: t, source: 'rail', id: `rail-${t}` })}
                onClick={() => onAdd(t)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <TileFace tile={t} />
                {used[t] > 0 && <span className="badge">{used[t]}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
