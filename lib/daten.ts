import { supabase, DbSpieler, DbTeilnehmer, DbTurnier, DbTipp, DbErgebnis } from './supabase';
import { Spieler, Tipp, Turnier, TurnierErgebnis, Teilnehmer } from './types';

// Helper: Convert DB format to app format
function dbToSpieler(db: DbSpieler): Spieler {
  return {
    id: db.id,
    name: db.name,
    ranking: db.ranking,
    geschlecht: db.geschlecht,
  };
}

function dbToTurnier(db: DbTurnier): Turnier {
  return {
    id: db.id,
    name: db.name,
    jahr: db.jahr,
    aktiv: db.aktiv,
    abgabeSchluss: db.abgabe_schluss || undefined,
  };
}

function dbToTipp(db: DbTipp): Tipp {
  return {
    teilnehmerName: db.teilnehmer_name,
    turnierId: db.turnier_id,
    herren: db.herren,
    damen: db.damen,
    siegerHerren: db.sieger_herren,
    siegerDamen: db.sieger_damen,
    abgegebenAm: db.abgegeben_am || new Date().toISOString(),
  };
}

function dbToErgebnis(db: DbErgebnis): TurnierErgebnis {
  return {
    turnierId: db.turnier_id,
    spielerId: db.spieler_id,
    runde: db.runde as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    out: db.out,
  };
}

function dbToTeilnehmer(db: DbTeilnehmer): Teilnehmer {
  return {
    name: db.name,
    erstelltAm: db.erstellt_am,
  };
}

// ============ SPIELER ============

export async function getSpieler(): Promise<{ herren: Spieler[]; damen: Spieler[] }> {
  const { data, error } = await supabase
    .from('spieler')
    .select('*')
    .order('ranking');

  if (error) throw new Error(`Failed to fetch spieler: ${error.message}`);

  const spieler = (data || []).map(dbToSpieler);
  return {
    herren: spieler.filter(s => s.geschlecht === 'herren'),
    damen: spieler.filter(s => s.geschlecht === 'damen'),
  };
}

export async function saveSpieler(spieler: { herren: Spieler[]; damen: Spieler[] }): Promise<void> {
  const alleSpieler = [
    ...spieler.herren.map(s => ({ ...s, geschlecht: 'herren' as const })),
    ...spieler.damen.map(s => ({ ...s, geschlecht: 'damen' as const })),
  ];

  const { error } = await supabase
    .from('spieler')
    .upsert(alleSpieler, { onConflict: 'id' });

  if (error) throw new Error(`Failed to save spieler: ${error.message}`);
}

// ============ TURNIERE ============

export async function getTurniere(): Promise<Turnier[]> {
  const { data, error } = await supabase
    .from('turniere')
    .select('*')
    .order('jahr', { ascending: false });

  if (error) throw new Error(`Failed to fetch turniere: ${error.message}`);

  return (data || []).map(dbToTurnier);
}

export async function saveTurniere(turniere: Turnier[]): Promise<void> {
  const dbTurniere = turniere.map(t => ({
    id: t.id,
    name: t.name,
    jahr: t.jahr,
    aktiv: t.aktiv,
    abgabe_schluss: t.abgabeSchluss || null,
  }));

  const { error } = await supabase
    .from('turniere')
    .upsert(dbTurniere, { onConflict: 'id' });

  if (error) throw new Error(`Failed to save turniere: ${error.message}`);
}

export async function getAktivesTurnier(): Promise<Turnier | null> {
  const { data, error } = await supabase
    .from('turniere')
    .select('*')
    .eq('aktiv', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch active turnier: ${error.message}`);
  }

  return data ? dbToTurnier(data) : null;
}

// ============ ERGEBNISSE ============

export async function getErgebnisse(): Promise<TurnierErgebnis[]> {
  const { data, error } = await supabase
    .from('ergebnisse')
    .select('*');

  if (error) throw new Error(`Failed to fetch ergebnisse: ${error.message}`);

  return (data || []).map(dbToErgebnis);
}

export async function saveErgebnisse(ergebnisse: TurnierErgebnis[]): Promise<void> {
  // Delete existing and insert new
  const turnierId = ergebnisse[0]?.turnierId;
  if (turnierId) {
    await supabase.from('ergebnisse').delete().eq('turnier_id', turnierId);
  }

  const dbErgebnisse = ergebnisse.map(e => ({
    turnier_id: e.turnierId,
    spieler_id: e.spielerId,
    runde: e.runde,
    out: e.out || false,
  }));

  const { error } = await supabase.from('ergebnisse').insert(dbErgebnisse);

  if (error) throw new Error(`Failed to save ergebnisse: ${error.message}`);
}

export async function getErgebnisseFuerTurnier(turnierId: string): Promise<TurnierErgebnis[]> {
  const { data, error } = await supabase
    .from('ergebnisse')
    .select('*')
    .eq('turnier_id', turnierId);

  if (error) throw new Error(`Failed to fetch ergebnisse: ${error.message}`);

  return (data || []).map(dbToErgebnis);
}

export async function upsertErgebnis(ergebnis: TurnierErgebnis): Promise<void> {
  const { error } = await supabase
    .from('ergebnisse')
    .upsert({
      turnier_id: ergebnis.turnierId,
      spieler_id: ergebnis.spielerId,
      runde: ergebnis.runde,
      out: ergebnis.out || false,
    }, { onConflict: 'turnier_id,spieler_id' });

  if (error) throw new Error(`Failed to upsert ergebnis: ${error.message}`);
}

export async function deleteErgebnis(turnierId: string, spielerId: string): Promise<void> {
  const { error } = await supabase
    .from('ergebnisse')
    .delete()
    .eq('turnier_id', turnierId)
    .eq('spieler_id', spielerId);

  if (error) throw new Error(`Failed to delete ergebnis: ${error.message}`);
}

// ============ TIPPS ============

export async function getTipps(): Promise<Tipp[]> {
  const { data, error } = await supabase
    .from('tipps')
    .select('*');

  if (error) throw new Error(`Failed to fetch tipps: ${error.message}`);

  return (data || []).map(dbToTipp);
}

export async function saveTipps(tipps: Tipp[]): Promise<void> {
  const dbTipps = tipps.map(t => ({
    teilnehmer_name: t.teilnehmerName,
    turnier_id: t.turnierId,
    herren: t.herren,
    damen: t.damen,
    sieger_herren: t.siegerHerren,
    sieger_damen: t.siegerDamen,
    abgegeben_am: t.abgegebenAm,
  }));

  for (const tipp of dbTipps) {
    const { error } = await supabase
      .from('tipps')
      .upsert(tipp, { onConflict: 'teilnehmer_name,turnier_id' });

    if (error) throw new Error(`Failed to save tipp: ${error.message}`);
  }
}

export async function getTippsFuerTurnier(turnierId: string): Promise<Tipp[]> {
  const { data, error } = await supabase
    .from('tipps')
    .select('*')
    .eq('turnier_id', turnierId);

  if (error) throw new Error(`Failed to fetch tipps: ${error.message}`);

  return (data || []).map(dbToTipp);
}

export async function getTippFuerTeilnehmer(
  teilnehmerName: string,
  turnierId: string
): Promise<Tipp | null> {
  const { data, error } = await supabase
    .from('tipps')
    .select('*')
    .eq('teilnehmer_name', teilnehmerName)
    .eq('turnier_id', turnierId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch tipp: ${error.message}`);
  }

  return data ? dbToTipp(data) : null;
}

export async function saveTipp(tipp: Tipp): Promise<void> {
  const { error } = await supabase
    .from('tipps')
    .upsert({
      teilnehmer_name: tipp.teilnehmerName,
      turnier_id: tipp.turnierId,
      herren: tipp.herren,
      damen: tipp.damen,
      sieger_herren: tipp.siegerHerren,
      sieger_damen: tipp.siegerDamen,
      abgegeben_am: tipp.abgegebenAm,
    }, { onConflict: 'teilnehmer_name,turnier_id' });

  if (error) throw new Error(`Failed to save tipp: ${error.message}`);
}

// ============ TEILNEHMER ============

export async function getTeilnehmer(): Promise<Teilnehmer[]> {
  const { data, error } = await supabase
    .from('teilnehmer')
    .select('*')
    .order('name');

  if (error) throw new Error(`Failed to fetch teilnehmer: ${error.message}`);

  return (data || []).map(dbToTeilnehmer);
}

export async function saveTeilnehmer(teilnehmer: Teilnehmer[]): Promise<void> {
  const dbTeilnehmer = teilnehmer.map(t => ({
    name: t.name,
    erstellt_am: t.erstelltAm,
  }));

  const { error } = await supabase
    .from('teilnehmer')
    .upsert(dbTeilnehmer, { onConflict: 'name' });

  if (error) throw new Error(`Failed to save teilnehmer: ${error.message}`);
}

export async function addTeilnehmer(name: string): Promise<Teilnehmer> {
  const { data: existing } = await supabase
    .from('teilnehmer')
    .select('*')
    .ilike('name', name)
    .single();

  if (existing) {
    throw new Error('Teilnehmer existiert bereits');
  }

  const neu = {
    name,
    erstellt_am: new Date().toISOString(),
  };

  const { error } = await supabase.from('teilnehmer').insert(neu);

  if (error) throw new Error(`Failed to add teilnehmer: ${error.message}`);

  return { name: neu.name, erstelltAm: neu.erstellt_am };
}
