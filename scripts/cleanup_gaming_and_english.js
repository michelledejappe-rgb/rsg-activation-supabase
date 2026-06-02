const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    if (line.trim().startsWith('#') || !line.includes('=')) return;
    const [key, ...rest] = line.split('=');
    let v = rest.join('=').trim().replace(/^["']|["']$/g, '');
    process.env[key.trim()] = v;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Filter logic
function shouldKeepArticle(title, text) {
  const t = (title || "").toLowerCase();
  const d = (text || "").toLowerCase();

  // 1. Anti-Gaming Filter
  const gamingWords = [
    'jeu vidéo', 'jeux vidéo', 'gaming', 'playstation', 'ps5', 'xbox', 'nintendo', 
    'switch', 'console', 'gameplay', 'rockstar', 'gta', 'gta 6', 'fifa', 'fortnite', 
    'gamers', 'cyberpunk 2077', 'pc gamer', 'resident evil', 'call of duty', 
    'assassin\'s creed', 'gamer', 'jeux-video', 'jeu-video'
  ];
  for (const word of gamingWords) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  // 2. English Detection Filter (Strict French Only)
  const englishStopwords = [
    ' the ', ' is ', ' for ', ' in ', ' with ', ' at ', ' on ', ' and ', ' of ', ' to ', 
    ' from ', ' this ', ' that ', ' under ', ' with ', ' about '
  ];
  for (const word of englishStopwords) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  // Common English titles or terms
  const englishTerms = [
    'release date', 'official trailer', 'announces', 'unveils', 'collaboration info', 
    'exclusive drop', 'collection release'
  ];
  for (const word of englishTerms) {
    if (t.includes(word) || d.includes(word)) {
      return false;
    }
  }

  return true;
}

async function run() {
  console.log("=== CLEANING SUPABASE AND LOCAL PAYLOADS ===");

  // 1. Clean Supabase database news table
  const { data: news, error } = await supabase
    .from('news')
    .select('id, title, text, date_str');

  if (error) {
    console.error("Error fetching news from Supabase:", error.message);
    return;
  }

  console.log(`Fetched ${news.length} articles from Supabase. Scanning for gaming and English articles...`);
  
  const toDeleteIds = [];
  const keptNews = [];

  for (const item of news) {
    const isHypebeast = item.date_str && item.date_str.includes('Hypebeast');
    const isKeep = shouldKeepArticle(item.title, item.text) && !isHypebeast;

    if (!isKeep) {
      console.log(`❌ Rejecting article: "${item.title}"`);
      toDeleteIds.push(item.id);
    } else {
      keptNews.push(item.title);
    }
  }

  console.log(`Found ${toDeleteIds.length} articles to delete.`);

  if (toDeleteIds.length > 0) {
    const { error: delError } = await supabase
      .from('news')
      .delete()
      .in('id', toDeleteIds);

    if (delError) {
      console.error("Error deleting rows from Supabase:", delError.message);
    } else {
      console.log(`✅ Successfully deleted ${toDeleteIds.length} rows from Supabase news table.`);
    }
  } else {
    console.log("No rows to delete from Supabase.");
  }

  // 2. Clean local payload files in current repo and parent Downloads directory
  const checkDirs = [
    path.join(__dirname, '..'),
    path.join(__dirname, '../..')
  ];

  for (const dir of checkDirs) {
    if (!fs.existsSync(dir)) continue;
    
    const payloadFiles = fs.readdirSync(dir)
      .filter(f => f.startsWith('_qg_payload_') && f.endsWith('.json'));

    for (const file of payloadFiles) {
      const filePath = path.join(dir, file);
      try {
        const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (payload.news && Array.isArray(payload.news)) {
          const originalCount = payload.news.length;
          payload.news = payload.news.filter(item => {
            const isHypebeast = item.date_str && item.date_str.includes('Hypebeast');
            return shouldKeepArticle(item.title, item.text) && !isHypebeast;
          });
          const newCount = payload.news.length;
          
          if (originalCount !== newCount) {
            fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
            console.log(`✅ Cleaned local payload file: ${filePath} (Filtered out ${originalCount - newCount} articles).`);
          }
        }
      } catch (err) {
        console.error(`Error processing payload file ${filePath}:`, err.message);
      }
    }
  }
}

run();
