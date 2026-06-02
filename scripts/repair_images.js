// =====================================================================
// scripts/repair_images.js
// Répare les images HORS-SUJET déjà présentes dans Supabase.
//   - GARDE  : images de sources presse / CDN fiables, ou dont l'URL
//              contient clairement le sujet (ancre).
//   - REMPLACE : domaines junk/NSFW, ou URL sans aucun rapport,
//              via le moteur de pertinence (lib/imageEngine).
//
// Usage :
//   node scripts/repair_images.js          → SIMULATION (n'écrit rien)
//   node scripts/repair_images.js --apply  → applique les corrections
// =====================================================================
const path = require('path'); const fs = require('fs');
(function () {
  const p = path.join(__dirname, '../.env.local');
  if (fs.existsSync(p)) fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach(l => {
    if (l.trim().startsWith('#') || !l.includes('=')) return;
    const [k, ...r] = l.split('='); process.env[k.trim()] = r.join('=').trim().replace(/^["']|["']$/g, '');
  });
})();

const { createClient } = require('@supabase/supabase-js');
const { getBestImage, buildSearchContext, scoreCandidate } = require('../lib/imageEngine');

const APPLY = process.argv.includes('--apply');

// Domaines clairement inacceptables → toujours remplacer
const JUNK_RE = /(porn|xxx|[^a-z]sexe?[^a-z]|escort|casino|viagra|pdffiller|medicaljournal|chosenvoices|quizur|vrporn)/i;

// CDN/sources fiables (presse, produits, posters) → garder même sans ancre dans l'URL
const TRUSTED = [
  'acsta.net', 'sneakers.fr', 'hypb.st', 'media-amazon', 'ssl-images-amazon',
  'zerochan.net', 'picclickimg', 'comicbook', 'marvel.com', 'planetebd',
  'animecorner', 'filmaffinity', 'cloudfront.net', 'etsystatic', 'ebayimg',
  'justwatch', 'fancaps', 'iconik-global', 'otakustudy', 'japan2uk',
  'fullress', 'bbystatic', 'animeesports', 'coyotemag', 'image.tmdb.org',
  'static.animecorner', 'd28hgpri8am2if'
];

function hostOf(url) { try { return new URL(url).hostname; } catch { return ''; } }

function classify(item) {
  const url = item.img || '';
  if (!url.startsWith('http')) return { decision: 'RESOLVE', reason: 'img manquante' };
  if (JUNK_RE.test(url)) return { decision: 'RESOLVE', reason: 'domaine junk/NSFW' };
  const host = hostOf(url);
  if (TRUSTED.some(t => host.includes(t))) return { decision: 'KEEP', reason: 'CDN fiable' };
  const { anchors } = buildSearchContext(item.title, item.cat);
  const sc = scoreCandidate({ image: url, title: '', page: url }, anchors);
  if (sc >= 1) return { decision: 'KEEP', reason: `URL contient le sujet (score ${sc})` };
  return { decision: 'RESOLVE', reason: `domaine inconnu + URL hors-sujet (host ${host})` };
}

// petit pool de concurrence
async function pool(items, n, worker) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await worker(items[idx], idx); }
  }));
  return out;
}

(async () => {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await sb.from('news').select('id,cat,title,img').order('published_at', { ascending: false });
  if (error) { console.error('ERREUR Supabase:', error.message); process.exit(1); }

  console.log(`\n${data.length} news. Mode : ${APPLY ? 'APPLICATION ✍️' : 'SIMULATION 👀'}\n`);

  const toResolve = [];
  for (const item of data) {
    const c = classify(item);
    if (c.decision === 'KEEP') {
      console.log(`  ✅ GARDE   [${(item.cat||'?').padEnd(6)}] ${item.title.slice(0, 50).padEnd(50)} (${c.reason})`);
    } else {
      toResolve.push({ item, reason: c.reason });
    }
  }

  console.log(`\n— ${toResolve.length} image(s) à ré-résoudre via le moteur —\n`);

  const results = await pool(toResolve, 4, async ({ item, reason }) => {
    const newImg = await getBestImage(item.title, item.cat);
    return { item, reason, newImg };
  });

  let replaced = 0, toBg = 0;
  for (const { item, reason, newImg } of results) {
    const oldHost = hostOf(item.img) || '(vide)';
    if (newImg) {
      replaced++;
      console.log(`  🔄 REMPLACE [${(item.cat||'?').padEnd(6)}] ${item.title.slice(0, 46).padEnd(46)}`);
      console.log(`             ${oldHost}  →  ${hostOf(newImg)}   (${reason})`);
    } else {
      toBg++;
      console.log(`  🎨 FOND CAT [${(item.cat||'?').padEnd(6)}] ${item.title.slice(0, 46).padEnd(46)} (ex: ${oldHost} — rien de fiable trouvé)`);
    }
    if (APPLY) {
      const { error: uErr } = await sb.from('news').update({ img: newImg }).eq('id', item.id);
      if (uErr) console.log(`     ⚠️ échec update: ${uErr.message}`);
    }
  }

  console.log(`\n=== Bilan : ${replaced} remplacée(s), ${toBg} → fond catégorie, ${data.length - toResolve.length} gardée(s) ===`);
  console.log(APPLY ? 'Corrections APPLIQUÉES dans Supabase.' : 'Simulation terminée. Relancer avec --apply pour écrire.');
})();
