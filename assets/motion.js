(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const running = new Set();
  let observer;
  function animate(el, frames, options) {
    if (reduced.matches || typeof el.animate !== 'function') return;
    const effect = el.animate(frames, {duration: 750, easing: 'cubic-bezier(.22,1,.36,1)', ...options});
    running.add(effect);
    effect.onfinish = effect.oncancel = () => running.delete(effect);
  }
  // No hidden classes or persistent fill: content survives partial script failures.
  document.querySelectorAll('.hero h1 > span').forEach((line, i) => {
    animate(line, [{clipPath: 'inset(0 0 100% 0)', transform: 'translateY(22px)'}, {clipPath: 'inset(0 0 0% 0)', transform: 'translateY(0)'}], {duration: 900, delay: i * 100});
  });
  if ('IntersectionObserver' in window && !reduced.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.contains(document.activeElement)) return;
        animate(entry.target, [{opacity: .2, transform: 'translateY(24px)'}, {opacity: 1, transform: 'translateY(0)'}]);
      });
    }, {threshold: .08});
    document.querySelectorAll('.section-head, .project-grid, .method-list li, .about-grid, .contact-grid').forEach(el => observer.observe(el));
  }
  const stage = document.querySelector('.portrait-stage');
  const paper = document.querySelector('.portrait-paper');
  let frame = 0;
  function resetTilt() {
    cancelAnimationFrame(frame); frame = 0;
    paper?.style.removeProperty('--tilt-x');
    paper?.style.removeProperty('--tilt-y');
  }
  stage?.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse' || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = stage.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5));
      paper.style.setProperty('--tilt-x', `${-y * 7}deg`);
      paper.style.setProperty('--tilt-y', `${x * 7}deg`);
    });
  }, {passive: true});
  stage?.addEventListener('pointerleave', resetTilt);
  stage?.addEventListener('pointercancel', resetTilt);
  finePointer.addEventListener('change', resetTilt);
  reduced.addEventListener('change', () => {
    resetTilt();
    if (reduced.matches) { observer?.disconnect(); running.forEach(effect => effect.cancel()); }
  });
  document.addEventListener('focusin', () => running.forEach(effect => effect.cancel()));
  const menu = document.getElementById('mobileMenu');
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    if (menu?.open) animate(menu, [{transform: 'translateX(32px)', opacity: .5}, {transform: 'translateX(0)', opacity: 1}], {duration: 350});
  });
  document.querySelectorAll('.project-note').forEach(note => note.addEventListener('toggle', () => {
    if (note.open) animate(note.querySelector('.note-grid'), [{opacity: .2, transform: 'translateY(-8px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 350});
  }));
})();
