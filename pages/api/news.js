import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import imageEngine from '../../lib/imageEngine.js';
const { getBestImage } = imageEngine;

// =========================================================
const FALLBACK_NEWS = [
  {
    cat: "collab",
    emoji: "🏰",
    date_str: "1er Juin 2026 · Retail",
    hot: true,
    img: "https://bricks-radar.com/wp-content/uploads/2026/03/lego-minas-tirith-set-leak.jpg",
    title: "LEGO lance Minas Tirith en avant-première Insiders ce 1er juin",
    text: "LEGO ouvre ce matin les ventes de son set Lord of the Rings 'Minas Tirith' (11 377 pièces) pour ses membres Insiders. Le set exclusif promotionnel 'Grond' offert suscite une ruée sans précédent chez les collectionneurs adultes. Ruptures de stocks attendues avant ce soir en ligne."
  },
  {
    cat: "collab",
    emoji: "👕",
    date_str: "1er Juin 2026 · Streetwear",
    hot: true,
    img: "https://image-cdn.hypb.st/https://hypebeast.com/image/2026/01/15/shueisha-100th-anniversary-uniqlo-ut-collaboration-collection-release-info-t-shirts-manga-jujutsu-kaisen-kingdom-rurouni-kenshin-hunterxhunter-001.jpg?q=75&w=800&cbr=1&fit=max",
    title: "Uniqlo UT dévoile sa Vague 3 Shueisha (Bleach, SPY x FAMILY, Mashle)",
    text: "Le géant du retail Uniqlo vient d'annoncer officiellement le troisième drop de sa collection monumentale Shueisha 100th UT. Prévue pour août, cette vague intègre Bleach, Mashle, SPY×FAMILY et Yu-Gi-Oh!. Un booster de trafic majeur pour le textile jeune adulte."
  },
  {
    cat: "anime",
    emoji: "🌸",
    date_str: "1er Juin 2026 · Fandom",
    hot: false,
    img: "https://static.zerochan.net/Kanroji.Mitsuri.full.3925410.jpg",
    title: "Demon Slayer : ufotable publie un visuel inédit de Mitsuri Kanroji",
    text: "Pour célébrer l'anniversaire du Pilier de l'Amour ce 1er juin, ufotable partage une illustration inédite. Le post suscite un engagement colossal, les fabricants de collectibles anticipent un pic de ventes sur les figurines de la licence ce mois-ci."
  },
  {
    cat: "series",
    emoji: "🚇",
    date_str: "1er Juin 2026 · Streaming",
    hot: false,
    img: "https://image.tmdb.org/t/p/original/uRQalzrXA5OTI6dDDi4eqrpIzbN.jpg",
    title: "Le film Milky☆Subway : The Galactic Limited Express rejoint Netflix",
    text: "Netflix surprend la fanbase de science-fiction rétro en ajoutant ce 1er juin le long-métrage Milky☆Subway. Une arrivée stratégique pour la plateforme qui continue de muscler ses droits exclusifs face à la concurrence de Crunchyroll."
  },
  {
    cat: "manga",
    emoji: "💔",
    date_str: "31 Mai 2026 · Édition",
    hot: false,
    img: "https://static.planetebd.com/dynamicImages/album/cover/large/59/57/album-cover-large-59571.jpg",
    title: "Clap de fin pour le manga 'La Belle et le Badass' de Sawako Arashida",
    text: "Le dernier chapitre est paru hier au Japon, bouclant cette comédie romantique plébiscitée. Le tome 6 final sortira le 15 juin. Les réseaux de librairies s'attendent à un trafic massif pour cette licence très vendeuse en rayon Shojo."
  },
  {
    cat: "series",
    emoji: "🏆",
    date_str: "30 Mai 2026 · Tokyo",
    hot: true,
    img: "https://cdn.anime-planet.com/anime/primary/my-hero-academia-final-season-1.webp?t=1728743673",
    title: "My Hero Academia bat Solo Leveling et rafle l'Anime of the Year 2026",
    text: "La conclusion de la saga MHA a été couronnée reine de l'année aux Crunchyroll Anime Awards à Tokyo suite à un vote record de 73 millions de fans. Une consécration commerciale ultime pour la franchise de Shueisha et ses licenciés."
  },
  {
    cat: "cine",
    emoji: "⚔️",
    date_str: "30 Mai 2026 · Box-Office",
    hot: false,
    img: "https://comicbook.com/wp-content/uploads/sites/4/2025/06/Demon-Slayer-Infinity-Castle-Movie-Poster.jpg?resize=212",
    title: "Demon Slayer : Infinity Castle sacré Film de l'Année 2026",
    text: "L'arc final en trilogie décroche le prix suprême. L'annonce booste la valorisation des droits de merchandising, les géants français du retail (FNAC, Micromania) préparent des corners physiques pour tout l'été."
  },
  {
    cat: "manga",
    emoji: "⚔️",
    date_str: "31 Mai 2026 · Édition",
    hot: false,
    img: "https://static.animecorner.me/2025/03/1741090910-52c5b2e678a561df8a447cfe8f36e26e.jpg",
    title: "Le manga 'I Left My A-Rank Party' entre officiellement dans son arc final",
    text: "Kodansha confirme l'entrée dans la phase finale avec le chapitre 165. Un jalon important pour ce manga de fantasy qui cartonne en édition. Les distributeurs planifient déjà des réimpressions collectors de fin de parcours."
  },
  {
    cat: "collab",
    emoji: "⌚",
    date_str: "29 Mai 2026 · Horlogerie",
    hot: false,
    img: "https://www.picclickimg.com/uooAAOSwCMtadqBK/Casio-G-Shock-RX-78-2-Gundam-30th-Anniversary-DW-5600VT-EMS.webp",
    title: "Casio dévoile une montre G-SHOCK exclusive inspirée de Gundam",
    text: "Un modèle premium collector aux couleurs du robot RX-78-2. Ce partenariat à fort impact lifestyle est déjà en rupture sur les précommandes. Une preuve de plus de la force du cross-licensing de luxe auprès des jeunes actifs."
  },
  {
    cat: "collab",
    emoji: "🧸",
    date_str: "31 Mai 2026 · Collectibles",
    hot: false,
    img: "https://m.media-amazon.com/images/I/71rH-HH8egL._AC_SL1500_.jpg",
    title: "Funko Winnie l'Ourson : une gamme 'Pop Nooks' pour le centenaire Disney",
    text: "Funko présente une série exclusive de décors miniatures Winnie l'Ourson pour célébrer le centenaire. Ce positionnement cadeau décoratif très porteur s'implante idéalement dans les rayons culturels pour la saison estivale."
  },
  {
    cat: "anime",
    emoji: "🪚",
    date_str: "1er Juin 2026 · Streaming",
    hot: false,
    img: "https://static.animecorner.me/2024/09/1726149680-ba54301e4c97ada7764e8f9816c8a46e.jpg",
    title: "Shangri-La Frontier Saison 2 démarre sur Crunchyroll et Netflix",
    text: "La saison 2 de l'anime phénomène sur le gaming en VR débute ce lundi 1er juin en simulcast mondial. Un événement streaming majeur qui dynamise déjà les ventes de figurines articulées Bandai Spirits dans les réseaux spécialisés et de grande distribution."
  },
  {
    cat: "manga",
    emoji: "📖",
    date_str: "31 Mai 2026 · Édition",
    hot: false,
    img: "https://www.iconik-global.com/wp-content/uploads/2026/02/Japan-expo-768x490.png",
    title: "Préparation Japan Expo : Les éditeurs français accélèrent les lancements",
    text: "En vue du salon de juillet, Pika, Kana et Ki-oon dévoilent des plannings denses (Wind Breaker T22, Komi T25, Kaijin Fugeki T6). Les librairies spécialisées renforcent leurs stocks pour faire face à la ruée traditionnelle de l'été."
  },
  {
    cat: "manga",
    emoji: "👰",
    date_str: "29 Mai 2026 · Ventes",
    hot: false,
    img: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781974725762/frieren-beyond-journeys-end-vol-1-9781974725762_hr.jpg",
    title: "Frieren sacré manga le plus vendu du premier semestre 2026 en France",
    text: "L'œuvre de Kanehito Yamada franchit un cap historique en France. Ki-oon annonce un tirage supplémentaire massif pour approvisionner les hypermarchés afin d'éviter toute rupture de stock avant les vacances."
  },
  {
    cat: "cine",
    emoji: "🤠",
    date_str: "29 Mai 2026 · Grande Distrib",
    hot: false,
    img: "https://pics.filmaffinity.com/toy_story_5-496105354-large.jpg",
    title: "Toy Story 5 : Carrefour et Cora installent des corners géants Pixar",
    text: "Disney déploie sa force de frappe commerciale pour le 5e opus Pixar. Les enseignes françaises installent des corners de vente géants théâtralisés pour capter la clientèle familiale tout au long du mois de juin."
  },
  {
    cat: "series",
    emoji: "⚽",
    date_str: "28 Mai 2026 · Netflix",
    hot: false,
    img: "https://4kwallpapers.com/images/wallpapers/blue-lock-vs-u-20-2880x1800-20398.jpg",
    title: "Blue Lock : VS U-20 JAPAN est disponible en intégralité sur Netflix",
    text: "La série foot du moment arrive d'un coup en SVOD. L'effet de recommandation Netflix devrait faire exploser l'engagement et stimuler les drops textile ainsi que le sell-out sur les produits de licence sportive associés."
  },
  {
    cat: "collab",
    emoji: "👟",
    date_str: "30 Mai 2026 · Streetwear",
    hot: false,
    img: "https://www.fullress.com/wp-content/uploads/2025/11/1saFdsgfe999-4.jpg",
    title: "adidas s'associe aux Bisounours pour un drop estival Kawaii",
    text: "La collection de sneakers et sportswear rétro Care Bears × adidas fait le buzz sur TikTok. Un drop centré sur la nostalgie Y2K qui s'annonce collector avec des ruptures immédiates sur l'application adidas Confirmed."
  },
  {
    cat: "series",
    emoji: "✨",
    date_str: "27 Mai 2026 · Audiences",
    hot: false,
    img: "https://comicbook.com/wp-content/uploads/sites/4/2024/12/My-Dress-Up-Darling-Season-2-Poster.jpg?resize=1059",
    title: "My Dress-Up Darling S2 : Carton d'audience absolu pour la rom-com",
    text: "L'adaptation du manga de Shinichi Fukuda signe un démarrage exceptionnel sur Crunchyroll. Les fabricants de figurines de collection enregistrent des volumes de précommandes records sur le personnage de Marin Kitagawa."
  },
  {
    cat: "manga",
    emoji: "🤵",
    date_str: "28 Mai 2026 · Édition",
    hot: false,
    img: "https://files.otakustudy.com/wp-content/uploads/2014/02/15065329/1617580_10152261726324451_1051969077_o.jpg",
    title: "Seven Seas annonce l'acquisition majeure de 17 nouvelles licences",
    text: "L'éditeur leader aux États-Unis muscle son ontologie manga et light novels pour 2026-2027. Cette offensive éditoriale confirme la vitalité insolente et la croissance ininterrompue du marché de la BD japonaise en Occident."
  },
  {
    cat: "collab",
    emoji: "🎴",
    date_str: "30 Mai 2026 · Collectibles",
    hot: false,
    img: "https://www.japan2uk.com/cdn/shop/files/POP_MART_-_Dimoo_World_x_Disney_Series_Blind_Box1_700x700.png?v=1754307048",
    title: "Pop Mart et Disney dévoilent la collection Dimoo World exclusives",
    text: "Le leader mondial des blind boxes s'associe à Disney pour réinventer les personnages cultes. Ce drop destiné aux jeunes adultes génère un trafic massif en boutique physique et cartonne en unboxing sur les réseaux sociaux."
  },
  {
    cat: "cine",
    emoji: "🕷️",
    date_str: "29 Mai 2026 · Cinéma",
    hot: false,
    img: "https://cdn.marvel.com/content/2x/spidermanbrandnewday_lob_mas_mob_01.jpg",
    title: "Spider-Man Brand New Day : Sony et Marvel déploient les premiers visuels",
    text: "La promotion s'intensifie autour du prochain volet de Tom Holland. Les partenaires de licensing (Lego, Hasbro) s'alignent pour une déferlante de produits dérivés prévue en rayon dès fin juin pour l'été."
  },
  {
    cat: "cine",
    emoji: "🏆",
    date_str: "30 Mai 2026 · Box-Office",
    hot: false,
    img: "https://voyeglobal.com/wp-content/uploads/2026/02/Riddhi-10.jpg",
    title: "Cannes 2026 : Le palmarès officiel dévoilé, impact attendu en salle",
    text: "Le 79e Festival de Cannes a remis ses prix ce samedi soir. Les exploitants de salles de cinéma prévoient un regain de fréquentation pour les films primés, stimulant la vente de tickets et les abonnements."
  },
  {
    cat: "series",
    emoji: "🟣",
    date_str: "29 Mai 2026 · Streaming",
    hot: false,
    img: "https://i.redd.it/5vcmfkm4lzp91.jpg",
    title: "Jujutsu Kaisen S2 maintient sa domination dans le Top 5 Netflix",
    text: "La diffusion continue en streaming maintient la licence dans le haut des charts. Le sell-out du merchandising associé (vêtements, accessoires de bureau) montre une stabilité commerciale rare et très lucrative pour les revendeurs."
  }
];

// =========================================================
// Moteur de recherche d'image CÔTÉ SERVEUR (Node.js / Vercel)
// Chaîne : Google API → Google scrape → DDG → Wikimedia → null
// =========================================================

function buildSearchQuery(title, cat) {
  const lower = title.toLowerCase();

  // 1. Spécialisation par contexte (overrides existants...)
  if (lower.includes('goldorak') || lower.includes('grendizer')) return 'Casio G-Shock Goldorak U GA-110 Grendizer watch official';
  if (lower.includes('g-shock') || (lower.includes('casio') && lower.includes('gundam'))) return 'Casio G-SHOCK Gundam RX-78-2 DW-5600 2026 watch official photo';
  if (lower.includes('minas tirith') || (lower.includes('lego') && lower.includes('lord')))  return 'LEGO Minas Tirith 11377 Lord of the Rings set official product 2026';
  if (lower.includes('mitsuri'))                                                               return 'Demon Slayer Mitsuri Kanroji ufotable birthday 2026 anime illustration';
  if (lower.includes('infinity castle'))                                                       return 'Demon Slayer Infinity Castle 2025 theatrical movie official poster';
  if (lower.includes('toy story 5'))                                                           return 'Toy Story 5 Pixar 2026 official theatrical movie poster';
  if (lower.includes('spider-man') && lower.includes('brand new day'))                        return 'Spider-Man Brand New Day 2026 Tom Holland Marvel official poster';
  if (lower.includes('blue lock') && lower.includes('u-20'))                                  return 'Blue Lock VS U-20 Japan anime official visual poster 2026';
  if (lower.includes('shangri-la frontier') && lower.includes('saison 2'))                   return 'Shangri-La Frontier Season 2 anime key visual 2026';
  if (lower.includes('my hero academia') && lower.includes('anime of the year'))             return 'My Hero Academia Final Season anime poster Crunchyroll Awards 2026';
  if (lower.includes('jujutsu kaisen'))                                                       return 'Jujutsu Kaisen Season 2 anime official poster visual';
  if (lower.includes('frieren'))                                                               return 'Frieren Beyond Journey End manga cover official art';
  if (lower.includes('uniqlo') && lower.includes('shueisha'))                                return 'Uniqlo UT Shueisha 100th anniversary manga collection Bleach SPY FAMILY 2026';
  if (lower.includes('care bears') || (lower.includes('bisounours') && lower.includes('adidas'))) return 'adidas Care Bears 2026 collab sneakers official photo';
  if (lower.includes('my dress-up darling') || (lower.includes('dress') && lower.includes('darling'))) return 'My Dress-Up Darling Season 2 anime Marin Kitagawa official key visual';
  if (lower.includes('pop mart') && lower.includes('disney'))                                return 'Pop Mart Disney Dimoo 2026 blind box figure official product photo';
  if (lower.includes('cannes') && lower.includes('2026'))                                    return 'Festival de Cannes 2026 palmares Palme dOr ceremonie photo officielle';
  if (lower.includes('funko') && lower.includes('winnie'))                                   return 'Funko Pop Winnie the Pooh Disney 100 anniversary official figure product';
  if (lower.includes('japan expo'))                                                           return 'Japan Expo Paris 2026 salon officiel affiche manga anime';
  if (lower.includes('seven seas'))                                                           return 'Seven Seas Entertainment manga publisher 2026 new license';

  // 2. Extraction robuste si pas d'override
  let entity = null;
  const knownEntities = [
    'G-SHOCK', 'Casio', 'Gundam', 'RX-78-2', 'LEGO', 'Minas Tirith', 'Lord of the Rings',
    'Demon Slayer', 'Kimetsu no Yaiba', 'Mitsuri', 'Infinity Castle', 'My Hero Academia', 
    'Jujutsu Kaisen', 'Frieren', 'Blue Lock', 'Shangri-La Frontier', 'My Dress-Up Darling',
    'Toy Story', 'Spider-Man', 'Cannes', 'Japan Expo', 'Funko', 'Winnie', 'Pop Mart', 
    'adidas', 'Uniqlo', 'Seven Seas', 'Crunchyroll', 'Netflix', 'Solo Leveling',
    'Dragon Quest', 'Hunter x Hunter', 'Noces des lucioles', 'One Piece', 'Chainsaw Man',
    'Bleach', 'Naruto', 'Dragon Ball'
  ];
  for (const e of knownEntities) {
    if (lower.includes(e.toLowerCase())) { entity = e; break; }
  }

  let q = entity;
  if (!q) {
    const quoteMatch = title.match(/[«"“]([^»"”]+)[»"”]/);
    if (quoteMatch) {
      q = quoteMatch[1].trim();
    } else {
      q = title
        .replace(/^.{0,80}?(dévoile|annonce|lance|publie|présente|sort|rejoint|s['']associe (aux?|à)|entre dans|est disponible|bat|rafle|maintient\s+sa?\s+|sacré|clap de fin pour|marque un|ouvre|offre)\s+/i, '')
        .split(/[,:–-]/).shift().trim();
      
      const words = q.split(/\s+/);
      if (words.length > 5) {
        q = words.slice(0, 4).join(' ');
      }
    }
  }

  const catSuffix = { cine:'official movie poster', series:'anime official poster', anime:'anime key visual', manga:'manga cover official', collab:'official product photo' };
  return `${q} ${catSuffix[cat] || 'official image'}`;
}

// =========================================================
// Sources d'images fiables — sans scraping fragile
// =========================================================

async function fetchFromGoogleAPI(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.GOOGLE_CX;
  if (!key || !cx) return null;
  try {
    const url  = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&num=5&imgType=photo&safe=active&key=${key}&cx=${cx}`;
    const data = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json();
    return data.items?.find(i => /\.(jpg|jpeg|png|webp)/i.test(i.link))?.link || null;
  } catch (e) { return null; }
}

// Moteur de recherche Bing & Yahoo (Direct scraping + Index fallback unifié)
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
        if (img) return img;
      }
    }
  } catch (e) { /* silencieux en direct, continue vers Yahoo */ }

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
        if (img) return img;
      }
    }
  } catch (e) { /* silencieux en direct, continue vers l'index unifié */ }

  // --- ÉTAPE 3 : Index unifié Bing & Yahoo (Fallback de secours résilient) ---
  try {
    const htmlUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const resHtml = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!resHtml.ok) return null;
    const html = await resHtml.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];

    const jsonUrl = `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const resJson = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!resJson.ok) return null;
    const data = await resJson.json();
    if (data.results && data.results.length > 0) {
      return data.results.find(i => /\.(jpg|jpeg|png|webp)/i.test(i.image))?.image || null;
    }
  } catch (e) { /* silencieux */ }
  return null;
}


// Jikan API — MyAnimeList (gratuit, sans clé, images HD)
async function fetchFromJikan(query) {
  try {
    for (const type of ['anime', 'manga']) {
      const url  = `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&limit=1&order_by=popularity&sort=asc`;
      const data = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json();
      const img  = data.data?.[0]?.images?.jpg?.large_image_url;
      if (img) return img;
    }
  } catch (e) { /* silencieux */ }
  return null;
}

// TMDb — The Movie Database (clé optionnelle via TMDB_API_KEY)
async function fetchFromTMDb(query) {
  try {
    const key = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
    for (const type of ['movie', 'tv']) {
      const url    = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(query)}&language=fr-FR`;
      const data   = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json();
      const poster = data.results?.[0]?.poster_path;
      if (poster) return `https://image.tmdb.org/t/p/w500${poster}`;
    }
  } catch (e) { /* silencieux */ }
  return null;
}

// Wikipedia REST API — thumbnail de la page de l'entité (très fiable)
async function fetchFromWikipedia(query) {
  try {
    const searchRes  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`, { signal: AbortSignal.timeout(7000) });
    const searchData = await searchRes.json();
    const pageTitle  = searchData.query?.search?.[0]?.title;
    if (!pageTitle) return null;
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, { signal: AbortSignal.timeout(7000) });
    const summary    = await summaryRes.json();
    return summary.thumbnail?.source || summary.originalimage?.source || null;
  } catch (e) { return null; }
}

// Wikimedia Commons — filtré (images uniquement, pas PDF/SVG/OGV)
async function fetchFromWikimedia(query) {
  try {
    const search = await (await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`,
      { signal: AbortSignal.timeout(6000) }
    )).json();
    const results = (search.query?.search || []).filter(r => {
      const l = r.title.toLowerCase();
      return (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') || l.endsWith('.webp'))
        && !l.includes('.pdf') && !l.includes('.svg') && !l.includes('.ogv');
    });
    if (!results.length) return null;
    const info = await (await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(results[0].title)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
      { signal: AbortSignal.timeout(6000) }
    )).json();
    return Object.values(info.query?.pages || {})[0]?.imageinfo?.[0]?.url || null;
  } catch (e) { return null; }
}

async function getAutoImage(title, cat) {
  // Délégué au moteur unifié (lib/imageEngine.js) — logique IDENTIQUE au cron :
  // Google→Bing→Yahoo→DDG filtrés par pertinence + filet exact (Jikan/TMDb/Wikipedia).
  return await getBestImage(title, cat);
}

// =========================================================
// Handler principal
// =========================================================
export default async function handler(req, res) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let news = [];
  let isDatabase = false;

  // Étape 1 — Supabase (source principale, remplie par le cron)
  if (supabaseUrl && supabaseAnon) {
    try {
      const sb = createClient(supabaseUrl, supabaseAnon);
      const { data, error } = await sb.from('news').select('*').order('published_at', { ascending: false });
      if (!error && data?.length > 0) { news = data; isDatabase = true; }
    } catch (e) { /* silencieux */ }
  }

  // Étape 2 — Payload local (enrichi par le cron, contient les images scrappées)
  if (!isDatabase) {
    try {
      let dir = process.cwd();
      let payloads = fs.readdirSync(dir).filter(f => f.startsWith('_qg_payload_') && f.endsWith('.json'));
      
      if (payloads.length === 0) {
        dir = path.join(process.cwd(), '..');
        if (fs.existsSync(dir)) {
          payloads = fs.readdirSync(dir).filter(f => f.startsWith('_qg_payload_') && f.endsWith('.json'));
        }
      }

      const payloadsMapped = payloads
        .map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

      if (payloadsMapped.length > 0) {
        const raw = JSON.parse(fs.readFileSync(path.join(dir, payloadsMapped[0].f), 'utf8'));
        if (Array.isArray(raw.news)) {
          news = raw.news.map((item, i) => ({
            cat: item.cat || 'cine', emoji: item.emoji || '📰',
            date_str: item.date_str || item.date || 'Récemment',
            title: item.title, text: item.text, hot: !!item.hot,
            img: item.img || null,
            published_at: item.published_at || new Date(Date.now() - i * 30 * 60 * 1000).toISOString()
          }));
        }
      }
    } catch (e) { /* mode Vercel — pas de filesystem */ }
  }

  // Étape 3 — Données intégrées (FALLBACK_NEWS sans images)
  if (news.length === 0) {
    news = FALLBACK_NEWS.map((item, i) => ({
      ...item, published_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    }));
  }

  // Étape 4 — Résolution automatique des images manquantes côté serveur et Proxy
  // Si l'image est manquante, on la cherche à la volée (Google → DDG → Jikan/TMDb → Wiki).
  // Toutes les images externes sont passées par notre proxy d'images local pour contourner les blocages de hotlinking (CORS/403).
  const populated = await Promise.all(news.map(async item => {
    let img = item.img;
    if (!img || !img.startsWith('http')) {
      img = await getAutoImage(item.title, item.cat);
    }
    if (img && img.startsWith('http')) {
      img = `/api/proxy-image?url=${encodeURIComponent(img)}`;
    }
    return { ...item, img };
  }));

  res.status(200).json({
    success: true,
    source: isDatabase ? 'supabase' : 'local_fallback',
    data: populated
  });
}
