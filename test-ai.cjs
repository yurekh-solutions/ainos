// Temp: test JSON website-content generation via Pollinations GET
async function main() {
  const prompt = 'Generate website content for a business named "Spice Villa", industry: restaurant, description: family-run Indian restaurant in Mumbai. Respond ONLY with valid JSON: {"tagline":string,"heroHeading":string,"heroSub":string,"about":string,"services":[{"name":string,"desc":string}x4],"features":[string x3],"cta":string}';
  const r = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?json=true');
  const t = await r.text();
  console.log('HTTP', r.status, 'len', t.length);
  try { const j = JSON.parse(t); console.log('VALID JSON. tagline:', j.tagline, '| services:', (j.services || []).length); }
  catch { console.log('NOT JSON:', t.slice(0, 200)); }
}
main().catch((e) => console.error('FAIL', e.message));
