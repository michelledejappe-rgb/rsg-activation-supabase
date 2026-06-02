import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Protection contre les appels malveillants/abusifs
  // En production, Vercel ajoute un en-tête d'autorisation contenant le CRON_SECRET sécurisé.
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // On préfère la clé de rôle de service en écriture pour contourner les blocages RLS
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      message: "Variables de connexion Supabase manquantes dans Vercel."
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const githubRepo = "michelledejappe-rgb/rsg-activation-supabase";
  
  try {
    console.log(`[Cloud Cron] Récupération des fichiers du dépôt : ${githubRepo}`);
    
    // Configurer les en-têtes pour l'API GitHub
    const headers = {
      'User-Agent': 'RSG-QG-Cloud-Cron'
    };
    
    // Si un jeton GitHub est configuré pour un dépôt privé, l'utiliser
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 2. Appeler l'API GitHub pour lister les fichiers à la racine
    const filesRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/`, { headers });
    
    if (!filesRes.ok) {
      const errText = await filesRes.text();
      throw new Error(`Erreur API GitHub (${filesRes.status}) : ${errText}`);
    }

    const files = await filesRes.json();
    
    if (!Array.isArray(files)) {
      throw new Error("L'API GitHub n'a pas retourné une liste de fichiers valide.");
    }

    // Filtrer pour trouver les fichiers de type _qg_payload_*.json
    const payloadFiles = files
      .filter(file => file.name.startsWith('_qg_payload_') && file.name.endsWith('.json'))
      .map(file => ({
        name: file.name,
        downloadUrl: file.download_url
      }));

    if (payloadFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun fichier de type _qg_payload_*.json trouvé dans le dépôt GitHub."
      });
    }

    // Trier les fichiers par nom de manière alphabétique décroissante (les dates dans les noms trient le plus récent en premier)
    // Exemple : _qg_payload_20260526.json > _qg_payload_20260524.json
    payloadFiles.sort((a, b) => b.name.localeCompare(a.name));
    
    const latestFile = payloadFiles[0];
    console.log(`[Cloud Cron] Fichier payload sélectionné : ${latestFile.name}`);

    // 3. Télécharger le contenu du fichier sélectionné
    const downloadRes = await fetch(latestFile.downloadUrl, { headers });
    if (!downloadRes.ok) {
      throw new Error(`Impossible de télécharger le contenu du fichier depuis GitHub.`);
    }

    const payload = await downloadRes.json();

    if (!payload.news || !Array.isArray(payload.news)) {
      throw new Error("Le format du payload JSON n'est pas valide (tableau 'news' manquant).");
    }

    console.log(`[Cloud Cron] Traitement de ${payload.news.length} actualités...`);

    // Préparer les données avec étalement temporel pour simuler une activité dynamique récente
    const newsToUpsert = payload.news.map((item, index) => {
      const now = new Date();
      const publishedAt = new Date(now.getTime() - index * 30 * 60 * 1000); // 30 minutes de décalage chronologique

      return {
        cat: item.cat || 'cine',
        emoji: item.emoji || '📰',
        date_str: item.date || 'Récemment',
        title: item.title,
        text: item.text,
        hot: !!item.hot,
        img: item.img || null, // Préservation de l'image de produit exacte extraite par le Cron
        published_at: publishedAt.toISOString()
      };
    });

    console.log("[Cloud Cron] Synchronisation en cours vers Supabase...");

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
      message: `Synchronisation réussie depuis le fichier ${latestFile.name}`,
      items_count: newsToUpsert.length
    });

  } catch (err) {
    console.error("[Cloud Cron] Erreur critique :", err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
