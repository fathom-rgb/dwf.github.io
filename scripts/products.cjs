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
  const featured = products.filter(p => p.featured).slice(0, 3);
  const categories = [...new Set(products.map(p => p.category))];
  return `<section class="section wrap products-section" id="projects" aria-labelledby="projectsTitle" tabindex="-1">
  <header class="products-heading"><h2 id="projectsTitle">正在重点做<span class="accent">。</span></h2><a class="text-link directory-jump" href="#all-products">全部作品 <span class="count">${products.length}</span> <span aria-hidden="true">↓</span></a></header>
  <div class="featured-products" data-count="${featured.length}">${featured.map(p => `<article class="featured-product" aria-labelledby="featured-${p.id}">
    <a class="featured-visual" href="${escape(p.href)}" aria-label="${escape(p.action)}${p.href.startsWith('https://') ? '（新标签页）' : ''}"${p.href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${img(p, 'product-screenshot', true)}</a>
    <div class="product-meta"><span>${escape(p.category)}</span><span class="product-status">${escape(p.status)}</span></div>
    <h3 id="featured-${p.id}">${escape(p.name)}</h3><p>${escape(p.description)}</p>
    ${link(p.href, p.action, 'product-action')}
  </article>`).join('\n')}</div>
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
    .replace('<!-- CONSTELLATION -->', renderConstellation(products));
}
function renderConstellation(products) {
  validate(products);
  const initial = products[0];
  return `<figure class="constellation" aria-labelledby="constellationTitle">
    <figcaption class="constellation-heading"><span id="constellationTitle">作品星图</span><span>${products.length} 件作品 · 持续生长</span></figcaption>
    <div class="constellation-stage">
      <canvas class="constellation-canvas" aria-hidden="true"></canvas>
      <div class="constellation-nodes">${products.map((p,i) => `<a class="star-node" href="${escape(p.href)}" data-star-id="${p.id}" data-star-image="${escape(p.image || '')}" data-star-description="${escape(p.description)}" data-star-category="${escape(p.category)}" data-star-mark="${escape(p.mark || p.name[0])}"${i === 0 ? ' data-selected="true"' : ''}${p.href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="star-hit">${img(p)}</span><span class="star-label">${escape(p.name)} <span aria-hidden="true">↗</span></span><span class="star-category">${escape(p.category)}</span>${p.href.startsWith('https://') ? '<span class="sr-only">（新标签页）</span>' : ''}</a>`).join('')}</div>
      <div class="constellation-controls" hidden><button type="button" data-star-rotate="left" aria-label="向左旋转星图">←</button><button type="button" data-star-rotate="right" aria-label="向右旋转星图">→</button><button type="button" data-star-pause aria-pressed="false">暂停转动</button><button type="button" data-star-reset>复位</button></div>
    </div>
    <div class="star-caption" role="status" aria-live="polite" aria-atomic="true"><strong>${escape(initial.name)}</strong><p>${escape(initial.description)}</p></div>
    <p class="star-help">选择一颗星，进入一件作品。<span class="star-drag-hint" hidden>拖动空白处可旋转。</span></p>
  </figure>`;
}
if (require.main === module) {
  const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
  fs.writeFileSync(path.join(root, 'index.html'), renderPage(products));
  console.log(`Generated homepage: ${products.length} products`);
}
module.exports = {validate, renderProducts, renderPage, renderConstellation, root};
