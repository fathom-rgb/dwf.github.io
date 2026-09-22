const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {renderProducts, renderConstellation, validate, root} = require('./products.cjs');
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const html = renderProducts(products);
assert.equal((html.match(/class="catalog-product"/g) || []).length, products.length);
assert.equal((html.match(/class="featured-product"/g) || []).length, Math.min(3, products.filter(p => p.featured).length));
const mock = {id:'test-new-product', name:'新增产品 <测试>', description:'这是测试数据，不会发布。', category:'实验项目', status:'原型展示', href:'https://example.com/', action:'体验原型'};
const expanded = renderProducts([...products, mock]);
const stars = renderConstellation([...products, mock]);
assert.equal((stars.match(/class="star-node"/g) || []).length, products.length + 1);
assert(stars.includes('新增产品 &lt;测试&gt;'));
for (const p of products) assert(stars.includes(`href="${p.href}"`));
assert(expanded.includes('id="test-new-product"'));
assert(expanded.includes('data-category-filter="实验项目"'));
assert(expanded.includes('新增产品 &lt;测试&gt;'));
assert(!expanded.includes('id="featured-test-new-product"'));
assert.equal((expanded.match(/class="catalog-product"/g) || []).length, products.length + 1);
assert.equal((renderProducts(products.map(p => ({...p, featured: true, image:'assets/unilifesim.jpg', imageAlt:'测试', imageWidth:1161, imageHeight:635}))).match(/class="featured-product"/g) || []).length, 3);
assert.throws(() => validate([...products, products[0]]), /重复/);
assert.throws(() => validate([{...mock, href:'javascript:alert(1)'}]), /链接/);
assert.throws(() => validate([{...mock, featured:true}]), /真实截图/);
for (const p of products) {
  assert(html.includes(`id="${p.id}"`), `Missing legacy anchor: ${p.id}`);
  if (p.image) assert(fs.existsSync(path.join(root, p.image)), `Missing screenshot: ${p.image}`);
}
console.log('PASS: new product/category generation, static content, feature cap, escaping and existing anchors');
