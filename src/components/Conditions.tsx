import { Variant, WINDS, Wind, isConcealed } from '../engine';
import { Action, AppState, WinFlags, toHandInput } from '../state';

interface FlagDef { key: keyof WinFlags; label: string; zh: string; hint: string }

const FLAGS: Record<Variant, FlagDef[]> = {
  hk: [
    { key: 'lastTile', label: 'Last tile', zh: '海底撈月', hint: 'Won on the last tile of the wall or the last discard.' },
    { key: 'kongReplacement', label: 'Won on kong replacement', zh: '槓上開花', hint: 'Your winning tile was drawn after declaring a kong.' },
    { key: 'doubleKongReplacement', label: 'Double kong replacement', zh: '槓上槓', hint: 'Two kongs in a row, won on the second replacement.' },
    { key: 'robbingKong', label: 'Robbing the kong', zh: '搶槓', hint: 'Won on the tile someone added to make a kong.' },
    { key: 'heavenly', label: 'Blessing of Heaven', zh: '天糊', hint: 'Dealer wins with the starting hand.' },
    { key: 'earthly', label: 'Blessing of Earth', zh: '地糊', hint: "Non-dealer wins on the dealer's first discard." },
    { key: 'humanly', label: 'Blessing of Man', zh: '人糊', hint: 'Non-dealer self-picks a win on their first turn.' },
  ],
  mcr: [
    { key: 'lastTile', label: 'Last tile of the game', zh: '妙手回春 / 海底撈月', hint: 'Drew the last wall tile, or won on the final discard.' },
    { key: 'kongReplacement', label: 'Won on kong replacement', zh: '槓上開花', hint: 'Your winning tile was drawn after declaring a kong.' },
    { key: 'robbingKong', label: 'Robbing the kong', zh: '搶槓和', hint: 'Won on the tile someone added to make a kong.' },
    { key: 'lastOfKind', label: 'Last of its kind', zh: '和絕張', hint: 'The other 3 copies of your winning tile were already visible.' },
  ],
};

function WindPicker({ label, zh, value, onChange }: { label: string; zh: string; value: Wind; onChange: (w: Wind) => void }) {
  return (
    <div className="field">
      <div className="field-label">{label} <span className="zh-sub">{zh}</span></div>
      <div className="segmented winds">
        {WINDS.map((w, i) => (
          <button key={i} className={value === i ? 'on' : ''} aria-pressed={value === i} onClick={() => onChange(i as Wind)}>
            <span className="zh">{w.zh}</span> <span className="small">{w.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Conditions({ state, dispatch }: { state: AppState; dispatch: (a: Action) => void }) {
  const { prefs, hand } = state;
  const win = hand.win;
  const concealed = isConcealed(toHandInput(hand));
  const flag = (key: keyof WinFlags, value: boolean) => dispatch({ type: 'flag', key, value });

  return (
    <section className="card" aria-label="How you won">
      <div className="card-head">
        <h2>How you won <span className="zh-sub">和牌條件</span></h2>
      </div>

      <div className="field">
        <div className="field-label">Winning tile came from</div>
        <div className="segmented">
          <button className={win.selfDrawn ? 'on' : ''} aria-pressed={win.selfDrawn} onClick={() => flag('selfDrawn', true)}>
            The wall <span className="zh-sub">自摸</span>
          </button>
          <button className={!win.selfDrawn ? 'on' : ''} aria-pressed={!win.selfDrawn} onClick={() => flag('selfDrawn', false)}>
            A discard <span className="zh-sub">食糊</span>
          </button>
        </div>
      </div>

      <WindPicker label="Your seat wind" zh="門風" value={prefs.seatWind} onChange={(w) => dispatch({ type: 'prefs', patch: { seatWind: w } })} />
      <WindPicker label="Round wind" zh="圈風" value={prefs.roundWind} onChange={(w) => dispatch({ type: 'prefs', patch: { roundWind: w } })} />

      <p className="status-line">
        <span className={`dot ${concealed ? 'dot-on' : ''}`} />
        {concealed
          ? 'Concealed hand — no sets claimed from other players.'
          : 'Open hand — you claimed at least one set.'}
      </p>

      <div className="toggles">
        {FLAGS[prefs.variant].map((f) => (
          <label className="toggle" key={f.key}>
            <span className="toggle-text">
              <span className="toggle-title">{f.label} <span className="zh-sub">{f.zh}</span></span>
              <span className="toggle-hint">{f.hint}</span>
            </span>
            <input type="checkbox" role="switch" checked={win[f.key]} onChange={(e) => flag(f.key, e.target.checked)} />
            <span className="switch" aria-hidden />
          </label>
        ))}
      </div>

      {prefs.variant === 'hk' && (
        <details className="table-rules">
          <summary>Table rules</summary>
          <div className="field">
            <div className="field-label">Minimum fan to win <span className="zh-sub">起糊</span></div>
            <div className="segmented">
              {[0, 1, 3].map((n) => (
                <button key={n} className={prefs.hk.minimumFan === n ? 'on' : ''} onClick={() => dispatch({ type: 'hkOptions', patch: { minimumFan: n } })}>
                  {n} fan
                </button>
              ))}
            </div>
          </div>
          <label className="toggle">
            <span className="toggle-text">
              <span className="toggle-title">Allow Seven Pairs <span className="zh-sub">七對子</span></span>
              <span className="toggle-hint">Only some tables play this hand (4 fan).</span>
            </span>
            <input type="checkbox" role="switch" checked={prefs.hk.allowSevenPairs} onChange={(e) => dispatch({ type: 'hkOptions', patch: { allowSevenPairs: e.target.checked } })} />
            <span className="switch" aria-hidden />
          </label>
        </details>
      )}
    </section>
  );
}
