import Link from 'next/link';
import Card from '@/components/ui/Card';
import { getTurniere, getTipps, getSpieler, getTeilnehmer, getErgebnisse } from '@/lib/daten';
import { Tipp, Spieler, TurnierErgebnis } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isDeadlinePassed(dateString: string | undefined): boolean {
  if (!dateString) return false;
  return new Date() > new Date(dateString);
}

function formatDeadline(dateString: string | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AlleTippsPage() {
  const turniere = await getTurniere();
  const tipps = await getTipps();
  const spielerData = await getSpieler();
  const teilnehmer = await getTeilnehmer();
  const ergebnisse = await getErgebnisse();

  const aktivTurnier = turniere.find(t => t.aktiv);

  if (!aktivTurnier) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p className="text-xl mb-4">Kein aktives Turnier</p>
          <Link href="/" className="text-green-600 hover:underline">
            Zurück zur Startseite
          </Link>
        </div>
      </Card>
    );
  }

  const deadlinePassed = isDeadlinePassed(aktivTurnier.abgabeSchluss);

  // If deadline hasn't passed, don't show tips
  if (!deadlinePassed) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Alle Tipps</h1>

        <Card title={`${aktivTurnier.name} ${aktivTurnier.jahr}`}>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-xl text-gray-600 mb-4">
              Tipps sind noch nicht sichtbar
            </p>
            {aktivTurnier.abgabeSchluss && (
              <p className="text-gray-500">
                Tipps werden sichtbar nach dem Abgabeschluss am{' '}
                <strong>{formatDeadline(aktivTurnier.abgabeSchluss)}</strong>
              </p>
            )}
            <div className="mt-6">
              <Link
                href="/teilnehmer"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Jetzt Tipp abgeben
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const turnierTipps = tipps.filter(t => t.turnierId === aktivTurnier.id);
  const turnierErgebnisse = ergebnisse.filter(e => e.turnierId === aktivTurnier.id);
  const alleSpieler = [...spielerData.herren, ...spielerData.damen];

  function getSpielerName(id: string): string {
    const found = alleSpieler.find(s => s.id === id);
    return found ? found.name : id;
  }

  function getSpielerRanking(id: string): number {
    const found = alleSpieler.find(s => s.id === id);
    return found ? found.ranking : 999;
  }

  function getSpielerById(id: string): Spieler | undefined {
    return alleSpieler.find(s => s.id === id);
  }

  // Check if a player is still in the tournament (has result >= 2 or no result yet = still in R1)
  function istNochImTurnier(spielerId: string): boolean {
    const result = turnierErgebnisse.find(e => e.spielerId === spielerId);
    // If no result, player is still in tournament (hasn't been eliminated)
    // If result exists, player reached that round (and may have lost there)
    // For simplicity: player is "out" if they have a result (meaning they reached that round and lost)
    // Actually, we should consider: result.runde means they REACHED that round
    // So everyone with a result is still being tracked
    return !result || result.runde >= 2;
  }

  // Get unique players across all tips for comparison
  const allPickedHerren = new Set<string>();
  const allPickedDamen = new Set<string>();
  turnierTipps.forEach(tipp => {
    tipp.herren.forEach(id => allPickedHerren.add(id));
    tipp.damen.forEach(id => allPickedDamen.add(id));
  });

  // Sort players by how many people picked them
  const herrenByPopularity = Array.from(allPickedHerren)
    .map(id => ({
      id,
      spieler: getSpielerById(id),
      count: turnierTipps.filter(t => t.herren.includes(id)).length,
      siegerCount: turnierTipps.filter(t => t.siegerHerren === id).length,
    }))
    .sort((a, b) => b.count - a.count);

  const damenByPopularity = Array.from(allPickedDamen)
    .map(id => ({
      id,
      spieler: getSpielerById(id),
      count: turnierTipps.filter(t => t.damen.includes(id)).length,
      siegerCount: turnierTipps.filter(t => t.siegerDamen === id).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Alle Tipps</h1>
        <Link href="/rangliste" className="text-green-600 hover:underline">
          Zur Rangliste →
        </Link>
      </div>

      <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
        Abgabeschluss war am {formatDeadline(aktivTurnier.abgabeSchluss)}. Alle Tipps sind jetzt sichtbar.
      </div>

      {turnierTipps.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            Keine Tipps abgegeben.
          </div>
        </Card>
      ) : (
        <>
          {/* Comparison Matrix - Herren */}
          <Card title="Vergleich Herren">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">
                      Spieler
                    </th>
                    {turnierTipps.map(tipp => (
                      <th key={tipp.teilnehmerName} className="px-2 py-2 text-center font-medium text-gray-600 min-w-16">
                        {tipp.teilnehmerName.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Anz.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {herrenByPopularity.map(({ id, spieler, count, siegerCount }) => (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 whitespace-nowrap sticky left-0 bg-white z-10">
                        <span className="text-gray-400 mr-1">{spieler?.ranking}.</span>
                        <span className="font-medium">{spieler?.name}</span>
                        {siegerCount > 0 && (
                          <span className="ml-1 text-yellow-500" title={`${siegerCount}x Siegertipp`}>
                            ★{siegerCount}
                          </span>
                        )}
                      </td>
                      {turnierTipps.map(tipp => {
                        const picked = tipp.herren.includes(id);
                        const isSieger = tipp.siegerHerren === id;
                        return (
                          <td key={tipp.teilnehmerName} className="px-2 py-1.5 text-center">
                            {picked ? (
                              <span className={`inline-block w-6 h-6 rounded-full ${
                                isSieger
                                  ? 'bg-yellow-400 text-white'
                                  : 'bg-green-500 text-white'
                              } text-xs leading-6`}>
                                {isSieger ? '★' : '✓'}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-center font-bold text-gray-600">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Comparison Matrix - Damen */}
          <Card title="Vergleich Damen">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">
                      Spielerin
                    </th>
                    {turnierTipps.map(tipp => (
                      <th key={tipp.teilnehmerName} className="px-2 py-2 text-center font-medium text-gray-600 min-w-16">
                        {tipp.teilnehmerName.split(' ')[0]}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Anz.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {damenByPopularity.map(({ id, spieler, count, siegerCount }) => (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 whitespace-nowrap sticky left-0 bg-white z-10">
                        <span className="text-gray-400 mr-1">{spieler?.ranking}.</span>
                        <span className="font-medium">{spieler?.name}</span>
                        {siegerCount > 0 && (
                          <span className="ml-1 text-yellow-500" title={`${siegerCount}x Siegertipp`}>
                            ★{siegerCount}
                          </span>
                        )}
                      </td>
                      {turnierTipps.map(tipp => {
                        const picked = tipp.damen.includes(id);
                        const isSieger = tipp.siegerDamen === id;
                        return (
                          <td key={tipp.teilnehmerName} className="px-2 py-1.5 text-center">
                            {picked ? (
                              <span className={`inline-block w-6 h-6 rounded-full ${
                                isSieger
                                  ? 'bg-yellow-400 text-white'
                                  : 'bg-green-500 text-white'
                              } text-xs leading-6`}>
                                {isSieger ? '★' : '✓'}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-center font-bold text-gray-600">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Individual Tips (collapsible details) */}
          <details className="group">
            <summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-green-600 list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              Einzelne Tipps anzeigen
            </summary>
            <div className="mt-4 space-y-6">
              {turnierTipps.map(tipp => (
                <Card key={tipp.teilnehmerName} title={tipp.teilnehmerName}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Herren</h4>
                      <div className="space-y-1">
                        {tipp.herren.map(id => (
                          <div
                            key={id}
                            className={`p-2 rounded text-sm ${
                              id === tipp.siegerHerren
                                ? 'bg-yellow-100 border border-yellow-400'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="text-gray-500 mr-2">{getSpielerRanking(id)}.</span>
                            {getSpielerName(id)}
                            {id === tipp.siegerHerren && (
                              <span className="float-right text-yellow-600 text-xs">★ Sieger</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Damen</h4>
                      <div className="space-y-1">
                        {tipp.damen.map(id => (
                          <div
                            key={id}
                            className={`p-2 rounded text-sm ${
                              id === tipp.siegerDamen
                                ? 'bg-yellow-100 border border-yellow-400'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="text-gray-500 mr-2">{getSpielerRanking(id)}.</span>
                            {getSpielerName(id)}
                            {id === tipp.siegerDamen && (
                              <span className="float-right text-yellow-600 text-xs">★ Sieger</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    Abgegeben am {new Date(tipp.abgegebenAm).toLocaleString('de-DE')}
                  </div>
                </Card>
              ))}
            </div>
          </details>
        </>
      )}

      {/* Show who hasn't submitted */}
      {(() => {
        const submitted = new Set(turnierTipps.map(t => t.teilnehmerName));
        const missing = teilnehmer.filter(t => !submitted.has(t.name));
        if (missing.length === 0) return null;

        return (
          <Card title="Keine Tipps abgegeben">
            <div className="text-gray-500">
              {missing.map(t => t.name).join(', ')}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
