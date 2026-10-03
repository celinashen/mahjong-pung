import { useCallback, useState } from 'react';
import { ScoreResult, Variant, score } from './engine';
import { Conditions } from './components/Conditions';
import { HandView } from './components/HandView';
import { ResultSheet } from './components/ResultSheet';
import { RulesSheet } from './components/RulesSheet';
import { TilePicker } from './components/TilePicker';
import { hiddenCount, hiddenNeeded, toContext, toHandInput, useAppState } from './state';

const VARIANTS: Array<{ id: Variant; label: string; zh: string }> = [
  { id: 'hk', label: 'Hong Kong', zh: '港式' },
  { id: 'mcr', label: 'Chinese', zh: '國標' },
];

export default function App() {
  const [state, dispatch] = useAppState();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { prefs, hand } = state;

  const calculate = () => setResult(score(prefs.variant, toHandInput(hand), toContext(state), prefs.hk));
  const close = useCallback(() => setResult(null), []);
  const closeRules = useCallback(() => setRulesOpen(false), []);
  const newHand = () => {
    dispatch({ type: 'newHand' });
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const ready = hand.winning !== null && hiddenCount(hand) === hiddenNeeded(hand);
  const isEmpty = hand.tiles.length === 0 && hand.winning === null && hand.melds.length === 0 && hand.flowers.length === 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="seal" aria-hidden>碰</span>
          <span className="wordmark">pung!</span>
        </div>
        <div className="segmented variant" role="tablist" aria-label="Mahjong variant">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={prefs.variant === v.id}
              className={prefs.variant === v.id ? 'on' : ''}
              onClick={() => dispatch({ type: 'variant', variant: v.id })}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button className="rules-btn" aria-label="How to play" onClick={() => setRulesOpen(true)}>?</button>
      </header>

      <main>
        <HandView hand={hand} dispatch={dispatch} />
        <TilePicker hand={hand} mode={state.mode} dispatch={dispatch} />
        <Conditions state={state} dispatch={dispatch} />
        <button className="rules-link" onClick={() => setRulesOpen(true)}>
          <span className="rules-link-icon">?</span>
          <span><b>New to {prefs.variant === 'hk' ? 'Hong Kong' : 'Chinese'} mahjong?</b><br />Set-up, turns, claiming and how to score.</span>
        </button>
        <p className="footnote">
          {prefs.variant === 'hk'
            ? 'Hong Kong scoring per the HKMJ cheat sheet: 13-fan limit, discarder pays all.'
            : 'Chinese Official (MCR) scoring per the WMO competition rules: 8-point minimum, flowers excluded.'}
        </p>
      </main>

      <footer className="actionbar">
        <button className="btn" onClick={newHand} disabled={isEmpty}>New hand</button>
        <button className={`btn btn-primary grow${ready ? ' ready' : ''}`} onClick={calculate}>Calculate score</button>
      </footer>

      {result && <ResultSheet result={result} onClose={close} onNewHand={newHand} />}
      {rulesOpen && <RulesSheet initial={prefs.variant} onClose={closeRules} />}
    </div>
  );
}
