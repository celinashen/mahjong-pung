import { useLang } from '../i18n';
import { Action, Prefs, VARIANTS } from '../state';
import { Bi } from './Bi';
import { Sheet } from './Sheet';

interface Props {
  prefs: Prefs;
  dispatch: (a: Action) => void;
  onClose: () => void;
}

export function GameModeSheet({ prefs, dispatch, onClose }: Props) {
  const { tx } = useLang();
  const hk = prefs.variant === 'hk';

  return (
    <Sheet label={tx('Game mode', '玩法設定')} onClose={onClose}>
      <h2 className="sheet-title"><Bi en="Game mode" zh="玩法設定" /></h2>

      <div className="field">
        <div className="field-label"><Bi en="Rules" zh="規則" /></div>
        <div className="segmented" role="radiogroup" aria-label={tx('Mahjong variant', '麻雀種類')}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              role="radio"
              aria-checked={prefs.variant === v.id}
              className={prefs.variant === v.id ? 'on' : ''}
              onClick={() => dispatch({ type: 'variant', variant: v.id })}
            >
              <Bi en={v.en} zh={v.zh} />
            </button>
          ))}
        </div>
      </div>

      <div className="toggles">
        <label className="toggle">
          <span className="toggle-text">
            <span className="toggle-title"><Bi en="Count flowers" zh="計花" /></span>
            <span className="toggle-hint">
              {hk
                ? tx('Off: flowers score nothing, and neither does having none.', '關閉：花牌不計番，無花亦不加番。')
                : tx('Off: flowers add no bonus points.', '關閉：花牌不加分。')}
            </span>
          </span>
          <input type="checkbox" role="switch" checked={prefs.flowers} onChange={(e) => dispatch({ type: 'prefs', patch: { flowers: e.target.checked } })} />
          <span className="switch" aria-hidden />
        </label>
        <label className="toggle">
          <span className="toggle-text">
            <span className="toggle-title"><Bi en="Count winds" zh="計風" /></span>
            <span className="toggle-hint">
              {hk
                ? tx('Off: no seat or round wind fan, and no seat flower fan. Hands like Big Four Winds still score.', '關閉：不計門風、圈風及正花。大四喜等牌型照計。')
                : tx('Off: no seat or round wind points. Hands like Big Four Winds still score.', '關閉：不計門風、圈風分。大四喜等牌型照計。')}
            </span>
          </span>
          <input type="checkbox" role="switch" checked={prefs.winds} onChange={(e) => dispatch({ type: 'prefs', patch: { winds: e.target.checked } })} />
          <span className="switch" aria-hidden />
        </label>
      </div>

      {hk && (
        <div className="table-rules">
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
        </div>
      )}

      <div className="sheet-actions sticky">
        <button className="btn btn-primary" onClick={onClose}>{tx('Done', '完成')}</button>
      </div>
    </Sheet>
  );
}
