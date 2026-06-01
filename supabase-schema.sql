-- Table pour stocker les actualités QG de Road Sixty Geek
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  cat text not null,          -- Catégorie (manga, anime, cine, series, collab)
  emoji text,                 -- Emoji représentant l'actualité
  date_str text not null,     -- Date formatisée pour l'affichage (ex: "Il y a 2 heures")
  title text not null unique, -- Titre de l'article (unique pour éviter les doublons au sync)
  text text not null,         -- Contenu/Description de l'actualité
  hot boolean default false,  -- Si l'actualité est importante/brûlante (Hero Section)
  img text,                   -- URL de l'image réelle exacte (DuckDuckGo/Unsplash) récupérée par le Cron
  published_at timestamp with time zone default now() -- Date réelle d'insertion
);

-- Instruction de migration pour les bases existantes :
-- ALTER TABLE news ADD COLUMN IF NOT EXISTS img text;

-- Activation de la sécurité de niveau ligne (Row-Level Security)
alter table news enable row level security;

-- Politique de sécurité : Lecture publique autorisée pour tous
create policy "Allow public read access" on news
  for select using (true);
