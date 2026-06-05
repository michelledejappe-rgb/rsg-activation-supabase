import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { slugify } from '../lib/slug';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncSource, setSyncSource] = useState('local_fallback');
  const [activeNewsItem, setActiveNewsItem] = useState(null);
  
  // Nouveaux états interactifs du plan d'amélioration B2C
  const [votes, setVotes] = useState({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  // États de l'Insta-Story Studio B2C
  const [showStoryStudio, setShowStoryStudio] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState('hype');
  const [generatingStory, setGeneratingStory] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Copier l'URL propre de l'article (pour les liens "lire la suite" en story)
  const fallbackCopy = (text, done) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); done();
    } catch (e) { /* silencieux */ }
  };
  const copyArticleLink = () => {
    if (!activeNewsItem) return;
    const link = `https://roadsixtygeek.com/actu/${slugify(activeNewsItem.title)}`;
    const done = () => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(() => fallbackCopy(link, done));
    } else {
      fallbackCopy(link, done);
    }
  };

  const [trends, setTrends] = useState([
    { name: 'One Piece (Arc Elbaph)', value: 0, target: 94 },
    { name: 'Star Wars (The Mandalorian)', value: 0, target: 87 },
    { name: 'Toy Story 5 (Pixar)', value: 0, target: 79 },
    { name: 'Care Bears × Adidas', value: 0, target: 72 }
  ]);

  // Récupérer les actualités depuis notre API
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        const json = await res.json();
        if (json.success && json.data) {
          setNews(json.data);
          setSyncSource(json.source);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des actualités :", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  // Déclencher l'animation des barres de tendance dans la sidebar après le chargement
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      setTrends(prev => prev.map(t => ({ ...t, value: t.target })));
    }, 150);
    return () => clearTimeout(timer);
  }, [loading]);

  // Régénérer l'image de Story dès que le studio s'ouvre ou que le sticker change
  useEffect(() => {
    if (showStoryStudio && activeNewsItem) {
      renderStory(selectedSticker);
    }
  }, [showStoryStudio, selectedSticker, activeNewsItem]);

  // Fonction de rendu Canvas pour générer un visuel Story HD (1080x1920 px)
  // Fonction de rendu DOM-to-Image pour générer un visuel Story HD (1080x1920 px) digne d'une agence
  const renderStory = async (stickerType) => {
    if (!activeNewsItem) return;
    setGeneratingStory(true);
    
    try {
      // Import dynamique côté client de html-to-image (SSR-safe)
      const htmlToImage = await import('html-to-image');
      
      // Attendre un court cycle pour s'assurer du rendu correct du DOM Next.js
      setTimeout(async () => {
        const node = document.getElementById('r6g-story-template');
        if (!node) {
          setGeneratingStory(false);
          return;
        }
        
        try {
          // Génération d'une URL de données PNG avec un ratio de pixels doublé pour une netteté absolue (Retina 300DPI)
          const dataUrl = await htmlToImage.toPng(node, {
            pixelRatio: 2,
            skipFonts: true,
            width: 1080,
            height: 1920,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }
          });
          setStoryImageUrl(dataUrl);
        } catch (err) {
          console.error("[Story Studio] Erreur html-to-image rendering:", err);
        } finally {
          setGeneratingStory(false);
        }
      }, 400);
    } catch (e) {
      console.error("[Story Studio] Erreur import dynamique html-to-image:", e);
      setGeneratingStory(false);
    }
  };

  // Helper pour convertir une image base64 en Blob sans fetch (robuste sur tous les navigateurs)
  const dataURLtoBlob = (dataurl) => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Error converting data URL to blob:", e);
      return null;
    }
  };

  // Partager le fichier PNG nativement (Web Share API)
  const shareStory = async () => {
    if (!storyImageUrl) return;
    try {
      const blob = dataURLtoBlob(storyImageUrl);
      if (!blob) {
        triggerDownload();
        return;
      }
      
      const file = new File([blob], `R6G_Story_${activeNewsItem.cat}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Road Sixty Geek Story`,
          text: `Découvre les nouveautés Pop Culture !`
        });
      } else {
        triggerDownload();
      }
    } catch (err) {
      console.error("Share error:", err);
      triggerDownload();
    }
  };

  // Télécharger l'image PNG en fallback
  const triggerDownload = () => {
    if (!storyImageUrl) return;
    const link = document.createElement('a');
    link.download = `R6G_Story_${activeNewsItem.cat}_${Date.now()}.png`;
    link.href = storyImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helpers pour le Canvas
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        lines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    return lines;
  }

  // Dictionnaire de traduction et emojis pour les catégories
  const CATEGORIES = {
    all: { label: 'Toutes les actus', emoji: '🔥' },
    cine: { label: 'Ciné / Box Office', emoji: '🎬' },
    series: { label: 'Séries / Netflix', emoji: '📺' },
    anime: { label: 'Anime / Streaming', emoji: '🪚' },
    manga: { label: 'Mangas / Éditions', emoji: '📖' },
    collab: { label: 'Collabs / Merch', emoji: '🧸' }
  };

  // Filtrer les actualités par catégorie et par recherche textuelle
  const filteredNews = news.filter(item => {
    const matchesCat = selectedCat === 'all' || item.cat === selectedCat;
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Séparer les actualités pour la Mosaïque "À la Une" (Hero Grid)
  let mosaicMain = null;
  let mosaicSide = [];
  let feedNews = [];

  if (filteredNews.length > 0) {
    const hotIndex = filteredNews.findIndex(item => item.hot);
    const mainIndex = hotIndex !== -1 ? hotIndex : 0;
    
    mosaicMain = filteredNews[mainIndex];
    
    // Reste des actus pour la mosaïque latérale (3 max)
    const remaining = filteredNews.filter((_, idx) => idx !== mainIndex);
    mosaicSide = remaining.slice(0, 3);
    
    // Le reste va dans le flux d'actualités classique (Feed)
    feedNews = remaining.slice(3);
  }

  // Vérifier si une actualité a moins de 48h
  function isFresh(publishedAt) {
    if (!publishedAt) return false;
    const now = new Date();
    const pubDate = new Date(publishedAt);
    const diffHours = Math.abs(now - pubDate) / 3600000;
    return diffHours <= 48;
  }

  // Formater l'affichage de l'heure
  function getDisplayTime(item) {
    if (!item.published_at) return item.date_str || 'Récemment';
    
    const now = new Date();
    const pubDate = new Date(item.published_at);
    const diffMins = Math.floor(Math.abs(now - pubDate) / 60000);
    
    if (diffMins < 60) {
      return `Il y a ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    }
    
    return item.date_str || pubDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // Obtenir des visuels en arrière-plan cohérents pour la Pop Culture (fallback si pas d'image spécifique)
  const CATEGORY_IMAGES = {
    cine: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    series: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop',
    anime: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    manga: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    collab: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?q=80&w=600&auto=format&fit=crop'
  };

  // Calculer l'indice de Hype dynamique selon le vote de l'utilisateur
  function getDynamicMetrics(item) {
    const vote = votes[item.title];
    if (vote === 'hype') {
      return {
        hype: '98% (Légendaire)',
        potential: 'Impatient (Haut)',
        target: '100% de Likes'
      };
    } else if (vote === 'flop') {
      return {
        hype: '42% (Moyen)',
        potential: 'Mitigé',
        target: 'Avis partagés'
      };
    }
    return {
      hype: item.hot ? '95%' : '84%',
      potential: item.hot ? 'Légendaire' : 'Énorme',
      target: item.hot ? 'Hype Générale' : 'Très Attendu'
    };
  }

  // Obtenir un commentaire de la Rédac dynamique et réactif selon la catégorie et le vote
  function getDynamicComment(item) {
    const vote = votes[item.title];
    if (vote === 'hype') {
      return `🔥 Fandom en ébullition ! Votre vote "Direct dans ma collection" rejoint l'avis unanime de notre communauté. Cette nouveauté s'impose déjà comme un classique incontournable du moment. Attendez-vous à un épuisement rapide des stocks dès son lancement officiel !`;
    } else if (vote === 'flop') {
      return `💸 Avis de sagesse ! En choisissant de "passer votre tour", vous reflétez une frange prudente des collectionneurs. Entre prix élevés et exclusivités parfois superflues, la communauté conseille d'attendre des retours plus poussés avant d'investir. Un choix réfléchi.`;
    }
    
    switch (item.cat) {
      case 'collab':
        return `🤝 La folie du cross-licensing ! Les collaborations de marques comme LEGO, Uniqlo ou Casio continuent de dominer le retail de pop-culture. Les fans apprécient particulièrement les accessoires exclusifs offerts à l'achat. Préparez-vous à des files d'attente virtuelles !`;
      case 'anime':
        return `🌸 L'âge d'or de l'animation ! Qu'il s'agisse d'ufotable ou de MAPPA, chaque visuel ou annonce d'anniversaire fait trembler la fanbase. L'engagement organique constaté sur les réseaux présage un engouement massif sur tous les produits dérivés et figurines de la licence.`;
      case 'manga':
        return `📖 Édition en effervescence ! Qu'il s'agisse d'un cap de ventes historique ou de l'entrée dans un arc final, le public français confirme son amour inconditionnel pour les versions collectors reliées. Les librairies et corners de grande distribution s'attendent à un trafic record.`;
      case 'cine':
        return `🎬 Box-office pop-culturel ! Les géants du divertissement déploient des trésors de promotion pour leurs blockbusters d'animation ou de super-héros. Cet impact culturel direct va se traduire par un raz-de-marée de merchandising en magasin spécialisé tout au long de la saison.`;
      case 'series':
        return `📺 La guerre du streaming ! L'arrivée surprise de licences fortes ou de suites d'animés sur Netflix et Crunchyroll maintient le fandom sous tension créative. Un booster d'audiences exceptionnel qui soutient également la valorisation des collections physiques associées.`;
      default:
        return `🛡️ L'avis du QG : Une annonce passionnante qui fait déjà vibrer la communauté geek. L'engouement sur notre fil Instagram montre que les passionnés attendent ce drop de pied ferme. Un événement pop-culturel majeur à suivre de très près !`;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Head>
        <title>Road Sixty Geek (QG) — Actu Pop Culture, Mangas & Licences</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Découvrez toute l'actualité pop culture, mangas, animes, cinéma et les collabs de marque les plus folles !" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <link rel="canonical" href="https://roadsixtygeek.com" />
        <meta property="og:title" content="Road Sixty Geek (QG) — Actu Pop Culture, Mangas & Licences" />
        <meta property="og:description" content="Le portail ultime des nouveautés pop culture, mangas, animes, séries et drops collectors !" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://roadsixtygeek.com" />
        <meta property="og:image" content="https://roadsixtygeek.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Road Sixty Geek (QG) — Actu Pop Culture, Mangas & Licences" />
        <meta name="twitter:description" content="Le portail ultime des nouveautés pop culture et drops collectors." />
        <meta name="twitter:image" content="https://roadsixtygeek.com/logo.png" />
        
        {/* Données Structurées JSON-LD pour l'Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              "name": "Road Sixty Geek QG",
              "url": "https://roadsixtygeek.com",
              "logo": "https://roadsixtygeek.com/logo.png",
              "sameAs": [
                "https://www.instagram.com/roadsixtygeek"
              ]
            })
          }}
        />
        
        {/* Données Structurées JSON-LD dynamiques par article */}
        {activeNewsItem && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": activeNewsItem.title,
                "description": activeNewsItem.text,
                "datePublished": activeNewsItem.published_at || new Date().toISOString(),
                "image": activeNewsItem.img || "https://roadsixtygeek.com/logo.png",
                "author": {
                  "@type": "Organization",
                  "name": "Road Sixty Geek"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Road Sixty Geek QG",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://roadsixtygeek.com/logo.png"
                  }
                }
              })
            }}
          />
        )}
      </Head>

      {/* Lueurs d'ambiance en arrière-plan */}
      <div className="ambient-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
        <div className="glow-3"></div>
      </div>

      {/* Header Premium */}
      <header className="qg-header">
        <div className="header-container">
          <Link href="/" className="logo-section">
            <img src="/logo.png" alt="Road Sixty Geek Logo" className="logo-img" />
            <span className="logo-text">ROAD SIXTY GEEK</span>
            <span className="logo-tag">QG Actu</span>
          </Link>

          <div className="header-meta">
            {syncSource === 'supabase' ? (
              <div className="sync-badge">
                <span className="sync-dot"></span>
                Base de données Live
              </div>
            ) : (
              <div className="sync-badge fallback">
                <span className="sync-dot"></span>
                Payload local synchronisé
              </div>
            )}
            
            <a className="play-quiz-btn" href="https://meet.roadsixtygeek.com" target="_blank" rel="noopener noreferrer">
              🎤 Meet-Up
            </a>
            <button className="play-quiz-btn" onClick={() => window.location.href = '/activation'}>
              🎮 Jouer au Challenge
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header d'Introduction */}
      <section className="qg-hero-header">
        <p className="hero-subtitle">Veille Pop Culture & Merchandising</p>
        <h1 className="hero-title">Le Portail Officiel des Licences & IP</h1>
        <p className="hero-desc">
          Les dernières tendances pop culture, lancements collectors de marques cultes, sorties manga/anime incontournables et buzz de la communauté. Le hub officiel de Road Sixty Geek.
        </p>
      </section>

      {/* Zone Mosaïque de la Une (Jeuxvideo.com Style) */}
      <section className="qg-mosaic-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chargement du portail pop culture...</div>
        ) : filteredNews.length === 0 ? (
          <div className="no-news-message">
            <h3>Aucune actualité ne correspond à vos filtres</h3>
            <p style={{ marginTop: '8px' }}>Essayez d'élargir votre recherche ou de changer d'onglet.</p>
          </div>
        ) : (
          <div className="mosaic-grid">
            {/* Grand article principal à la Une */}
            {mosaicMain && (
              <div className="mosaic-main" onClick={() => setActiveNewsItem(mosaicMain)}>
                <div 
                  className="mosaic-bg-image" 
                  style={{ backgroundImage: `url(${mosaicMain.img || CATEGORY_IMAGES[mosaicMain.cat]})` }}
                />
                <div className="mosaic-overlay" />
                <div className="mosaic-content">
                  <div className="badge-group">
                    <span className={`category-tag cat-${mosaicMain.cat}`}>
                      {mosaicMain.emoji} {CATEGORIES[mosaicMain.cat]?.label}
                    </span>
                    {mosaicMain.hot && <span className="hot-badge">🔥 À la Une</span>}
                    {isFresh(mosaicMain.published_at) && <span className="fresh-badge">⚡ Nouveau</span>}
                  </div>
                  <h2 className="mosaic-title">{mosaicMain.title}</h2>
                  <p className="mosaic-text">{mosaicMain.text}</p>
                  <span className="mosaic-date">{getDisplayTime(mosaicMain)}</span>
                </div>
              </div>
            )}

            {/* Articles secondaires empilés à droite (3 articles max) */}
            <div className="hero-side-stack">
              {mosaicSide.map((item, idx) => (
                <div key={idx} className="mosaic-side-card" onClick={() => setActiveNewsItem(item)}>
                  <div 
                    className="side-card-bg-image" 
                    style={{ backgroundImage: `url(${item.img || CATEGORY_IMAGES[item.cat]})` }}
                  />
                  <div className="side-card-overlay" />
                  <div className="side-card-content">
                    <div className="badge-group" style={{ gap: '5px' }}>
                      <span className={`category-tag cat-${item.cat}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {item.emoji} {CATEGORIES[item.cat]?.label.split(' / ')[0]}
                      </span>
                      {isFresh(item.published_at) && <span className="fresh-badge" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>⚡</span>}
                    </div>
                    <h3 className="side-card-title">{item.title}</h3>
                    <p className="side-card-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.45', marginTop: '2px' }}>{item.text}</p>
                    <span className="mosaic-date" style={{ fontSize: '0.7rem' }}>{getDisplayTime(item)}</span>
                  </div>
                </div>
              ))}
              {/* Si moins de 3 articles secondaires, boucher le trou proprement */}
              {mosaicSide.length === 0 && (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: 'var(--bg-glass)', border: '1px dashed var(--border-white)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  Plus d'actualités à venir
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Mise en page principale en 2 colonnes */}
      <main className="qg-main-layout">
        
        {/* Colonne de gauche : Filtres + Flux d'actus */}
        <section>
          <div className="qg-filter-bar">
            <div className="category-tabs">
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  className={`tab-btn ${selectedCat === key ? 'active' : ''}`}
                  onClick={() => setSelectedCat(key)}
                >
                  {value.emoji} {value.label}
                </button>
              ))}
            </div>

            <div className="search-wrapper">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une actu..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="news-feed-container">
            {feedNews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border-white)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                Pas d'autres actualités dans cette catégorie. Restez à l'écoute !
              </div>
            ) : (
              feedNews.map((item, idx) => (
                <div key={idx} className="news-card-item" onClick={() => setActiveNewsItem(item)}>
                  <div className="news-card-media">
                    {item.img ? (
                      <div 
                        className="news-card-media-img"
                        style={{ backgroundImage: `url(${item.img})`, opacity: 1 }}
                      />
                    ) : (
                      <>
                        <div 
                          className="news-card-media-img"
                          style={{ backgroundImage: `url(${CATEGORY_IMAGES[item.cat]})`, opacity: 0.15 }}
                        />
                        <span className="news-card-emoji">{item.emoji}</span>
                      </>
                    )}
                  </div>

                  <div className="news-card-info">
                    <div className="news-card-title-row">
                      <h4 className="news-card-title">{item.title}</h4>
                      {isFresh(item.published_at) && <span className="fresh-badge" style={{ fontSize: '0.65rem' }}>⚡ Nouveau</span>}
                    </div>
                    <p className="news-card-text">{item.text}</p>
                    <div className="news-card-meta">
                      <div className="meta-left">
                        <span className={`category-tag cat-${item.cat}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {CATEGORIES[item.cat]?.label}
                        </span>
                      </div>
                      <span>{getDisplayTime(item)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Colonne de droite : Sidebar (Tendances & Raccourcis de marque) */}
        <aside className="qg-sidebar">
          
          {/* Widget de tendances de vente des Licences */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Tendances Licences IP</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Les licences les plus recherchées et validées par la communauté en direct des réseaux sociaux.
            </p>
            <div className="trends-list">
              {trends.map((item, idx) => (
                <div key={idx} className="trend-item">
                  <div className="trend-info">
                    <span className="trend-name">{item.name}</span>
                    <span className="trend-percentage">{item.value}%</span>
                  </div>
                  <div className="trend-bar-bg">
                    <div className="trend-bar-fill" style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget Instagram B2C */}
          <div className="sidebar-widget" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(219, 39, 119, 0.08) 0%, transparent 60%), var(--bg-dark)', borderColor: 'rgba(219, 39, 119, 0.15)' }}>
            <h3 className="widget-title" style={{ borderBottomColor: 'var(--color-pink)' }}>Rejoignez le Club Instagram !</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Suivez-nous sur **@roadsixtygeek** pour les coulisses, les unboxings collectors, les concours exclusifs et votez pour les prochains drops de la boutique !
            </p>
            <a 
              href="https://www.instagram.com/roadsixtygeek" 
              target="_blank" 
              rel="noopener noreferrer"
              className="play-quiz-btn"
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #c13584 0%, #e1306c 100%)', color: 'white', borderColor: 'transparent', textAlign: 'center' }}
            >
              📸 Suivre @roadsixtygeek
            </a>
          </div>

          {/* Widget Newsletter B2C */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter Road Sixty Geek</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Rejoignez notre communauté de passionnés ! Recevez les alertes des meilleurs drops de la semaine, bons plans et actus pop culture incontournables.
            </p>
            {newsletterStatus === 'success' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: '600' }}>
                ✨ Bienvenue dans le Club ! Inscription validée.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (newsletterEmail) setNewsletterStatus('success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Votre adresse email de passionné..."
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button type="submit" className="play-quiz-btn" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}>
                  S'inscrire au Club Geek
                </button>
              </form>
            )}
          </div>

          {/* Widget de Feedback B2C (Boîte à Idées) */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Votre Boîte à Idées !</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Une idée de drop, de collab de vos rêves ou de sujet d'actualité ? Partagez vos suggestions avec l'équipe Road Sixty Geek !
            </p>
            {feedbackStatus === 'success' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: '600' }}>
                🙏 Merci ! Votre idée a bien été envoyée à l'équipe.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (feedbackText) setFeedbackStatus('success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Quelle collab ou drop aimeriez-vous voir..."
                  required
                  rows="3"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <button type="submit" className="play-quiz-btn" style={{ background: 'var(--bg-dark)', color: 'var(--color-yellow)', justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}>
                  Envoyer mon idée
                </button>
              </form>
            )}
          </div>

        </aside>
      </main>

      {/* Footer Premium */}
      <footer className="qg-footer">
        <div className="footer-logo">ROAD SIXTY GEEK</div>
        <p>© {new Date().getFullYear()} Road Sixty Geek. Propulsé par Next.js & Supabase.</p>
        <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Tous droits réservés. Les marques et logos mentionnés restent la propriété de leurs titulaires respectifs.
        </p>
      </footer>

      {/* Interactive Premium News Modal */}
      {activeNewsItem && (
        <div className="news-modal-overlay" onClick={() => setActiveNewsItem(null)}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setActiveNewsItem(null)}>
              &times;
            </button>
            <div className="modal-header-section">
              <span className={`category-tag cat-${activeNewsItem.cat}`}>
                {activeNewsItem.emoji} {CATEGORIES[activeNewsItem.cat]?.label}
              </span>
              <span className="modal-date">{getDisplayTime(activeNewsItem)}</span>
            </div>
            <h2 className="modal-title">{activeNewsItem.title}</h2>

            {/* Lien propre de l'article — pour le coller dans une story "lire la suite" */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '2px 0 10px' }}>
              <button onClick={copyArticleLink} className="play-quiz-btn" style={{ fontSize: '0.78rem', padding: '7px 12px' }}>
                {copiedLink ? '✅ Lien copié !' : "🔗 Copier le lien de l'article"}
              </button>
              <a href={`/actu/${slugify(activeNewsItem.title)}`} target="_blank" rel="noopener noreferrer" className="play-quiz-btn" style={{ fontSize: '0.78rem', padding: '7px 12px', textDecoration: 'none', background: 'var(--bg-glass)', color: 'var(--color-dark)' }}>
                ↗ Voir la page
              </a>
            </div>

            {/* Visual background placeholder banner in modal */}
            <div 
              className="modal-banner" 
              style={{ backgroundImage: `url(${activeNewsItem.img || CATEGORY_IMAGES[activeNewsItem.cat]})` }}
            >
              {!activeNewsItem.img && (
                <>
                  <div className="modal-banner-overlay" />
                  <span className="modal-banner-emoji">{activeNewsItem.emoji}</span>
                </>
              )}
            </div>

            <div className="modal-body">
              <h4 className="modal-section-title">Actualité Pop Culture & Licences</h4>
              <p className="modal-text">{activeNewsItem.text}</p>
              
              {/* Vote interactif B2C */}
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '15px', borderRadius: '12px', marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', fontFamily: 'var(--font-head)', color: 'var(--color-dark)', marginBottom: '4px' }}>Votre avis de passionné</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Dites-nous : allez-vous craquer pour cette nouveauté ?</p>
                {votes[activeNewsItem.title] ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#b28b03', fontWeight: '600' }}>
                    <span>{votes[activeNewsItem.title] === 'hype' ? '🔥 Direct dans ma collection !' : '💸 Je passe mon tour'}</span>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: null }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer' }}>Modifier</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: 'hype' }))} style={{ flex: 1, border: '1px solid var(--border-white)', background: 'var(--bg-dark)', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'var(--transition-smooth)' }}>
                      🔥 Direct dans ma collection
                    </button>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: 'flop' }))} style={{ flex: 1, border: '1px solid var(--border-white)', background: 'var(--bg-dark)', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'var(--transition-smooth)' }}>
                      💸 Je passe mon tour
                    </button>
                  </div>
                )}
              </div>

              {/* R6G Licensing & Retail Intelligence Section */}
              <div className="r6g-analysis-box">
                <div className="analysis-header">
                  <span className="analysis-logo">🛡️</span>
                  <div>
                    <h4 className="analysis-title">L'Avis Pop Culture du QG</h4>
                    <p className="analysis-subtitle">Analyses de fans & insights passion</p>
                  </div>
                </div>
                <div className="analysis-grid">
                  <div className="analysis-metric">
                    <span className="metric-label">Indice de Hype</span>
                    <span className="metric-value text-yellow">
                      {getDynamicMetrics(activeNewsItem).hype}
                    </span>
                  </div>
                  <div className="analysis-metric">
                    <span className="metric-label">Niveau d'Attente</span>
                    <span className="metric-value text-green">
                      {getDynamicMetrics(activeNewsItem).potential}
                    </span>
                  </div>
                  <div className="analysis-metric">
                    <span className="metric-label">Hype Instagram</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem' }}>
                      {getDynamicMetrics(activeNewsItem).target}
                    </span>
                  </div>
                </div>
                <div className="analysis-commentary">
                  <strong>Le mot de la Rédac :</strong> {getDynamicComment(activeNewsItem)}
                </div>
              </div>

              {/* Bouton Insta-Story Studio B2C */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-white)', paddingTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowStoryStudio(true)}
                  className="play-quiz-btn"
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: 'black', border: 'none', padding: '12px', fontSize: '0.95rem', borderRadius: '12px' }}
                >
                  📸 Insta-Story Studio (Générer une Story 9:16)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insta-Story Studio Modal Overlay */}
      {showStoryStudio && activeNewsItem && (
        <div className="news-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowStoryStudio(false)}>
          <div className="news-modal-content" style={{ maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowStoryStudio(false)}>
              &times;
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: '800', fontSize: '1.25rem', color: 'var(--color-dark)', marginBottom: '4px' }}>📸 Insta-Story Studio</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Créez un visuel HD 9:16 personnalisé prêt pour Instagram</p>
            </div>

            {/* Zone de prévisualisation de l'image Story générée */}
            <div style={{ position: 'relative', background: '#020617', borderRadius: '12px', border: '1px solid var(--border-white)', display: 'grid', placeItems: 'center', minHeight: '340px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {generatingStory ? (
                <div style={{ color: '#ffffff', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div className="sync-dot" style={{ background: 'var(--color-yellow)', boxShadow: '0 0 10px var(--color-yellow)', width: '12px', height: '12px' }}></div>
                  Génération du visuel HD...
                </div>
              ) : storyImageUrl ? (
                <img 
                  src={storyImageUrl} 
                  alt="Aperçu Story Instagram" 
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'contain' }} 
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Erreur de génération</div>
              )}
            </div>

            {/* Sélecteur de Sticker Hype */}
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Choisissez votre Badge Story</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => setSelectedSticker('hype')}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedSticker === 'hype' ? 'var(--color-yellow)' : 'var(--border-white)',
                    background: selectedSticker === 'hype' ? 'var(--color-yellow-glow)' : 'var(--bg-dark)',
                    color: selectedSticker === 'hype' ? '#b28b03' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  🔥 Hype Maximale
                </button>
                <button 
                  onClick={() => setSelectedSticker('drop')}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedSticker === 'drop' ? '#ef4444' : 'var(--border-white)',
                    background: selectedSticker === 'drop' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-dark)',
                    color: selectedSticker === 'drop' ? '#ef4444' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  🚨 Alerte Drop
                </button>
                <button 
                  onClick={() => setSelectedSticker('pepite')}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedSticker === 'pepite' ? 'var(--color-cyan)' : 'var(--border-white)',
                    background: selectedSticker === 'pepite' ? 'rgba(8, 145, 178, 0.08)' : 'var(--bg-dark)',
                    color: selectedSticker === 'pepite' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  💎 Pépite Geek
                </button>
                <button 
                  onClick={() => setSelectedSticker('collection')}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedSticker === 'collection' ? 'var(--color-green)' : 'var(--border-white)',
                    background: selectedSticker === 'collection' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-dark)',
                    color: selectedSticker === 'collection' ? 'var(--color-green)' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  💸 Direct Collection
                </button>
              </div>
            </div>

            {/* Actions de partage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
              <button 
                onClick={shareStory}
                disabled={generatingStory || !storyImageUrl}
                className="play-quiz-btn"
                style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #c13584 0%, #e1306c 100%)', color: '#ffffff', borderColor: 'transparent', padding: '12px', fontSize: '0.85rem', borderRadius: '10px' }}
              >
                📲 Partager directement en Story
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={triggerDownload}
                  disabled={generatingStory || !storyImageUrl}
                  className="play-quiz-btn"
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-glass)', color: 'var(--color-dark)', borderColor: 'var(--border-white)', padding: '10px', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  💾 Télécharger PNG
                </button>
                <button 
                  onClick={() => setShowStoryStudio(false)}
                  className="play-quiz-btn"
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--color-yellow)', borderColor: 'var(--color-dark)', padding: '10px', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template de Story Masqué (1080x1920 px) - Rendu par html-to-image en tâche de fond */}
      {/* Intégré dans un conteneur technique invisible mais peint à 100% pour contourner les optimisations mobiles de Safari/Chrome */}
      {activeNewsItem && (
        <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', top: 0, left: 0, opacity: 0 }}>
          <div 
            id="r6g-story-template" 
            style={{
              width: '1080px',
              height: '1920px',
              position: 'relative',
              background: 'linear-gradient(180deg, #030712 0%, #080c14 50%, #020617 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontFamily: 'Montserrat, sans-serif',
              overflow: 'hidden',
              boxSizing: 'border-box',
              padding: '80px'
            }}
          >
            {/* Lueurs radiales colorées néon d'ambiance */}
            <div style={{ position: 'absolute', top: '-100px', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.16) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-100px', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(219, 39, 119, 0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
            
            {/* Motif Dot-Grid rétro de Road Sixty Geek */}
            <div className="story-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none' }} />

            {/* 1. Logo Officiel (Abaissé à y=130px dans le template pour la zone de sécurité) */}
            <div style={{ marginTop: '130px', display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
              <img 
                src={typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'} 
                alt="Road Sixty Geek" 
                style={{ width: '280px', height: 'auto' }} 
              />
            </div>

            {/* 2. Cadre Visuel Central (Format 4:5 - y=420px) */}
            <div 
              style={{
                marginTop: '100px',
                width: '920px',
                height: '740px',
                position: 'relative',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8)',
                overflow: 'hidden',
                zIndex: 10
              }}
            >
              {activeNewsItem?.img ? (
                <img 
                  src={typeof window !== 'undefined' && activeNewsItem.img.startsWith('/') ? `${window.location.origin}${activeNewsItem.img}` : activeNewsItem.img} 
                  alt={activeNewsItem.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                /* CONCEPTION GRAPHIQUE "FALLBACK PRESTIGE" DICTIONNAIRE / MOCK */
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #090d16 100%)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Grilles techniques */}
                  <div className="story-fallback-grid" style={{ position: 'absolute', inset: 0, opacity: 0.04 }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(234, 179, 8, 0.12)', top: '10%' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(219, 39, 119, 0.12)', bottom: '10%' }} />
                  
                  {/* Émoji géant en filigrane */}
                  <div style={{ position: 'absolute', fontSize: '360px', opacity: 0.05, userSelect: 'none' }}>
                    {activeNewsItem?.emoji || '📰'}
                  </div>
                  
                  {/* Halo néon central */}
                  <div style={{ position: 'absolute', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.22) 0%, rgba(219, 39, 119, 0.12) 50%, rgba(0,0,0,0) 70%)' }} />
                  
                  {/* Émoji principal */}
                  <div style={{ fontSize: '180px', zIndex: 5, filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))' }}>
                    {activeNewsItem?.emoji || '📰'}
                  </div>

                  {/* Étiquettes techniques stencil style DA */}
                  <div style={{ position: 'absolute', bottom: '40px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '18px', color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '1px' }}>
                    [ RSG // CREATIVE STICKER SYSTEM ]
                  </div>
                  <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '18px', color: 'rgba(255, 255, 255, 0.35)' }}>
                    SYS.NO // {activeNewsItem?.cat?.toUpperCase()}_FLBK
                  </div>
                  <div style={{ position: 'absolute', top: '40px', right: '40px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '18px', color: 'rgba(255, 255, 255, 0.35)' }}>
                    LAT.2026 // QG
                  </div>
                </div>
              )}

              {/* Sticker streetwear slanted diagonal */}
              {selectedSticker && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '30px',
                    right: '30px',
                    transform: 'rotate(2.5deg)',
                    padding: '16px 36px',
                    borderRadius: '12px',
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                    zIndex: 20,
                    background: selectedSticker === 'hype' ? '#eab308' : selectedSticker === 'drop' ? '#ef4444' : selectedSticker === 'pepite' ? '#06b6d4' : '#10b981',
                    color: selectedSticker === 'hype' ? '#000000' : '#ffffff'
                  }}
                >
                  {selectedSticker === 'hype' && '🔥 HYPE MAXIMALE'}
                  {selectedSticker === 'drop' && '🚨 ALERTE DROP'}
                  {selectedSticker === 'pepite' && '💎 PÉPITE GEEK'}
                  {selectedSticker === 'collection' && '💸 DIRECT COLLECTION'}
                </div>
              )}
            </div>

            {/* 3. Carte Typographique dépolie (y=1220px) */}
            <div 
              style={{
                marginTop: '60px',
                width: '920px',
                minHeight: '430px',
                background: 'rgba(10, 15, 30, 0.92)', // Arrière-plan plus sombre et contrasté pour une lisibilité parfaite
                border: '1px solid rgba(255, 255, 255, 0.12)', // Bordure blanche néon fine et nette
                borderRadius: '24px',
                boxSizing: 'border-box',
                padding: '50px 50px 50px 80px',
                position: 'relative',
                zIndex: 10,
                display: 'block' // Passage en display block standard pour contourner les bugs de flexbox SVG sous Safari iOS
              }}
            >
              {/* Règle verticale néon jaune */}
              <div style={{ position: 'absolute', left: '35px', top: '50px', bottom: '50px', width: '6px', background: '#eab308', borderRadius: '4px' }} />

              {/* Catégorie et Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#eab308', letterSpacing: '1.5px', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  {CATEGORIES[activeNewsItem?.cat]?.label?.toUpperCase() || 'ACTU'}
                </span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#94a3b8', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                  • {activeNewsItem ? getDisplayTime(activeNewsItem).toUpperCase() : ''}
                </span>
              </div>

              {/* Titre Impact / Arial Black — Style Streetwear Editorial Ultra-condensé */}
              <h2 
                style={{ 
                  fontSize: '54px', 
                  fontWeight: 900, 
                  color: '#ffffff', 
                  margin: '0 0 24px 0', 
                  padding: 0, 
                  lineHeight: '62px', // Espacement de ligne généreux et protecteur pour éviter toute superposition
                  letterSpacing: '0.5px',
                  fontFamily: '"Impact", "Arial Black", sans-serif', // Fontes streetwear robustes préinstallées sur iOS et Android
                  textTransform: 'uppercase' // Force la DA streetwear prestigieuse
                }}
              >
                {activeNewsItem?.title}
              </h2>

              {/* Excerpt en Helvetica Neue épuré */}
              <p 
                style={{ 
                  fontSize: '26px', 
                  fontWeight: 500, 
                  color: '#cbd5e1', 
                  margin: 0, 
                  padding: 0, 
                  lineHeight: '38px',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' // Standardisé pour la netteté du rendu de petits textes
                }}
              >
                {activeNewsItem?.text?.split('. ')[0] || ''}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
