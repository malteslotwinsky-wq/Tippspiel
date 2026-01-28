import Link from 'next/link';
import Rangliste from '@/components/Rangliste';
import TurnierDraw from '@/components/TurnierDraw';
import Card from '@/components/ui/Card';
import { getTurniere, getTipps, getErgebnisse, getSpieler } from '@/lib/daten';
import { berechneRangliste, berechnePunkteFuerSpieler } from '@/lib/punkte';
import { RUNDEN_NAMEN, Runde, PUNKTE_PRO_RUNDE } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function RanglistePage() {
  const turniere = await getTurniere();
  const tipps = await getTipps();
  const ergebnisse = await getErgebnisse();
  const spielerData = await getSpieler();

  const aktivTurnier = turniere.find(t => t.aktiv);

  if (!aktivTurnier) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p className="text-xl mb-4">Kein aktives Turnier</p>
          <Link href="/admin" className="text-green-600 hover:underline">
            Als Admin ein Turnier erstellen
          </Link>
        </div>
      </Card>
    );
  }

  const rangliste = berechneRangliste(tipps, ergebnisse, aktivTurnier.id, true);
  const turnierErgebnisse = ergebnisse.filter(e => e.turnierId === aktivTurnier.id);
  const turnierTipps = tipps.filter(t => t.turnierId === aktivTurnier.id);

  // Get all players with results for this tournament
  const alleSpieler = [...spielerData.herren, ...spielerData.damen];
  const spielerMitErgebnis = turnierErgebnisse.map(e => {
    const spieler = alleSpieler.find(s => s.id === e.spielerId);
    return {
      ...e,
      spielerName: spieler?.name || 'Unbekannt',
      geschlecht: spieler?.geschlecht || 'herren',
    };
  }).sort((a, b) => b.runde - a.runde);

  const herrenErgebnisse = spielerMitErgebnis.filter(e => e.geschlecht === 'herren');
  const damenErgebnisse = spielerMitErgebnis.filter(e => e.geschlecht === 'damen');

  // Get all picked players with their points
  const ausgewaehlteSpielerIds = new Set<string>();
  turnierTipps.forEach(tipp => {
    tipp.herren.forEach(id => ausgewaehlteSpielerIds.add(id));
    tipp.damen.forEach(id => ausgewaehlteSpielerIds.add(id));
  });

  // Count how many participants picked each player
  const spielerPickCount = new Map<string, number>();
  turnierTipps.forEach(tipp => {
    [...tipp.herren, ...tipp.damen].forEach(id => {
      spielerPickCount.set(id, (spielerPickCount.get(id) || 0) + 1);
    });
  });

  // Calculate points for each picked player
  const ausgewaehlteSpielerMitPunkten = Array.from(ausgewaehlteSpielerIds).map(id => {
    const spieler = alleSpieler.find(s => s.id === id);
    const ergebnis = turnierErgebnisse.find(e => e.spielerId === id);
    const punkte = ergebnis ? PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] : 0;
    // Player is "noch dabei" if no result OR result exists but out !== true
    const nochDabei = !ergebnis || !ergebnis.out;

    return {
      id,
      name: spieler?.name || 'Unbekannt',
      ranking: spieler?.ranking || 999,
      geschlecht: spieler?.geschlecht || 'herren',
      punkte,
      runde: ergebnis?.runde || null,
      nochDabei,
      anzahlPicks: spielerPickCount.get(id) || 0,
    };
  });

  // Sort by points (descending), then by ranking
  const herrenMitPunkten = ausgewaehlteSpielerMitPunkten
    .filter(s => s.geschlecht === 'herren')
    .sort((a, b) => b.punkte - a.punkte || a.ranking - b.ranking);

  const damenMitPunkten = ausgewaehlteSpielerMitPunkten
    .filter(s => s.geschlecht === 'damen')
    .sort((a, b) => b.punkte - a.punkte || a.ranking - b.ranking);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Rangliste</h1>

      <Rangliste
        rangliste={rangliste}
        turniername={`${aktivTurnier.name} ${aktivTurnier.jahr}`}
      />

      {/* Draw Visualization */}
      {turnierErgebnisse.some(e => e.runde >= 4) && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Turnierbaum Herren">
            <TurnierDraw
              ergebnisse={turnierErgebnisse}
              spieler={alleSpieler}
              geschlecht="herren"
            />
          </Card>
          <Card title="Turnierbaum Damen">
            <TurnierDraw
              ergebnisse={turnierErgebnisse}
              spieler={alleSpieler}
              geschlecht="damen"
            />
          </Card>
        </div>
      )}

      {turnierErgebnisse.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Turnierergebnisse Herren">
            {herrenErgebnisse.length === 0 ? (
              <p className="text-gray-500">Noch keine Ergebnisse</p>
            ) : (
              <div className="space-y-1">
                {herrenErgebnisse.map(e => (
                  <div key={e.spielerId} className="flex justify-between py-1">
                    <span>{e.spielerName}</span>
                    <span className="text-gray-600">
                      {RUNDEN_NAMEN[e.runde as Runde]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Turnierergebnisse Damen">
            {damenErgebnisse.length === 0 ? (
              <p className="text-gray-500">Noch keine Ergebnisse</p>
            ) : (
              <div className="space-y-1">
                {damenErgebnisse.map(e => (
                  <div key={e.spielerId} className="flex justify-between py-1">
                    <span>{e.spielerName}</span>
                    <span className="text-gray-600">
                      {RUNDEN_NAMEN[e.runde as Runde]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Ausgewählte Spieler mit Punkten */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Ausgewählte Herren - Punktestand">
          <div className="space-y-1">
            {herrenMitPunkten.map(s => (
              <div
                key={s.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded ${
                  s.nochDabei ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-6">{s.ranking}.</span>
                  <span className={s.nochDabei ? 'font-medium' : 'text-gray-500'}>
                    {s.name}
                  </span>
                  {!s.nochDabei && s.runde && (
                    <span className="text-xs text-gray-400">
                      (out: {RUNDEN_NAMEN[s.runde as Runde]})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400" title="Anzahl Teilnehmer die diesen Spieler gewählt haben">
                    {s.anzahlPicks}x
                  </span>
                  <span className={`font-bold ${s.punkte > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.punkte.toFixed(1)}
                  </span>
                  {s.nochDabei && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Noch im Turnier"></span>
                  )}
                </div>
              </div>
            ))}
            {herrenMitPunkten.length === 0 && (
              <p className="text-gray-500 text-center py-2">Keine Spieler ausgewählt</p>
            )}
          </div>
        </Card>

        <Card title="Ausgewählte Damen - Punktestand">
          <div className="space-y-1">
            {damenMitPunkten.map(s => (
              <div
                key={s.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded ${
                  s.nochDabei ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-6">{s.ranking}.</span>
                  <span className={s.nochDabei ? 'font-medium' : 'text-gray-500'}>
                    {s.name}
                  </span>
                  {!s.nochDabei && s.runde && (
                    <span className="text-xs text-gray-400">
                      (out: {RUNDEN_NAMEN[s.runde as Runde]})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400" title="Anzahl Teilnehmer die diesen Spieler gewählt haben">
                    {s.anzahlPicks}x
                  </span>
                  <span className={`font-bold ${s.punkte > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.punkte.toFixed(1)}
                  </span>
                  {s.nochDabei && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Noch im Turnier"></span>
                  )}
                </div>
              </div>
            ))}
            {damenMitPunkten.length === 0 && (
              <p className="text-gray-500 text-center py-2">Keine Spielerinnen ausgewählt</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
