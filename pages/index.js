import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TOTAL_PAGES = 24;
const pageSrc = (n) => `/magazine/page-${String(n).padStart(2, '0')}.jpg`;

const ACTIVATIONS = [
  { ip: 'One Piece', type: 'Arche immersive', tag: 'Toei · Shueisha', img: '/assets/rsg_one_piece_arche.png' },
  { ip: 'Harry Potter', type: 'Allée centrale magique', tag: 'Warner Bros.', img: '/assets/rsg_harry_potter_allee.png' },
  { ip: 'Star Wars', type: 'Galaxie événement', tag: 'Disney · Lucasfilm', img: '/assets/rsg_retail_star_wars.png' },
  { ip: 'Les Minions', type: 'Banana park', tag: 'Universal · Illumination', img: '/assets/rsg_retail_minions.png' }
];

export default function MagazineHome() {
  const [flipOpen, setFlipOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const [flipDir, setFlipDir] = useState('22px');

  const openFlip = (n = 1) => { setPage(n); setFlipDir('22px'); setFlipOpen(true); };
  const closeFlip = () => setFlipOpen(false);

  const goTo = useCallback((n) => {
    setPage((cur) => {
      const next = Math.max(1, Math.min(TOTAL_PAGES, n));
      setFlipDir(next >= cur ? '26px' : '-26px');
      return next;
    });
  }, []);

  // Navigation clavier + verrou du scroll quand le flipbook est ouvert
  useEffect(() => {
    if (!flipOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeFlip();
      else if (e.key === 'ArrowRight') goTo(page + 1);
      else if (e.key === 'ArrowLeft') goTo(page - 1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [flipOpen, page, goTo]);

  // Précharger les pages voisines pour un feuilletage fluide
  useEffect(() => {
    if (!flipOpen) return;
    [page + 1, page - 1].forEach((n) => {
      if (n >= 1 && n <= TOTAL_PAGES) { const im = new Image(); im.src = pageSrc(n); }
    });
  }, [flipOpen, page]);

  // ── Zoom / défilement des pages (scroll natif = fiable partout) ───
  const [zoom, setZoom] = useState(1);            // 1 = page entière visible
  const [fit, setFit] = useState({ w: 0, h: 0 }); // taille "page entière" (px)
  const [videoOpen, setVideoOpen] = useState(null);
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const tapRef = useRef(0);
  const AR = 1226 / 1719;

  // Couche interactive : vidéos posées sur des pages du magazine (page → vidéo).
  const PAGE_VIDEOS = {
    19: { embed: 'https://www.youtube.com/embed/ap6t0e9Nb0g?start=27&autoplay=1&rel=0', label: 'Voir la vidéo', top: '50%', left: '50%' }
  };

  // Taille de la page qui tient entièrement dans la zone de lecture
  const computeFit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    let fw = H * AR, fh = H;
    if (fw > W) { fw = W; fh = W / AR; }
    setFit({ w: Math.round(fw), h: Math.round(fh) });
  }, [AR]);

  useEffect(() => {
    if (!flipOpen) return;
    const id = setTimeout(computeFit, 0);
    window.addEventListener('resize', computeFit);
    return () => { clearTimeout(id); window.removeEventListener('resize', computeFit); };
  }, [flipOpen, computeFit]);

  // Reset zoom + scroll + vidéo à chaque page / ouverture
  useEffect(() => {
    setZoom(1); setVideoOpen(null);
    if (wrapRef.current) wrapRef.current.scrollTo(0, 0);
  }, [page, flipOpen]);

  const clampZoom = (z) => Math.min(4, Math.max(1, Math.round(z * 100) / 100));
  const zoomBy = (f) => setZoom((z) => clampZoom(z * f));
  // « Ajuster largeur » : la page remplit la largeur (et on défile verticalement)
  const fitWidth = () => {
    const wrap = wrapRef.current;
    if (!wrap || !fit.w) return;
    setZoom(clampZoom((wrap.clientWidth - 4) / fit.w));
    requestAnimationFrame(() => { if (wrapRef.current) wrapRef.current.scrollTo(0, 0); });
  };
  // Double-clic : zoom 1 ↔ 2.2 centré sur le point cliqué
  const toggleZoom = (e) => {
    setZoom((z) => {
      if (z > 1) return 1;
      const nz = 2.2;
      const wrap = wrapRef.current;
      if (wrap && e && typeof e.clientX === 'number') {
        const r = wrap.getBoundingClientRect();
        const cx = (e.clientX - r.left + wrap.scrollLeft) * nz / z;
        const cy = (e.clientY - r.top + wrap.scrollTop) * nz / z;
        requestAnimationFrame(() => {
          if (!wrapRef.current) return;
          wrapRef.current.scrollLeft = cx - r.width / 2;
          wrapRef.current.scrollTop = cy - r.height / 2;
        });
      }
      return nz;
    });
  };

  // Déplacement : scroll natif (tactile) + glisser-pour-déplacer (souris)
  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') {
      const now = Date.now();
      if (now - tapRef.current < 300) toggleZoom(e);
      tapRef.current = now;
      return; // le tactile défile nativement
    }
    const wrap = wrapRef.current;
    if (!wrap || zoom <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop };
    if (wrap.setPointerCapture) { try { wrap.setPointerCapture(e.pointerId); } catch (err) {} }
  };
  const onPointerMove = (e) => {
    const wrap = wrapRef.current;
    if (!wrap || !dragRef.current) return;
    wrap.scrollLeft = dragRef.current.sl - (e.clientX - dragRef.current.x);
    wrap.scrollTop = dragRef.current.st - (e.clientY - dragRef.current.y);
  };
  const onPointerUp = () => { dragRef.current = null; };

  return (
    <div className="mag">
      <Head>
        <title>Road Sixty Geek — La marque pop culture de Carrefour | Licensing & Retail</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Road Sixty Geek, la marque pop culture de Carrefour imaginée et opérée par Gencode. Licences, activations en magasin et communautés : 5,8M de fans, 200 espaces partout en France." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/magazine.css" />
        <link rel="canonical" href="https://roadsixtygeek.com" />
        <meta property="og:title" content="Road Sixty Geek — La marque pop culture de Carrefour" />
        <meta property="og:description" content="Licences, activations en magasin et communautés. 5,8M de fans, 200 espaces partout en France. Un concept Gencode." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://roadsixtygeek.com" />
        <meta property="og:image" content="https://roadsixtygeek.com/magazine/page-01.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="mag-bar">
        <div className="mag-bar-in">
          <Link href="/" className="mag-logo">
            <img src="/logo.png" alt="Road Sixty Geek" />
            <span className="disp">Road Sixty Geek</span>
          </Link>
          <nav className={`mag-nav ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)}>
            <button className="mag-cta" style={{ background: 'transparent', color: '#ee7a1b', border: '1px solid #2a2a30' }} onClick={() => openFlip(1)}>Le magazine</button>
            <Link href="/qg" style={{ color: '#b8b3a8', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>Actu</Link>
            <a href="mailto:kauffman.david@gmail.com?subject=Licensing%20Day%20—%20Projet%20licence" className="mag-cta">Une question ?</a>
          </nav>
          <button className="mag-burger" aria-label="Menu" onClick={() => setNavOpen((v) => !v)}>≡</button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mag-hero" id="concept">
        <div className="wrap">
          <div className="mag-hero-grid">
            <div>
              <p className="kick orange">L'édition spéciale — Licensing Day 2026</p>
              <h1>Les licences, les communautés &amp; les événements qui <span className="orange">marquent l'année</span></h1>
              <p className="lede">La marque pop culture de Carrefour, imaginée et opérée par l'agence Gencode. On transforme les rayons en destinations pour les fans, de Mario à la Semaine du Manga.</p>
              <div className="mag-hero-actions">
                <button className="mag-btn mag-btn-orange" onClick={() => openFlip(1)}>📖 Feuilleter le magazine</button>
                <a href="mailto:kauffman.david@gmail.com?subject=Licensing%20Day%20—%20Projet%20licence" className="mag-btn mag-btn-ghost">Une question ? Un projet ?</a>
              </div>
            </div>
            <div className="mag-hero-mag">
              <div className="mag-cover-stack" onClick={() => openFlip(1)} role="button" tabIndex={0}
                   onKeyDown={(e) => { if (e.key === 'Enter') openFlip(1); }}>
                <img src={pageSrc(1)} alt="Couverture du magazine Road Sixty Geek Vol.2" />
                <span className="mag-cover-badge">▸ Feuilleter le Vol.2</span>
              </div>
            </div>
          </div>

          <div className="mag-stats">
            <div className="mag-stat"><div className="num orange">5,8M</div><div className="lbl">Fans cumulés</div></div>
            <div className="mag-stat"><div className="num">200</div><div className="lbl">Espaces · partout en France</div></div>
            <div className="mag-stat"><div className="num">40+</div><div className="lbl">Licences activées</div></div>
            <div className="mag-stat"><div className="num">+35%</div><div className="lbl">Sell-out moyen</div></div>
          </div>
        </div>
      </section>

      {/* ── Le magazine (feuilleter) ─────────────────────────────── */}
      <section className="mag-sec mag-flip-promo">
        <div className="wrap">
          <div className="mag-flip-grid">
            <div className="mag-flip-covers">
              <img src={pageSrc(1)} alt="Magazine Road Sixty Geek Vol.2" onClick={() => openFlip(1)} style={{ cursor: 'pointer' }} />
            </div>
            <div className="mag-flip-info">
              <p className="kick orange">Le magazine · Vol.2 — 2026</p>
              <h2>Feuilletez l'édition que nous distribuons au salon</h2>
              <p>24 pages : le concept, nos ambassadeurs, nos activations chez Carrefour, le premier meet-up, nos chiffres et le portrait de notre équipe. La même édition que celle qu'on vous remet en main, à lire ici en un clic.</p>
              <div className="mag-flip-meta">
                <div><div className="num">32</div><div className="lbl">Pages</div></div>
                <div><div className="num">8</div><div className="lbl">Reportages</div></div>
                <div><div className="num">2026</div><div className="lbl">Vol.2</div></div>
              </div>
              <button className="mag-btn mag-btn-orange" onClick={() => openFlip(1)}>📖 Ouvrir le flipbook</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mag-footer">
        <div className="wrap">
          <div className="mag-footer-top">
            <div className="disp">Road Sixty Geek</div>
            <div className="mag-footer-links">
              <a href="#concept">Le concept</a>
              <button onClick={() => openFlip(1)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Le magazine</button>
              <Link href="/qg">Actu pop culture</Link>
              <a href="https://www.instagram.com/roadsixtygeek" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="mailto:kauffman.david@gmail.com?subject=Licensing%20Day%20—%20Projet%20licence">Contact</a>
            </div>
          </div>
          <div className="mag-footer-run">
            <span>La route vers la pop culture — Vol.2</span>
            <span>© {new Date().getFullYear()} Road Sixty Geek · un concept Gencode × Carrefour</span>
          </div>
        </div>
      </footer>

      {/* ── Flipbook ─────────────────────────────────────────────── */}
      {flipOpen && (
        <div className="flip-overlay" onClick={(e) => { if (e.target.classList.contains('flip-overlay')) closeFlip(); }}>
          <div className="flip-top">
            <div className="flip-title">
              <span className="disp">Road Sixty Geek</span>
              <span className="tag">VOL.2 · 2026</span>
            </div>
            <button className="flip-close" aria-label="Fermer" onClick={closeFlip}>×</button>
          </div>

          <div className="flip-stage">
            <button className="flip-arrow prev" aria-label="Page précédente" disabled={page <= 1} onClick={() => goTo(page - 1)}>‹</button>
            <div
              className={`flip-page-wrap ${zoom > 1 ? 'zoomed' : ''}`}
              ref={wrapRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={toggleZoom}
            >
              <div className="flip-page-scroll">
                <div className="flip-page-frame">
                  <img
                    key={page}
                    ref={imgRef}
                    className="flip-page"
                    style={fit.w
                      ? { '--flip-dir': flipDir, width: fit.w * zoom + 'px', height: fit.h * zoom + 'px' }
                      : { '--flip-dir': flipDir, maxWidth: '92vw', maxHeight: '80vh' }}
                    src={pageSrc(page)}
                    alt={`Magazine Road Sixty Geek — page ${page}`}
                    draggable={false}
                  />
                  {PAGE_VIDEOS[page] && zoom === 1 && (
                    <button
                      className="flip-video-hotspot"
                      style={{ top: PAGE_VIDEOS[page].top, left: PAGE_VIDEOS[page].left }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setVideoOpen(PAGE_VIDEOS[page].embed); }}
                      aria-label={PAGE_VIDEOS[page].label}
                    >
                      <span className="play">▶</span>
                      <span className="lbl">{PAGE_VIDEOS[page].label}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button className="flip-arrow next" aria-label="Page suivante" disabled={page >= TOTAL_PAGES} onClick={() => goTo(page + 1)}>›</button>
          </div>

          <div className="flip-bottom">
            <div className="flip-counter">
              <button className="flip-zoom-btn" aria-label="Dézoomer" onClick={() => zoomBy(1 / 1.4)}>−</button>
              <span className="flip-zoom-pct">{Math.round(zoom * 100)}%</span>
              <button className="flip-zoom-btn" aria-label="Zoomer" onClick={() => zoomBy(1.4)}>+</button>
              <button className="flip-zoom-btn flip-fitw" aria-label="Ajuster à la largeur" title="Agrandir / ajuster à la largeur" onClick={fitWidth}>⤢</button>
              <span className="flip-counter-sep">·</span>
              <b>{String(page).padStart(2, '0')}</b> / {TOTAL_PAGES}
            </div>
            <div className="flip-thumbs">
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} className={`flip-thumb ${n === page ? 'active' : ''}`} aria-label={`Aller à la page ${n}`} onClick={() => goTo(n)}>
                    <img src={pageSrc(n)} alt="" loading="lazy" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {videoOpen && (
        <div className="flip-video-modal" onClick={(e) => { if (e.target.classList.contains('flip-video-modal')) setVideoOpen(null); }}>
          <div className="flip-video-box">
            <button className="flip-video-close" aria-label="Fermer la vidéo" onClick={() => setVideoOpen(null)}>×</button>
            <div className="flip-video-frame">
              <iframe src={videoOpen} title="Vidéo Road Sixty Geek" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
