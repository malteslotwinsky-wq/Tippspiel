export interface Spieler {
  id: string;
  name: string;
  ranking: number;
  geschlecht: 'herren' | 'damen';
}

export interface Tipp {
  teilnehmerName: string;
  turnierId: string;
  herren: string[];      // 8 Spieler-IDs
  damen: string[];       // 8 Spieler-IDs
  siegerHerren: string;  // Siegertipp Herren
  siegerDamen: string;   // Siegertipp Damen
  abgegebenAm: string;   // ISO Date
}

export interface Turnier {
  id: string;
  name: string;
  jahr: number;
  aktiv: boolean;
  abgabeSchluss?: string; // ISO Date
}

export interface TurnierErgebnis {
  turnierId: string;
  spielerId: string;
  runde: 1 | 2 | 3 | 4 | 5 | 6 | 7;  // 1=R1, 2=R2, 3=R3, 4=AF, 5=VF, 6=HF, 7=F/Sieger
  out?: boolean;  // true = ausgeschieden, false/undefined = noch dabei
}

export interface Teilnehmer {
  name: string;
  erstelltAm: string;
}

export interface PunkteStand {
  teilnehmerName: string;
  punkteHerren: number;
  punkteDamen: number;
  punkteGesamt: number;
  bonusHerren: number;
  bonusDamen: number;
  verbleibendeHerren?: number;
  verbleibendeDamen?: number;
}

export type Runde = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const RUNDEN_NAMEN: Record<Runde, string> = {
  1: '1. Runde',
  2: '2. Runde',
  3: '3. Runde',
  4: 'Achtelfinale',
  5: 'Viertelfinale',
  6: 'Halbfinale',
  7: 'Finale',
};

export const PUNKTE_PRO_RUNDE: Record<Runde, number> = {
  1: 0,
  2: 0.5,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5, // Basispunkte für Finale, Sieger bekommt +1 extra = 6
};
