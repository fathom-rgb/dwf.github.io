const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
for (const file of ['index.html', 'resume.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('lang="zh-CN"'), `${file}: language missing`);
  assert(!/tel:|www_dwf_com|18258279827|certificate\.jpg|data-filter/.test(html), `${file}: retired public content`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(value)) continue;
    if (value.startsWith('#')) assert(ids.includes(value.slice(1)), `${file}: broken anchor ${value}`);
    else assert(fs.existsSync(path.join(path.dirname(file), value.split(/[?#]/)[0])), `${file}: missing ${value}`);
  }
  for (const [, attrs, code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (attrs.includes('ld+json')) JSON.parse(code);
    else new vm.Script(code);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) assert(/alt="[^"]*"/.test(match[0]), `${file}: missing alt`);
}
new vm.Script(fs.readFileSync('assets/site.js', 'utf8'));
new vm.Script(fs.readFileSync('assets/motion.js', 'utf8'));
new vm.Script(fs.readFileSync('characters/app.js', 'utf8'));
console.log('PASS: local links, anchors, unique IDs, image alternatives, privacy checks, JSON-LD and JavaScript syntax');
