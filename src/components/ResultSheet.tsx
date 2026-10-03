import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { HK_POINTS, Lang, ScoreResult, TileSet, setTiles } from '../engine';
import { useLang } from '../i18n';
import { Bi } from './Bi';
import { Sheet } from './Sheet';
import { TileFace } from './TileFace';

type Text = { en: string; zh: string };

const FORM_LABEL: Record<string, Text> = {
  sevenPairs: { en: 'Seven pairs', zh: '七對' },
  thirteenOrphans: { en: 'Thirteen orphans', zh: '十三么' },
  honorsKnitted: { en: 'Honours & knitted tiles', zh: '全不靠' },
  knittedStraight: { en: 'Knitted straight + set + pair', zh: '組合龍＋一組＋將' },
};

const SET_KIND = {
  en: { chow: 'Chow', pung: 'Pung', kong: 'Kong', pair: 'Pair', claimed: 'claimed', concealed: 'concealed', wonHere: 'won here' },
  zh: { chow: '順子', pung: '刻子', kong: '槓', pair: '眼', claimed: '明', concealed: '暗', wonHere: '和這組' },
};

function setLabel(s: TileSet, lang: Lang) {
  const L = SET_KIND[lang];
  const open = s.kind !== 'pair' && !s.concealed ? ` · ${L.claimed}` : s.kind === 'kong' ? ` · ${L.concealed}` : '';
  return `${L[s.kind]}${open}`;
}

/** Counts up from 0 to `target` for a little drama. */
function useCountUp(target: number, ms = 700) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

const CONFETTI_COLORS = ['#a20000', '#0e6b47', '#e3a21a', '#1f5fb4', '#fffaf0'];

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 90;
      return {
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist * 0.8 + 30}px`,
        '--rot': `${Math.random() * 720 - 360}deg`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDelay: `${0.25 + Math.random() * 0.15}s`,
      } as CSSProperties;
    }),
    [],
  );
  return <div className="confetti" aria-hidden>{pieces.map((style, i) => <i key={i} style={style} />)}</div>;
}

interface Props {
  result: ScoreResult;
  onClose: () => void;
  onNewHand: () => void;
}

export function ResultSheet({ result, onClose, onNewHand }: Props) {
  const { lang, tx } = useLang();
  const hk = result.variant === 'hk';
  const d = result.decomposition;
  const unit = hk ? tx('fan', '番') : tx('pts', '分');
  const shown = useCountUp(result.error ? 0 : result.total);

  return (
    <Sheet label={tx('Score', '計番結果')} onClose={onClose}>

        {result.error ? (
          <div className="result-error">
            <div className="oops" aria-hidden><TileFace tile={31} /></div>
            <h2>{tx("Can't score this yet", '未能計番')}</h2>
            <p>{result.error}</p>
            <button className="btn btn-primary" onClick={onClose}>{tx('Back to hand', '返回手牌')}</button>
          </div>
        ) : (
          <>
            <div className="score-hero">
              {result.meetsMinimum && <Confetti />}
              <div className={`seal-score ${result.meetsMinimum ? '' : 'dud'}`}>
                <span className="score-num">{shown}</span>
                <span className="score-unit">{hk ? <Bi en="fan" zh="番" /> : <Bi en="points" zh="分" />}</span>
              </div>
              {hk && (
                <div className="score-meta">
                  {tx('Worth ', '番數表上值 ')}<b>{HK_POINTS[result.total]}</b>{tx(' points on the payment table', ' 分')}
                </div>
              )}
              <div className={`verdict ${result.meetsMinimum ? 'ok' : 'bad'}`}>
                {result.meetsMinimum
                  ? tx('Valid win', '可以和牌')
                  : tx(`Below the ${result.minimum}-${hk ? 'fan' : 'point'} minimum`, `未夠 ${result.minimum} ${unit}起和`)}
              </div>
            </div>

            {result.notes.length > 0 && (
              <ul className="notes">{result.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            )}

            <h3 className="sheet-h">{tx('Why you scored this', '番種明細')}</h3>
            {result.fans.length === 0 ? (
              <p className="hint">{tx('No scoring features — a chicken hand.', '沒有番種 —— 雞糊。')}</p>
            ) : (
              <ul className="fan-list">
                {result.fans.map((f, i) => (
                  <li key={`${f.id}-${f.points}`} className="fan" style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
                    <div className="fan-top">
                      <span className="fan-name"><Bi en={f.en} zh={f.zh} />{f.count > 1 && <span className="times"> ×{f.count}</span>}</span>
                      <span className="fan-pts">+{f.points * f.count}</span>
                    </div>
                    <p className="fan-why">{f.why}</p>
                  </li>
                ))}
                <li className="fan fan-total">
                  <span>
                    {tx('Total', '合共')}
                    {hk && result.rawTotal > result.total ? tx(` (capped from ${result.rawTotal})`, `（原本 ${result.rawTotal} 番，爆棚）`) : ''}
                  </span>
                  <span>{result.total} {unit}</span>
                </li>
              </ul>
            )}

            {d && (
              <>
                <h3 className="sheet-h">{tx('How your hand was read', '牌型拆解')}</h3>
                {FORM_LABEL[d.form] && <p className="hint small">{FORM_LABEL[d.form][lang]}</p>}
                {d.sets.length > 0 && (
                  <div className="read-sets">
                    {d.sets.map((s, i) => (
                      <div className="meld" key={i}>
                        <div className="meld-tiles">
                          {setTiles(s).map((t, k) => <TileFace key={k} tile={t} size="sm" />)}
                        </div>
                        <div className="meld-label">{setLabel(s, lang)}{i === d.winSet ? ` · ${SET_KIND[lang].wonHere}` : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
                {d.sets.length === 0 && <p className="hint small">{tx('Special hand — scored as a whole.', '特殊牌型 —— 整副計番。')}</p>}
              </>
            )}

            <h3 className="sheet-h">{tx('Payment', '找數')}</h3>
            <ul className="payout">{result.payout.map((p) => <li key={p}>{p}</li>)}</ul>

            <div className="sheet-actions">
              <button className="btn" onClick={onClose}>{tx('Edit hand', '修改手牌')}</button>
              <button className="btn btn-primary" onClick={onNewHand}>{tx('New hand', '新一局')}</button>
            </div>
          </>
        )}
    </Sheet>
  );
}
