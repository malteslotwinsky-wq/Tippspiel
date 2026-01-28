'use client';

import { useState, useEffect } from 'react';
import { Spieler, Turnier, Tipp } from '@/lib/types';
import SpielerAuswahl from './SpielerAuswahl';
import Button from './ui/Button';
import Card from './ui/Card';

interface TippFormularProps {
  teilnehmerName: string;
  turnier: Turnier;
  alleSpieler: { herren: Spieler[]; damen: Spieler[] };
  existierenderTipp?: Tipp | null;
  onSubmit: (tipp: Omit<Tipp, 'abgegebenAm'>) => Promise<void>;
}

export default function TippFormular({
  teilnehmerName,
  turnier,
  alleSpieler,
  existierenderTipp,
  onSubmit,
}: TippFormularProps) {
  const [herrenAuswahl, setHerrenAuswahl] = useState<string[]>(
    existierenderTipp?.herren || []
  );
  const [damenAuswahl, setDamenAuswahl] = useState<string[]>(
    existierenderTipp?.damen || []
  );
  const [siegerHerren, setSiegerHerren] = useState<string>(
    existierenderTipp?.siegerHerren || ''
  );
  const [siegerDamen, setSiegerDamen] = useState<string>(
    existierenderTipp?.siegerDamen || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggleHerren = (id: string) => {
    setHerrenAuswahl(prev => {
      if (prev.includes(id)) {
        // Remove and also clear winner if it was this player
        if (siegerHerren === id) setSiegerHerren('');
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
  };

  const handleToggleDamen = (id: string) => {
    setDamenAuswahl(prev => {
      if (prev.includes(id)) {
        if (siegerDamen === id) setSiegerDamen('');
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (herrenAuswahl.length !== 8) {
      setError('Bitte wähle genau 8 Herren aus');
      return;
    }
    if (damenAuswahl.length !== 8) {
      setError('Bitte wähle genau 8 Damen aus');
      return;
    }
    if (!siegerHerren) {
      setError('Bitte wähle einen Siegertipp für Herren');
      return;
    }
    if (!siegerDamen) {
      setError('Bitte wähle einen Siegertipp für Damen');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        teilnehmerName,
        turnierId: turnier.id,
        herren: herrenAuswahl,
        damen: damenAuswahl,
        siegerHerren,
        siegerDamen,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  const herrenSpielerAuswahl = alleSpieler.herren.filter(s =>
    herrenAuswahl.includes(s.id)
  );
  const damenSpielerAuswahl = alleSpieler.damen.filter(s =>
    damenAuswahl.includes(s.id)
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Tipp erfolgreich gespeichert!
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Herren auswählen (8 Spieler)">
          <SpielerAuswahl
            spieler={alleSpieler.herren}
            ausgewaehlt={herrenAuswahl}
            onToggle={handleToggleHerren}
            geschlecht="herren"
          />
        </Card>

        <Card title="Damen auswählen (8 Spielerinnen)">
          <SpielerAuswahl
            spieler={alleSpieler.damen}
            ausgewaehlt={damenAuswahl}
            onToggle={handleToggleDamen}
            geschlecht="damen"
          />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Siegertipp Herren">
          {herrenAuswahl.length > 0 ? (
            <div className="space-y-2">
              {herrenSpielerAuswahl.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSiegerHerren(s.id)}
                  className={`w-full p-2 rounded-md text-left transition-colors ${
                    siegerHerren === s.id
                      ? 'bg-yellow-100 border-2 border-yellow-500'
                      : 'bg-gray-50 hover:bg-yellow-50'
                  }`}
                >
                  <span className="text-gray-500 mr-2">{s.ranking}</span>
                  {s.name}
                  {siegerHerren === s.id && (
                    <span className="float-right text-yellow-600">★</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Wähle zuerst 8 Herren aus
            </p>
          )}
        </Card>

        <Card title="Siegertipp Damen">
          {damenAuswahl.length > 0 ? (
            <div className="space-y-2">
              {damenSpielerAuswahl.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSiegerDamen(s.id)}
                  className={`w-full p-2 rounded-md text-left transition-colors ${
                    siegerDamen === s.id
                      ? 'bg-yellow-100 border-2 border-yellow-500'
                      : 'bg-gray-50 hover:bg-yellow-50'
                  }`}
                >
                  <span className="text-gray-500 mr-2">{s.ranking}</span>
                  {s.name}
                  {siegerDamen === s.id && (
                    <span className="float-right text-yellow-600">★</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Wähle zuerst 8 Damen aus
            </p>
          )}
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
        >
          {submitting ? 'Speichern...' : existierenderTipp ? 'Tipp aktualisieren' : 'Tipp abgeben'}
        </Button>
      </div>
    </div>
  );
}
