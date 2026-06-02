import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '../../lib/slug';

const SITE = 'https://roadsixtygeek.com';

const CATEGORIES = {
  cine:   { label: 'Ciné / Box Office', emoji: '🎬' },
  series: { label: 'Séries / Netflix', emoji: '📺' },
  anime:  { label: 'Anime / Streaming', emoji: '🪚' },
  manga:  { label: 'Mangas / Éditions', emoji: '📖' },
  collab: { label: 'Collabs / Merch', emoji: '🧸' }
};

const CATEGORY_IMAGES = {
  cine: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop',
  series: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1200&auto=format&fit=crop',
  anime: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
  manga: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
  collab: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?q=80&w=1200&auto=format&fit=crop'
};

// Renvoie une URL ABSOLUE passant par notre proxy (robuste pour l'aperçu social)
function proxied(img) {
  if (!img) return null;
  if (img.startsWith('/api/proxy-image')) return SITE + img;
  if (img.startsWith('http')) return `${SITE}/api/proxy-image?url=${encodeURIComponent(img)}`;
  return SITE + (img.startsWith('/') ? img : '/' + img);
}

export async function getServerSideProps({ params, res }) {
  const slug = params.slug;
  let article = null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const sb = createClient(url, key);
      const { data } = await sb.from('news').select('*').order('published_at', { ascending: false });
      if (Array.isArray(data)) {
        article = data.find(n => slugify(n.title) === slug) || null;
      }
    }
  } catch (e) { /* silencieux */ }

  if (!article) return { notFound: true };
  // Cache CDN court pour de bonnes perfs sur les liens partagés
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  return { props: { article } };
}

export default function ArticlePage({ article }) {
  const cat = CATEGORIES[article.cat] || { label: 'Actu', emoji: '📰' };
  const ogImage = proxied(article.img) || `${SITE}/logo.png`;
  const displayImg = proxied(article.img) || CATEGORY_IMAGES[article.cat] || `${SITE}/logo.png`;
  const url = `${SITE}/actu/${slugify(article.title)}`;
  const desc = (article.text || '').replace(/\s+/g, ' ').trim().slice(0, 200);

  return (
    <div className="min-h-screen">
      <Head>
        <title>{`${article.title} — Road Sixty Geek`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content={desc} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={url} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Open Graph — c'est ce qui donne l'aperçu riche dans une story / un partage */}
        <meta property="og:site_name" content="Road Sixty Geek" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImage} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": desc,
            "datePublished": article.published_at || new Date().toISOString(),
            "image": ogImage,
            "url": url,
            "author": { "@type": "Organization", "name": "Road Sixty Geek" },
            "publisher": { "@type": "Organization", "name": "Road Sixty Geek QG", "logo": { "@type": "ImageObject", "url": `${SITE}/logo.png` } }
          }) }}
        />
      </Head>

      {/* Header */}
      <header className="qg-header">
        <div className="header-container">
          <Link href="/" className="logo-section">
            <img src="/logo.png" alt="Road Sixty Geek Logo" className="logo-img" />
            <span className="logo-text">ROAD SIXTY GEEK</span>
            <span className="logo-tag">QG Actu</span>
          </Link>
          <Link href="/" className="play-quiz-btn" style={{ textDecoration: 'none' }}>← Toutes les actus</Link>
        </div>
      </header>

      {/* Article */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.2rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className={`category-tag cat-${article.cat}`}>{cat.emoji} {cat.label}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{article.date_str || 'Récemment'}</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 1.25rem' }}>
          {article.title}
        </h1>

        <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-white)', boxShadow: 'var(--shadow-lg)', background: '#0f172a', marginBottom: '1.5rem' }}>
          <img src={displayImg} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {article.text}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-white)', paddingTop: '1.5rem' }}>
          <Link href="/" className="play-quiz-btn" style={{ textDecoration: 'none' }}>🔥 Découvrir toutes les actus</Link>
          <a href="https://www.instagram.com/roadsixtygeek" target="_blank" rel="noopener noreferrer" className="play-quiz-btn"
             style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #c13584 0%, #e1306c 100%)', color: '#fff', borderColor: 'transparent' }}>
            📸 Suivre @roadsixtygeek
          </a>
        </div>
      </main>

      <footer className="qg-footer">
        <div className="footer-logo">ROAD SIXTY GEEK</div>
        <p>© {new Date().getFullYear()} Road Sixty Geek. Propulsé par Next.js & Supabase.</p>
      </footer>
    </div>
  );
}
