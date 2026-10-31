import { PointerEvent, RefObject } from 'react';
import { Tile, sortTiles, tileLabel } from '../engine';
import { useLang } from '../i18n';
import { TileDrag, useTileDrag } from '../useTileDrag';
import { Bi } from './Bi';
import { TileFace } from './TileFace';

interface Props {
  tiles: Tile[];
  error: string | null;
  rootRef: RefObject<HTMLElement>;
  drag: TileDrag | null;
  pointerDown: ReturnType<typeof useTileDrag>['pointerDown'];
  onRemove: (tile: Tile) => void;
}

export function HandView({ tiles, error, rootRef, drag, pointerDown, onRemove }: Props) {
  const { lang, tx } = useLang();
  const size = Math.max(14, tiles.length);
  const incoming = drag?.source === 'rail';

  const seen = new Map<Tile, number>();
  const placed = sortTiles(tiles).map((tile) => {
    const copy = seen.get(tile) ?? 0;
    seen.set(tile, copy + 1);
    return { tile, id: `${tile}-${copy}` };
  });

  return (
    <section
      ref={rootRef}
      className={`card hand-card${incoming ? ' drop-ready' : ''}${incoming && drag.over ? ' drop-over' : ''}`}
      aria-label={tx('Your hand', '手牌')}
    >
      <div className="card-head">
        <h2><Bi en="Your hand" zh="手牌" /></h2>
        <span className={`count ${tiles.length >= 14 ? 'count-full' : ''}`}>{tiles.length}<small>/{size}</small></span>
      </div>

      <div className="hand-grid">
        {placed.map(({ tile, id }) => (
          <button
            key={id}
            className={`tile-btn${drag?.source === 'hand' && drag.id === id ? ' dragging' : ''}`}
            aria-label={tx(`Remove ${tileLabel(tile, lang)}`, `刪除${tileLabel(tile, lang)}`)}
            onPointerDown={(e: PointerEvent) => pointerDown(e, { tile, source: 'hand', id })}
            onClick={() => onRemove(tile)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <TileFace tile={tile} />
          </button>
        ))}
        {Array.from({ length: size - placed.length }, (_, i) => <span key={i} className="slot" aria-hidden />)}
      </div>

      {error ? (
        <p className="hint warn" role="alert">{error}</p>
      ) : (
        <p className="hand-hint">
          {tiles.length === 0
            ? tx('Drag tiles up from below to fill your hand.', '從下面把牌拖上來。')
            : tx('Tap a tile to remove it, or drag it away. Got a kong? Add all 4 tiles.', '點一下刪除，或拖走。有槓？四張都要加。')}
        </p>
      )}
    </section>
  );
}
