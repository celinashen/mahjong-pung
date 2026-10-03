import { createContext, useContext } from 'react';
import type { Lang } from './engine';

export type { Lang };

export const LangContext = createContext<Lang>('en');

/** `tx(en, zh)` picks the string for the current language. Translations sit next to their use. */
export function useLang() {
  const lang = useContext(LangContext);
  const tx = <T,>(en: T, zh: T): T => (lang === 'zh' ? zh : en);
  return { lang, tx };
}

export function defaultLang(): Lang {
  try {
    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}
