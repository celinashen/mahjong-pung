import { ALL_BONUS, SUITS, Tile } from '../engine';
import { Action, HandState, PickMode, canPick, remaining } from '../state';
import { BonusFace, TileFace } from './TileFace';

const GROUPS: Array<{ kind: 'concealed' | 'revealed'; label: string; modes: Array<{ mode: PickMode; label: string }> }> = [
  { kind: 'concealed', label: 'Concealed 暗', modes: [{ mode: 'tile', label: 'Tile' }, { mode: 'ckong', label: 'Kong' }] },
  { kind: 'revealed', label: 'Revealed 明', modes: [{ mode: 'chow', label: 'Chow' }, { mode: 'pung', label: 'Pung' }, { mode: 'kong', label: 'Kong' }] },
];

const MODE_HINT: Record<PickMode, string> = {
  tile: 'Adds one tile to the concealed part of your hand.',
  ckong: 'Four of a kind you declared from your own hand. Your hand stays concealed.',
  chow: 'A run you claimed from the player before you. Tap its lowest tile (3 → 3-4-5).',
  pung: 'Three of a kind you claimed from a discard.',
  kong: 'Four of a kind you claimed, or a pung you upgraded.',
};

const ROWS: Array<{ label: string; zh: string; tiles: Tile[] }> = [
  ...SUITS.map((s, i) => ({ label: s.en, zh: s.zh, tiles: Array.from({ length: 9 }, (_, r) => i * 9 + r) })),
  { label: 'Honours', zh: '字', tiles: [27, 28, 29, 30, 31, 32, 33] },
];

interface Props {
  hand: HandState;
  mode: PickMode;
  dispatch: (a: Action) => void;
}

export function TilePicker({ hand, mode, dispatch }: Props) {
  const left = remaining(hand);
  return (
    <section className="card" aria-label="Add tiles">
      <div className="card-head">
        <h2>Add tiles <span className="zh-sub">選牌</span></h2>
      </div>

      <div className="mode-groups">
        {GROUPS.map((g) => (
          <div key={g.kind} className={`mode-group group-${g.kind}`}>
            <div className={`zone-tag tag-${g.kind}`}>{g.label}</div>
            <div className="segmented" role="radiogroup" aria-label={g.label}>
              {g.modes.map((m) => (
                <button
                  key={m.mode}
                  role="radio"
                  aria-checked={mode === m.mode}
                  className={mode === m.mode ? 'on' : ''}
                  onClick={() => dispatch({ type: 'mode', mode: m.mode })}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className={`mode-hint hint-${mode === 'tile' || mode === 'ckong' ? 'concealed' : 'revealed'}`}>{MODE_HINT[mode]}</p>

      {ROWS.map((row) => (
        <div className="pick-row" key={row.label}>
          <div className="row-label">{row.label} <span className="zh-sub">{row.zh}</span></div>
          <div className={`pick-grid ${row.tiles.length === 7 ? 'honors' : ''}`}>
            {row.tiles.map((t) => {
              const ok = canPick(hand, mode, t);
              return (
                <button key={t} className="tile-btn pick" disabled={!ok} onClick={() => dispatch({ type: 'pick', tile: t })}>
                  <TileFace tile={t} />
                  {left[t] < 4 && <span className="badge">{4 - left[t]}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pick-row">
        <div className="row-label">Flowers & seasons <span className="zh-sub">花</span></div>
        <div className="pick-grid bonus-grid">
          {ALL_BONUS.map((b) => {
            const on = hand.flowers.includes(b);
            return (
              <button
                key={b}
                className={`tile-btn pick ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() => dispatch({ type: 'toggleFlower', bonus: b })}
              >
                <BonusFace bonus={b} active={on} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
