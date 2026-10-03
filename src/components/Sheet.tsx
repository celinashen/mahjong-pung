import { ReactNode, useEffect, useRef } from 'react';
import { useLang } from '../i18n';

interface Props {
  label: string;
  /** Skip the bouncy entrance (used for the rulebook). */
  plain?: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet used for results and rules. Closes on backdrop tap or Escape. */
export function Sheet({ label, plain, onClose, children }: Props) {
  const { tx } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={`sheet-backdrop${plain ? ' sheet-plain' : ''}`} onClick={onClose}>
      <div className={`sheet${plain ? ' sheet-plain' : ''}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top">
          <div className="sheet-grip" />
          <button className="sheet-close" aria-label={tx('Close', '關閉')} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
