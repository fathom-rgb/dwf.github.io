(() => {
  'use strict';
  const desk = document.querySelector('.spatial-desk');
  const control = document.querySelector('.book-control');
  if (!desk || !control) return;
  control.disabled = false;
  control.addEventListener('click', () => {
    const open = desk.classList.toggle('book-open');
    control.setAttribute('aria-expanded', String(open));
    control.textContent = open ? '合上这本书 ↗' : '翻开这本书 ↗';
    document.getElementById('bookExcerpt').setAttribute('aria-hidden', String(!open));
  });
})();
