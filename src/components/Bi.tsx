import { useLang } from '../i18n';

/**
 * A label in the current language with the other language as a small subtitle,
 * so mixed tables (some read English, some Chinese) can follow along.
 */
export function Bi({ en, zh }: { en: string; zh: string }) {
  const { lang } = useLang();
  return (
    <>
      {lang === 'zh' ? zh : en}
      <span className="alt" lang={lang === 'zh' ? 'en' : 'zh-Hant'}>{lang === 'zh' ? en : zh}</span>
    </>
  );
}
