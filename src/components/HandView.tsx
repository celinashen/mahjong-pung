import { useState } from 'react';
import { Meld } from '../engine';
import { useLang } from '../i18n';
import { Action, HandState, hiddenCount, hiddenNeeded } from '../state';
import { Bi } from './Bi';
import { BonusFace, TileFace } from './TileFace';

const MELD_LABEL = {
  en: { chow: 'Chow', pung: 'Pung', kong: 'Kong', hidden: 'Hidden kong' },
  zh: { chow: '上', pung: '碰', kong: '明槓', hidden: '暗槓' },
} as const;

function meldTiles(m: Meld) {
  if (m.kind === 'chow') return [m.tile, m.tile + 1, m.tile + 2];
  return Array(m.kind === 'kong' ? 4 : 3).fill(m.tile);
}

function MeldView({ meld, onRemove }: { meld: Meld; onRemove: () => void }) {
  const { lang, tx } = useLang();
  const labels = MELD_LABEL[lang];
  return (
    <div className="meld">
      <div className="meld-tiles">
        {meldTiles(meld).map((t, k) => <TileFace key={k} tile={t} size="sm" />)}
      </div>
      <div className="meld-label">
        {meld.kind === 'kong' && meld.concealed ? labels.hidden : labels[meld.kind]}
        <button className="x" aria-label={tx('Remove set', '刪除這組')} onClick={onRemove}>×</button>
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
  const { tx } = useLang();
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
    <section className="card hand-card" aria-label={tx('Your hand', '手牌')}>
      <div className="card-head">
        <h2><Bi en="Your hand" zh="手牌" /></h2>
        <span className={`count ${count === 14 ? 'count-full' : ''}`}>{count}<small>/14</small></span>
      </div>

      <div className="zone zone-revealed">
        <div className="zone-head">
          <span className="zone-tag tag-revealed">{tx('Revealed 明', '明牌')}</span>
          <span className="zone-desc">{tx('Sets you claimed from other players', '從其他人上、碰、槓回來的牌組')}</span>
        </div>
        {revealed.length === 0 ? (
          <p className="zone-empty">{tx('None — use Chow / Pung / Kong below for claimed sets.', '沒有 —— 用下面的「上／碰／槓」加入明牌。')}</p>
        ) : (
          <div className="melds">
            {revealed.map(({ m, i }) => <MeldView key={i} meld={m} onRemove={() => removeMeld(i)} />)}
          </div>
        )}
      </div>

      <div className="zone zone-concealed">
        <div className="zone-head">
          <span className="zone-tag tag-concealed">{tx('Concealed 暗', '暗牌')}</span>
          <span className="zone-desc">{tx('Tiles only you can see', '只有你看得到的牌')}</span>
        </div>

        {hiddenKongs.length > 0 && (
          <div className="melds">
            {hiddenKongs.map(({ m, i }) => <MeldView key={i} meld={m} onRemove={() => removeMeld(i)} />)}
          </div>
        )}

        {hand.tiles.length === 0 && hand.winning === null ? (
          <p className="zone-empty">{tx('Tap tiles below with Tile selected to add them here.', '選「單張」後點下面的牌，加到這裡。')}</p>
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
                <span className="win-label">{tx('Winning', '和牌')}</span>
              </div>
            )}
          </div>
        )}

        {full && hand.winning === null && (
          <p className="hint warn">{tx('Select the tile you won on, then tap ★ Winning tile.', '選出你和的那張牌，再按「★ 和牌張」。')}</p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="tile-actions" role="toolbar" aria-label={tx('Selected tiles', '已選的牌')}>
          <span className="sel-count">{tx(`${selected.length} selected`, `已選 ${selected.length} 張`)}</span>
          {selected.length === 1 && selected[0] !== 'win' && (
            <button className="chip chip-gold" onClick={makeWinning}>{tx('★ Winning tile', '★ 和牌張')}</button>
          )}
          <button className="chip chip-danger" onClick={removeSelected}>
            {tx('Remove', '刪除')}{selected.length > 1 ? ` ${selected.length}` : ''}
          </button>
          <button className="chip chip-ghost" onClick={() => setSelected([])}>{tx('Clear', '取消')}</button>
        </div>
      )}

      {hand.flowers.length > 0 && (
        <div className="flower-row">
          <span className="zone-tag tag-bonus">{tx('Flowers 花', '花牌')}</span>
          {hand.flowers.map((b) => (
            <button key={b} className="tile-btn" aria-label={tx('Remove flower', '刪除花牌')} onClick={() => dispatch({ type: 'toggleFlower', bonus: b })}>
              <BonusFace bonus={b} size="sm" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
