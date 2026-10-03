import { useCallback, useEffect, useMemo, useState } from 'react';
import { Variant, score } from './engine';
import { Bi } from './components/Bi';
import { Conditions } from './components/Conditions';
import { HandView } from './components/HandView';
import { ResultSheet } from './components/ResultSheet';
import { RulesSheet } from './components/RulesSheet';
import { TilePicker } from './components/TilePicker';
import { LangContext } from './i18n';
import { hiddenCount, hiddenNeeded, toContext, toHandInput, useAppState } from './state';

const VARIANTS: Array<{ id: Variant; en: string; zh: string }> = [
  { id: 'hk', en: 'Hong Kong', zh: '港式' },
  { id: 'mcr', en: 'Chinese', zh: '國標' },
];

export default function App() {
  const [state, dispatch] = useAppState();
  const [showResult, setShowResult] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { prefs, hand } = state;
  const lang = prefs.lang;
  const zh = lang === 'zh';
  const tx = (en: string, zhText: string) => (zh ? zhText : en);

  useEffect(() => {
    document.documentElement.lang = zh ? 'zh-Hant' : 'en';
    document.title = zh ? 'pung! 碰 — 麻雀計番' : 'pung!';
  }, [zh]);

  // Recomputed on demand so the result follows the language setting.
  const result = useMemo(
    () => (showResult ? score(prefs.variant, toHandInput(hand), toContext(state), prefs.hk, lang) : null),
    [showResult, prefs.variant, prefs.hk, hand, state, lang],
  );
  const close = useCallback(() => setShowResult(false), []);
  const closeRules = useCallback(() => setRulesOpen(false), []);
  const newHand = () => {
    dispatch({ type: 'newHand' });
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const ready = hand.winning !== null && hiddenCount(hand) === hiddenNeeded(hand);
  const isEmpty = hand.tiles.length === 0 && hand.winning === null && hand.melds.length === 0 && hand.flowers.length === 0;

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <header className="topbar">
          <div className="topbar-row">
            <div className="brand">
              <span className="seal" aria-hidden>碰</span>
              <span className="wordmark">pung!</span>
            </div>
            <button
              className="lang-toggle"
              onClick={() => dispatch({ type: 'prefs', patch: { lang: zh ? 'en' : 'zh' } })}
              aria-label={zh ? 'Switch to English' : '切換至中文'}
            >
              <span className={!zh ? 'on' : ''}>EN</span>
              <span className={zh ? 'on' : ''}>中</span>
            </button>
            <button className="rules-btn" aria-label={tx('How to play', '玩法')} onClick={() => setRulesOpen(true)}>?</button>
          </div>
          <div className="segmented variant" role="tablist" aria-label={tx('Mahjong variant', '麻雀種類')}>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={prefs.variant === v.id}
                className={prefs.variant === v.id ? 'on' : ''}
                onClick={() => dispatch({ type: 'variant', variant: v.id })}
              >
                <Bi en={v.en} zh={v.zh} />
              </button>
            ))}
          </div>
        </header>

        <main>
          <HandView hand={hand} dispatch={dispatch} />
          <TilePicker hand={hand} mode={state.mode} dispatch={dispatch} />
          <Conditions state={state} dispatch={dispatch} />
          <button className="rules-link" onClick={() => setRulesOpen(true)}>
            <span className="rules-link-icon">?</span>
            <span>
              <b>{prefs.variant === 'hk' ? tx('New to Hong Kong mahjong?', '第一次玩港式麻雀？') : tx('New to Chinese mahjong?', '第一次玩國標麻將？')}</b>
              <br />
              {tx('Set-up, turns, claiming and how to score.', '開局、輪流摸打、上碰槓及計番方法。')}
            </span>
          </button>
          <p className="footnote">
            {prefs.variant === 'hk'
              ? tx('Hong Kong scoring per the HKMJ cheat sheet: 13-fan limit, discarder pays all.', '港式計番依照 HKMJ 番數表：13 番爆棚，出銃包。')
              : tx('Chinese Official (MCR) scoring per the WMO competition rules: 8-point minimum, flowers excluded.', '國標麻將依照世界麻將組織比賽規則：8 分起和，花牌不計。')}
          </p>
        </main>

        <footer className="actionbar">
          <button className="btn" onClick={newHand} disabled={isEmpty}>{tx('New hand', '新一局')}</button>
          <button className={`btn btn-primary grow${ready ? ' ready' : ''}`} onClick={() => setShowResult(true)}>
            {tx('Calculate score', '計番！')}
          </button>
        </footer>

        {result && <ResultSheet result={result} onClose={close} onNewHand={newHand} />}
        {rulesOpen && <RulesSheet initial={prefs.variant} onClose={closeRules} />}
      </div>
    </LangContext.Provider>
  );
}
