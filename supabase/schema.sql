-- Tennis Tippspiel Database Schema
-- Run this in Supabase SQL Editor

-- Spieler (Tennis players)
CREATE TABLE IF NOT EXISTS spieler (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ranking INTEGER NOT NULL,
  geschlecht TEXT NOT NULL CHECK (geschlecht IN ('herren', 'damen'))
);

-- Teilnehmer (Participants/Tippers)  
CREATE TABLE IF NOT EXISTS teilnehmer (
  name TEXT PRIMARY KEY,
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

-- Turniere (Tournaments)
CREATE TABLE IF NOT EXISTS turniere (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jahr INTEGER NOT NULL,
  aktiv BOOLEAN DEFAULT FALSE,
  abgabe_schluss TIMESTAMPTZ
);

-- Tipps (Bets/Picks)
CREATE TABLE IF NOT EXISTS tipps (
  id SERIAL PRIMARY KEY,
  teilnehmer_name TEXT REFERENCES teilnehmer(name) ON DELETE CASCADE,
  turnier_id TEXT REFERENCES turniere(id) ON DELETE CASCADE,
  herren TEXT[] NOT NULL,
  damen TEXT[] NOT NULL,
  sieger_herren TEXT NOT NULL,
  sieger_damen TEXT NOT NULL,
  abgegeben_am TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teilnehmer_name, turnier_id)
);

-- Ergebnisse (Results)
CREATE TABLE IF NOT EXISTS ergebnisse (
  id SERIAL PRIMARY KEY,
  turnier_id TEXT REFERENCES turniere(id) ON DELETE CASCADE,
  spieler_id TEXT REFERENCES spieler(id) ON DELETE CASCADE,
  runde INTEGER NOT NULL CHECK (runde BETWEEN 1 AND 7),
  out BOOLEAN DEFAULT FALSE,
  UNIQUE(turnier_id, spieler_id)
);

-- Enable Row Level Security
ALTER TABLE spieler ENABLE ROW LEVEL SECURITY;
ALTER TABLE teilnehmer ENABLE ROW LEVEL SECURITY;
ALTER TABLE turniere ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ergebnisse ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (anyone can view)
CREATE POLICY "Public read access" ON spieler FOR SELECT USING (true);
CREATE POLICY "Public read access" ON teilnehmer FOR SELECT USING (true);
CREATE POLICY "Public read access" ON turniere FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tipps FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ergebnisse FOR SELECT USING (true);

-- Authenticated users can insert/update (for now, we'll restrict this later with admin roles)
CREATE POLICY "Authenticated insert" ON teilnehmer FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON tipps FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update" ON tipps FOR UPDATE USING (true);
CREATE POLICY "Authenticated insert" ON ergebnisse FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update" ON ergebnisse FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete" ON ergebnisse FOR DELETE USING (true);
CREATE POLICY "Authenticated update turniere" ON turniere FOR UPDATE USING (true);
