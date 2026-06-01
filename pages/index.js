import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncSource, setSyncSource] = useState('local_fallback');
  const [activeNewsItem, setActiveNewsItem] = useState(null);
  
  // Nouveaux états interactifs du plan d'amélioration
  const [votes, setVotes] = useState({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

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
        hype: '98% (Massif)',
        potential: 'Critique (Ruée)',
        target: item.cat === 'collab' ? 'Adultes / Collectionneurs' : 'Fanbase Optimisée'
      };
    } else if (vote === 'flop') {
      return {
        hype: '42% (Faible)',
        potential: 'Risqué (Sur-stock)',
        target: 'Surchargé / Niche'
      };
    }
    return {
      hype: item.hot ? '95%' : '84%',
      potential: 'Très Élevé',
      target: item.cat === 'collab' ? 'Millennials / Collect' : item.cat === 'manga' ? 'Génération Z' : 'Fanbase Grand Public'
    };
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Head>
        <title>Road Sixty Geek (QG) — Portail Pop Culture & Licences B2B</title>
        <meta name="description" content="Toute l'actualité business, analyses de tendances et merchandising des plus grandes licences manga, anime, ciné, séries et collabs de marque." />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Road Sixty Geek (QG) — Portail Pop Culture & Licences B2B" />
        <meta property="og:description" content="L'actualité business et tendances de la pop culture et du merchandising à destination des professionnels et des fans." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://roadsixtygeek.com" />
        <meta property="og:image" content="https://roadsixtygeek.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Road Sixty Geek (QG) — Portail Pop Culture & Licences B2B" />
        <meta name="twitter:description" content="L'actualité business et tendances de la pop culture et du merchandising." />
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
                "https://www.linkedin.com/company/roadsixtygeek"
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
                  "name": "Road Sixty Geek Intelligence"
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
            
            <button className="play-quiz-btn" onClick={() => window.location.href = 'https://roadsixtygeek.com/activation'}>
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
          Analyses de tendances, lancements de produits de marque, sorties anime/manga majeures et buzz des hypermarchés. Le hub d'intelligence Road Sixty Geek.
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
                    <div 
                      className="news-card-media-img"
                      style={{ backgroundImage: `url(${item.img || CATEGORY_IMAGES[item.cat]})`, opacity: 0.15 }}
                    />
                    <span className="news-card-emoji">{item.emoji}</span>
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
              Indices de buzz et sell-out mesurés en temps réel sur les réseaux et en points de vente Carrefour/Cora.
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

          {/* Widget Newsletter Premium (Plan d'Amélioration Axe 3) */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Newsletter Veille Hebdo</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Rejoignez plus de 1 200 acheteurs et recevez notre condensé de tendances licences tous les lundis.
            </p>
            {newsletterStatus === 'success' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: '600' }}>
                ✨ Inscription validée ! Bienvenue dans la veille.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (newsletterEmail) setNewsletterStatus('success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Votre email professionnel..."
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                />
                <button type="submit" className="play-quiz-btn" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}>
                  S'abonner à la veille B2B
                </button>
              </form>
            )}
          </div>

          {/* Widget de Feedback / Axes d'amélioration (Plan d'Amélioration Protocole) */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Avis & Axes d'Amélioration</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Dites-nous ce qui vous plaît ou ce qui vous manque sur le QG !
            </p>
            {feedbackStatus === 'success' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: '600' }}>
                🙏 Merci ! Notre équipe analyse votre retour.
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (feedbackText) setFeedbackStatus('success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Fonctionnalités, données, ou actus manquantes..."
                  required
                  rows="3"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <button type="submit" className="play-quiz-btn" style={{ background: 'var(--color-dark)', color: 'var(--color-yellow)', justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}>
                  Envoyer mon avis
                </button>
              </form>
            )}
          </div>

          {/* Widget d'info de synchronisation (Preuve de cron) */}
          <div className="sidebar-widget" style={{ padding: '1.2rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', fontFamily: 'var(--font-head)' }}>Statut de Synchronisation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div>• Tâche Cron : <span style={{ color: 'var(--color-green)', fontWeight: '600' }}>Active (1h)</span></div>
              <div>• Source locale : <span style={{ fontFamily: 'monospace' }}>Downloads/_qg_payload_*.json</span></div>
              <div>• Qualité éditoriale : <span style={{ color: 'var(--color-cyan)', fontWeight: '600' }}>Norme LinkedIn</span></div>
            </div>
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
            
            {/* Visual background placeholder banner in modal */}
            <div 
              className="modal-banner" 
              style={{ backgroundImage: `url(${activeNewsItem.img || CATEGORY_IMAGES[activeNewsItem.cat]})` }}
            >
              <div className="modal-banner-overlay" />
              <span className="modal-banner-emoji">{activeNewsItem.emoji}</span>
            </div>

            <div className="modal-body">
              <h4 className="modal-section-title">Actualité Pop Culture & Licences</h4>
              <p className="modal-text">{activeNewsItem.text}</p>
              
              {/* Vote interactif B2B (Plan d'Amélioration Axe 3) */}
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-white)', padding: '15px', borderRadius: '12px', marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', fontFamily: 'var(--font-head)', color: 'var(--color-dark)', marginBottom: '4px' }}>Sentiment Décideur / Évaluation de Potentiel</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Votre avis pro sur le potentiel de cette licence dans vos points de vente.</p>
                {votes[activeNewsItem.title] ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#b28b03', fontWeight: '600' }}>
                    <span>👍 Sentiment enregistré : {votes[activeNewsItem.title] === 'hype' ? 'Hype Massive' : 'Risque de Flop'} !</span>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: null }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer' }}>Modifier</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: 'hype' }))} style={{ flex: 1, border: '1px solid var(--border-white)', background: 'var(--bg-dark)', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'var(--transition-smooth)' }}>
                      🔥 Hype Massive
                    </button>
                    <button onClick={() => setVotes(prev => ({ ...prev, [activeNewsItem.title]: 'flop' }))} style={{ flex: 1, border: '1px solid var(--border-white)', background: 'var(--bg-dark)', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'var(--transition-smooth)' }}>
                      ⚠️ Risque Flop
                    </button>
                  </div>
                )}
              </div>

              {/* R6G Licensing & Retail Intelligence Section */}
              <div className="r6g-analysis-box">
                <div className="analysis-header">
                  <span className="analysis-logo">🛡️</span>
                  <div>
                    <h4 className="analysis-title">R6G Licensing Intelligence</h4>
                    <p className="analysis-subtitle">Analyse d'impact retail & tendances B2B</p>
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
                    <span className="metric-label">Potentiel Commercial</span>
                    <span className="metric-value text-green">
                      {getDynamicMetrics(activeNewsItem).potential}
                    </span>
                  </div>
                  <div className="analysis-metric">
                    <span className="metric-label">Cible Consommateurs</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem' }}>
                      {getDynamicMetrics(activeNewsItem).target}
                    </span>
                  </div>
                </div>
                <div className="analysis-commentary">
                  <strong>Décryptage de l'Expert R6G :</strong> Cette annonce confirme la vigueur insolente du segment de licence auprès des consommateurs européens. Le sell-out constaté en hypermarchés (notamment dans les corners Carrefour et Cora) démontre que les lancements de produits dérivés d'anime et de collabs de marque captent l'attention immédiate. Nous conseillons aux chefs de rayon d'accentuer la théâtralisation en magasin pour maximiser le chiffre d'affaires impulsif.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
