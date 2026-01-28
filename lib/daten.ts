import { promises as fs } from 'fs';
import path from 'path';
import { Spieler, Tipp, Turnier, TurnierErgebnis, Teilnehmer } from './types';

const dataDir = path.join(process.cwd(), 'data');

// Spieler
export async function getSpieler(): Promise<{ herren: Spieler[]; damen: Spieler[] }> {
  const data = await fs.readFile(path.join(dataDir, 'spieler.json'), 'utf-8');
  return JSON.parse(data);
}

export async function saveSpieler(spieler: { herren: Spieler[]; damen: Spieler[] }): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, 'spieler.json'),
    JSON.stringify(spieler, null, 2)
  );
}

// Turniere
export async function getTurniere(): Promise<Turnier[]> {
  const data = await fs.readFile(path.join(dataDir, 'turniere.json'), 'utf-8');
  return JSON.parse(data);
}

export async function saveTurniere(turniere: Turnier[]): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, 'turniere.json'),
    JSON.stringify(turniere, null, 2)
  );
}

export async function getAktivesTurnier(): Promise<Turnier | null> {
  const turniere = await getTurniere();
  return turniere.find(t => t.aktiv) || null;
}

// Ergebnisse
export async function getErgebnisse(): Promise<TurnierErgebnis[]> {
  const data = await fs.readFile(path.join(dataDir, 'ergebnisse.json'), 'utf-8');
  return JSON.parse(data);
}

export async function saveErgebnisse(ergebnisse: TurnierErgebnis[]): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, 'ergebnisse.json'),
    JSON.stringify(ergebnisse, null, 2)
  );
}

export async function getErgebnisseFuerTurnier(turnierId: string): Promise<TurnierErgebnis[]> {
  const ergebnisse = await getErgebnisse();
  return ergebnisse.filter(e => e.turnierId === turnierId);
}

// Tipps
export async function getTipps(): Promise<Tipp[]> {
  const data = await fs.readFile(path.join(dataDir, 'tipps.json'), 'utf-8');
  return JSON.parse(data);
}

export async function saveTipps(tipps: Tipp[]): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, 'tipps.json'),
    JSON.stringify(tipps, null, 2)
  );
}

export async function getTippsFuerTurnier(turnierId: string): Promise<Tipp[]> {
  const tipps = await getTipps();
  return tipps.filter(t => t.turnierId === turnierId);
}

export async function getTippFuerTeilnehmer(
  teilnehmerName: string,
  turnierId: string
): Promise<Tipp | null> {
  const tipps = await getTipps();
  return tipps.find(t => t.teilnehmerName === teilnehmerName && t.turnierId === turnierId) || null;
}

// Teilnehmer
export async function getTeilnehmer(): Promise<Teilnehmer[]> {
  const data = await fs.readFile(path.join(dataDir, 'teilnehmer.json'), 'utf-8');
  return JSON.parse(data);
}

export async function saveTeilnehmer(teilnehmer: Teilnehmer[]): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, 'teilnehmer.json'),
    JSON.stringify(teilnehmer, null, 2)
  );
}

export async function addTeilnehmer(name: string): Promise<Teilnehmer> {
  const teilnehmer = await getTeilnehmer();
  const existing = teilnehmer.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    throw new Error('Teilnehmer existiert bereits');
  }
  const neu: Teilnehmer = {
    name,
    erstelltAm: new Date().toISOString(),
  };
  teilnehmer.push(neu);
  await saveTeilnehmer(teilnehmer);
  return neu;
}
