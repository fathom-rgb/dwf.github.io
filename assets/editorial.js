(() => {
  'use strict';
  const art = document.querySelector('.paper-art');
  if (!art) return;
  const motion = matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) and (min-width: 761px)');
  let frame = 0, x = 0, y = 0;
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    art.style.removeProperty('--paper-x'); art.style.removeProperty('--paper-y');
  }
  art.addEventListener('pointermove', event => {
    if (!motion.matches) return;
    const bounds = art.getBoundingClientRect();
    x = (event.clientY - bounds.top) / bounds.height - .5;
    y = (event.clientX - bounds.left) / bounds.width - .5;
    if (!frame) frame = requestAnimationFrame(() => {
      art.style.setProperty('--paper-x', `${-x * 1.8}deg`);
      art.style.setProperty('--paper-y', `${y * 2.4}deg`);
      frame = 0;
    });
  }, {passive:true});
  art.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('pagehide', reset);
})();
