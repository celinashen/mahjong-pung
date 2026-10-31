import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_BONUS, Meld, Variant, WINDS, Wind, readingHas, setChoices, setTiles, tileLabel } from '../engine';
import { useLang } from '../i18n';
import { Action, AppState, WinFlags, readings, winningChoices } from '../state';
import { Bi } from './Bi';
import { Sheet } from './Sheet';
import { BonusFace, TileFace } from './TileFace';

type Text = { en: string; zh: string };
interface FlagDef { key: keyof WinFlags; label: Text; hint: Text }

const FLAGS: Record<Variant, FlagDef[]> = {
  hk: [
    { key: 'lastTile', label: { en: 'Last tile', zh: '海底撈月' }, hint: { en: 'Won on the last tile of the wall or the last discard.', zh: '用牌牆最後一張或最後一張打出的牌和牌。' } },
    { key: 'kongReplacement', label: { en: 'Won on kong replacement', zh: '槓上開花' }, hint: { en: 'Your winning tile was drawn after declaring a kong.', zh: '開槓後補回來的牌令你和牌。' } },
    { key: 'doubleKongReplacement', label: { en: 'Double kong replacement', zh: '槓上槓' }, hint: { en: 'Two kongs in a row, won on the second replacement.', zh: '連續開兩次槓，用第二張補牌和牌。' } },
    { key: 'robbingKong', label: { en: 'Robbing the kong', zh: '搶槓' }, hint: { en: 'Won on the tile someone added to make a kong.', zh: '和別人加槓的那張牌。' } },
    { key: 'heavenly', label: { en: 'Blessing of Heaven', zh: '天糊' }, hint: { en: 'Dealer wins with the starting hand.', zh: '莊家開牌即和。' } },
    { key: 'earthly', label: { en: 'Blessing of Earth', zh: '地糊' }, hint: { en: "Non-dealer wins on the dealer's first discard.", zh: '閒家和莊家打出的第一張牌。' } },
    { key: 'humanly', label: { en: 'Blessing of Man', zh: '人糊' }, hint: { en: 'Non-dealer self-picks a win on their first turn.', zh: '閒家第一次摸牌即自摸。' } },
  ],
  mcr: [
    { key: 'lastTile', label: { en: 'Last tile of the game', zh: '妙手回春／海底撈月' }, hint: { en: 'Drew the last wall tile, or won on the final discard.', zh: '摸牌牆最後一張自摸，或和最後一張打出的牌。' } },
    { key: 'kongReplacement', label: { en: 'Won on kong replacement', zh: '槓上開花' }, hint: { en: 'Your winning tile was drawn after declaring a kong.', zh: '開槓後補回來的牌令你和牌。' } },
    { key: 'robbingKong', label: { en: 'Robbing the kong', zh: '搶槓和' }, hint: { en: 'Won on the tile someone added to make a kong.', zh: '和別人加槓的那張牌。' } },
    { key: 'lastOfKind', label: { en: 'Last of its kind', zh: '和絕張' }, hint: { en: 'The other 3 copies of your winning tile were already visible.', zh: '和的那張牌，其餘三張已經在場上出現。' } },
  ],
};

const SET_LABEL = {
  en: { chow: 'Chow', pung: 'Pung', kong: 'Kong' },
  zh: { chow: '吃', pung: '碰', kong: '明槓' },
} as const;

type Step = 'revealed' | 'winning' | 'how' | 'flowers' | 'winds';

function WindPicker({ label, value, onChange }: { label: Text; value: Wind; onChange: (w: Wind) => void }) {
  const { lang } = useLang();
  return (
    <div className="field">
      <div className="field-label"><Bi en={label.en} zh={label.zh} /></div>
      <div className="segmented winds">
        {WINDS.map((w, i) => (
          <button key={i} className={value === i ? 'on' : ''} aria-pressed={value === i} onClick={() => onChange(i as Wind)}>
            <span className="zh">{w.zh}</span>{lang === 'en' && <> <span className="small">{w.en}</span></>}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StepProps {
  state: AppState;
  dispatch: (a: Action) => void;
}

function RevealedStep({ state, dispatch }: StepProps) {
  const { lang, tx } = useLang();
  const { hand, prefs } = state;
  const all = useMemo(() => readings(hand, prefs), [hand, prefs]);
  const choices = useMemo(() => setChoices(all), [all]);
  const same = (a: Meld, b: Meld) => a.kind === b.kind && a.tile === b.tile;
  const picked = (m: Meld) => hand.revealed.filter((r) => same(r, m)).length;

  return (
    <>
      <p className="question-hint">
        {tx(
          'Tap every set you claimed from another player before you won. Leave the rest. Kongs you leave count as concealed.',
          '選出和牌前從別人吃、碰、槓回來的牌組，其餘不用選。沒有選的槓當暗槓。',
        )}
      </p>
      <div className="set-grid">
        {choices.map((m, i) => {
          // Repeats of a set share a key, so the first `picked` copies show as chosen.
          const nth = choices.slice(0, i).filter((c) => same(c, m)).length;
          const on = nth < picked(m);
          const fits = all.some((r) => readingHas(r, [...hand.revealed, m]));
          return (
            <button
              key={`${m.kind}-${m.tile}-${nth}`}
              className={`set-card${on ? ' on' : ''}`}
              aria-pressed={on}
              disabled={!on && !fits}
              onClick={() => dispatch({ type: 'revealed', set: m, on: !on })}
            >
              <span className="meld-tiles">
                {setTiles({ ...m, declared: true }).map((t, k) => <TileFace key={k} tile={t} size="sm" />)}
              </span>
              <span className="set-label">{SET_LABEL[lang][m.kind]}</span>
            </button>
          );
        })}
      </div>
      <p className="question-note">
        {hand.revealed.length === 0
          ? tx('Nothing selected: your hand counts as concealed.', '沒有選擇：當作門前清。')
          : tx(`${hand.revealed.length} revealed`, `已選 ${hand.revealed.length} 組`)}
      </p>
    </>
  );
}

function WinningStep({ state, dispatch }: StepProps) {
  const { lang, tx } = useLang();
  const { hand, prefs } = state;
  return (
    <>
      <p className="question-hint">{tx('The tile that completed your hand.', '令你和牌的那一張。')}</p>
      <div className="choice-grid">
        {winningChoices(hand, prefs).map((t) => (
          <button
            key={t}
            className={`tile-btn${hand.winning === t ? ' on' : ''}`}
            aria-pressed={hand.winning === t}
            aria-label={tileLabel(t, lang)}
            onClick={() => dispatch({ type: 'winning', tile: t })}
          >
            <TileFace tile={t} highlight={hand.winning === t} />
          </button>
        ))}
      </div>
    </>
  );
}

function HowStep({ state, dispatch }: StepProps) {
  const { lang } = useLang();
  const { win } = state.hand;
  const flag = (key: keyof WinFlags, value: boolean) => dispatch({ type: 'flag', key, value });
  return (
    <>
      <div className="segmented">
        <button className={win.selfDrawn ? 'on' : ''} aria-pressed={win.selfDrawn} onClick={() => flag('selfDrawn', true)}>
          <Bi en="The wall" zh="自摸" />
        </button>
        <button className={!win.selfDrawn ? 'on' : ''} aria-pressed={!win.selfDrawn} onClick={() => flag('selfDrawn', false)}>
          <Bi en="A discard" zh="食糊" />
        </button>
      </div>
      <div className="toggles">
        {FLAGS[state.prefs.variant].map((f) => (
          <label className="toggle" key={f.key}>
            <span className="toggle-text">
              <span className="toggle-title"><Bi en={f.label.en} zh={f.label.zh} /></span>
              <span className="toggle-hint">{f.hint[lang]}</span>
            </span>
            <input type="checkbox" role="switch" checked={win[f.key]} onChange={(e) => flag(f.key, e.target.checked)} />
            <span className="switch" aria-hidden />
          </label>
        ))}
      </div>
    </>
  );
}

function FlowersStep({ state, dispatch, minimum }: StepProps & { minimum: number }) {
  const { tx } = useLang();
  const { flowers } = state.hand;
  return (
    <>
      <p className="question-hint">
        {minimum > 0
          ? tx(`Tap each one you hold. You need at least ${minimum} to win this way.`, `點選你有的花牌，最少要 ${minimum} 隻。`)
          : tx('Tap each one you collected, or skip if you have none.', '點選你有的花牌，沒有就直接下一步。')}
      </p>
      <div className="choice-grid flower-grid">
        {ALL_BONUS.map((b) => {
          const on = flowers.includes(b);
          return (
            <button key={b} className={`tile-btn${on ? ' on' : ''}`} aria-pressed={on} onClick={() => dispatch({ type: 'toggleFlower', bonus: b })}>
              <BonusFace bonus={b} active={on} />
            </button>
          );
        })}
      </div>
      <p className="question-note">{tx(`${flowers.length} collected`, `共 ${flowers.length} 隻`)}</p>
    </>
  );
}

const TITLE: Record<Step, Text> = {
  revealed: { en: 'Which sets were revealed?', zh: '哪些牌組已打開？' },
  winning: { en: 'What was your last tile?', zh: '最後和哪一張？' },
  how: { en: 'How did you get it?', zh: '那張牌從哪裡來？' },
  flowers: { en: 'Which flowers did you get?', zh: '有哪些花牌？' },
  winds: { en: 'What were the winds?', zh: '門風和圈風是？' },
};

/** A win on 7 or 8 flowers doesn't need a complete hand. */
const FLOWER_WIN_MINIMUM = 7;

interface Props extends StepProps {
  /** Only ask about flowers: the player is claiming a flower win. */
  flowerWin: boolean;
  onDone: () => void;
  onClose: () => void;
}

/** One question at a time, skipping any that don't apply to this hand or game mode. */
export function Questions({ state, dispatch, flowerWin, onDone, onClose }: Props) {
  const { tx } = useLang();
  const { hand, prefs } = state;
  const [index, setIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const steps = useMemo<Step[]>(() => {
    if (flowerWin) return ['flowers'];
    const hasSets = setChoices(readings(hand, prefs)).length > 0;
    return [
      ...(hasSets ? ['revealed' as const] : []),
      'winning', 'how',
      ...(prefs.flowers ? ['flowers' as const] : []),
      ...(prefs.winds ? ['winds' as const] : []),
    ];
  }, [flowerWin, hand, prefs]);

  const step = steps[index];
  const last = index === steps.length - 1;
  const blocked = (step === 'winning' && hand.winning === null)
    || (flowerWin && hand.flowers.length < FLOWER_WIN_MINIMUM);

  useEffect(() => { topRef.current?.closest('.sheet')?.scrollTo(0, 0); }, [step]);

  return (
    <Sheet label={tx('About your hand', '關於這副牌')} onClose={onClose}>
      <div ref={topRef} className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1}>
        {steps.map((s, i) => <i key={s} className={i <= index ? 'on' : ''} />)}
      </div>
      <h2 className="sheet-title"><Bi en={TITLE[step].en} zh={TITLE[step].zh} /></h2>

      {step === 'revealed' && <RevealedStep state={state} dispatch={dispatch} />}
      {step === 'winning' && <WinningStep state={state} dispatch={dispatch} />}
      {step === 'how' && <HowStep state={state} dispatch={dispatch} />}
      {step === 'flowers' && <FlowersStep state={state} dispatch={dispatch} minimum={flowerWin ? FLOWER_WIN_MINIMUM : 0} />}
      {step === 'winds' && (
        <>
          <WindPicker label={{ en: 'Your seat wind', zh: '門風' }} value={prefs.seatWind} onChange={(w) => dispatch({ type: 'prefs', patch: { seatWind: w } })} />
          <WindPicker label={{ en: 'Round wind', zh: '圈風' }} value={prefs.roundWind} onChange={(w) => dispatch({ type: 'prefs', patch: { roundWind: w } })} />
        </>
      )}

      <div className="sheet-actions sticky">
        <button className="btn" onClick={() => (index === 0 ? onClose() : setIndex(index - 1))}>{tx('Back', '返回')}</button>
        <button className="btn btn-primary" disabled={blocked} onClick={() => (last ? onDone() : setIndex(index + 1))}>
          {last ? tx('Calculate', '計番！') : tx('Next', '下一步')}
        </button>
      </div>
    </Sheet>
  );
}
