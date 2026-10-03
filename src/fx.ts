// Springy "boing" on every button tap. Uses the Web Animations API on the
// `scale` property so it never fights with CSS transforms/animations already
// on the element (tile drop-ins, selected-tile lift, etc.).

const BOING: Keyframe[] = [
  { scale: '1' },
  { scale: '0.88', offset: 0.25 },
  { scale: '1.08', offset: 0.6 },
  { scale: '0.98', offset: 0.82 },
  { scale: '1' },
];

export function installButtonFx() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', (e) => {
    if (reduced.matches) return;
    const btn = (e.target as Element | null)?.closest?.('button, .toggle');
    if (!btn || (btn as HTMLButtonElement).disabled || btn.closest('.sheet-plain')) return;
    btn.animate(BOING, { duration: 420, easing: 'ease-out' });
  });
}
