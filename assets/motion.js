(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  let observer;
  function animate(el, frames, options) {
    if (!el || reduced.matches || typeof el.animate !== 'function') return;
    const effect = el.animate(frames, {duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', ...options});
    running.add(effect);
    effect.onfinish = effect.oncancel = () => running.delete(effect);
    return effect;
  }
  // No hidden classes or persistent fill: content survives partial script failures.
  document.querySelectorAll('.hero h1 > span').forEach((line, i) => {
    animate(line, [{opacity: .65, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 420, delay: i * 70});
  });
  if ('IntersectionObserver' in window && !reduced.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.contains(document.activeElement)) return;
        const parts = entry.target.matches('.section-head') ? Array.from(entry.target.children) : [entry.target];
        parts.forEach((part, i) => animate(part, [{opacity: .6, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {delay: i * 70}));
      });
    }, {threshold: .08});
    document.querySelectorAll('.section-head, .project-grid, .method-list li, .about-grid, .contact-grid').forEach(el => observer.observe(el));
  }
  const scholar = document.querySelector('.scholar-button');
  const scholarImage = scholar?.querySelector('img');
  let greetingEffect;
  if (scholar) scholar.disabled = false;
  scholar?.addEventListener('click', () => {
    greetingEffect?.cancel();
    greetingEffect = animate(scholarImage, [
      {transform: 'rotate(0deg) translateY(0)'},
      {transform: 'rotate(-3deg) translateY(-5px)', offset: .3},
      {transform: 'rotate(2deg) translateY(-2px)', offset: .65},
      {transform: 'rotate(0deg) translateY(0)'}
    ], {duration: 580});
    const greeting = document.querySelector('.scholar-greeting');
    if (greeting) greeting.textContent = '你好，欢迎来到我的个人空间。';
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { observer?.disconnect(); running.forEach(effect => effect.cancel()); }
  });

  const progress = document.querySelector('.reading-progress');
  const sections = Array.from(document.querySelectorAll('main > section[id]'));
  const chapterLinks = Array.from(document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav nav a[href^="#"]'));
  let scrollFrame = 0;
  function updateReading() {
    scrollFrame = 0;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const ratio = maxScroll ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    const readingLine = Math.min(innerHeight * .35, 240);
    let current = '';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= readingLine) current = '#' + section.id;
    });
    if (maxScroll > 0 && scrollY >= maxScroll - 2 && sections.length) current = '#' + sections[sections.length - 1].id;
    chapterLinks.forEach(link => {
      if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function queueReading() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReading);
  }
  addEventListener('scroll', queueReading, {passive: true});
  addEventListener('resize', queueReading, {passive: true});
  addEventListener('pageshow', queueReading);
  if ('ResizeObserver' in window) new ResizeObserver(queueReading).observe(document.body);
  updateReading();
  document.addEventListener('focusin', () => running.forEach(effect => effect.cancel()));
  const menu = document.getElementById('mobileMenu');
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    if (menu?.open) animate(menu, [{transform: 'translateX(32px)', opacity: .5}, {transform: 'translateX(0)', opacity: 1}], {duration: 350});
  });
  document.querySelectorAll('.project-note').forEach(note => note.addEventListener('toggle', () => {
    if (note.open) animate(note.querySelector('.note-grid'), [{opacity: .2, transform: 'translateY(-8px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 350});
  }));
})();
