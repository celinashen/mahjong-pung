import { Variant, WINDS, Wind, isConcealed } from '../engine';
import { useLang } from '../i18n';
import { Action, AppState, WinFlags, toHandInput } from '../state';
import { Bi } from './Bi';

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

export function Conditions({ state, dispatch }: { state: AppState; dispatch: (a: Action) => void }) {
  const { lang, tx } = useLang();
  const { prefs, hand } = state;
  const win = hand.win;
  const concealed = isConcealed(toHandInput(hand));
  const flag = (key: keyof WinFlags, value: boolean) => dispatch({ type: 'flag', key, value });

  return (
    <section className="card" aria-label={tx('How you won', '和牌條件')}>
      <div className="card-head">
        <h2><Bi en="How you won" zh="和牌條件" /></h2>
      </div>

      <div className="field">
        <div className="field-label">{tx('Winning tile came from', '和牌的那張來自')}</div>
        <div className="segmented">
          <button className={win.selfDrawn ? 'on' : ''} aria-pressed={win.selfDrawn} onClick={() => flag('selfDrawn', true)}>
            <Bi en="The wall" zh="自摸" />
          </button>
          <button className={!win.selfDrawn ? 'on' : ''} aria-pressed={!win.selfDrawn} onClick={() => flag('selfDrawn', false)}>
            <Bi en="A discard" zh="食糊" />
          </button>
        </div>
      </div>

      <WindPicker label={{ en: 'Your seat wind', zh: '門風' }} value={prefs.seatWind} onChange={(w) => dispatch({ type: 'prefs', patch: { seatWind: w } })} />
      <WindPicker label={{ en: 'Round wind', zh: '圈風' }} value={prefs.roundWind} onChange={(w) => dispatch({ type: 'prefs', patch: { roundWind: w } })} />

      <p className="status-line">
        <span className={`dot ${concealed ? 'dot-on' : ''}`} />
        {concealed
          ? tx('Concealed hand — no sets claimed from other players.', '門前清 —— 沒有吃碰明槓。')
          : tx('Open hand — you claimed at least one set.', '已開牌 —— 有吃碰或明槓。')}
      </p>

      <div className="toggles">
        {FLAGS[prefs.variant].map((f) => (
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

      {prefs.variant === 'hk' && (
        <details className="table-rules">
          <summary>{tx('Table rules', '枱規')}</summary>
          <div className="field">
            <div className="field-label"><Bi en="Minimum fan to win" zh="起糊番數" /></div>
            <div className="segmented">
              {[0, 1, 3].map((n) => (
                <button key={n} className={prefs.hk.minimumFan === n ? 'on' : ''} onClick={() => dispatch({ type: 'hkOptions', patch: { minimumFan: n } })}>
                  {tx(`${n} fan`, `${n} 番`)}
                </button>
              ))}
            </div>
          </div>
          <label className="toggle">
            <span className="toggle-text">
              <span className="toggle-title"><Bi en="Allow Seven Pairs" zh="七對子" /></span>
              <span className="toggle-hint">{tx('Only some tables play this hand (4 fan).', '只有部分枱規計這副牌（4 番）。')}</span>
            </span>
            <input type="checkbox" role="switch" checked={prefs.hk.allowSevenPairs} onChange={(e) => dispatch({ type: 'hkOptions', patch: { allowSevenPairs: e.target.checked } })} />
            <span className="switch" aria-hidden />
          </label>
        </details>
      )}
    </section>
  );
}
