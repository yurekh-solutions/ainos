const fs = require('fs');

function loadArr(path, exportName) {
  const txt = fs.readFileSync(path, 'utf8');
  const m = txt.match(new RegExp(`export const ${exportName}\\s*[:=][^=]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!m) return [];
  // Strip TypeScript type annotations like `(t: TemplateType)` — not needed here.
  // The arrays are pure object literals; eval works.
  return eval(m[1]);
}

const base = fs.readFileSync('src/data/invitations/templates.ts', 'utf8');
const baseMatch = base.match(/const BASE_TEMPLATES = (\[[\s\S]*?\n\]);/);
const BASE = baseMatch ? eval(baseMatch[1]) : [];
const GEN = loadArr('src/data/invitations/templatesGenerated.ts', 'GENERATED_TEMPLATES');
const EXP = loadArr('src/data/invitations/templatesExpanded.ts', 'EXPANDED_TEMPLATES');

const all = [...BASE, ...GEN, ...EXP];
const seen = new Set();
const unique = all.filter((t) => {
  if (!t.previewImage) return true;
  if (seen.has(t.previewImage)) return false;
  seen.add(t.previewImage);
  return true;
});

console.log('BASE:', BASE.length);
console.log('GENERATED:', GEN.length);
console.log('EXPANDED:', EXP.length);
console.log('Combined:', all.length);
console.log('After dedupe:', unique.length);
console.log('Removed dupes:', all.length - unique.length);

// Show ganpati subset
const gp = unique.filter((t) => t.category === 'ganpati');
console.log('\nGanpati after dedupe:', gp.length);
gp.forEach((t) => console.log('  -', t._id, t.name, '=>', t.previewImage));
