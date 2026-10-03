import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { HK_POINTS, ScoreResult, TileSet, setTiles } from '../engine';
import { Sheet } from './Sheet';
import { TileFace } from './TileFace';

const FORM_LABEL: Record<string, string> = {
  sevenPairs: 'Seven pairs',
  thirteenOrphans: 'Thirteen orphans',
  honorsKnitted: 'Honours & knitted tiles',
  knittedStraight: 'Knitted straight + set + pair',
};

function setLabel(s: TileSet) {
  const kind = { chow: 'Chow', pung: 'Pung', kong: 'Kong', pair: 'Pair' }[s.kind];
  const open = s.kind !== 'pair' && !s.concealed ? ' · claimed' : s.kind === 'kong' ? ' · concealed' : '';
  return `${kind}${open}`;
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
  const hk = result.variant === 'hk';
  const d = result.decomposition;
  const shown = useCountUp(result.error ? 0 : result.total);

  return (
    <Sheet label="Score" onClose={onClose}>

        {result.error ? (
          <div className="result-error">
            <div className="oops" aria-hidden>🀫</div>
            <h2>Can't score this yet</h2>
            <p>{result.error}</p>
            <button className="btn btn-primary" onClick={onClose}>Back to hand</button>
          </div>
        ) : (
          <>
            <div className="score-hero">
              {result.meetsMinimum && <Confetti />}
              <div className={`seal-score ${result.meetsMinimum ? '' : 'dud'}`}>
                <span className="score-num">{shown}</span>
                <span className="score-unit">{hk ? '番 fan' : '分 points'}</span>
              </div>
              {hk && <div className="score-meta">Worth <b>{HK_POINTS[result.total]}</b> points on the payment table</div>}
              <div className={`verdict ${result.meetsMinimum ? 'ok' : 'bad'}`}>
                {result.meetsMinimum ? 'Valid win' : `Below the ${result.minimum}-${hk ? 'fan' : 'point'} minimum`}
              </div>
            </div>

            {result.notes.length > 0 && (
              <ul className="notes">{result.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            )}

            <h3 className="sheet-h">Why you scored this</h3>
            {result.fans.length === 0 ? (
              <p className="hint">No scoring features — a chicken hand.</p>
            ) : (
              <ul className="fan-list">
                {result.fans.map((f, i) => (
                  <li key={`${f.id}-${f.points}`} className="fan" style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
                    <div className="fan-top">
                      <span className="fan-name">{f.en} <span className="zh-sub">{f.zh}</span>{f.count > 1 && <span className="times"> ×{f.count}</span>}</span>
                      <span className="fan-pts">+{f.points * f.count}</span>
                    </div>
                    <p className="fan-why">{f.why}</p>
                  </li>
                ))}
                <li className="fan fan-total">
                  <span>Total{hk && result.rawTotal > result.total ? ` (capped from ${result.rawTotal})` : ''}</span>
                  <span>{result.total} {hk ? 'fan' : 'pts'}</span>
                </li>
              </ul>
            )}

            {d && (
              <>
                <h3 className="sheet-h">How your hand was read</h3>
                {FORM_LABEL[d.form] && <p className="hint small">{FORM_LABEL[d.form]}</p>}
                {d.sets.length > 0 && (
                  <div className="read-sets">
                    {d.sets.map((s, i) => (
                      <div className="meld" key={i}>
                        <div className="meld-tiles">
                          {setTiles(s).map((t, k) => <TileFace key={k} tile={t} size="sm" />)}
                        </div>
                        <div className="meld-label">{setLabel(s)}{i === d.winSet ? ' · won here' : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
                {d.sets.length === 0 && <p className="hint small">Special hand — scored as a whole.</p>}
              </>
            )}

            <h3 className="sheet-h">Payment</h3>
            <ul className="payout">{result.payout.map((p) => <li key={p}>{p}</li>)}</ul>

            <div className="sheet-actions">
              <button className="btn" onClick={onClose}>Edit hand</button>
              <button className="btn btn-primary" onClick={onNewHand}>New hand</button>
            </div>
          </>
        )}
    </Sheet>
  );
}
