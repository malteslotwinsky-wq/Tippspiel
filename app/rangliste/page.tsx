import Link from 'next/link';
import Rangliste from '@/components/Rangliste';
import TurnierDraw from '@/components/TurnierDraw';
import Card from '@/components/ui/Card';
import { getTurniere, getTipps, getErgebnisse, getSpieler } from '@/lib/daten';
import { berechneRangliste } from '@/lib/punkte';
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
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="empty-state-title">Kein aktives Turnier</p>
          <p className="empty-state-text mb-4">Erstelle ein Turnier im Admin-Bereich.</p>
          <Link href="/admin" className="btn-secondary btn-sm">
            Zum Admin-Bereich
          </Link>
        </div>
      </Card>
    );
  }

  const rangliste = berechneRangliste(tipps, ergebnisse, aktivTurnier.id, true);
  const turnierErgebnisse = ergebnisse.filter(e => e.turnierId === aktivTurnier.id);
  const turnierTipps = tipps.filter(t => t.turnierId === aktivTurnier.id);

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

  const ausgewaehlteSpielerIds = new Set<string>();
  turnierTipps.forEach(tipp => {
    tipp.herren.forEach(id => ausgewaehlteSpielerIds.add(id));
    tipp.damen.forEach(id => ausgewaehlteSpielerIds.add(id));
  });

  const spielerPickCount = new Map<string, number>();
  turnierTipps.forEach(tipp => {
    [...tipp.herren, ...tipp.damen].forEach(id => {
      spielerPickCount.set(id, (spielerPickCount.get(id) || 0) + 1);
    });
  });

  const ausgewaehlteSpielerMitPunkten = Array.from(ausgewaehlteSpielerIds).map(id => {
    const spieler = alleSpieler.find(s => s.id === id);
    const ergebnis = turnierErgebnisse.find(e => e.spielerId === id);
    const punkte = ergebnis ? PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] : 0;
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

  const herrenMitPunkten = ausgewaehlteSpielerMitPunkten
    .filter(s => s.geschlecht === 'herren')
    .sort((a, b) => b.punkte - a.punkte || a.ranking - b.ranking);

  const damenMitPunkten = ausgewaehlteSpielerMitPunkten
    .filter(s => s.geschlecht === 'damen')
    .sort((a, b) => b.punkte - a.punkte || a.ranking - b.ranking);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Rangliste</h1>
        <p className="page-subtitle">{aktivTurnier.name} {aktivTurnier.jahr}</p>
      </div>

      {/* Main Rangliste */}
      <Rangliste rangliste={rangliste} />

      {/* Draw Visualization */}
      {turnierErgebnisse.some(e => e.runde >= 4) && (
        <section>
          <h2 className="section-header">Turnierbaum</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Herren">
              <TurnierDraw ergebnisse={turnierErgebnisse} spieler={alleSpieler} geschlecht="herren" />
            </Card>
            <Card title="Damen">
              <TurnierDraw ergebnisse={turnierErgebnisse} spieler={alleSpieler} geschlecht="damen" />
            </Card>
          </div>
        </section>
      )}

      {/* Tournament Results */}
      {turnierErgebnisse.length > 0 && (
        <section>
          <h2 className="section-header">Turnierergebnisse</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Herren">
              {herrenErgebnisse.length === 0 ? (
                <p className="text-sm text-slate-500">Noch keine Ergebnisse</p>
              ) : (
                <div className="space-y-1">
                  {herrenErgebnisse.map(e => (
                    <div key={e.spielerId} className="flex justify-between py-1.5 text-sm">
                      <span className="text-slate-900">{e.spielerName}</span>
                      <span className="text-slate-500">{RUNDEN_NAMEN[e.runde as Runde]}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card title="Damen">
              {damenErgebnisse.length === 0 ? (
                <p className="text-sm text-slate-500">Noch keine Ergebnisse</p>
              ) : (
                <div className="space-y-1">
                  {damenErgebnisse.map(e => (
                    <div key={e.spielerId} className="flex justify-between py-1.5 text-sm">
                      <span className="text-slate-900">{e.spielerName}</span>
                      <span className="text-slate-500">{RUNDEN_NAMEN[e.runde as Runde]}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Selected Players */}
      <section>
        <h2 className="section-header">Ausgewählte Spieler</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Herren">
            <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
              {herrenMitPunkten.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">Keine Spieler ausgewählt</p>
              ) : herrenMitPunkten.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between py-2 px-2 rounded-lg text-sm ${s.nochDabei ? 'bg-emerald-50' : 'bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 text-xs w-5 flex-shrink-0">{s.ranking}</span>
                    <span className={`truncate ${s.nochDabei ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                    {!s.nochDabei && s.runde && (
                      <span className="badge badge-gray flex-shrink-0">
                        {RUNDEN_NAMEN[s.runde as Runde]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{s.anzahlPicks}×</span>
                    <span className={`font-semibold tabular-nums ${s.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.punkte.toFixed(1)}
                    </span>
                    {s.nochDabei && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Noch dabei" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Damen">
            <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
              {damenMitPunkten.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">Keine Spielerinnen ausgewählt</p>
              ) : damenMitPunkten.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between py-2 px-2 rounded-lg text-sm ${s.nochDabei ? 'bg-emerald-50' : 'bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-400 text-xs w-5 flex-shrink-0">{s.ranking}</span>
                    <span className={`truncate ${s.nochDabei ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                    {!s.nochDabei && s.runde && (
                      <span className="badge badge-gray flex-shrink-0">
                        {RUNDEN_NAMEN[s.runde as Runde]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{s.anzahlPicks}×</span>
                    <span className={`font-semibold tabular-nums ${s.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.punkte.toFixed(1)}
                    </span>
                    {s.nochDabei && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Noch dabei" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
