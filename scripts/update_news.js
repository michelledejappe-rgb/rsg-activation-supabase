const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// =========================================================
// Chargement .env.local
// =========================================================
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    if (line.trim().startsWith('#') || !line.includes('=')) return;
    const [key, ...rest] = line.split('=');
    let v = rest.join('=').trim().replace(/^["']|["']$/g, '');
    process.env[key.trim()] = v;
  });
}

loadEnv();

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || null;
const GOOGLE_CX      = process.env.GOOGLE_CX || null;
const TMDB_API_KEY   = process.env.TMDB_API_KEY || null;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Cron] Variables Supabase manquantes.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================
// Lecture du payload le plus récent (Recherche hybride)
// =========================================================
function getLatestPayload() {
  let files = [];

  // 1. Recherche dans la racine du projet (idéal pour GitHub Actions et dépôts propres)
  const projectRoot = path.join(__dirname, '..');
  if (fs.existsSync(projectRoot)) {
    const projectFiles = fs.readdirSync(projectRoot)
      .filter(f => f.startsWith('_qg_payload_') && f.endsWith('.json'))
      .map(f => ({ path: path.join(projectRoot, f), f, mtime: fs.statSync(path.join(projectRoot, f)).mtimeMs }));
    files = [...files, ...projectFiles];
  }

  // 2. Recherche dans le dossier parent (Downloads local) pour compatibilité historique
  const parentDir = path.join(__dirname, '../..');
  if (fs.existsSync(parentDir)) {
    const parentFiles = fs.readdirSync(parentDir)
      .filter(f => f.startsWith('_qg_payload_') && f.endsWith('.json'))
      .map(f => ({ path: path.join(parentDir, f), f, mtime: fs.statSync(path.join(parentDir, f)).mtimeMs }));
    files = [...files, ...parentFiles];
  }

  if (!files.length) {
    console.warn('[Cron] Aucun payload trouvé.');
    return null;
  }

  // Trier par nom de fichier de manière décroissante pour garantir un ordre stable et robuste (indépendant des dates de checkout Git)
  files.sort((a, b) => b.f.localeCompare(a.f));
  
  console.log(`[Cron] Payload retenu : ${files[0].f} (Chemin: ${files[0].path})`);
  return files[0].path;
}

// =========================================================
// Extraction du contexte de recherche depuis le titre
// Retourne { query, entity, cat, isAnime, isCine, isCollab }
// =========================================================
function analyzeTitle(title, cat) {
  const t = title.toLowerCase();

  const isAnime   = cat === 'anime' || cat === 'manga' || cat === 'series';
  const isCine    = cat === 'cine';
  const isCollab  = cat === 'collab';

  // Extraction de l'entité principale (marque, titre, franchise)
  // On cherche les noms propres et franchises connues
  let entity = null;
  const knownEntities = [
    'G-SHOCK', 'Casio', 'Gundam', 'RX-78-2',
    'LEGO', 'Minas Tirith', 'Lord of the Rings',
    'Demon Slayer', 'Kimetsu no Yaiba', 'Mitsuri', 'Infinity Castle',
    'My Hero Academia', 'Jujutsu Kaisen', 'Frieren',
    'Blue Lock', 'Shangri-La Frontier', 'My Dress-Up Darling',
    'Toy Story', 'Spider-Man', 'Cannes', 'Japan Expo',
    'Funko', 'Winnie', 'Pop Mart', 'adidas', 'Uniqlo',
    'Seven Seas', 'Crunchyroll', 'Netflix', 'Solo Leveling'
  ];
  for (const e of knownEntities) {
    if (t.includes(e.toLowerCase())) { entity = e; break; }
  }

  // Construction de la requête de recherche
  let query = entity || title.split(/[,:–]/).shift().trim();

  // Spécialisation par contexte
  if (t.includes('goldorak') || t.includes('grendizer')) query = 'Casio G-Shock Goldorak U GA-110 Grendizer watch';
  else if (t.includes('g-shock') && t.includes('gundam')) query = 'Casio G-SHOCK Gundam RX-78-2 DW-5600 2026';
  else if (t.includes('minas tirith')) query = 'LEGO Minas Tirith 11377 Lord of the Rings 2026';
  else if (t.includes('mitsuri')) query = 'Demon Slayer Mitsuri Kanroji ufotable';
  else if (t.includes('infinity castle')) query = 'Demon Slayer Infinity Castle movie';
  else if (t.includes('toy story 5')) query = 'Toy Story 5 Pixar 2026';
  else if (t.includes('spider-man') && t.includes('brand new day')) query = 'Spider-Man Brand New Day 2026';
  else if (t.includes('blue lock') && t.includes('u-20')) query = 'Blue Lock VS U-20 JAPAN anime';
  else if (t.includes('shangri-la frontier')) query = 'Shangri-La Frontier Season 2 anime';
  else if (t.includes('my hero academia')) query = 'My Hero Academia Final Season';
  else if (t.includes('jujutsu kaisen')) query = 'Jujutsu Kaisen Season 2';
  else if (t.includes('frieren')) query = 'Frieren Beyond Journey End';
  else if (t.includes('uniqlo') && t.includes('shueisha')) query = 'Uniqlo UT Shueisha manga collection 2026';
  else if (t.includes('care bears') || (t.includes('bisounours') && t.includes('adidas'))) query = 'adidas Care Bears Samba 2026';
  else if (t.includes('dress-up darling') || t.includes('marin kitagawa')) query = 'My Dress-Up Darling Season 2';
  else if (t.includes('pop mart') && t.includes('disney')) query = 'Pop Mart Disney Dimoo 2026';
  else if (t.includes('cannes') && t.includes('2026')) query = 'Cannes 2026 film festival';
  else if (t.includes('funko') && t.includes('winnie')) query = 'Funko Pop Winnie the Pooh Disney';
  else if (t.includes('japan expo')) query = 'Japan Expo 2026 Paris';
  else if (t.includes('seven seas')) query = 'Seven Seas Entertainment manga';
  else if (t.includes('milky') && t.includes('subway')) query = 'Galactic Express anime Netflix';

  return { query, entity, cat, isAnime, isCine, isCollab };
}

// =========================================================
// Source 1 — Google Custom Search API (si clés dispo)
// Gratuit : 100 requêtes/jour
// =========================================================
async function fetchFromGoogleAPI(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) return null;
  try {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&num=5&imgType=photo&safe=active&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const img  = data.items?.find(i => /\.(jpg|jpeg|png|webp)/i.test(i.link))?.link;
    if (img) { console.log(`[Cron Image] ✅ Google API → ${img}`); return img; }
  } catch (e) { console.warn(`[Cron Image] Google API : ${e.message}`); }
  return null;
}

// =========================================================
// Source 1b — Moteur de recherche Bing & Yahoo (Direct scraping + Index fallback unifié)
// =========================================================
async function fetchFromBingYahoo(query) {
  // --- ÉTAPE 1 : Recherche Directe sur Bing Images (Index Bing) ---
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&cc=FR&setlang=fr&safeSearch=moderate&first=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.bing.com/',
        'Cache-Control': 'max-age=0'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const html = await res.text();
      const murlRegex = /&quot;murl&quot;:&quot;(https?:\/\/[^&"]+?)&quot;/g;
      const matches = [...html.matchAll(murlRegex)].map(m => m[1]);
      if (matches.length > 0) {
        const img = matches.find(u => /\.(jpg|jpeg|png|webp)/i.test(u));
        if (img) {
          console.log(`[Cron Image] ✅ Bing Images Direct → ${img}`);
          return img;
        }
      }
    }
  } catch (e) {
    console.warn(`[Cron Image] Échec direct Bing Images: ${e.message}`);
  }

  // --- ÉTAPE 2 : Recherche Directe sur Yahoo Images (Index Yahoo) ---
  try {
    const url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}&imgsz=large`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://images.search.yahoo.com/'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const html = await res.text();
      const ouMatches = [...html.matchAll(/"ou":"(https?:\/\/[^"]+?)"/g)].map(m => m[1]);
      const iurlMatches = [...html.matchAll(/"iurl":"(https?:\/\/[^"]+?)"/g)].map(m => m[1].replace(/\\/g, ''));
      const combined = [...ouMatches, ...iurlMatches];
      if (combined.length > 0) {
        const img = combined.find(u => /\.(jpg|jpeg|png|webp)/i.test(u));
        if (img) {
          console.log(`[Cron Image] ✅ Yahoo Images Direct → ${img}`);
          return img;
        }
      }
    }
  } catch (e) {
    console.warn(`[Cron Image] Échec direct Yahoo Images: ${e.message}`);
  }

  // --- ÉTAPE 3 : Index unifié Bing & Yahoo (Fallback de secours résilient) ---
  try {
    const htmlUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const resHtml = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!resHtml.ok) throw new Error(`HTML HTTP ${resHtml.status}`);
    const html = await resHtml.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    if (!vqdMatch) throw new Error('VQD token non trouvé');
    const vqd = vqdMatch[1];

    const jsonUrl = `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const resJson = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!resJson.ok) throw new Error(`JSON HTTP ${resJson.status}`);
    const data = await resJson.json();
    if (data.results && data.results.length > 0) {
      const img = data.results.find(i => /\.(jpg|jpeg|png|webp)/i.test(i.image))?.image;
      if (img) {
        console.log(`[Cron Image] ✅ Index Bing & Yahoo unifié (DDG fallback) → ${img}`);
        return img;
      }
    }
  } catch (e) {
    console.warn(`[Cron Image] Échec Index unifié Bing & Yahoo: ${e.message}`);
  }
  return null;
}


// =========================================================
// Source 2 — Jikan API (MyAnimeList, sans clé)
// Parfait pour anime, manga, séries animées
// Rate limit : 3 req/sec — on est largement en dessous
// =========================================================
async function fetchFromJikan(query) {
  try {
    // Essayer en tant qu'anime d'abord
    let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1&order_by=popularity&sort=asc`;
    let res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const img  = data.data?.[0]?.images?.jpg?.large_image_url;
      if (img) { console.log(`[Cron Image] ✅ Jikan (anime) → ${img}`); return img; }
    }
    // Essayer en tant que manga
    url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1&order_by=popularity&sort=asc`;
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const img  = data.data?.[0]?.images?.jpg?.large_image_url;
      if (img) { console.log(`[Cron Image] ✅ Jikan (manga) → ${img}`); return img; }
    }
  } catch (e) { console.warn(`[Cron Image] Jikan : ${e.message}`); }
  return null;
}

// =========================================================
// Source 3 — TMDb API (The Movie Database, clé optionnelle)
// Gratuit avec clé sur themoviedb.org
// Fallback sur l'endpoint public sans clé pour les recherches simples
// =========================================================
async function fetchFromTMDb(query) {
  try {
    const key = TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d'; // clé demo publique (limitée)
    // Chercher d'abord en tant que film
    let url  = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&language=fr-FR`;
    let res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data   = await res.json();
      const poster = data.results?.[0]?.poster_path;
      if (poster) {
        const img = `https://image.tmdb.org/t/p/w500${poster}`;
        console.log(`[Cron Image] ✅ TMDb (movie) → ${img}`);
        return img;
      }
    }
    // Chercher en tant que série TV
    url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(query)}&language=fr-FR`;
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data   = await res.json();
      const poster = data.results?.[0]?.poster_path;
      if (poster) {
        const img = `https://image.tmdb.org/t/p/w500${poster}`;
        console.log(`[Cron Image] ✅ TMDb (TV) → ${img}`);
        return img;
      }
    }
  } catch (e) { console.warn(`[Cron Image] TMDb : ${e.message}`); }
  return null;
}

// =========================================================
// Source 4 — Wikipedia REST API (thumbnail de page)
// Extrêmement fiable pour les franchises connues, sans clé
// =========================================================
async function fetchFromWikipedia(query) {
  try {
    // Étape 1 : Trouver le titre exact de l'article Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(7000) });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const pageTitle  = searchData.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    // Étape 2 : Récupérer le thumbnail via l'API REST Wikipedia
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(7000) });
    if (!summaryRes.ok) return null;
    const summary = await summaryRes.json();

    const img = summary.thumbnail?.source || summary.originalimage?.source;
    if (img) { console.log(`[Cron Image] ✅ Wikipedia (${pageTitle}) → ${img}`); return img; }
  } catch (e) { console.warn(`[Cron Image] Wikipedia : ${e.message}`); }
  return null;
}

// =========================================================
// Source 5 — Wikimedia Commons (filtré : images uniquement)
// =========================================================
async function fetchFromWikimedia(query) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results    = searchData.query?.search || [];

    // Filtrer les résultats : on veut uniquement des fichiers images (pas PDF, OGV, WEBM, SVG)
    const imageResults = results.filter(r => {
      const lower = r.title.toLowerCase();
      return (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp'))
        && !lower.includes('.pdf') && !lower.includes('.svg') && !lower.includes('.ogv') && !lower.includes('.webm');
    });

    if (!imageResults.length) return null;

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageResults[0].title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(6000) });
    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const url = Object.values(infoData.query?.pages || {})[0]?.imageinfo?.[0]?.url;
    if (url) { console.log(`[Cron Image] ✅ Wikimedia Commons → ${url}`); return url; }
  } catch (e) { console.warn(`[Cron Image] Wikimedia : ${e.message}`); }
  return null;
}

// =========================================================
// Moteur principal — Chaîne de sources par priorité
// =========================================================
async function getExactImage(title, cat) {
  const { query } = analyzeTitle(title, cat);
  console.log(`[Cron Image] Recherche pour : "${title}"`);
  console.log(`[Cron Image] Requête : "${query}" | cat: ${cat}`);

  // 1. Google Custom Search API (si débloqué)
  const googleImg = await fetchFromGoogleAPI(query);
  if (googleImg) return googleImg;

  // 2. Moteur de recherche Bing & Yahoo (100% gratuit et sans clé d'API)
  const ddgImg = await fetchFromBingYahoo(query);
  if (ddgImg) return ddgImg;

  // null → le Story template utilise le design prestige
  console.warn(`[Cron Image] ⚠️ Aucune image trouvée via Google pour : "${title}"`);
  return null;
}

// =========================================================
// Boucle principale du cron
// =========================================================
// =========================================================
// Récupération des flux de presse RSS (Actualisation 100% autonome sans fichiers)
// =========================================================
async function fetchRSSNews() {
  const feeds = [
    { url: "https://www.manga-news.com/index.php/feed/news", cat: "manga", defaultEmoji: "📖" },
    { url: "https://www.allocine.fr/rss/news.xml", cat: "cine", defaultEmoji: "🎬" },
    { url: "https://hypebeast.com/feed", cat: "collab", defaultEmoji: "🧸" }
  ];
  
  const rssNews = [];
  console.log("[RSS] Récupération des actualités en direct des flux de presse...");
  
  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      
      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      let count = 0;
      
      while ((match = itemRegex.exec(xml)) !== null && count < 6) {
        const itemContent = match[1];
        
        const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        
        let img = null;
        const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)["']/);
        const mediaMatch = itemContent.match(/<media:content[^>]+url=["'](https?:\/\/[^"']+)["']/);
        
        if (enclosureMatch) img = enclosureMatch[1];
        else if (mediaMatch) img = mediaMatch[1];
        else if (descMatch) {
          const imgInDesc = descMatch[1].match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/);
          if (imgInDesc) img = imgInDesc[1];
        }
        
        const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<!\[CDATA\[|\]\]>/g, '') : '';
        let desc = descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<!\[CDATA\[|\]\]>/g, '') : '';
        if (desc.length > 250) desc = desc.slice(0, 247) + '...';
        
        if (!title || !desc) continue;
        
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();
        
        // Formater date_str
        const dayStr = new Date(pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const sourceLabel = feed.url.includes('allocine') ? 'AlloCiné' : feed.url.includes('manga-news') ? 'MangaNews' : 'Hypebeast';
        
        rssNews.push({
          cat: feed.cat,
          emoji: feed.defaultEmoji,
          date_str: `${dayStr} · ${sourceLabel}`,
          title: title.slice(0, 150),
          text: desc,
          hot: count === 0,
          img: img || null,
          published_at: pubDate
        });
        count++;
      }
    } catch (e) {
      console.warn(`[RSS] Impossible de lire le flux ${feed.url}: ${e.message}`);
    }
  }
  
  console.log(`[RSS] ${rssNews.length} actualités presse récupérées avec succès !`);
  return rssNews;
}

// =========================================================
// Boucle principale du cron
// =========================================================
async function run() {
  const payloadPath = getLatestPayload();
  let payloadNews = [];
  if (payloadPath) {
    try {
      const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
      if (Array.isArray(payload.news)) {
        payloadNews = payload.news;
      }
    } catch (e) {
      console.warn('[Cron] Impossible de lire le payload local:', e.message);
    }
  }

  // 1. Récupérer les flux RSS presse en temps réel pour actualisation automatique 100% autonome
  let rssNews = [];
  try {
    rssNews = await fetchRSSNews();
  } catch (err) {
    console.error('[Cron] Erreur lors de la récupération des flux RSS :', err.message);
  }

  // 2. Fusionner les actualités (les flux RSS d'abord pour avoir la fraîcheur absolue)
  const allNewsRaw = [...rssNews, ...payloadNews];
  
  // Dédoublonner par titre pour éviter les doublons lors des runs successifs
  const uniqueTitles = new Set();
  const allNewsFiltered = [];
  for (const item of allNewsRaw) {
    if (!item.title) continue;
    const cleanTitle = item.title.trim().toLowerCase();
    if (!uniqueTitles.has(cleanTitle)) {
      uniqueTitles.add(cleanTitle);
      allNewsFiltered.push(item);
    }
  }

  console.log(`[Cron] ${allNewsFiltered.length} actualités totales à traiter (dont ${rssNews.length} issues de flux RSS)... \n`);

  const newsToUpsert = [];
  for (let i = 0; i < allNewsFiltered.length; i++) {
    const item = allNewsFiltered[i];
    const publishedAt = item.published_at || new Date(Date.now() - i * 30 * 60 * 1000).toISOString();

    const forceUpdate = process.argv.includes('--force');
    const existingImg = (!forceUpdate && item.img?.startsWith('http')) ? item.img : null;
    let img = existingImg;

    if (!existingImg) {
      img = await getExactImage(item.title, item.cat);
      // Pause entre les requêtes pour respecter les rate limits
      await new Promise(r => setTimeout(r, 800));
    } else {
      console.log(`[Cron] [${i + 1}/${allNewsFiltered.length}] Image déjà présente ✓`);
    }

    newsToUpsert.push({
      cat:          item.cat || 'cine',
      emoji:        item.emoji || '📰',
      date_str:     item.date_str || item.date || 'Récemment',
      title:        item.title,
      text:         item.text,
      hot:          !!item.hot,
      img,
      published_at: publishedAt
    });
  }

  // Sauvegarde locale dans le dernier payload (uniquement pour les news statiques de structure)
  if (payloadPath) {
    try {
      const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
      fs.writeFileSync(payloadPath, JSON.stringify({ ...payload, news: newsToUpsert.filter(n => !n.date_str.includes('AlloCiné') && !n.date_str.includes('MangaNews') && !n.date_str.includes('Hypebeast')) }, null, 2));
      console.log(`\n[Cron] Payload local mis à jour.`);
    } catch (e) {
      console.error('[Cron] Erreur écriture payload :', e.message);
    }
  }

  // Sync Supabase
  try {
    const { error } = await supabase.from('news').upsert(newsToUpsert, { onConflict: 'title' });
    if (error) throw error;
    console.log(`[Cron] ✅ Supabase synchronisé (${newsToUpsert.length} actus, dont RSS et Payloads)`);
  } catch (e) {
    console.warn(`[Cron] ⚠️ Supabase inaccessible : ${e.message}`);
  }
}

run();
