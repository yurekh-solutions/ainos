const fs = require('fs');
const content = fs.readFileSync('src/data/invitations/templatesExpanded.ts', 'utf8');
const match = content.match(/export const EXPANDED_TEMPLATES = (\[[\s\S]*?\]);/);
const templates = eval(match[1]);
const imgs = templates.map(t => t.previewImage);
const unique = new Set(imgs);
console.log('Total templates:', templates.length);
console.log('Unique images:', unique.size);
console.log('Duplicates:', imgs.length - unique.size);

// Count per image
const counts = {};
imgs.forEach(img => { counts[img] = (counts[img] || 0) + 1; });
const mostRepeated = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);
console.log('\nMost repeated images:');
mostRepeated.forEach(([img, count]) => console.log(`  ${count}x - ${img}`));
