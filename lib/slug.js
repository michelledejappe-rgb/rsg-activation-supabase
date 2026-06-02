// =====================================================================
// lib/slug.js — Slug stable et lisible à partir d'un titre d'article.
// Utilisé par la page /actu/[slug] ET la home (bouton « copier le lien »)
// pour garantir des URLs identiques des deux côtés.
// =====================================================================
function slugify(title) {
  return String(title || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/['’`]/g, ' ')
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-')   // tout le reste -> tiret
    .replace(/^-+|-+$/g, '')        // pas de tiret au début/fin
    .slice(0, 80)
    .replace(/-+$/g, '');
}

module.exports = { slugify };
