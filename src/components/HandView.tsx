import { useState } from 'react';
import { Meld } from '../engine';
import { Action, HandState, hiddenCount, hiddenNeeded } from '../state';
import { BonusFace, TileFace } from './TileFace';

const MELD_LABEL = { chow: 'Chow', pung: 'Pung', kong: 'Kong' } as const;

function meldTiles(m: Meld) {
  if (m.kind === 'chow') return [m.tile, m.tile + 1, m.tile + 2];
  return Array(m.kind === 'kong' ? 4 : 3).fill(m.tile);
}

function MeldView({ meld, onRemove }: { meld: Meld; onRemove: () => void }) {
  return (
    <div className="meld">
      <div className="meld-tiles">
        {meldTiles(meld).map((t, k) => <TileFace key={k} tile={t} size="sm" />)}
      </div>
      <div className="meld-label">
        {meld.kind === 'kong' && meld.concealed ? 'Hidden kong' : MELD_LABEL[meld.kind]}
        <button className="x" aria-label="Remove set" onClick={onRemove}>×</button>
      </div>
    </div>
  );
}

interface Props {
  hand: HandState;
  dispatch: (a: Action) => void;
}

/** 'win' stands for the winning tile; numbers are indices into hand.tiles. */
type Sel = number | 'win';

export function HandView({ hand, dispatch }: Props) {
  const [selected, setSelected] = useState<Sel[]>([]);
  const count = hiddenCount(hand) + hand.melds.length * 3;
  const sorted = hand.tiles.map((tile, index) => ({ tile, index })).sort((a, b) => a.tile - b.tile);
  const full = hiddenCount(hand) === hiddenNeeded(hand);

  const revealed = hand.melds.map((m, i) => ({ m, i })).filter(({ m }) => !(m.kind === 'kong' && m.concealed));
  const hiddenKongs = hand.melds.map((m, i) => ({ m, i })).filter(({ m }) => m.kind === 'kong' && m.concealed);

  const toggle = (s: Sel) => setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const removeSelected = () => {
    dispatch({
      type: 'removeTiles',
      indices: selected.filter((s): s is number => s !== 'win'),
      winning: selected.includes('win'),
    });
    setSelected([]);
  };
  const makeWinning = () => {
    const [only] = selected;
    if (typeof only === 'number') dispatch({ type: 'makeWinning', index: only });
    setSelected([]);
  };
  const removeMeld = (index: number) => {
    dispatch({ type: 'removeMeld', index });
    setSelected([]);
  };

  return (
    <section className="card hand-card" aria-label="Your hand">
      <div className="card-head">
        <h2>Your hand <span className="zh-sub">手牌</span></h2>
        <span className={`count ${count === 14 ? 'count-full' : ''}`}>{count}<small>/14</small></span>
      </div>

      <div className="zone zone-revealed">
        <div className="zone-head">
          <span className="zone-tag tag-revealed">Revealed 明</span>
          <span className="zone-desc">Sets you claimed from other players</span>
        </div>
        {revealed.length === 0 ? (
          <p className="zone-empty">None — use <b>Chow / Pung / Kong</b> below for claimed sets.</p>
        ) : (
          <div className="melds">
            {revealed.map(({ m, i }) => <MeldView key={i} meld={m} onRemove={() => removeMeld(i)} />)}
          </div>
        )}
      </div>

      <div className="zone zone-concealed">
        <div className="zone-head">
          <span className="zone-tag tag-concealed">Concealed 暗</span>
          <span className="zone-desc">Tiles only you can see</span>
        </div>

        {hiddenKongs.length > 0 && (
          <div className="melds">
            {hiddenKongs.map(({ m, i }) => <MeldView key={i} meld={m} onRemove={() => removeMeld(i)} />)}
          </div>
        )}

        {hand.tiles.length === 0 && hand.winning === null ? (
          <p className="zone-empty">Tap tiles below with <b>Tile</b> selected to add them here.</p>
        ) : (
          <div className="hidden-row">
            <div className="hidden-tiles">
              {sorted.map(({ tile, index }) => (
                <button
                  key={index}
                  className={`tile-btn ${selected.includes(index) ? 'selected' : ''}`}
                  aria-pressed={selected.includes(index)}
                  onClick={() => toggle(index)}
                >
                  <TileFace tile={tile} />
                </button>
              ))}
            </div>
            {hand.winning !== null && (
              <div className="win-slot">
                <button
                  className={`tile-btn ${selected.includes('win') ? 'selected' : ''}`}
                  aria-pressed={selected.includes('win')}
                  onClick={() => toggle('win')}
                >
                  <TileFace tile={hand.winning} highlight />
                </button>
                <span className="win-label">Winning</span>
              </div>
            )}
          </div>
        )}

        {full && hand.winning === null && (
          <p className="hint warn">Select the tile you won on, then tap <b>★ Winning tile</b>.</p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="tile-actions" role="toolbar" aria-label="Selected tiles">
          <span className="sel-count">{selected.length} selected</span>
          {selected.length === 1 && selected[0] !== 'win' && (
            <button className="chip chip-gold" onClick={makeWinning}>★ Winning tile</button>
          )}
          <button className="chip chip-danger" onClick={removeSelected}>
            Remove{selected.length > 1 ? ` ${selected.length}` : ''}
          </button>
          <button className="chip chip-ghost" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {hand.flowers.length > 0 && (
        <div className="flower-row">
          <span className="zone-tag tag-bonus">Flowers 花</span>
          {hand.flowers.map((b) => (
            <button key={b} className="tile-btn" aria-label="Remove flower" onClick={() => dispatch({ type: 'toggleFlower', bonus: b })}>
              <BonusFace bonus={b} size="sm" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
