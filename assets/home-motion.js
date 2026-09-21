(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function animate(element, delay = 0) {
    if (!element || reduced.matches || !element.animate) return;
    const animation = element.animate([{opacity: .65, transform: 'translateY(7px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 420, delay, easing: 'cubic-bezier(.22,1,.36,1)'});
    running.add(animation);
    animation.onfinish = animation.oncancel = () => running.delete(animation);
  }
  document.querySelectorAll('.hero h1 > span').forEach((line, i) => animate(line, i * 65));
  animate(document.querySelector('.hero .identity-portrait'), 100);
  const scholar = document.querySelector('.scholar-button');
  if (scholar) {
    scholar.disabled = false;
    scholar.addEventListener('click', () => {
      running.forEach(effect => effect.cancel());
      animate(scholar.querySelector('img'));
      document.querySelector('.scholar-greeting').textContent = '你好，欢迎来到我的个人空间。';
    });
  }
  reduced.addEventListener('change', () => { if (reduced.matches) running.forEach(effect => effect.cancel()); });
  document.addEventListener('focusin', () => running.forEach(effect => effect.cancel()));
  // Section navigation is an enhancement; normal anchor links remain available.
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const current = [...visible].sort((a,b) => a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0]?.id;
      links.forEach(link => { if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    }, {rootMargin: '-76px 0px -45% 0px', threshold: 0});
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
  }
})();
