import React from 'react';

// URL absolue du portail roadsixtygeek.com
const BASE_URL = 'https://roadsixtygeek.com';

function generateSiteMap(news) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${BASE_URL}</loc>
       <changefreq>hourly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${BASE_URL}/qg</loc>
       <changefreq>hourly</changefreq>
       <priority>0.9</priority>
     </url>
     ${news
       .map((item) => {
         const slug = encodeURIComponent(item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
         return `
       <url>
           <loc>${BASE_URL}/news/${slug}</loc>
           <lastmod>${item.published_at || new Date().toISOString()}</lastmod>
           <changefreq>daily</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  let news = [];
  try {
    // Tenter de récupérer l'actualité en local ou via l'API publique
    const request = await fetch('http://localhost:3000/api/news');
    const json = await request.json();
    if (json.success && json.data) {
      news = json.data;
    }
  } catch (e) {
    // Si fetch local échoue (lors du build statique), on peut importer directement le fallback
    try {
      const { FALLBACK_NEWS } = require('./api/news');
      news = FALLBACK_NEWS.map((item, index) => ({
        ...item,
        published_at: new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
      }));
    } catch (err) {
      news = [];
    }
  }

  // Générer le sitemap XML
  const sitemap = generateSiteMap(news);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function SiteMap() {}
