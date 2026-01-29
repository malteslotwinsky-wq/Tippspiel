'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TippFormular from '@/components/TippFormular';
import Card from '@/components/ui/Card';
import { Spieler, Turnier, Tipp, TurnierErgebnis, RUNDEN_NAMEN, Runde, PUNKTE_PRO_RUNDE } from '@/lib/types';

export default function TeilnehmerTippPage() {
  const params = useParams();
  const teilnehmerName = decodeURIComponent(params.name as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turnier, setTurnier] = useState<Turnier | null>(null);
  const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
  const [ergebnisse, setErgebnisse] = useState<TurnierErgebnis[]>([]);
  const [existierenderTipp, setExistierenderTipp] = useState<Tipp | null>(null);
  const [abgabeGeschlossen, setAbgabeGeschlossen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [turnierRes, spielerRes, ergebnisseRes] = await Promise.all([
          fetch('/api/turnier'),
          fetch('/api/spieler'),
          fetch('/api/turnier/ergebnisse'),
        ]);

        const turniere = await turnierRes.json();
        const aktivTurnier = turniere.find((t: Turnier) => t.aktiv);

        if (!aktivTurnier) {
          setError('Kein aktives Turnier gefunden');
          setLoading(false);
          return;
        }

        setTurnier(aktivTurnier);

        if (aktivTurnier.abgabeSchluss) {
          const deadline = new Date(aktivTurnier.abgabeSchluss);
          setAbgabeGeschlossen(new Date() > deadline);
        }

        const spielerData = await spielerRes.json();
        setSpieler(spielerData);

        const alleErgebnisse = await ergebnisseRes.json();
        const turnierErgebnisse = alleErgebnisse.filter((e: TurnierErgebnis) => e.turnierId === aktivTurnier.id);
        setErgebnisse(turnierErgebnisse);

        const tippsRes = await fetch(
          `/api/tipps?teilnehmerName=${encodeURIComponent(teilnehmerName)}&turnierId=${aktivTurnier.id}`
        );
        const tipps = await tippsRes.json();
        if (tipps.length > 0) {
          setExistierenderTipp(tipps[0]);
        }

        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    }

    loadData();
  }, [teilnehmerName]);

  const handleSubmit = async (tipp: Omit<Tipp, 'abgegebenAm'>) => {
    const response = await fetch('/api/tipps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipp),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.details?.join(', ') || data.error || 'Fehler beim Speichern');
    }

    const tippsRes = await fetch(
      `/api/tipps?teilnehmerName=${encodeURIComponent(teilnehmerName)}&turnierId=${turnier!.id}`
    );
    const tipps = await tippsRes.json();
    if (tipps.length > 0) {
      setExistierenderTipp(tipps[0]);
    }
  };

  function formatDeadline(dateString: string | undefined) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getSpielerInfo(id: string) {
    if (!spieler) return { name: id, ranking: 0 };
    const alleSpieler = [...spieler.herren, ...spieler.damen];
    const found = alleSpieler.find(s => s.id === id);
    return found ? { name: found.name, ranking: found.ranking } : { name: id, ranking: 0 };
  }

  function getSpielerStatus(id: string) {
    const ergebnis = ergebnisse.find(e => e.spielerId === id);
    if (!ergebnis) {
      return { runde: null, nochDabei: true, rundenName: null, punkte: 0, isSieger: false };
    }

    // Basispunkte für die Runde
    let punkte = PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] || 0;

    // Sieger-Bonus: +1 wenn im Finale (runde 7) und NICHT ausgeschieden
    const isSieger = ergebnis.runde === 7 && ergebnis.out !== true;
    if (isSieger) {
      punkte += 1;
    }

    return {
      runde: ergebnis.runde,
      nochDabei: ergebnis.out !== true,
      rundenName: RUNDEN_NAMEN[ergebnis.runde as Runde],
      punkte,
      isSieger,
    };
  }

  function berechneKategoriePunkte(spielerIds: string[]) {
    return spielerIds.reduce((sum, id) => {
      const status = getSpielerStatus(id);
      return sum + status.punkte;
    }, 0);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-4 w-32"></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-10"></div>
            ))}
          </div>
          <div className="card p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="empty-state">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/rangliste" className="btn-secondary btn-sm">
            Zur Rangliste
          </Link>
        </div>
      </Card>
    );
  }

  if (!turnier || !spieler) {
    return null;
  }

  // After deadline: Show tip readonly with player status
  if (abgabeGeschlossen) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <Link href="/rangliste" className="link text-sm">
            ← Zurück zur Rangliste
          </Link>
          <h1 className="page-title mt-2">Tipp von {teilnehmerName}</h1>
          <p className="page-subtitle">{turnier.name} {turnier.jahr}</p>
        </div>

        <div className="bg-slate-100 border border-slate-200 text-slate-700 px-4 py-3 rounded-lg text-sm">
          Abgabeschluss war am {formatDeadline(turnier.abgabeSchluss)}.
        </div>

        {existierenderTipp ? (
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Herren-Auswahl" subtitle={`${berechneKategoriePunkte(existierenderTipp.herren).toFixed(1)} Punkte`}>
              <div className="space-y-2">
                {existierenderTipp.herren.map(id => {
                  const info = getSpielerInfo(id);
                  const status = getSpielerStatus(id);
                  const isSieger = id === existierenderTipp.siegerHerren;

                  return (
                    <div
                      key={id}
                      className={`p-2.5 rounded-lg flex items-center justify-between text-sm ${isSieger ? 'bg-amber-50 border border-amber-200' :
                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-slate-400 text-xs w-4">{info.ranking}</span>
                        <span className={`truncate ${status.nochDabei ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                          {info.name}
                        </span>
                        {isSieger && <span className="text-amber-500">★</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                        <span className={`font-semibold text-xs tabular-nums ${status.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {status.punkte.toFixed(1)}
                        </span>
                        {status.nochDabei ? (
                          <span className="badge badge-green text-xs">
                            {status.rundenName || 'Dabei'}
                          </span>
                        ) : (
                          <span className="badge badge-gray text-xs">
                            Out
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Damen-Auswahl" subtitle={`${berechneKategoriePunkte(existierenderTipp.damen).toFixed(1)} Punkte`}>
              <div className="space-y-2">
                {existierenderTipp.damen.map(id => {
                  const info = getSpielerInfo(id);
                  const status = getSpielerStatus(id);
                  const isSieger = id === existierenderTipp.siegerDamen;

                  return (
                    <div
                      key={id}
                      className={`p-2.5 rounded-lg flex items-center justify-between text-sm ${isSieger ? 'bg-amber-50 border border-amber-200' :
                        status.nochDabei ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-slate-400 text-xs w-4">{info.ranking}</span>
                        <span className={`truncate ${status.nochDabei ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                          {info.name}
                        </span>
                        {isSieger && <span className="text-amber-500">★</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                        <span className={`font-semibold text-xs tabular-nums ${status.punkte > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {status.punkte.toFixed(1)}
                        </span>
                        {status.nochDabei ? (
                          <span className="badge badge-green text-xs">
                            {status.rundenName || 'Dabei'}
                          </span>
                        ) : (
                          <span className="badge badge-gray text-xs">
                            Out
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="empty-state">
              <p className="empty-state-text">{teilnehmerName} hat keinen Tipp abgegeben.</p>
            </div>
          </Card>
        )}

        <div className="text-center">
          <Link href="/rangliste" className="link">
            Zurück zur Rangliste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <Link href="/teilnehmer" className="link text-sm">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="page-title mt-2">Tipp für {teilnehmerName}</h1>
        <p className="page-subtitle">{turnier.name} {turnier.jahr}</p>
      </div>

      {existierenderTipp && (
        <div className="flex items-center gap-3">
          <span className="badge badge-green">Tipp abgegeben</span>
          <span className="text-sm text-slate-500">
            {new Date(existierenderTipp.abgegebenAm).toLocaleString('de-DE')}
          </span>
        </div>
      )}

      {turnier.abgabeSchluss && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          <strong>Abgabeschluss:</strong> {formatDeadline(turnier.abgabeSchluss)}
          <p className="text-amber-700 mt-1">
            Dein Tipp ist bis zum Abgabeschluss für andere nicht sichtbar.
          </p>
        </div>
      )}

      <TippFormular
        teilnehmerName={teilnehmerName}
        turnier={turnier}
        alleSpieler={spieler}
        existierenderTipp={existierenderTipp}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
