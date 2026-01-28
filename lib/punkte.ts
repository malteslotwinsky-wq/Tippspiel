import { Tipp, TurnierErgebnis, PunkteStand, Runde, PUNKTE_PRO_RUNDE } from './types';

export function berechnePunkteFuerSpieler(
  spielerId: string,
  ergebnisse: TurnierErgebnis[],
  turnierId: string
): number {
  const spielerErgebnis = ergebnisse.find(
    e => e.spielerId === spielerId && e.turnierId === turnierId
  );

  if (!spielerErgebnis) {
    return 0;
  }

  return PUNKTE_PRO_RUNDE[spielerErgebnis.runde];
}

export function berechnePunkteFuerTipp(
  tipp: Tipp,
  ergebnisse: TurnierErgebnis[],
  berechneVerbleibende: boolean = false
): PunkteStand {
  const turnierId = tipp.turnierId;
  const turnierErgebnisse = ergebnisse.filter(e => e.turnierId === turnierId);

  // Punkte für Herren
  let punkteHerren = 0;
  for (const spielerId of tipp.herren) {
    punkteHerren += berechnePunkteFuerSpieler(spielerId, turnierErgebnisse, turnierId);
  }

  // Punkte für Damen
  let punkteDamen = 0;
  for (const spielerId of tipp.damen) {
    punkteDamen += berechnePunkteFuerSpieler(spielerId, turnierErgebnisse, turnierId);
  }

  // Bonus für richtigen Siegertipp
  let bonusHerren = 0;
  let bonusDamen = 0;

  const siegerHerren = turnierErgebnisse.find(
    e => e.runde === 7 && e.spielerId.startsWith('h')
  );
  const siegerDamen = turnierErgebnisse.find(
    e => e.runde === 7 && e.spielerId.startsWith('d')
  );

  if (siegerHerren && siegerHerren.spielerId === tipp.siegerHerren) {
    bonusHerren = 1;
  }

  if (siegerDamen && siegerDamen.spielerId === tipp.siegerDamen) {
    bonusDamen = 1;
  }

  // Calculate remaining players (those not marked as "out")
  let verbleibendeHerren = 0;
  let verbleibendeDamen = 0;

  if (berechneVerbleibende) {
    // Count picked players who are NOT marked as out
    for (const spielerId of tipp.herren) {
      const result = turnierErgebnisse.find(e => e.spielerId === spielerId);
      // Player is still in if: no result yet, or result exists but out !== true
      if (!result || !result.out) {
        verbleibendeHerren++;
      }
    }

    for (const spielerId of tipp.damen) {
      const result = turnierErgebnisse.find(e => e.spielerId === spielerId);
      if (!result || !result.out) {
        verbleibendeDamen++;
      }
    }
  }

  return {
    teilnehmerName: tipp.teilnehmerName,
    punkteHerren: punkteHerren + bonusHerren,
    punkteDamen: punkteDamen + bonusDamen,
    punkteGesamt: punkteHerren + punkteDamen + bonusHerren + bonusDamen,
    bonusHerren,
    bonusDamen,
    verbleibendeHerren: berechneVerbleibende ? verbleibendeHerren : undefined,
    verbleibendeDamen: berechneVerbleibende ? verbleibendeDamen : undefined,
  };
}

export function berechneRangliste(
  tipps: Tipp[],
  ergebnisse: TurnierErgebnis[],
  turnierId: string,
  berechneVerbleibende: boolean = false
): PunkteStand[] {
  const turnierTipps = tipps.filter(t => t.turnierId === turnierId);

  const punkteStaende = turnierTipps.map(tipp =>
    berechnePunkteFuerTipp(tipp, ergebnisse, berechneVerbleibende)
  );

  // Sortiere nach Gesamtpunkten (absteigend)
  punkteStaende.sort((a, b) => b.punkteGesamt - a.punkteGesamt);

  return punkteStaende;
}

export function getSpielerPunkteDetails(
  spielerIds: string[],
  ergebnisse: TurnierErgebnis[],
  turnierId: string
): Map<string, { runde: Runde | null; punkte: number }> {
  const details = new Map<string, { runde: Runde | null; punkte: number }>();

  for (const spielerId of spielerIds) {
    const ergebnis = ergebnisse.find(
      e => e.spielerId === spielerId && e.turnierId === turnierId
    );

    if (ergebnis) {
      details.set(spielerId, {
        runde: ergebnis.runde,
        punkte: PUNKTE_PRO_RUNDE[ergebnis.runde],
      });
    } else {
      details.set(spielerId, { runde: null, punkte: 0 });
    }
  }

  return details;
}
