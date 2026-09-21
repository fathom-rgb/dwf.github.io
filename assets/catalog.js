(() => {
  'use strict';
  const toolbar = document.querySelector('.catalog-filters');
  if (!toolbar) return;
  const buttons = [...toolbar.querySelectorAll('[data-category-filter]')];
  const products = [...document.querySelectorAll('[data-product-category]')];
  const count = document.getElementById('catalogCount');
  const empty = document.querySelector('.catalog-empty');
  function filter(category) {
    let shown = 0;
    products.forEach(product => {
      product.hidden = category !== 'all' && product.dataset.productCategory !== category;
      if (!product.hidden) shown++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
    count.textContent = category === 'all' ? `共 ${shown} 件作品` : `${category} · ${shown} / ${products.length} 件作品`;
    empty.hidden = shown !== 0;
  }
  toolbar.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset.categoryFilter)));
  document.querySelector('[data-reset-filter]')?.addEventListener('click', () => { filter('all'); buttons[0].focus(); });
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const product = target?.closest('[data-product-category]');
    if (product?.hidden) filter('all');
    if (target?.matches('details')) target.open = true;
    if (product) requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
  }
  addEventListener('hashchange', revealAnchor);
  document.querySelectorAll('a[href$="-notes"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (target?.matches('details')) target.open = true;
  }));
  revealAnchor();
})();
