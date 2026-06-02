// =====================================================================
// lib/imageEngine.js  —  Moteur d'images unifié (CommonJS)
// Utilisé par le cron (scripts/update_news.js) ET l'API (pages/api/news.js)
// pour garantir une logique IDENTIQUE (site == base de données).
//
// Chaîne (choix produit) :
//   1. Google Custom Search   (filtré par pertinence)
//   2. Bing Images            (filtré par pertinence)
//   3. Yahoo Images           (filtré par pertinence)
//   4. Index unifié (DDG)     (filtré par pertinence)
//   --- filet de sécurité « images exactes » ---
//   5. Jikan  (anime / manga / séries)
//   6. TMDb   (ciné / séries)
//   7. Wikipedia (franchises connues)
//   8. null  → la page affiche le fond catégorie (jamais d'image fausse)
//
// PRINCIPE CLÉ : mieux vaut PAS d'image (fond catégorie propre) qu'une
// image hors-sujet. Toute image candidate doit « matcher » le sujet.
// =====================================================================

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const IMG_RE = /\.(jpg|jpeg|png|webp)(\?|#|$)/i;

// ---------------------------------------------------------------------
// Outils texte
// ---------------------------------------------------------------------
function deaccent(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function norm(s) {
  return deaccent(String(s || '')).toLowerCase();
}
function unescapeHtml(s) {
  return String(s || '')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Mots « décoratifs » qui ne distinguent pas un sujet d'un autre.
const GENERIC = new Set([
  'official','officiel','officielle','officiels','movie','film','poster','affiche',
  'anime','manga','cover','jaquette','key','visual','keyvisual','product','produit',
  'photo','picture','image','images','watch','montre','set','figure','figurine',
  'blind','box','illustration','illu','art','artwork','fanart','wallpaper','hd','4k',
  'season','saison','serie','series','tv','show','new','collection','collab',
  'collaboration','sneaker','sneakers','edition','vol','tome','chapitre','chapter',
  'the','of','and','for','with','from','les','des','une','sur','par','aux','dans',
  'pour','avec','son','sa','ses','leur','est','que','qui','plus','tout','toute',
  '2023','2024','2025','2026','2027','2028'
]);

// Entités/franchises connues — sert à identifier l'« ancre » forte.
const KNOWN_ENTITIES = [
  'G-SHOCK','Casio','Gundam','RX-78-2','LEGO','Minas Tirith','Lord of the Rings',
  'Demon Slayer','Kimetsu no Yaiba','Mitsuri','Infinity Castle','My Hero Academia',
  'Jujutsu Kaisen','Frieren','Blue Lock','Shangri-La Frontier','My Dress-Up Darling',
  'Toy Story','Spider-Man','Cannes','Japan Expo','Funko','Winnie','Pop Mart',
  'adidas','Uniqlo','Seven Seas','Crunchyroll','Netflix','Solo Leveling',
  'Dragon Quest','Hunter x Hunter','One Piece','Chainsaw Man','Bleach','Naruto',
  'Dragon Ball','Pokemon','Pokémon','Goldorak','Grendizer','Bisounours','Care Bears',
  'SPY x FAMILY','Mashle','Kingdom','Yu-Gi-Oh','Marin Kitagawa','Dimoo','Pixar',
  'Disney','Marvel','Sony','Bandai','Sawako Arashida','Kanehito Yamada'
];

// Requêtes curées pour les sujets « héros » récurrents (très précises).
function curatedQuery(lower) {
  const has = (...w) => w.every(x => lower.includes(x));
  if (lower.includes('goldorak') || lower.includes('grendizer')) return 'Casio G-Shock Goldorak Grendizer GA-110 watch';
  if (lower.includes('g-shock') || has('casio', 'gundam')) return 'Casio G-SHOCK Gundam RX-78-2 DW-5600 watch';
  if (lower.includes('minas tirith') || has('lego', 'lord')) return 'LEGO Minas Tirith 11377 Lord of the Rings set';
  if (lower.includes('mitsuri')) return 'Demon Slayer Mitsuri Kanroji ufotable';
  if (lower.includes('infinity castle')) return 'Demon Slayer Infinity Castle movie';
  if (lower.includes('toy story 5')) return 'Toy Story 5 Pixar movie';
  if (has('spider-man', 'brand new day')) return 'Spider-Man Brand New Day Tom Holland Marvel';
  if (has('blue lock', 'u-20')) return 'Blue Lock VS U-20 Japan anime';
  if (lower.includes('shangri-la frontier')) return 'Shangri-La Frontier Season 2 anime';
  if (has('my hero academia')) return 'My Hero Academia Final Season anime';
  if (lower.includes('jujutsu kaisen')) return 'Jujutsu Kaisen anime';
  if (lower.includes('frieren')) return 'Frieren Beyond Journeys End';
  if (has('uniqlo', 'shueisha')) return 'Uniqlo UT Shueisha manga collection';
  if (lower.includes('care bears') || has('bisounours', 'adidas')) return 'adidas Care Bears collab sneakers';
  if (lower.includes('my dress-up darling') || has('dress', 'darling')) return 'My Dress-Up Darling anime Marin Kitagawa';
  if (has('pop mart', 'disney')) return 'Pop Mart Disney Dimoo blind box figure';
  if (has('cannes', '2026')) return 'Festival de Cannes 2026 palmares';
  if (has('funko', 'winnie')) return 'Funko Pop Winnie the Pooh Disney figure';
  if (lower.includes('japan expo')) return 'Japan Expo Paris manga anime';
  if (lower.includes('seven seas')) return 'Seven Seas Entertainment manga';
  return null;
}

const CAT_SUFFIX = {
  cine:  'official movie poster',
  series:'anime official poster',
  anime: 'anime key visual',
  manga: 'manga cover official',
  collab:'official product photo'
};

// Tokenise en gardant les codes produits (11377) et refs (rx-78-2, u-20).
function tokenize(s) {
  return norm(s)
    .replace(/[^a-z0-9-]+/g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^-+|-+$/g, ''))
    .filter(Boolean);
}

function isAnchorToken(tok) {
  if (!tok) return false;
  if (/\d{3,}/.test(tok)) return true;          // code produit (11377)
  if (/[a-z]-?\d|\d-?[a-z]/.test(tok)) return true; // ref (u-20, rx-78-2)
  if (GENERIC.has(tok)) return false;
  return tok.length >= 3;
}
function isStrongAnchor(tok) {
  return /\d{3,}/.test(tok) || /[a-z]-?\d/.test(tok) || tok.length >= 6;
}

// ---------------------------------------------------------------------
// Contexte de recherche : query précise + ancres de pertinence
// ---------------------------------------------------------------------
function buildSearchContext(title, cat) {
  const lower = norm(title);

  // 1. Entité connue (ancre forte prioritaire)
  let entity = null;
  for (const e of KNOWN_ENTITIES) {
    if (lower.includes(norm(e))) { entity = e; break; }
  }

  // 2. Requête de base
  let baseQuery = curatedQuery(lower);
  if (!baseQuery) {
    const quote = title.match(/[«"“]([^»"”]+)[»"”]/);
    if (quote) {
      baseQuery = quote[1].trim();
    } else if (entity) {
      baseQuery = entity;
    } else {
      // Nettoyage : on retire le verbe d'annonce + on garde le début significatif
      baseQuery = title
        .replace(/^.{0,80}?(dévoile|annonce|lance|publie|présente|sort|rejoint|s['']associe (aux?|à)|entre dans|est disponible|bat|rafle|maintient\s+sa?\s+|sacré|clap de fin pour|marque un|ouvre|offre|signe|confirme|prépare|installe|déploie|acquiert)\s+/i, '')
        .split(/[,:–-]/)[0].trim();
      const words = baseQuery.split(/\s+/);
      if (words.length > 5) baseQuery = words.slice(0, 5).join(' ');
    }
  }

  // 3. Ancres de pertinence (depuis la requête de base + l'entité)
  const anchorSet = new Set();
  for (const t of tokenize(baseQuery)) if (isAnchorToken(t)) anchorSet.add(t);
  if (entity) for (const t of tokenize(entity)) if (isAnchorToken(t)) anchorSet.add(t);
  const anchors = [...anchorSet];

  // 4. Requête « élargie » (avec suffixe catégorie) et requête « ancre » (courte)
  const suffix = CAT_SUFFIX[cat] || '';
  const queryFull = suffix && !norm(baseQuery).includes(norm(suffix.split(' ')[0]))
    ? `${baseQuery} ${suffix}`
    : baseQuery;
  const queryAnchor = (entity ? entity : anchors.slice(0, 3).join(' ')) || baseQuery;

  return { title, cat, entity, baseQuery, queryFull, queryAnchor, anchors };
}

// ---------------------------------------------------------------------
// Scoring de pertinence
// ---------------------------------------------------------------------
// candidate = { image, title, page }
function scoreCandidate(candidate, anchors) {
  if (!candidate || !candidate.image) return 0;
  const hay = norm(`${candidate.title || ''} ${candidate.page || ''} ${candidate.image || ''}`);
  let score = 0, strong = false;
  for (const a of anchors) {
    if (hay.includes(a)) { score++; if (isStrongAnchor(a)) strong = true; }
  }
  // Bonus : une ancre forte vaut une 2e correspondance
  return strong ? score + 1 : score;
}
function isRelevant(candidate, anchors) {
  if (!anchors.length) return false;          // pas d'ancre fiable → on ne risque pas
  const s = scoreCandidate(candidate, anchors);
  // 1 seule ancre dispo : il faut qu'elle matche (score>=1, déjà +1 si forte)
  if (anchors.length === 1) return s >= 1;
  // sinon au moins 2 correspondances (ou 1 forte qui a donné +1 → s>=2)
  return s >= 2;
}
// ---------------------------------------------------------------------
// Validation d'une image EXISTANTE (pour ne pas réintroduire de hors-sujet)
// ---------------------------------------------------------------------
const JUNK_RE = /(porn|xxx|[^a-z]sexe?[^a-z]|escort|casino|viagra|pdffiller|medicaljournal|chosenvoices|quizur|vrporn)/i;
const TRUSTED_HOSTS = [
  'acsta.net', 'sneakers.fr', 'hypb.st', 'media-amazon', 'ssl-images-amazon',
  'zerochan.net', 'picclickimg', 'comicbook', 'marvel.com', 'planetebd',
  'animecorner', 'filmaffinity', 'cloudfront.net', 'etsystatic', 'ebayimg',
  'justwatch', 'fancaps', 'iconik-global', 'otakustudy', 'japan2uk',
  'fullress', 'bbystatic', 'animeesports', 'coyotemag', 'image.tmdb.org',
  'sortiraparis', 'lesechos', 'sneakerwars', 'thebrickfan'
];
function hostOf(url) { try { return new URL(url).hostname; } catch { return ''; } }

// true = on peut garder cette image telle quelle ; false = il faut la re-résoudre
function isAcceptableImage(url, title, cat) {
  if (!url || !/^https?:/i.test(url)) return false;
  if (JUNK_RE.test(url)) return false;                       // NSFW / clairement junk
  const host = hostOf(url);
  if (TRUSTED_HOSTS.some(t => host.includes(t))) return true; // CDN presse/produit fiable
  const { anchors } = buildSearchContext(title, cat);
  return scoreCandidate({ image: url, page: url }, anchors) >= 1; // l'URL contient le sujet
}

// Choisit le meilleur candidat pertinent (score max, puis ordre d'apparition)
function pickRelevant(candidates, anchors) {
  let best = null, bestScore = 0;
  for (const c of candidates) {
    if (!c || !c.image || !IMG_RE.test(c.image)) continue;
    const s = scoreCandidate(c, anchors);
    if (s > bestScore) { bestScore = s; best = c; }
  }
  if (best && isRelevant(best, anchors)) return best.image;
  return null;
}

// ---------------------------------------------------------------------
// Sources « moteurs de recherche » → renvoient des candidats {image,title,page}
// ---------------------------------------------------------------------
async function googleCandidates(query) {
  const key = process.env.GOOGLE_API_KEY, cx = process.env.GOOGLE_CX;
  if (!key || !cx) return [];
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&num=8&imgType=photo&safe=active&key=${key}&cx=${cx}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(i => ({
      image: i.link,
      title: i.title || i.snippet || '',
      page: i.image?.contextLink || i.displayLink || ''
    }));
  } catch (e) { return []; }
}

async function bingCandidates(query) {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&cc=FR&setlang=fr&safeSearch=moderate&first=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7', 'Referer': 'https://www.bing.com/' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out = [];
    for (const m of html.matchAll(/m="(\{[^"]*?&quot;murl&quot;[^"]*?\})"/g)) {
      try {
        const j = JSON.parse(unescapeHtml(m[1]));
        if (j.murl) out.push({ image: j.murl, title: j.t || '', page: j.purl || '' });
      } catch (e) { /* bloc illisible, on continue */ }
    }
    return out;
  } catch (e) { return []; }
}

async function yahooCandidates(query) {
  try {
    const url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}&imgsz=large&ei=UTF-8`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7', 'Referer': 'https://images.search.yahoo.com/' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out = [];
    // Yahoo encode chaque résultat en JSON : {"iurl":"img","rurl":"page","tit":"titre",...}
    for (const m of html.matchAll(/\{[^{}]*?"(?:iurl|ou)":"https?:[^{}]*?\}/g)) {
      const blk = m[0];
      const img = (blk.match(/"(?:iurl|ou)":"(https?:\/\/[^"]+?)"/) || [])[1];
      if (!img) continue;
      const tit = (blk.match(/"(?:tit|alt|t)":"([^"]{2,120}?)"/) || [])[1] || '';
      const page = (blk.match(/"(?:rurl|rl)":"(https?:\/\/[^"]+?)"/) || [])[1] || '';
      out.push({ image: img.replace(/\\/g, ''), title: unescapeHtml(tit), page: page.replace(/\\/g, '') });
    }
    return out;
  } catch (e) { return []; }
}

async function ddgCandidates(query) {
  try {
    const htmlRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000)
    });
    if (!htmlRes.ok) return [];
    const html = await htmlRes.text();
    const vqd = (html.match(/vqd=([0-9-]+)/) || [])[1];
    if (!vqd) return [];
    const jsonRes = await fetch(`https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
      headers: { 'User-Agent': UA, 'Referer': 'https://duckduckgo.com/' }, signal: AbortSignal.timeout(6000)
    });
    if (!jsonRes.ok) return [];
    const data = await jsonRes.json();
    return (data.results || []).map(r => ({
      image: r.image, title: r.title || '', page: r.url || r.source || ''
    }));
  } catch (e) { return []; }
}

// ---------------------------------------------------------------------
// Sources « exactes » (filet) → renvoient une URL si le titre matche l'ancre
// ---------------------------------------------------------------------
function anchorScore(text, anchors) {
  const hay = norm(text);
  let s = 0, strong = false;
  for (const a of anchors) if (hay.includes(a)) { s++; if (isStrongAnchor(a)) strong = true; }
  return strong ? s + 1 : s;
}
function titleMatchesAnchors(resultTitle, anchors) {
  return anchorScore(resultTitle, anchors) >= 1; // sources exactes déjà ciblées
}
// Parmi des items, renvoie celui dont le texte matche le MIEUX les ancres (préfère le plus spécifique)
function bestByAnchor(items, getText, anchors) {
  let best = null, bestS = 0;
  for (const it of items) {
    const s = anchorScore(getText(it), anchors);
    if (s > bestS) { bestS = s; best = it; }
  }
  return bestS >= 1 ? best : null;
}

async function jikanImage(ctx) {
  if (!['anime', 'manga', 'series'].includes(ctx.cat)) return null;
  const q = ctx.baseQuery || ctx.queryAnchor;
  try {
    for (const type of ['anime', 'manga']) {
      const url = `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(q)}&limit=5&order_by=popularity&sort=asc`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.data || []).filter(it => it.images?.jpg?.large_image_url || it.images?.jpg?.image_url);
      const best = bestByAnchor(items,
        it => `${it.title || ''} ${it.title_english || ''} ${(it.titles || []).map(x => x.title).join(' ')}`,
        ctx.anchors);
      if (best) return best.images.jpg.large_image_url || best.images.jpg.image_url;
    }
  } catch (e) { /* silencieux */ }
  return null;
}

async function tmdbImage(ctx) {
  if (!['cine', 'series', 'anime'].includes(ctx.cat)) return null;
  const q = ctx.baseQuery || ctx.queryAnchor;
  try {
    const key = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
    for (const type of ['movie', 'tv']) {
      const url = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(q)}&language=fr-FR`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.results || []).filter(r => r.poster_path);
      const best = bestByAnchor(items,
        r => `${r.title || ''} ${r.name || ''} ${r.original_title || ''} ${r.original_name || ''}`,
        ctx.anchors);
      if (best) return `https://image.tmdb.org/t/p/w500${best.poster_path}`;
    }
  } catch (e) { /* silencieux */ }
  return null;
}

async function wikipediaImage(ctx) {
  const q = ctx.baseQuery || ctx.queryAnchor;
  try {
    const sRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=1&format=json&origin=*`, { signal: AbortSignal.timeout(7000) });
    if (!sRes.ok) return null;
    const sData = await sRes.json();
    const pageTitle = sData.query?.search?.[0]?.title;
    if (!pageTitle || !titleMatchesAnchors(pageTitle, ctx.anchors)) return null;
    const dRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, { signal: AbortSignal.timeout(7000) });
    if (!dRes.ok) return null;
    const d = await dRes.json();
    return d.thumbnail?.source || d.originalimage?.source || null;
  } catch (e) { return null; }
}

// ---------------------------------------------------------------------
// Orchestrateur principal
// ---------------------------------------------------------------------
async function getBestImage(title, cat, opts = {}) {
  const log = opts.log ? (m) => console.log(m) : () => {};
  const ctx = buildSearchContext(title, cat);
  log(`[img] "${title}"`);
  log(`[img]   query="${ctx.queryFull}" | base="${ctx.baseQuery}" | anchors=[${ctx.anchors.join(', ')}]`);

  const engines = [
    ['Google', googleCandidates],
    ['Bing',   bingCandidates],
    ['Yahoo',  yahooCandidates],
    ['DDG',    ddgCandidates]
  ];

  // Passe 1 — requête précise (avec suffixe catégorie) sur Google→Bing→Yahoo→DDG (ordre demandé)
  for (const [name, fn] of engines) {
    const img = pickRelevant(await fn(ctx.queryFull), ctx.anchors);
    if (img) { log(`[img]   ✅ ${name} (précise) → ${img}`); return img; }
  }

  // Passe 2 — requête sans suffixe (souvent plus efficace) sur les moteurs riches
  if (ctx.baseQuery && ctx.baseQuery !== ctx.queryFull) {
    for (const [name, fn] of [['Bing', bingCandidates], ['DDG', ddgCandidates]]) {
      const img = pickRelevant(await fn(ctx.baseQuery), ctx.anchors);
      if (img) { log(`[img]   ✅ ${name} (base) → ${img}`); return img; }
    }
  }

  // Passe 3 — filet « images exactes » (affiches/jaquettes officielles)
  for (const [name, fn] of [['Jikan', jikanImage], ['TMDb', tmdbImage], ['Wikipedia', wikipediaImage]]) {
    const img = await fn(ctx);
    if (img) { log(`[img]   ✅ ${name} (exact) → ${img}`); return img; }
  }

  log(`[img]   ⚠️ aucune image pertinente → fond catégorie`);
  return null;
}

module.exports = {
  getBestImage,
  isAcceptableImage,
  buildSearchContext,
  scoreCandidate,
  isRelevant,
  pickRelevant,
  // exposé pour tests
  _sources: { googleCandidates, bingCandidates, yahooCandidates, ddgCandidates, jikanImage, tmdbImage, wikipediaImage }
};
