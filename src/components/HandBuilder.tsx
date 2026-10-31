import { useRef } from 'react';
import { useLang } from '../i18n';
import { Action, HandState } from '../state';
import { DragSource, useTileDrag } from '../useTileDrag';
import { HandView } from './HandView';
import { TileFace } from './TileFace';
import { TilePicker } from './TilePicker';

interface Props {
  hand: HandState;
  error: string | null;
  dispatch: (a: Action) => void;
}

/** The hand and the tile rail, joined by drag and drop. */
export function HandBuilder({ hand, error, dispatch }: Props) {
  const { tx } = useLang();
  const handRef = useRef<HTMLElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const { drag, pointerDown, wasDrag } = useTileDrag({
    target: (source: DragSource) => (source === 'rail' ? handRef.current : binRef.current),
    onDrop: ({ source, tile }) => dispatch({ type: source === 'rail' ? 'addTile' : 'removeTile', tile }),
  });
  const removing = drag?.source === 'hand';

  return (
    <>
      <HandView
        tiles={hand.tiles}
        error={error}
        rootRef={handRef}
        drag={drag}
        pointerDown={pointerDown}
        onRemove={(tile) => { if (!wasDrag()) dispatch({ type: 'removeTile', tile }); }}
      />
      <TilePicker
        tiles={hand.tiles}
        pointerDown={pointerDown}
        onAdd={(tile) => { if (!wasDrag()) dispatch({ type: 'addTile', tile }); }}
      />

      {removing && (
        <div ref={binRef} className={`drop-bin${drag.over ? ' over' : ''}`} role="status">
          <span className="drop-bin-icon" aria-hidden>×</span>
          {drag.over ? tx('Let go to remove', '放手即刪除') : tx('Drag here to remove', '拖到這裡刪除')}
        </div>
      )}
      {drag && (
        <div className={`drag-ghost${removing && drag.over ? ' leaving' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden>
          <TileFace tile={drag.tile} />
        </div>
      )}
    </>
  );
}
