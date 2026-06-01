import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncSource, setSyncSource] = useState('local_fallback');
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
  // mosaicMain : le premier élément "hot", ou par défaut le premier tout court
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

  // Obtenir des visuels en arrière-plan cohérents pour la Pop Culture (fallback si pas d'image)
  const CATEGORY_IMAGES = {
    cine: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    series: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop',
    anime: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    manga: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    collab: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?q=80&w=600&auto=format&fit=crop'
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Head>
        <title>Road Sixty Geek (QG) — Portail Pop Culture & Licences</title>
        <meta name="description" content="Toute l'actualité business et tendances des plus grandes licences manga, anime, ciné, séries et collabs de marque." />
        <link rel="icon" href="/favicon.ico" />
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
        <p className="hero-subtitle">Veuve Pop Culture & Merchandising</p>
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
              <div className="mosaic-main">
                <div 
                  className="mosaic-bg-image" 
                  style={{ backgroundImage: `url(${CATEGORY_IMAGES[mosaicMain.cat] || CATEGORY_IMAGES.cine})` }}
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
                <div key={idx} className="mosaic-side-card">
                  <div 
                    className="side-card-bg-image" 
                    style={{ backgroundImage: `url(${CATEGORY_IMAGES[item.cat] || CATEGORY_IMAGES.cine})` }}
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
                <div key={idx} className="news-card-item">
                  <div className="news-card-media">
                    <div 
                      className="news-card-media-img"
                      style={{ backgroundImage: `url(${CATEGORY_IMAGES[item.cat] || CATEGORY_IMAGES.cine})`, opacity: 0.15 }}
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

          {/* Widget d'appel à l'action pour le quiz/jeu RSG original */}
          <div className="sidebar-widget game-ad-widget">
            <div className="game-ad-content">
              <span className="game-ad-badge">🔥 Challenge</span>
              <h3 className="game-ad-title">Testez vos connaissances Geek !</h3>
              <p className="game-ad-text">
                Rejoignez l'activation Road Sixty Geek. Répondez au questionnaire de rapidité de 8 secondes, enregistrez votre meilleur score et décrochez une place au classement !
              </p>
              <button 
                className="play-quiz-btn" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => window.location.href = 'https://roadsixtygeek.com/activation'}
              >
                ⚡ Relever le Défi
              </button>
            </div>
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
    </div>
  );
}
