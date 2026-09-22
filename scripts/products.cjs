const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(products) {
  if (!Array.isArray(products) || !products.length) throw Error('作品数据需要至少一项');
  const ids = new Set();
  for (const p of products) {
    if (!/^[a-z][a-z0-9-]*$/.test(p.id) || ids.has(p.id)) throw Error('作品 ID 无效或重复');
    ids.add(p.id);
    for (const key of ['name','description','category','status','href','action']) if (typeof p[key] !== 'string' || !p[key].trim()) throw Error(`${p.id}: 缺少 ${key}`);
    for (const url of [p.href, p.source].filter(Boolean)) {
      if (!/^(https:\/\/|#[a-z]|[a-z][a-z0-9-/]*(?:\.html)?$)/i.test(url) || /[<>"'\s]/.test(url) || url.includes('..')) throw Error(`${p.id}: 链接无效`);
    }
    if (p.featured !== undefined && typeof p.featured !== 'boolean') throw Error(`${p.id}: featured 应为布尔值`);
    if (p.featured && !p.image) throw Error(`${p.id}: 精选作品需要真实截图`);
    if (p.image && (!/^assets\/[a-zA-Z0-9/_-]+\.(png|webp|jpg)$/.test(p.image) || !p.imageAlt || !p.imageWidth || !p.imageHeight)) throw Error(`${p.id}: 图片信息不完整`);
    if (p.href === `#${p.id}-notes` && !p.notes?.length) throw Error(`${p.id}: 缺少作品说明`);
  }
  return products;
}
const arrow = '<span aria-hidden="true">↗</span>';
function link(href, label, className = '') {
  const external = href.startsWith('https://');
  return `<a class="${className}" href="${escape(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)} ${arrow}${external ? '<span class="sr-only">（新标签页）</span>' : ''}</a>`;
}
function img(p, className = '', eager = false) {
  if (!p.image) return `<span class="product-mark" aria-hidden="true">${escape(p.mark || p.name[0])}</span>`;
  return `<img class="${className}" src="${escape(p.image)}" alt="${escape(p.imageAlt)}" width="${p.imageWidth}" height="${p.imageHeight}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
}
function notes(p) {
  if (!p.notes?.length) return '';
  return `<details class="product-notes" id="${p.id}-notes"><summary>创作笔记<span class="sr-only">：${escape(p.name)}</span></summary><div class="product-note-content">${p.notice ? `<p class="product-notice">${escape(p.notice)}</p>` : ''}${p.notes.map(n => `<div><h4>${escape(n.title)}</h4><p>${escape(n.text)}</p></div>`).join('')}${p.source ? link(p.source, '查看源码', 'text-link') : ''}</div></details>`;
}
function renderProducts(products) {
  validate(products);
  const categories = [...new Set(products.map(p => p.category))];
  return `<section class="section wrap products-section" id="projects" aria-labelledby="catalogTitle" tabindex="-1">
  <div class="catalog" id="all-products" tabindex="-1">
    <header class="catalog-heading"><h2 id="catalogTitle">全部作品</h2><p id="catalogCount" role="status" aria-live="polite" aria-atomic="true">共 ${products.length} 件作品</p></header>
    <div class="catalog-filters" role="group" aria-label="按作品类型筛选" hidden><button type="button" data-category-filter="all" aria-pressed="true" aria-controls="productList">全部 <span>${products.length}</span></button>${categories.map(c => `<button type="button" data-category-filter="${escape(c)}" aria-pressed="false" aria-controls="productList">${escape(c)} <span>${products.filter(p => p.category === c).length}</span></button>`).join('')}</div>
    <div class="product-list" id="productList" aria-labelledby="catalogTitle">${products.map(p => `<article class="catalog-product" id="${p.id}" data-product-category="${escape(p.category)}" tabindex="-1" aria-labelledby="title-${p.id}">
      <div class="catalog-row"><div class="catalog-thumb">${img(p)}</div><div class="catalog-copy"><div class="catalog-title"><h3 id="title-${p.id}">${escape(p.name)}</h3><span class="product-status">${escape(p.status)}</span></div><p>${escape(p.description)}</p><span class="catalog-category">${escape(p.category)}${p.subtitle ? ` · ${escape(p.subtitle)}` : ''}</span></div>${link(p.href, p.action, 'catalog-action')}</div>
      ${notes(p)}
    </article>`).join('\n')}</div>
    <p class="catalog-empty" hidden>这个分类暂时没有作品。<button type="button" data-reset-filter>查看全部作品</button></p>
  </div>
</section>`;
}
function renderPage(products) {
  return fs.readFileSync(path.join(root, 'templates/home.html'), 'utf8')
    .replace('<!-- PRODUCTS -->', renderProducts(products))
    .replace('<!-- HERO INDEX -->', renderHeroIndex(products));
}
function renderHeroIndex(products) {
  validate(products);
  return `<nav class="hero-index" aria-label="作品快捷入口">${products.slice(0,4).map((p,i) => `<a href="${escape(p.href)}"${p.href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="index-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="index-title">${escape(p.name)}<span aria-hidden="true">→</span></span>${p.href.startsWith('https://') ? '<span class="sr-only">（新标签页）</span>' : ''}</a>`).join('')}</nav>${products.length>4 ? `<a class="index-more text-link" href="#all-products">查看全部 ${products.length} 件作品 <span aria-hidden="true">→</span></a>` : ''}`;
}
if (require.main === module) {
  const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
  fs.writeFileSync(path.join(root, 'index.html'), renderPage(products));
  console.log(`Generated homepage: ${products.length} products`);
}
module.exports = {validate, renderProducts, renderPage, renderHeroIndex, root};
