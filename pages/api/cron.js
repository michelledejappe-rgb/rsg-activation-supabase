import { createClient } from '@supabase/supabase-js';
import imageEngine from '../../lib/imageEngine.js';
const { isAcceptableImage } = imageEngine;

// =========================================================
// Filtre de contenu anti-gaming et détection de la langue (Strictement Français)
// =========================================================
function shouldKeepArticle(title, text) {
  const t = (title || "").toLowerCase();
  const d = (text || "").toLowerCase();

  // 1. Anti-Gaming Filter
  const gamingWords = [
    'jeu vidéo', 'jeux vidéo', 'gaming', 'playstation', 'ps5', 'xbox', 'nintendo', 
    'switch', 'console', 'gameplay', 'rockstar', 'gta', 'gta 6', 'fifa', 'fortnite', 
    'gamers', 'cyberpunk 2077', 'pc gamer', 'resident evil', 'call of duty', 
    'assassin\'s creed', 'gamer', 'jeux-video', 'jeu-video'
  ];
  for (const word of gamingWords) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  // 2. English Detection Filter (Strict French Only)
  const englishStopwords = [
    ' the ', ' is ', ' for ', ' in ', ' with ', ' at ', ' on ', ' and ', ' of ', ' to ', 
    ' from ', ' this ', ' that ', ' under ', ' with ', ' about '
  ];
  for (const word of englishStopwords) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  // Termes anglais fréquents dans les collabs / drops
  const englishTerms = [
    'release date', 'official trailer', 'announces', 'unveils', 'collaboration info', 
    'exclusive drop', 'collection release'
  ];
  for (const word of englishTerms) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  // 3. Anti-French Series Filter
  const frenchSeriesTerms = [
    'série française', 'séries françaises', 'série de tf1', 'série tf1', 
    'série france 2', 'série france 3', 'série de france 2', 'série de france 3', 
    'série de m6', 'série m6', 'série canal+', 'série canal +', 'série d\'arte', 'série arte',
    'série de canal+', 'série de canal +', 'série d\'ocs', 'série ocs'
  ];
  for (const term of frenchSeriesTerms) {
    if (t.includes(term) || d.includes(term)) {
      return false;
    }
  }

  // Combined checks: the word "série" or "saison" or "épisode" or "feuilleton" AND a French channel/series keyword
  const containsSerieIndicator = t.includes('série') || t.includes('saison') || t.includes('épisode') || t.includes('feuilleton') ||
                                 d.includes('série') || d.includes('saison') || d.includes('épisode') || d.includes('feuilleton');
  
  if (containsSerieIndicator) {
    // Famous French series titles
    const famousFrenchSeries = [
      'hpi', 'lupin', 'dix pour cent', 'le bureau des légendes', 'bureau des legendes', 'kaamelott', 
      'plus belle la vie', 'demain nous appartient', 'ici tout commence', 'un si grand soleil', 'clem', 
      'balthazar', 'candice renoir', 'capitaine marleau', 'astrid et raphaëlle', 'astrid et raphaelle', 
      'engrenages', 'les combattantes', 'le bazar de la charité', 'bazar de la charite', 'validé', 'valide', 
      'family business', 'tapie', 'pax massilia', 'fiasco', 'ourika', 'la fièvre', 'la fievre', 'coeurs noirs', 
      'baron noir', 'kaboul kitchen', 'l\'opéra', 'l\'opera', 'hippocrate', 'l\'art du crime', 'skam france', 
      'le flambeau', 'la flamme', 'sous le soleil', 'caméra café', 'camera cafe', 'un gars une fille', 
      'scènes de ménages', 'scenes de menages', 'vestiaires', 'nos chers voisins', 'le bureau', 'les revenants',
      'mafiosa', 'braquo', 'guyane', 'le bureau des legendes', 'lupin'
    ];
    for (const show of famousFrenchSeries) {
      const regex = new RegExp(`\\b${show}\\b`, 'i');
      if (regex.test(title) || regex.test(text)) {
        return false;
      }
    }

    // Combined with French nationality indicator
    if (t.includes('français') || t.includes('française') || t.includes('françaises') ||
        d.includes('français') || d.includes('française') || d.includes('françaises')) {
      return false;
    }

    // Combined with French TV channels
    const frenchChannels = ['tf1', 'france 2', 'france 3', 'france3', 'france 5', 'france5', 'm6', 'canal+', 'canal +', 'arte', 'ocs'];
    for (const channel of frenchChannels) {
      const regex = new RegExp(`\\b${channel.replace('+', '\\+')}\\b`, 'i');
      if (regex.test(title) || regex.test(text)) {
        return false;
      }
    }
  }

  return true;
}

// =========================================================
// Récupération des flux de presse RSS (Actualisation 100% autonome sans fichiers)
// =========================================================
async function fetchRSSNews() {
  const feeds = [
    { url: "https://www.manga-news.com/index.php/feed/news", cat: "manga", defaultEmoji: "📖" },
    { url: "https://www.allocine.fr/rss/news.xml", cat: "cine", defaultEmoji: "🎬" },
    { url: "https://www.sneakers.fr/feed/", cat: "collab", defaultEmoji: "🧸" }
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
        const sourceLabel = feed.url.includes('allocine') ? 'AlloCiné' : feed.url.includes('manga-news') ? 'MangaNews' : 'Sneakers.fr';
        
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
// Handler principal du Cron
// =========================================================
export default async function handler(req, res) {
  // 1. Protection contre les appels malveillants/abusifs
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      message: "Variables de connexion Supabase manquantes dans Vercel."
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const githubRepo = "michelledejappe-rgb/rsg-activation-supabase";
  
  let payloadNews = [];
  let latestFileName = "Aucun";

  try {
    console.log(`[Cloud Cron] Récupération des fichiers du dépôt : ${githubRepo}`);
    
    const headers = {
      'User-Agent': 'RSG-QG-Cloud-Cron'
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Appeler l'API GitHub pour lister les fichiers à la racine
    const filesRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/`, { headers });
    
    if (filesRes.ok) {
      const files = await filesRes.json();
      
      if (Array.isArray(files)) {
        const payloadFiles = files
          .filter(file => file.name.startsWith('_qg_payload_') && file.name.endsWith('.json'))
          .map(file => ({
            name: file.name,
            downloadUrl: file.download_url
          }));

        if (payloadFiles.length > 0) {
          payloadFiles.sort((a, b) => b.name.localeCompare(a.name));
          const latestFile = payloadFiles[0];
          latestFileName = latestFile.name;
          
          console.log(`[Cloud Cron] Téléchargement du payload : ${latestFile.name}`);
          const downloadRes = await fetch(latestFile.downloadUrl, { headers });
          if (downloadRes.ok) {
            const payload = await downloadRes.json();
            if (payload.news && Array.isArray(payload.news)) {
              payloadNews = payload.news.map((item, index) => {
                const now = new Date();
                const publishedAt = item.published_at || new Date(now.getTime() - index * 30 * 60 * 1000).toISOString();
                return {
                  cat: item.cat || 'cine',
                  emoji: item.emoji || '📰',
                  date_str: item.date_str || item.date || 'Récemment',
                  title: item.title,
                  text: item.text,
                  hot: !!item.hot,
                  img: item.img || null,
                  published_at: publishedAt
                };
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Cloud Cron] Impossible de récupérer le payload GitHub, repli sur le flux RSS seul :", err.message);
  }

  try {
    // 2. Récupérer les actualités de presse RSS
    let rssNews = [];
    try {
      rssNews = await fetchRSSNews();
    } catch (e) {
      console.error("[Cloud Cron] Échec lecture flux RSS :", e.message);
    }

    // 3. Fusionner les actualités
    const allNewsRaw = [...rssNews, ...payloadNews];
    
    // Dédoublonner par titre
    const uniqueTitles = new Set();
    const newsToUpsert = [];
    for (const item of allNewsRaw) {
      if (!item.title) continue;
      
      // Filtrer les actualités gaming et anglaises
      if (!shouldKeepArticle(item.title, item.text)) {
        continue;
      }

      const cleanTitle = item.title.trim().toLowerCase();
      if (!uniqueTitles.has(cleanTitle)) {
        uniqueTitles.add(cleanTitle);
        newsToUpsert.push(item);
      }
    }

    // 3bis. Préserver les images déjà validées en base (dont les corrections) et
    //        ne JAMAIS réintroduire une image hors-sujet (rapide : un simple select).
    try {
      const { data: existingRows } = await supabase.from('news').select('title,img');
      const existingImg = {};
      (existingRows || []).forEach(r => { existingImg[(r.title || '').trim().toLowerCase()] = r.img; });
      for (const item of newsToUpsert) {
        const prev = existingImg[(item.title || '').trim().toLowerCase()];
        if (prev && isAcceptableImage(prev, item.title, item.cat)) {
          item.img = prev;                       // garde l'image déjà bonne (incl. réparées)
        } else if (!isAcceptableImage(item.img, item.title, item.cat)) {
          item.img = null;                        // jamais de hors-sujet ; /api/news comblera proprement
        }
      }
    } catch (e) {
      console.warn('[Cloud Cron] Préservation des images impossible :', e.message);
    }

    console.log(`[Cloud Cron] Synchronisation de ${newsToUpsert.length} actus (dont ${rssNews.length} RSS) vers Supabase...`);

    // 4. Effectuer l'upsert dans Supabase
    const { error } = await supabase
      .from('news')
      .upsert(newsToUpsert, { onConflict: 'title' });

    if (error) {
      throw error;
    }

    console.log("[Cloud Cron] Synchronisation cloud réussie avec succès !");
    
    return res.status(200).json({
      success: true,
      message: `Synchronisation réussie. Payload: ${latestFileName}. RSS actus: ${rssNews.length}.`,
      total_items: newsToUpsert.length
    });

  } catch (err) {
    console.error("[Cloud Cron] Erreur critique :", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
