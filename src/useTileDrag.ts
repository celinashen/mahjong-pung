import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { Tile } from './engine';

export type DragSource = 'rail' | 'hand';

export interface TileDrag {
  tile: Tile;
  source: DragSource;
  /** Identifies the exact tile on screen, so it can dim while it's in the air. */
  id: string;
  x: number;
  y: number;
  /** Finger is over the drop target. */
  over: boolean;
}

const START_PX = 8;
const TARGET_SLOP_PX = 16;

function isOver(el: HTMLElement | null, x: number, y: number) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left - TARGET_SLOP_PX && x <= r.right + TARGET_SLOP_PX
    && y >= r.top - TARGET_SLOP_PX && y <= r.bottom + TARGET_SLOP_PX;
}

interface Options {
  /** Where tiles from `source` can land. Read on every move, as targets can appear mid-drag. */
  target: (source: DragSource) => HTMLElement | null;
  onDrop: (drag: TileDrag) => void;
}

/**
 * Pointer-based drag, since HTML5 drag events don't fire for touch.
 *
 * Rail tiles sit in a horizontal scroller with `touch-action: pan-x`: a sideways
 * swipe stays with the browser (which sends pointercancel), and only a mostly
 * vertical move picks the tile up.
 */
export function useTileDrag({ target, onDrop }: Options) {
  const [drag, setDrag] = useState<TileDrag | null>(null);
  const pressing = useRef(false);
  const dragging = useRef(false);
  const justDragged = useRef(false);

  // touch-action alone doesn't reliably stop iOS Safari scrolling mid-drag.
  useEffect(() => {
    const block = (e: TouchEvent) => { if (dragging.current) e.preventDefault(); };
    document.addEventListener('touchmove', block, { passive: false });
    return () => document.removeEventListener('touchmove', block);
  }, []);

  const pointerDown = (e: ReactPointerEvent, item: Pick<TileDrag, 'tile' | 'source' | 'id'>) => {
    if (e.button !== 0 || pressing.current) return;
    pressing.current = true;
    const { pointerId, pointerType, clientX: startX, clientY: startY } = e;
    let current: TileDrag | null = null;

    const finish = (drop: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      pressing.current = false;
      if (!current) return;
      dragging.current = false;
      setDrag(null);
      // The mouse still sends a click after a drag; don't treat it as a tap.
      justDragged.current = true;
      setTimeout(() => { justDragged.current = false; }, 50);
      if (drop && current.over) onDrop(current);
    };
    const up = (ev: PointerEvent) => { if (ev.pointerId === pointerId) finish(true); };
    const cancel = (ev: PointerEvent) => { if (ev.pointerId === pointerId) finish(false); };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!current) {
        if (Math.hypot(dx, dy) < START_PX) return;
        if (item.source === 'rail' && pointerType !== 'mouse' && Math.abs(dx) > Math.abs(dy)) return;
        dragging.current = true;
      }
      current = { ...item, x: ev.clientX, y: ev.clientY, over: isOver(target(item.source), ev.clientX, ev.clientY) };
      setDrag(current);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };

  /** For onClick handlers: was this click really the end of a drag? */
  const wasDrag = () => justDragged.current;

  return { drag, pointerDown, wasDrag };
}
