require('./check.cjs');
const fs = require('node:fs');
fs.mkdirSync('dist/assets', {recursive:true});
fs.cpSync('characters', 'dist/characters', {recursive:true});
for (const file of ['index.html','resume.html','robots.txt','sitemap.xml','.nojekyll']) fs.copyFileSync(file, `dist/${file}`);
for (const file of ['styles.css','resume.css','site.js','motion.css','motion.js','favicon.svg','photo.jpg','unilifesim.jpg','portfolio-preview.jpg','certificate.jpg']) fs.copyFileSync(`assets/${file}`, `dist/assets/${file}`);
console.log('Built public-only static files in dist');
