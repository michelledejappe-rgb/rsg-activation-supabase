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
  const renderStory = (stickerType) => {
    if (!activeNewsItem) return;
    setGeneratingStory(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Fond Dégradé Sombre
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#020617');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Lueurs d'ambiance radiales
    const radialGlowTop = ctx.createRadialGradient(540, 200, 50, 540, 200, 600);
    radialGlowTop.addColorStop(0, 'rgba(234, 179, 8, 0.18)');
    radialGlowTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radialGlowTop;
    ctx.fillRect(0, 0, 1080, 1920);
    
    const radialGlowBottom = ctx.createRadialGradient(540, 1600, 50, 540, 1600, 600);
    radialGlowBottom.addColorStop(0, 'rgba(219, 39, 119, 0.1)');
    radialGlowBottom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radialGlowBottom;
    ctx.fillRect(0, 0, 1080, 1920);

    // Trame de points Dot-Grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 20; x < 1080; x += 40) {
      for (let y = 20; y < 1920; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Charger l'image avec support CORS anonyme
    const mainImg = new Image();
    mainImg.crossOrigin = "anonymous";
    
    const drawContent = () => {
      // Cadre Polaroid Central
      const cardX = 90;
      const cardY = 320;
      const cardW = 900;
      const cardH = 720;
      const cardRadius = 32;
      
      // Ombre du cadre
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.fill();
      
      // Reset de l'ombre
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Image à l'intérieur
      const imgX = cardX + 30;
      const imgY = cardY + 30;
      const imgW = cardW - 60;
      const imgH = cardH - 180;
      const imgRadius = 16;
      
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
      ctx.clip();
      
      try {
        if (mainImg.complete && mainImg.naturalWidth > 0) {
          const imgRatio = mainImg.width / mainImg.height;
          const boxRatio = imgW / imgH;
          let srcX = 0, srcY = 0, srcW = mainImg.width, srcH = mainImg.height;
          
          if (imgRatio > boxRatio) {
            srcW = mainImg.height * boxRatio;
            srcX = (mainImg.width - srcW) / 2;
          } else {
            srcH = mainImg.width / boxRatio;
            srcY = (mainImg.height - srcH) / 2;
          }
          ctx.drawImage(mainImg, srcX, srcY, srcW, srcH, imgX, imgY, imgW, imgH);
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback dégradé néon + émoji si l'image ne charge pas (CORS ou inexistant)
        const neonGrad = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
        neonGrad.addColorStop(0, '#eab308');
        neonGrad.addColorStop(1, '#db2777');
        ctx.fillStyle = neonGrad;
        ctx.fillRect(imgX, imgY, imgW, imgH);
        
        ctx.font = '140px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(activeNewsItem.emoji || '📰', imgX + imgW / 2, imgY + imgH / 2);
      }
      ctx.restore();

      // Texte de la photo Polaroid
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`🛡️ ROAD SIXTY GEEK • ACTUALITÉ`, imgX, imgY + imgH + 45);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '700 26px sans-serif';
      ctx.fillText(getDisplayTime(activeNewsItem).toUpperCase(), imgX, imgY + imgH + 95);

      // Header de la Story
      ctx.textAlign = 'center';
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(540, 100);
      ctx.lineTo(580, 115);
      ctx.lineTo(570, 175);
      ctx.lineTo(540, 200);
      ctx.lineTo(510, 175);
      ctx.lineTo(500, 115);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 40px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('QG', 540, 150);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.fillText('ROAD SIXTY GEEK', 540, 250);

      // Sticker Hype Diagonal
      const STICKERS = {
        hype: { label: '🔥 HYPE MAXIMALE', color: '#eab308', textColor: '#000000' },
        drop: { label: '🚨 ALERTE DROP', color: '#ef4444', textColor: '#ffffff' },
        pepite: { label: '💎 PÉPITE GEEK', color: '#0891b2', textColor: '#ffffff' },
        collection: { label: '💸 DIRECT EN COLLECTION', color: '#10b981', textColor: '#ffffff' }
      };
      
      const sticker = STICKERS[stickerType] || STICKERS.hype;
      
      ctx.save();
      ctx.translate(540, 1100);
      ctx.rotate(-0.05);
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      ctx.fillStyle = sticker.color;
      drawRoundedRect(ctx, -380, -45, 760, 90, 16);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = sticker.textColor;
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`//  ${sticker.label}  //`, 0, 0);
      ctx.restore();

      // Titre & Description de la Story
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      const maxTitleWidth = 900;
      const startX = 90;
      let startY = 1240;
      
      const titleLines = wrapText(ctx, activeNewsItem.title, maxTitleWidth);
      titleLines.forEach(line => {
        ctx.fillText(line, startX, startY);
        startY += 62;
      });
      
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 28px sans-serif';
      startY += 25;
      
      const cleanDesc = activeNewsItem.text.split('. ')[0] + '.';
      const descLines = wrapText(ctx, cleanDesc, maxTitleWidth);
      descLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, startX, startY);
        startY += 42;
      });

      // Footer : Sticker de Lien
      const footerY = 1750;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, 540 - 240, footerY - 45, 480, 90, 45);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#0891b2';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('🔗 roadsixtygeek.com', 540, footerY);

      try {
        const url = canvas.toDataURL('image/png');
        setStoryImageUrl(url);
      } catch (err) {
        console.error("Canvas export error:", err);
      } finally {
        setGeneratingStory(false);
      }
    };
    
    // Chargement intelligent de l'image
    if (activeNewsItem.img) {
      mainImg.onload = drawContent;
      mainImg.onerror = drawContent;
      mainImg.src = `/api/proxy-image?url=${encodeURIComponent(activeNewsItem.img)}`;
    } else {
      setTimeout(drawContent, 50);
    }
  };

  // Partager le fichier PNG nativement (Web Share API)
  const shareStory = async () => {
    if (!storyImageUrl) return;
    try {
      const res = await fetch(storyImageUrl);
      const blob = await res.blob();
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

  return (
    <div className="min-h-screen bg-black text-white relative">
      <Head>
        <title>Road Sixty Geek (QG) — Actu Pop Culture, Mangas & Licences</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Découvrez toute l'actualité pop culture, mangas, animes, cinéma et les collabs de marque les plus folles !" />
        <link rel="icon" href="/favicon.ico" />
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
                  <strong>Le mot de la Rédac :</strong> Cette annonce fait déjà vibrer toute la communauté geek sur les réseaux ! L'engouement constaté notamment sur notre compte Instagram montre que les passionnés attendent ce drop au tournant. Préparez-vous et restez à l'affût, les stocks risquent de s'écouler à vitesse grand V dès la sortie officielle !
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
    </div>
  );
}
