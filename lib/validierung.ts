import { Spieler } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAuswahl(
  ausgewaehlte: Spieler[],
  geschlecht: 'herren' | 'damen'
): ValidationResult {
  const errors: string[] = [];
  const label = geschlecht === 'herren' ? 'Herren' : 'Damen';

  // Prüfe Anzahl
  if (ausgewaehlte.length !== 8) {
    errors.push(`${label}: Es müssen genau 8 Spieler ausgewählt werden (aktuell: ${ausgewaehlte.length})`);
  }

  // Prüfe Geschlecht
  const falschesGeschlecht = ausgewaehlte.filter(s => s.geschlecht !== geschlecht);
  if (falschesGeschlecht.length > 0) {
    errors.push(`${label}: Spieler mit falschem Geschlecht ausgewählt`);
  }

  // Zähle nach Ranking-Kategorien
  const top8 = ausgewaehlte.filter(s => s.ranking <= 8);
  const top32 = ausgewaehlte.filter(s => s.ranking <= 32);
  const ausserhalb32 = ausgewaehlte.filter(s => s.ranking > 32);

  // Max. 4 aus Top 8
  if (top8.length > 4) {
    errors.push(`${label}: Maximal 4 Spieler aus Top 8 erlaubt (aktuell: ${top8.length})`);
  }

  // Max. 6 aus Top 32
  if (top32.length > 6) {
    errors.push(`${label}: Maximal 6 Spieler aus Top 32 erlaubt (aktuell: ${top32.length})`);
  }

  // Min. 2 außerhalb Top 32
  if (ausserhalb32.length < 2) {
    errors.push(`${label}: Mindestens 2 Spieler außerhalb Top 32 erforderlich (aktuell: ${ausserhalb32.length})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSiegerTipp(
  siegerId: string,
  ausgewaehlteSpieler: Spieler[]
): ValidationResult {
  const errors: string[] = [];

  // Siegertipp muss aus den ausgewählten Spielern sein
  const siegerInAuswahl = ausgewaehlteSpieler.some(s => s.id === siegerId);
  if (!siegerInAuswahl) {
    errors.push('Der Siegertipp muss aus den ausgewählten Spielern stammen');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateKompletteTipps(
  herren: Spieler[],
  damen: Spieler[],
  siegerHerren: string,
  siegerDamen: string
): ValidationResult {
  const allErrors: string[] = [];

  const herrenValidation = validateAuswahl(herren, 'herren');
  const damenValidation = validateAuswahl(damen, 'damen');

  allErrors.push(...herrenValidation.errors);
  allErrors.push(...damenValidation.errors);

  if (herrenValidation.valid) {
    const siegerHerrenValidation = validateSiegerTipp(siegerHerren, herren);
    allErrors.push(...siegerHerrenValidation.errors.map(e => `Herren: ${e}`));
  }

  if (damenValidation.valid) {
    const siegerDamenValidation = validateSiegerTipp(siegerDamen, damen);
    allErrors.push(...siegerDamenValidation.errors.map(e => `Damen: ${e}`));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function getAuswahlStats(ausgewaehlte: Spieler[]) {
  const top8 = ausgewaehlte.filter(s => s.ranking <= 8).length;
  const top32 = ausgewaehlte.filter(s => s.ranking <= 32).length;
  const ausserhalb32 = ausgewaehlte.filter(s => s.ranking > 32).length;

  return {
    top8,
    top32,
    ausserhalb32,
    top8Remaining: 4 - top8,
    top32Remaining: 6 - top32,
    ausserhalb32Needed: Math.max(0, 2 - ausserhalb32),
  };
}
