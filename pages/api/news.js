import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Données de secours d'excellente qualité (LinkedIn-style) si la base de données n'est pas encore connectée
const FALLBACK_NEWS = [
  {
    cat: "collab",
    emoji: "🏰",
    date_str: "1er Juin 2026 · Retail",
    title: "LEGO lance Minas Tirith en avant-première Insiders ce 1er juin",
    text: "LEGO ouvre ce matin les ventes de son set Lord of the Rings 'Minas Tirith' (11 377 pièces) pour ses membres Insiders. Le set exclusif promotionnel 'Grond' offert suscite une ruée sans précédent chez les collectionneurs adultes. Ruptures de stocks attendues avant ce soir en ligne.",
    hot: true
  },
  {
    cat: "collab",
    emoji: "👕",
    date_str: "1er Juin 2026 · Streetwear",
    title: "Uniqlo UT dévoile sa Vague 3 Shueisha (Bleach, SPY x FAMILY, Mashle)",
    text: "Le giant du retail Uniqlo vient d'annoncer officiellement le troisième drop de sa collection monumentale Shueisha 100th UT. Prévue pour août, cette vague intègre Bleach, Mashle, SPY×FAMILY et Yu-Gi-Oh!. Un booster de trafic majeur pour le textile jeune adulte.",
    hot: true
  },
  {
    cat: "anime",
    emoji: "🌸",
    date_str: "1er Juin 2026 · Fandom",
    title: "Demon Slayer : ufotable publie un visuel inédit de Mitsuri Kanroji",
    text: "Pour célébrer l'anniversaire du Pilier de l'Amour ce 1er juin, ufotable partage une illustration inédite. Le post suscite un engagement colossal, les fabricants de collectibles anticipent un pic de ventes sur les figurines de la licence ce mois-ci.",
    hot: false
  },
  {
    cat: "series",
    emoji: "🚇",
    date_str: "1er Juin 2026 · Streaming",
    title: "Le film Milky☆Subway : The Galactic Limited Express rejoint Netflix",
    text: "Netflix surprend la fanbase de science-fiction rétro en ajoutant ce 1er juin le long-métrage Milky☆Subway. Une arrivée stratégique pour la plateforme qui continue de muscler ses droits exclusifs face à la concurrence de Crunchyroll.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "💔",
    date_str: "31 Mai 2026 · Édition",
    title: "Clap de fin pour le manga 'La Belle et le Badass' de Sawako Arashida",
    text: "Le dernier chapitre est paru hier au Japon, bouclant cette comédie romantique plébiscitée. Le tome 6 final sortira le 15 juin. Les réseaux de librairies s'attendent à un trafic massif pour cette licence très vendeuse en rayon Shojo.",
    hot: false
  },
  {
    cat: "series",
    emoji: "🏆",
    date_str: "30 Mai 2026 · Tokyo",
    title: "My Hero Academia bat Solo Leveling et rafle l'Anime of the Year 2026",
    text: "La conclusion de la saga MHA a été couronnée reine de l'année aux Crunchyroll Anime Awards à Tokyo suite à un vote record de 73 millions de fans. Une consécration commerciale ultime pour la franchise de Shueisha et ses licenciés.",
    hot: true
  },
  {
    cat: "cine",
    emoji: "⚔️",
    date_str: "30 Mai 2026 · Box-Office",
    title: "Demon Slayer : Infinity Castle sacré Film de l'Année 2026",
    text: "L'arc final en trilogie décroche le prix suprême. L'annonce booste la valorisation des droits de merchandising, les géants français du retail (FNAC, Micromania) préparent des corners physiques pour tout l'été.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "⚔️",
    date_str: "31 Mai 2026 · Édition",
    title: "Le manga 'I Left My A-Rank Party' entre officiellement dans son arc final",
    text: "Kodansha confirme l'entrée dans la phase finale avec le chapitre 165. Un jalon important pour ce manga de fantasy qui cartonne en édition. Les distributeurs planifient déjà des réimpressions collectors de fin de parcours.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "⌚",
    date_str: "29 Mai 2026 · Horlogerie",
    title: "Casio dévoile une montre G-SHOCK exclusive inspirée de Gundam",
    text: "Un modèle premium collector aux couleurs du robot RX-78-2. Ce partenariat à fort impact lifestyle est déjà en rupture sur les précommandes. Une preuve de plus de la force du cross-licensing de luxe auprès des jeunes actifs.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "🧸",
    date_str: "31 Mai 2026 · Collectibles",
    title: "Funko Winnie l'Ourson : une gamme 'Pop Nooks' pour le centenaire Disney",
    text: "Funko présente une série exclusive de décors miniatures Winnie l'Ourson pour célébrer le centenaire. Ce positionnement cadeau décoratif très porteur s'implante idéalement dans les rayons culturels pour la saison estivale.",
    hot: false
  },
  {
    cat: "anime",
    emoji: "🪚",
    date_str: "1er Juin 2026 · Streaming",
    title: "Shangri-La Frontier Saison 2 démarre sur Crunchyroll et Netflix",
    text: "La saison 2 de l'anime phénomène sur le gaming en VR débute ce lundi 1er juin en simulcast mondial. Un événement streaming majeur qui dynamise déjà les ventes de figurines articulées Bandai Spirits dans les réseaux spécialisés et de grande distribution.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "📖",
    date_str: "31 Mai 2026 · Édition",
    title: "Préparation Japan Expo : Les éditeurs français accélèrent les lancements",
    text: "En vue du salon de juillet, Pika, Kana et Ki-oon dévoilent des plannings denses (Wind Breaker T22, Komi T25, Kaijin Fugeki T6). Les librairies spécialisées renforcent leurs stocks pour faire face à la ruée traditionnelle de l'été.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "👰",
    date_str: "29 Mai 2026 · Ventes",
    title: "Frieren sacré manga le plus vendu du premier semestre 2026 en France",
    text: "L'œuvre de Kanehito Yamada franchit un cap historique en France. Ki-oon annonce un tirage supplémentaire massif pour approvisionner les hypermarchés afin d'éviter toute rupture de stock avant les vacances.",
    hot: false
  },
  {
    cat: "cine",
    emoji: "🤠",
    date_str: "29 Mai 2026 · Grande Distrib",
    title: "Toy Story 5 : Carrefour et Cora installent des corners géants Pixar",
    text: "Disney déploie sa force de frappe commerciale pour le 5e opus Pixar. Les enseignes françaises installent des corners de vente géants théâtralisés pour capter la clientèle familiale tout au long du mois de juin.",
    hot: false
  },
  {
    cat: "series",
    emoji: "⚽",
    date_str: "28 Mai 2026 · Netflix",
    title: "Blue Lock : VS U-20 JAPAN est disponible en intégralité sur Netflix",
    text: "La série foot du moment arrive d'un coup en SVOD. L'effet de recommandation Netflix devrait faire exploser l'engagement et stimuler les drops textile ainsi que le sell-out sur les produits de licence sportive associés.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "👟",
    date_str: "30 Mai 2026 · Streetwear",
    title: "adidas s'associe aux Bisounours pour un drop estival Kawaii",
    text: "La collection de sneakers et sportswear rétro Care Bears × adidas fait le buzz sur TikTok. Un drop centré sur la nostalgie Y2K qui s'annonce collector avec des ruptures immédiates sur l'application adidas Confirmed.",
    hot: false
  },
  {
    cat: "series",
    emoji: "✨",
    date_str: "27 Mai 2026 · Audiences",
    title: "My Dress-Up Darling S2 : Carton d'audience absolu pour la rom-com",
    text: "L'adaptation du manga de Shinichi Fukuda signe un démarrage exceptionnel sur Crunchyroll. Les fabricants de figurines de collection enregistrent des volumes de précommandes records sur le personnage de Marin Kitagawa.",
    hot: false
  },
  {
    cat: "manga",
    emoji: "🤵",
    date_str: "28 Mai 2026 · Édition",
    title: "Seven Seas annonce l'acquisition majeure de 17 nouvelles licences",
    text: "L'éditeur leader aux États-Unis muscle son offre manga et light novels pour 2026-2027. Cette offensive éditoriale confirme la vitalité insolente et la croissance ininterrompue du marché de la BD japonaise en Occident.",
    hot: false
  },
  {
    cat: "collab",
    emoji: "🎴",
    date_str: "30 Mai 2026 · Collectibles",
    title: "Pop Mart et Disney dévoilent la collection Dimoo World exclusives",
    text: "Le leader mondial des blind boxes s'associe à Disney pour réinventer les personnages cultes. Ce drop destiné aux jeunes adultes génère un trafic massif en boutique physique et cartonne en unboxing sur les réseaux sociaux.",
    hot: false
  },
  {
    cat: "cine",
    emoji: "🕷️",
    date_str: "29 Mai 2026 · Cinéma",
    title: "Spider-Man Brand New Day : Sony et Marvel déploient les premiers visuels",
    text: "La promotion s'intensifie autour du prochain volet de Tom Holland. Les partenaires de licensing (Lego, Hasbro) s'alignent pour une déferlante de produits dérivés prévue en rayon dès fin juin pour l'été.",
    hot: false
  },
  {
    cat: "cine",
    emoji: "🏆",
    date_str: "30 Mai 2026 · Box-Office",
    title: "Cannes 2026 : Le palmarès officiel dévoilé, impact attendu en salle",
    text: "Le 79e Festival de Cannes a remis ses prix ce samedi soir. Les exploitants de salles de cinéma prévoient un regain de fréquentation pour les films primés, stimulant la vente de tickets et les abonnements.",
    hot: false
  },
  {
    cat: "series",
    emoji: "🟣",
    date_str: "29 Mai 2026 · Streaming",
    title: "Jujutsu Kaisen S2 maintient sa domination dans le Top 5 Netflix",
    text: "La diffusion continue en streaming maintient la licence dans le haut des charts. Le sell-out du merchandising associé (vêtements, accessoires de bureau) montre une stabilité commerciale rare et très lucrative pour les revendeurs.",
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
