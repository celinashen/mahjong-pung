import { useCallback, useEffect, useMemo, useState } from 'react';
import { MESSAGES } from './engine';
import { GameModeSheet } from './components/GameModeSheet';
import { HandBuilder } from './components/HandBuilder';
import { Questions } from './components/Questions';
import { ResultSheet } from './components/ResultSheet';
import { RulesSheet } from './components/RulesSheet';
import { LangContext } from './i18n';
import { VARIANTS, readings, scoreHand, useAppState } from './state';

/** Which questions are open: the full set, or just flowers for a win on 7 or 8 flowers. */
type Asking = 'hand' | 'flowerWin' | null;

export default function App() {
  const [state, dispatch] = useAppState();
  const [showResult, setShowResult] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [asking, setAsking] = useState<Asking>(null);
  const [notAWin, setNotAWin] = useState(false);
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
    () => (showResult ? scoreHand(state, lang) : null),
    [showResult, state, lang],
  );
  const close = useCallback(() => setShowResult(false), []);
  const closeRules = useCallback(() => setRulesOpen(false), []);
  const closeMode = useCallback(() => setModeOpen(false), []);
  const closeQuestions = useCallback(() => setAsking(null), []);
  const finishQuestions = useCallback(() => { setAsking(null); setShowResult(true); }, []);
  useEffect(() => setNotAWin(false), [hand.tiles, prefs.variant, prefs.hk]);
  const newHand = () => {
    dispatch({ type: 'newHand' });
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submit = () => {
    if (readings(hand, prefs).length > 0) setAsking('hand');
    else setNotAWin(true);
  };
  const claimFlowerWin = () => {
    dispatch({ type: 'flag', key: 'selfDrawn', value: true });
    setAsking('flowerWin');
  };
  const complete = hand.tiles.length >= 14;
  const isEmpty = hand.tiles.length === 0 && hand.flowers.length === 0;
  const modeSummary = [
    VARIANTS.find((v) => v.id === prefs.variant)![lang],
    ...(prefs.flowers ? [] : [tx('No flowers', '不計花')]),
    ...(prefs.winds ? [] : [tx('No winds', '不計風')]),
  ].join(' · ');

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
          <button className="mode-btn" onClick={() => setModeOpen(true)}>
            <span className="mode-btn-label">{tx('Game mode', '玩法')}</span>
            <span className="mode-btn-value">{modeSummary}</span>
            <span className="mode-btn-go" aria-hidden>›</span>
          </button>
        </header>

        <main>
          <HandBuilder hand={hand} error={notAWin ? MESSAGES[lang].notAWin : null} dispatch={dispatch} />
          {prefs.variant === 'hk' && prefs.flowers && !complete && (
            <button className="link-btn" onClick={claimFlowerWin}>{tx('Won with 7 or 8 flowers?', '七搶一或八仙過海？')}</button>
          )}
          <button className="rules-link" onClick={() => setRulesOpen(true)}>
            <span className="rules-link-icon">?</span>
            <span>
              <b>{prefs.variant === 'hk' ? tx('New to Hong Kong mahjong?', '第一次玩港式麻雀？') : tx('New to Chinese mahjong?', '第一次玩國標麻將？')}</b>
              <br />
              {tx('Set-up, turns, claiming and how to score.', '開局、輪流摸打、吃碰槓及計番方法。')}
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
          <button className={`btn btn-primary grow${complete ? ' ready' : ''}`} disabled={!complete} onClick={submit}>
            {tx('Submit hand', '提交手牌')}
          </button>
        </footer>

        {asking && (
          <Questions state={state} dispatch={dispatch} flowerWin={asking === 'flowerWin'} onDone={finishQuestions} onClose={closeQuestions} />
        )}
        {modeOpen && <GameModeSheet prefs={prefs} dispatch={dispatch} onClose={closeMode} />}
        {result && <ResultSheet result={result} onClose={close} onNewHand={newHand} />}
        {rulesOpen && <RulesSheet initial={prefs.variant} onClose={closeRules} />}
      </div>
    </LangContext.Provider>
  );
}
