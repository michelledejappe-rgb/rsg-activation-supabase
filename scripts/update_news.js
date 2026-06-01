const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Parser pour charger .env.local de manière robuste et sans dépendances externes
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    console.log(`[Sync] Chargement des variables depuis : ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      // Ignorer les commentaires et lignes vides
      if (line.trim().startsWith('#') || !line.includes('=')) return;
      const [key, ...valueParts] = line.split('=');
      const k = key.trim();
      let v = valueParts.join('=').trim();
      // Enlever les guillemets si présents
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.substring(1, v.length - 1);
      }
      process.env[k] = v;
    });
  } else {
    console.warn(`[Sync] Attention : Aucun fichier .env.local trouvé à ${envPath}`);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// On préfère la clé de rôle de service pour contourner le RLS en écriture, sinon fallback sur la clé anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[Sync] Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) doivent être définis.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Recherche du fichier payload le plus récent dans le dossier Downloads parent
function getLatestPayload() {
  const downloadsDir = path.join(__dirname, '../..'); // Dossier Downloads (parent de rsg-activation-supabase)
  console.log(`[Sync] Recherche dans le dossier : ${downloadsDir}`);
  
  if (!fs.existsSync(downloadsDir)) {
    console.error(`[Sync] Erreur : Le dossier Downloads à ${downloadsDir} n'existe pas.`);
    return null;
  }

  const files = fs.readdirSync(downloadsDir);
  const payloadFiles = files
    .filter(file => file.startsWith('_qg_payload_') && file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(downloadsDir, file);
      const stat = fs.statSync(filePath);
      return { name: file, path: filePath, mtime: stat.mtimeMs };
    });

  if (payloadFiles.length === 0) {
    console.warn("[Sync] Aucun fichier de type _qg_payload_*.json trouvé dans le dossier Downloads.");
    return null;
  }

  // Trier par date de modification décroissante
  payloadFiles.sort((a, b) => b.mtime - a.mtime);
  
  console.log(`[Sync] Fichier trouvé le plus récent : ${payloadFiles[0].name}`);
  return payloadFiles[0].path;
}

async function run() {
  const latestPayloadPath = getLatestPayload();
  if (!latestPayloadPath) {
    console.error("[Sync] Impossible de continuer sans fichier payload.");
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(latestPayloadPath, 'utf8');
    const payload = JSON.parse(rawData);

    if (!payload.news || !Array.isArray(payload.news)) {
      console.error("[Sync] Erreur : Le fichier payload ne contient pas de tableau 'news' valide.");
      process.exit(1);
    }

    console.log(`[Sync] Lecture de ${payload.news.length} actualités depuis le payload...`);

    // Préparer les actualités pour l'upsert
    const newsToUpsert = payload.news.map((item, index) => {
      // Pour simuler la fraîcheur de 24/48h sur le site, on peut ajuster la date réelle de publication
      // en fonction de son index ou de sa présence pour simuler un fil d'actualités vivant.
      const now = new Date();
      // On décale de quelques minutes ou heures selon l'index pour étaler la chronologie dans la base de données
      const publishedAt = new Date(now.getTime() - index * 30 * 60 * 1000); // Décalage de 30 mins par article

      return {
        cat: item.cat || 'cine',
        emoji: item.emoji || '📰',
        date_str: item.date || 'Récemment',
        title: item.title,
        text: item.text,
        hot: !!item.hot,
        published_at: publishedAt.toISOString()
      };
    });

    console.log("[Sync] Lancement de la synchronisation Supabase...");
    
    const { data, error } = await supabase
      .from('news')
      .upsert(newsToUpsert, { onConflict: 'title' });

    if (error) {
      throw error;
    }

    console.log(`[Sync] Succès ! ${newsToUpsert.length} actualités ont été synchronisées dans la table 'news'.`);
  } catch (err) {
    console.error("[Sync] Une erreur est survenue lors de la synchronisation :", err.message);
    process.exit(1);
  }
}

run();
