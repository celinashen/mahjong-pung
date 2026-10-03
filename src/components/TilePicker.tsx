import { ALL_BONUS, SUITS, Tile } from '../engine';
import { useLang } from '../i18n';
import { Action, HandState, PickMode, canPick, remaining } from '../state';
import { Bi } from './Bi';
import { BonusFace, TileFace } from './TileFace';

type Text = { en: string; zh: string };

const GROUPS: Array<{ kind: 'concealed' | 'revealed'; label: Text; modes: Array<{ mode: PickMode; label: Text }> }> = [
  {
    kind: 'concealed',
    label: { en: 'Concealed 暗', zh: '暗牌' },
    modes: [{ mode: 'tile', label: { en: 'Tile', zh: '單張' } }, { mode: 'ckong', label: { en: 'Kong', zh: '暗槓' } }],
  },
  {
    kind: 'revealed',
    label: { en: 'Revealed 明', zh: '明牌' },
    modes: [
      { mode: 'chow', label: { en: 'Chow', zh: '上' } },
      { mode: 'pung', label: { en: 'Pung', zh: '碰' } },
      { mode: 'kong', label: { en: 'Kong', zh: '明槓' } },
    ],
  },
];

const MODE_HINT: Record<PickMode, Text> = {
  tile: { en: 'Adds one tile to the concealed part of your hand.', zh: '加一張牌到你的暗牌。' },
  ckong: { en: 'Four of a kind you declared from your own hand. Your hand stays concealed.', zh: '自己摸齊四張後開的槓，手牌仍算門前清。' },
  chow: { en: 'A run you claimed from the player before you. Tap its lowest tile (3 → 3-4-5).', zh: '從上家上回來的順子。點最小的一張（三 → 三四五）。' },
  pung: { en: 'Three of a kind you claimed from a discard.', zh: '碰別人打出的牌組成的刻子。' },
  kong: { en: 'Four of a kind you claimed, or a pung you upgraded.', zh: '槓別人打出的牌，或碰後加槓。' },
};

const ROWS: Array<{ label: Text; tiles: Tile[] }> = [
  ...SUITS.map((s, i) => ({ label: { en: s.en, zh: `${s.zh}子` }, tiles: Array.from({ length: 9 }, (_, r) => i * 9 + r) })),
  { label: { en: 'Honours', zh: '字牌' }, tiles: [27, 28, 29, 30, 31, 32, 33] },
];

interface Props {
  hand: HandState;
  mode: PickMode;
  dispatch: (a: Action) => void;
}

export function TilePicker({ hand, mode, dispatch }: Props) {
  const { lang, tx } = useLang();
  const left = remaining(hand);
  return (
    <section className="card" aria-label={tx('Add tiles', '選牌')}>
      <div className="card-head">
        <h2><Bi en="Add tiles" zh="選牌" /></h2>
      </div>

      <div className="mode-groups">
        {GROUPS.map((g) => (
          <div key={g.kind} className={`mode-group group-${g.kind}`}>
            <div className={`zone-tag tag-${g.kind}`}>{g.label[lang]}</div>
            <div className="segmented" role="radiogroup" aria-label={g.label[lang]}>
              {g.modes.map((m) => (
                <button
                  key={m.mode}
                  role="radio"
                  aria-checked={mode === m.mode}
                  className={mode === m.mode ? 'on' : ''}
                  onClick={() => dispatch({ type: 'mode', mode: m.mode })}
                >
                  {m.label[lang]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className={`mode-hint hint-${mode === 'tile' || mode === 'ckong' ? 'concealed' : 'revealed'}`}>{MODE_HINT[mode][lang]}</p>

      {ROWS.map((row) => (
        <div className="pick-row" key={row.label.en}>
          <div className="row-label"><Bi en={row.label.en} zh={row.label.zh} /></div>
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
        <div className="row-label"><Bi en="Flowers & seasons" zh="花季" /></div>
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
