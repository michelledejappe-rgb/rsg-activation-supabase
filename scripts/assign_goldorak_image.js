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

const goldorakImgUrl = "https://i00.eu/img/606/1600x1600/avzetp07/256151.jpg";
const articleTitle = "Casio G-Shock dévoile une montre exclusive aux couleurs de Goldorak U";

async function run() {
  console.log("=== ASSIGNING PERFECT GOLDORAK WATCH IMAGE ===");
  
  // 1. Update the payload file C:\Users\djdou\Downloads\rsg-activation-supabase\_qg_payload_20260602.json
  const payloadPath = path.join(__dirname, '..', '_qg_payload_20260602.json');
  if (fs.existsSync(payloadPath)) {
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    if (payload.news && Array.isArray(payload.news)) {
      const idx = payload.news.findIndex(item => item.title === articleTitle);
      if (idx !== -1) {
        payload.news[idx].img = goldorakImgUrl;
        fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
        console.log(`✅ Updated payload JSON file: ${payloadPath}`);
      }
    }
  }

  // Also update the parent Downloads folder payload
  const parentPayloadPath = path.join(__dirname, '../..', '_qg_payload_20260602.json');
  if (fs.existsSync(parentPayloadPath)) {
    const payload = JSON.parse(fs.readFileSync(parentPayloadPath, 'utf8'));
    if (payload.news && Array.isArray(payload.news)) {
      const idx = payload.news.findIndex(item => item.title === articleTitle);
      if (idx !== -1) {
        payload.news[idx].img = goldorakImgUrl;
        fs.writeFileSync(parentPayloadPath, JSON.stringify(payload, null, 2));
        console.log(`✅ Updated parent Downloads payload JSON file: ${parentPayloadPath}`);
      }
    }
  }

  // 2. Update Supabase
  console.log("Updating Supabase database row...");
  const { error } = await supabase
    .from('news')
    .update({ img: goldorakImgUrl })
    .eq('title', articleTitle);
    
  if (error) {
    console.error("❌ Error updating Supabase:", error.message);
  } else {
    console.log("✅ Successfully updated Supabase database row with perfect watch image!");
  }
}

run();
