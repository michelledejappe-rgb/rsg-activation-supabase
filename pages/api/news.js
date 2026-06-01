import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Données de secours d'excellente qualité (LinkedIn-style) si la base de données n'est pas encore connectée
const FALLBACK_NEWS = [
  {
    cat: "cine",
    emoji: "🚀",
    date_str: "Au box-office",
    title: "The Mandalorian & Grogu — démarrage solide en 2e semaine",
    text: "Le 1er film Star Wars depuis 6 ans tient la cadence dans les salles. Pedro Pascal + Sigourney Weaver continuent de drainer la fanbase. Effet halo confirmé sur les rayons figurines en hypermarché.",
    hot: true
  },
  {
    cat: "series",
    emoji: "⚽",
    date_str: "Sur Netflix · 25 mai",
    title: "Blue Lock : VS U-20 JAPAN débarque sur Netflix",
    text: "La saison événement de l'anime foot le plus addictif arrive d'un coup sur Netflix. La fanbase shonen est en feu, le sell-out merch devrait suivre dans les semaines à venir.",
    hot: true
  },
  {
    cat: "anime",
    emoji: "🪚",
    date_str: "Sur Crunchyroll",
    title: "Chainsaw Man : Reze Arc débarque en streaming",
    text: "Après 190 jours d'exclusivité ciné, l'arc Reze rejoint enfin Crunchyroll. La saga Denji repart pour un cycle de buzz — opportunité en or pour les figurines Funko et lampes Paladone.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "🧸",
    date_str: "Été 2026",
    title: "Care Bears × adidas — le drop de l'été",
    text: "Les Bisounours s'invitent chez adidas pour une collection kawaii très attendue. D'autres surprises annoncées en juillet.",
    hot: false
  },
  {
    cat: "cine",
    emoji: "🤠",
    date_str: "17 juin 2026",
    title: "Toy Story 5 — Buzz est de retour",
    text: "Pixar relance sa franchise la plus iconique. Côté merchandising, le segment Toy Story s'annonce massif pour tout l'été en hypermarché.",
    hot: false
  },
  {
    cat: "series",
    emoji: "✨",
    date_str: "Annoncé · Kyoto Animation",
    title: "Sparks of Tomorrow — l'anime Netflix Original signé Kyoto Animation",
    text: "Netflix annonce une exclu mondiale produite par Kyoto Animation. Le studio le plus exigeant de l'industrie revient avec un projet original — événement majeur pour les fans d'animation premium.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "👰",
    date_str: "26 mai · Kadokawa",
    title: "Ayakashi Hunter's Tainted Bride lance un 2e spin-off manga",
    text: "Le shonen surnaturel s'étend avec un nouveau spin-off annoncé par Kadokawa. La saga continue de grandir, parfait timing pour les rayons manga collector.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "🎴",
    date_str: "Q4 2026",
    title: "Funko × Lego : la collab inédite",
    text: "Deux géants du collectible s'allient pour la toute première fois. Premier set co-brandé confirmé pour la fin d'année.",
    hot: false
  }
];

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let news = [];
  let isDatabase = false;

  // 1. Tenter de lire depuis Supabase
  if (url && anon) {
    try {
      const supabase = createClient(url, anon);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        news = data;
        isDatabase = true;
        console.log(`[API API] Récupéré ${data.length} actualités depuis Supabase.`);
      } else if (error) {
        console.error("[API API] Erreur Supabase :", error.message);
      }
    } catch (err) {
      console.error("[API API] Exception lors de la connexion Supabase :", err.message);
    }
  }

  // 2. Fallback local : Si pas de DB ou DB vide, tenter de lire le dernier fichier payload local (utile en dev local)
  if (!isDatabase) {
    try {
      // Le dossier de téléchargements est situé deux niveaux au-dessus du dossier pages/api
      const downloadsDir = path.join(process.cwd(), '..'); 
      const files = fs.readdirSync(downloadsDir);
      const payloadFiles = files
        .filter(file => file.startsWith('_qg_payload_') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(downloadsDir, file);
          const stat = fs.statSync(filePath);
          return { name: file, path: filePath, mtime: stat.mtimeMs };
        });

      if (payloadFiles.length > 0) {
        // Prendre le plus récent
        payloadFiles.sort((a, b) => b.mtime - a.mtime);
        const rawData = fs.readFileSync(payloadFiles[0].path, 'utf8');
        const payload = JSON.parse(rawData);
        if (payload.news && Array.isArray(payload.news)) {
          news = payload.news.map((item, index) => ({
            cat: item.cat || 'cine',
            emoji: item.emoji || '📰',
            date_str: item.date || 'Récemment',
            title: item.title,
            text: item.text,
            hot: !!item.hot,
            published_at: new Date(Date.now() - index * 30 * 60 * 1000).toISOString()
          }));
          console.log(`[API API] Fallback réussi sur le fichier local : ${payloadFiles[0].name}`);
        }
      }
    } catch (err) {
      // Échoue silencieusement si les répertoires ne sont pas accessibles (en production sur Vercel par exemple)
      console.log("[API API] Info : Mode production ou répertoire Downloads inaccessible.");
    }
  }

  // 3. Fallback ultime : Si aucun fichier local ou DB n'est disponible, servir les actualités mockées de haute qualité
  if (news.length === 0) {
    console.log("[API API] Chargement des données de secours intégrées.");
    news = FALLBACK_NEWS.map((item, index) => ({
      ...item,
      published_at: new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
    }));
  }

  // Renvoyer les actualités avec le statut de la source pour l'affichage (badge live sync)
  res.status(200).json({
    success: true,
    source: isDatabase ? 'supabase' : 'local_fallback',
    data: news
  });
}
