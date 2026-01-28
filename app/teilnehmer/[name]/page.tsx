'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TippFormular from '@/components/TippFormular';
import Card from '@/components/ui/Card';
import { Spieler, Turnier, Tipp } from '@/lib/types';

export default function TeilnehmerTippPage() {
  const params = useParams();
  const teilnehmerName = decodeURIComponent(params.name as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turnier, setTurnier] = useState<Turnier | null>(null);
  const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
  const [existierenderTipp, setExistierenderTipp] = useState<Tipp | null>(null);
  const [abgabeGeschlossen, setAbgabeGeschlossen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const turnierRes = await fetch('/api/turnier');
        const turniere = await turnierRes.json();
        const aktivTurnier = turniere.find((t: Turnier) => t.aktiv);

        if (!aktivTurnier) {
          setError('Kein aktives Turnier gefunden');
          setLoading(false);
          return;
        }

        setTurnier(aktivTurnier);

        // Check if deadline has passed
        if (aktivTurnier.abgabeSchluss) {
          const deadline = new Date(aktivTurnier.abgabeSchluss);
          setAbgabeGeschlossen(new Date() > deadline);
        }

        const spielerRes = await fetch('/api/spieler');
        const spielerData = await spielerRes.json();
        setSpieler(spielerData);

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

  function getSpielerName(id: string) {
    if (!spieler) return id;
    const alleSpieler = [...spieler.herren, ...spieler.damen];
    const found = alleSpieler.find(s => s.id === id);
    return found ? `${found.ranking}. ${found.name}` : id;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-500">Lade...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/teilnehmer" className="text-green-600 hover:underline">
            Zurück zur Übersicht
          </Link>
        </div>
      </Card>
    );
  }

  if (!turnier || !spieler) {
    return null;
  }

  // After deadline: Show tip readonly
  if (abgabeGeschlossen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/teilnehmer" className="text-green-600 hover:underline text-sm">
              ← Zurück zur Übersicht
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Tipp von {teilnehmerName}
            </h1>
            <p className="text-gray-600">
              {turnier.name} {turnier.jahr}
            </p>
          </div>
        </div>

        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Abgabeschluss war am {formatDeadline(turnier.abgabeSchluss)}. Tipps können nicht mehr geändert werden.
        </div>

        {existierenderTipp ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Herren-Auswahl">
              <div className="space-y-2">
                {existierenderTipp.herren.map(id => (
                  <div
                    key={id}
                    className={`p-2 rounded ${id === existierenderTipp.siegerHerren ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-50'}`}
                  >
                    {getSpielerName(id)}
                    {id === existierenderTipp.siegerHerren && (
                      <span className="float-right text-yellow-600">★ Siegertipp</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Damen-Auswahl">
              <div className="space-y-2">
                {existierenderTipp.damen.map(id => (
                  <div
                    key={id}
                    className={`p-2 rounded ${id === existierenderTipp.siegerDamen ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-50'}`}
                  >
                    {getSpielerName(id)}
                    {id === existierenderTipp.siegerDamen && (
                      <span className="float-right text-yellow-600">★ Siegertipp</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500">
              {teilnehmerName} hat keinen Tipp abgegeben.
            </div>
          </Card>
        )}

        <div className="text-center">
          <Link href="/tipps" className="text-green-600 hover:underline">
            Alle Tipps ansehen →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/teilnehmer" className="text-green-600 hover:underline text-sm">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Tipp für {teilnehmerName}
          </h1>
          <p className="text-gray-600">
            {turnier.name} {turnier.jahr}
          </p>
        </div>
        {existierenderTipp && (
          <div className="text-right">
            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Tipp abgegeben
            </span>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(existierenderTipp.abgegebenAm).toLocaleString('de-DE')}
            </p>
          </div>
        )}
      </div>

      {turnier.abgabeSchluss && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
          <strong>Abgabeschluss:</strong> {formatDeadline(turnier.abgabeSchluss)}
          <p className="text-sm mt-1">
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
