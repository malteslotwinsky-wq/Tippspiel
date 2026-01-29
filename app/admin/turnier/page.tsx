'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InteraktivesDraw from '@/components/InteraktivesDraw';
import { Turnier, Spieler, TurnierErgebnis, RUNDEN_NAMEN, Runde, Tipp } from '@/lib/types';

export default function AdminTurnierPage() {
  const [turniere, setTurniere] = useState<Turnier[]>([]);
  const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
  const [ergebnisse, setErgebnisse] = useState<TurnierErgebnis[]>([]);
  const [tipps, setTipps] = useState<Tipp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTurnier, setShowNewTurnier] = useState(false);
  const [newTurnierData, setNewTurnierData] = useState({
    name: '',
    jahr: new Date().getFullYear().toString(),
    abgabeSchluss: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // For result entry
  const [selectedSpieler, setSelectedSpieler] = useState('');
  const [selectedRunde, setSelectedRunde] = useState<string>('2');
  const [spielerSearch, setSpielerSearch] = useState('');
  const [showSpielerSuggestions, setShowSpielerSuggestions] = useState(false);
  const spielerInputRef = useRef<HTMLInputElement>(null);

  // For deadline editing
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  const aktivTurnier = turniere.find(t => t.aktiv);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [turnierRes, spielerRes, ergebnisseRes, tippsRes] = await Promise.all([
      fetch('/api/turnier'),
      fetch('/api/spieler'),
      fetch('/api/turnier/ergebnisse'),
      fetch('/api/tipps'),
    ]);

    setTurniere(await turnierRes.json());
    setSpieler(await spielerRes.json());
    setErgebnisse(await ergebnisseRes.json());
    setTipps(await tippsRes.json());
    setLoading(false);
  }

  async function handleCreateTurnier(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Create tournament
      const res = await fetch('/api/turnier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTurnierData.name,
          jahr: newTurnierData.jahr,
          abgabeSchluss: newTurnierData.abgabeSchluss ? new Date(newTurnierData.abgabeSchluss).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
        setSaving(false);
        return;
      }

      // Import Herren if CSV provided
      const herrenCsv = (newTurnierData as any).herrenCsv;
      if (herrenCsv && herrenCsv.trim()) {
        const herrenRes = await fetch('/api/spieler/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csv: herrenCsv,
            geschlecht: 'herren',
            ersetzen: true,
          }),
        });
        if (!herrenRes.ok) {
          const data = await herrenRes.json();
          setMessage({ type: 'error', text: `Turnier erstellt, aber Herren-Import fehlgeschlagen: ${data.error}` });
        }
      }

      // Import Damen if CSV provided
      const damenCsv = (newTurnierData as any).damenCsv;
      if (damenCsv && damenCsv.trim()) {
        const damenRes = await fetch('/api/spieler/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csv: damenCsv,
            geschlecht: 'damen',
            ersetzen: true,
          }),
        });
        if (!damenRes.ok) {
          const data = await damenRes.json();
          setMessage({ type: 'error', text: `Turnier erstellt, aber Damen-Import fehlgeschlagen: ${data.error}` });
        }
      }

      setMessage({ type: 'success', text: 'Turnier erstellt' + (herrenCsv || damenCsv ? ' und Spieler importiert' : '') });
      setShowNewTurnier(false);
      setNewTurnierData({ name: '', jahr: new Date().getFullYear().toString(), abgabeSchluss: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Erstellen' });
    }

    setSaving(false);
  }

  async function handleUpdateDeadline() {
    if (!aktivTurnier) return;
    setSaving(true);

    const res = await fetch('/api/turnier', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: aktivTurnier.id,
        abgabeSchluss: newDeadline ? new Date(newDeadline).toISOString() : null,
      }),
    });

    if (res.ok) {
      setMessage({ type: 'success', text: 'Abgabeschluss aktualisiert' });
      setEditingDeadline(false);
      loadData();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error });
    }

    setSaving(false);
  }

  async function handleAddErgebnis() {
    if (!selectedSpieler || !aktivTurnier) return;

    setSaving(true);
    const res = await fetch('/api/turnier/ergebnisse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnierId: aktivTurnier.id,
        spielerId: selectedSpieler,
        runde: parseInt(selectedRunde),
      }),
    });

    if (res.ok) {
      setMessage({ type: 'success', text: 'Ergebnis hinzugefügt' });
      setSelectedSpieler('');
      loadData();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error });
    }

    setSaving(false);
  }

  async function handleDeleteErgebnis(spielerId: string) {
    if (!aktivTurnier) return;

    const res = await fetch(
      `/api/turnier/ergebnisse?turnierId=${aktivTurnier.id}&spielerId=${spielerId}`,
      { method: 'DELETE' }
    );

    if (res.ok) {
      loadData();
    }
  }

  function formatDeadline(dateString: string | undefined) {
    if (!dateString) return 'Nicht gesetzt';
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isDeadlinePassed(dateString: string | undefined) {
    if (!dateString) return false;
    return new Date() > new Date(dateString);
  }

  function toLocalDateTimeString(dateString: string | undefined) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  if (loading) {
    return <div className="text-center py-12">Lade...</div>;
  }

  const alleSpieler = spieler ? [...spieler.herren, ...spieler.damen] : [];
  const turnierErgebnisse = aktivTurnier
    ? ergebnisse.filter(e => e.turnierId === aktivTurnier.id)
    : [];

  // Get all player IDs that were picked by participants for this tournament
  const turnierTipps = aktivTurnier ? tipps.filter(t => t.turnierId === aktivTurnier.id) : [];
  const ausgewaehlteSpielerIds = new Set<string>();
  turnierTipps.forEach(tipp => {
    tipp.herren.forEach(id => ausgewaehlteSpielerIds.add(id));
    tipp.damen.forEach(id => ausgewaehlteSpielerIds.add(id));
  });

  // Filter players: show picked players first, then others
  const ausgewaehlteSpieler = alleSpieler.filter(s => ausgewaehlteSpielerIds.has(s.id));
  const anderePickedHerren = ausgewaehlteSpieler.filter(s => s.id.startsWith('h'));
  const anderePickedDamen = ausgewaehlteSpieler.filter(s => s.id.startsWith('d'));

  const herrenErgebnisse = turnierErgebnisse
    .filter(e => e.spielerId.startsWith('h'))
    .map(e => ({
      ...e,
      spielerName: spieler?.herren.find(s => s.id === e.spielerId)?.name || 'Unbekannt',
    }))
    .sort((a, b) => b.runde - a.runde);

  const damenErgebnisse = turnierErgebnisse
    .filter(e => e.spielerId.startsWith('d'))
    .map(e => ({
      ...e,
      spielerName: spieler?.damen.find(s => s.id === e.spielerId)?.name || 'Unbekannt',
    }))
    .sort((a, b) => b.runde - a.runde);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-green-600 hover:underline text-sm">
            ← Zurück zum Admin-Bereich
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Turnier & Ergebnisse</h1>
        </div>
        <Button onClick={() => setShowNewTurnier(true)}>
          Neues Turnier
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showNewTurnier && (
        <Card title="Neues Turnier erstellen">
          <form onSubmit={handleCreateTurnier} className="space-y-6">
            {/* Tournament Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <select
                  value={newTurnierData.name}
                  onChange={e => setNewTurnierData({ ...newTurnierData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Auswählen...</option>
                  <option value="Australian Open">Australian Open</option>
                  <option value="French Open">French Open</option>
                  <option value="Wimbledon">Wimbledon</option>
                  <option value="US Open">US Open</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
                <input
                  type="number"
                  value={newTurnierData.jahr}
                  onChange={e => setNewTurnierData({ ...newTurnierData, jahr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="2024"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abgabeschluss</label>
              <input
                type="datetime-local"
                value={newTurnierData.abgabeSchluss}
                onChange={e => setNewTurnierData({ ...newTurnierData, abgabeSchluss: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">
                Nach diesem Zeitpunkt können keine Tipps mehr abgegeben werden.
              </p>
            </div>

            {/* Player Import Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span>🎾</span> Spieler hinzufügen (optional)
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Du kannst Spieler per CSV importieren. Format: <code className="bg-gray-100 px-1 rounded">Ranking,Name</code> pro Zeile.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Herren CSV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Herren (CSV)
                  </label>
                  <textarea
                    value={(newTurnierData as any).herrenCsv || ''}
                    onChange={e => setNewTurnierData({ ...newTurnierData, herrenCsv: e.target.value } as any)}
                    rows={5}
                    placeholder="1,Jannik Sinner&#10;2,Alexander Zverev&#10;3,Carlos Alcaraz&#10;..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                  />
                </div>

                {/* Damen CSV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Damen (CSV)
                  </label>
                  <textarea
                    value={(newTurnierData as any).damenCsv || ''}
                    onChange={e => setNewTurnierData({ ...newTurnierData, damenCsv: e.target.value } as any)}
                    rows={5}
                    placeholder="1,Aryna Sabalenka&#10;2,Iga Swiatek&#10;3,Coco Gauff&#10;..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Tipp: Kopiere die Rankings von der ATP/WTA Website. Leer lassen, um bestehende Spieler zu behalten.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Erstellen...' : 'Turnier erstellen'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowNewTurnier(false)}>
                Abbrechen
              </Button>
            </div>
          </form>
        </Card>
      )}

      {aktivTurnier ? (
        <>
          <Card title={`Aktives Turnier: ${aktivTurnier.name} ${aktivTurnier.jahr}`}>
            <div className="space-y-4">
              {/* Deadline Section */}
              <div className={`p-4 rounded-lg ${isDeadlinePassed(aktivTurnier.abgabeSchluss) ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className={`font-medium ${isDeadlinePassed(aktivTurnier.abgabeSchluss) ? 'text-red-800' : 'text-green-800'}`}>
                      Abgabeschluss: {formatDeadline(aktivTurnier.abgabeSchluss)}
                    </p>
                    {isDeadlinePassed(aktivTurnier.abgabeSchluss) ? (
                      <p className="text-red-600 text-sm mt-1">
                        Abgabeschluss vorbei - Tipps sind jetzt für alle sichtbar
                      </p>
                    ) : aktivTurnier.abgabeSchluss ? (
                      <p className="text-green-600 text-sm mt-1">
                        Teilnehmer können noch Tipps abgeben - Tipps sind versteckt
                      </p>
                    ) : (
                      <p className="text-yellow-600 text-sm mt-1">
                        Kein Abgabeschluss gesetzt - Tipps können jederzeit abgegeben werden
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingDeadline(true);
                      setNewDeadline(toLocalDateTimeString(aktivTurnier.abgabeSchluss));
                    }}
                  >
                    Bearbeiten
                  </Button>
                </div>

                {editingDeadline && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Neuer Abgabeschluss
                        </label>
                        <input
                          type="datetime-local"
                          value={newDeadline}
                          onChange={e => setNewDeadline(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <Button onClick={handleUpdateDeadline} disabled={saving}>
                        Speichern
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingDeadline(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Ergebnis eintragen</h3>
                <div className="flex gap-2 flex-wrap items-end">
                  {/* Autocomplete Input */}
                  <div className="relative flex-1 min-w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spieler suchen
                    </label>
                    <input
                      ref={spielerInputRef}
                      type="text"
                      value={spielerSearch}
                      onChange={e => {
                        setSpielerSearch(e.target.value);
                        setShowSpielerSuggestions(true);
                        setSelectedSpieler('');
                      }}
                      onFocus={() => setShowSpielerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSpielerSuggestions(false), 200)}
                      placeholder="Name eingeben..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {showSpielerSuggestions && spielerSearch.length >= 1 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {(() => {
                          // Filter players by search
                          const terms = spielerSearch.toLowerCase().split(' ');
                          const matchingSpieler = alleSpieler.filter(s => {
                            const name = s.name.toLowerCase();
                            return terms.every(term => name.includes(term));
                          });

                          // Sort: picked players first, then by ranking
                          const sortedSpieler = matchingSpieler.sort((a, b) => {
                            const aPicked = ausgewaehlteSpielerIds.has(a.id);
                            const bPicked = ausgewaehlteSpielerIds.has(b.id);
                            if (aPicked && !bPicked) return -1;
                            if (!aPicked && bPicked) return 1;
                            return a.ranking - b.ranking;
                          }).slice(0, 15);

                          if (sortedSpieler.length === 0) {
                            return (
                              <div className="px-3 py-2 text-gray-500 text-center">
                                Kein Spieler gefunden
                              </div>
                            );
                          }

                          return sortedSpieler.map(s => {
                            const isPicked = ausgewaehlteSpielerIds.has(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSpieler(s.id);
                                  setSpielerSearch(s.name);
                                  setShowSpielerSuggestions(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center gap-2 ${isPicked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-100'
                                  }`}
                              >
                                <span className="text-gray-500 w-8 text-right font-mono text-sm">
                                  {s.ranking}
                                </span>
                                <span className="font-medium">{s.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${s.id.startsWith('h')
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                                  }`}>
                                  {s.id.startsWith('h') ? 'H' : 'D'}
                                </span>
                                {isPicked && (
                                  <span className="text-xs text-green-600 ml-auto">Gewählt</span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Round Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Runde
                    </label>
                    <select
                      value={selectedRunde}
                      onChange={e => setSelectedRunde(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {([2, 3, 4, 5, 6, 7] as Runde[]).map(r => (
                        <option key={r} value={r}>
                          {RUNDEN_NAMEN[r]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={() => {
                      handleAddErgebnis();
                      setSpielerSearch('');
                    }}
                    disabled={!selectedSpieler || saving}
                  >
                    Hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Ausgewählte Spieler - Erreichte Runde einstellen */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Herren - Erreichte Runde">
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {(() => {
                  const herrenIds = Array.from(ausgewaehlteSpielerIds).filter(id => id.startsWith('h'));
                  const herrenSpieler = herrenIds
                    .map(id => {
                      const s = spieler?.herren.find(sp => sp.id === id);
                      const ergebnis = turnierErgebnisse.find(e => e.spielerId === id);
                      return s ? { ...s, ergebnis } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => (a?.ranking || 999) - (b?.ranking || 999)) as Array<{
                      id: string;
                      name: string;
                      ranking: number;
                      ergebnis?: { runde: number; out?: boolean };
                    }>;

                  if (herrenSpieler.length === 0) {
                    return <p className="text-gray-500">Keine Spieler ausgewählt</p>;
                  }

                  return herrenSpieler.map(s => {
                    const currentRunde = s.ergebnis?.runde || 0;
                    const isOut = s.ergebnis?.out === true;
                    // Sieger = im Finale (7) und NICHT out
                    const isInFinale = currentRunde === 7;
                    const isSieger = isInFinale && !isOut;
                    const isFinalist = isInFinale && isOut;

                    // Dropdown-Wert: spezieller Wert für Finale vs Sieger
                    // "7" = Finale (out=true), "7s" = Sieger (out=false)
                    const dropdownValue = isInFinale
                      ? (isSieger ? '7s' : '7f')
                      : (currentRunde.toString());

                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between py-1 px-2 rounded ${isSieger ? 'bg-yellow-50' : isFinalist ? 'bg-orange-50' : isOut ? 'bg-red-50' : 'bg-green-50'
                          }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-400 text-xs w-5 flex-shrink-0">{s.ranking}</span>
                          <span className={`truncate ${isOut && !isInFinale ? 'text-gray-500 line-through' : 'font-medium'}`}>
                            {s.name}
                          </span>
                          {isSieger && <span className="flex-shrink-0">🏆</span>}
                          {isFinalist && <span className="flex-shrink-0 text-xs text-orange-600">(Finalist)</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Ein Dropdown mit Finale und Sieger als separate Optionen */}
                          <select
                            value={dropdownValue}
                            onChange={async (e) => {
                              const val = e.target.value;
                              if (val === '0') {
                                // Remove result completely
                                await fetch(
                                  `/api/turnier/ergebnisse?turnierId=${aktivTurnier.id}&spielerId=${s.id}`,
                                  { method: 'DELETE' }
                                );
                              } else if (val === '7f') {
                                // Finale (Finalist, verloren) = runde 7, out: true
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: 7,
                                    out: true,
                                  }),
                                });
                              } else if (val === '7s') {
                                // Sieger = runde 7, out: false
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: 7,
                                    out: false,
                                  }),
                                });
                              } else {
                                // Normal round
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: parseInt(val),
                                    out: isOut,
                                  }),
                                });
                              }
                              loadData();
                            }}
                            className="text-xs px-1 py-0.5 border rounded w-20 bg-white border-gray-300"
                          >
                            <option value="0">-</option>
                            <option value="1">R1</option>
                            <option value="2">R2</option>
                            <option value="3">R3</option>
                            <option value="4">AF</option>
                            <option value="5">VF</option>
                            <option value="6">HF</option>
                            <option value="7f">Finale</option>
                            <option value="7s">Sieger</option>
                          </select>
                          {/* Out-Checkbox nur für normale Runden, NICHT für Finale/Sieger */}
                          {!isInFinale && currentRunde > 0 && (
                            <label className="flex items-center gap-1 cursor-pointer ml-1">
                              <input
                                type="checkbox"
                                checked={isOut}
                                onChange={async (e) => {
                                  await fetch('/api/turnier/ergebnisse', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      turnierId: aktivTurnier.id,
                                      spielerId: s.id,
                                      out: e.target.checked,
                                    }),
                                  });
                                  loadData();
                                }}
                                className="w-4 h-4 text-red-600 rounded border-gray-300"
                              />
                              <span className="text-xs font-medium text-red-600">Out</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            <Card title="Damen - Erreichte Runde">
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {(() => {
                  const damenIds = Array.from(ausgewaehlteSpielerIds).filter(id => id.startsWith('d'));
                  const damenSpieler = damenIds
                    .map(id => {
                      const s = spieler?.damen.find(sp => sp.id === id);
                      const ergebnis = turnierErgebnisse.find(e => e.spielerId === id);
                      return s ? { ...s, ergebnis } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => (a?.ranking || 999) - (b?.ranking || 999)) as Array<{
                      id: string;
                      name: string;
                      ranking: number;
                      ergebnis?: { runde: number; out?: boolean };
                    }>;

                  if (damenSpieler.length === 0) {
                    return <p className="text-gray-500">Keine Spielerinnen ausgewählt</p>;
                  }

                  return damenSpieler.map(s => {
                    const currentRunde = s.ergebnis?.runde || 0;
                    const isOut = s.ergebnis?.out === true;
                    // Siegerin = im Finale (7) und NICHT out
                    const isInFinale = currentRunde === 7;
                    const isSiegerin = isInFinale && !isOut;
                    const isFinalistin = isInFinale && isOut;

                    // Dropdown-Wert: spezieller Wert für Finale vs Siegerin
                    const dropdownValue = isInFinale
                      ? (isSiegerin ? '7s' : '7f')
                      : (currentRunde.toString());

                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between py-1 px-2 rounded ${isSiegerin ? 'bg-yellow-50' : isFinalistin ? 'bg-orange-50' : isOut ? 'bg-red-50' : 'bg-green-50'
                          }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-gray-400 text-xs w-5 flex-shrink-0">{s.ranking}</span>
                          <span className={`truncate ${isOut && !isInFinale ? 'text-gray-500 line-through' : 'font-medium'}`}>
                            {s.name}
                          </span>
                          {isSiegerin && <span className="flex-shrink-0">🏆</span>}
                          {isFinalistin && <span className="flex-shrink-0 text-xs text-orange-600">(Finalistin)</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Ein Dropdown mit Finale und Siegerin als separate Optionen */}
                          <select
                            value={dropdownValue}
                            onChange={async (e) => {
                              const val = e.target.value;
                              if (val === '0') {
                                // Remove result completely
                                await fetch(
                                  `/api/turnier/ergebnisse?turnierId=${aktivTurnier.id}&spielerId=${s.id}`,
                                  { method: 'DELETE' }
                                );
                              } else if (val === '7f') {
                                // Finale (Finalistin, verloren) = runde 7, out: true
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: 7,
                                    out: true,
                                  }),
                                });
                              } else if (val === '7s') {
                                // Siegerin = runde 7, out: false
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: 7,
                                    out: false,
                                  }),
                                });
                              } else {
                                // Normal round
                                await fetch('/api/turnier/ergebnisse', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    turnierId: aktivTurnier.id,
                                    spielerId: s.id,
                                    runde: parseInt(val),
                                    out: isOut,
                                  }),
                                });
                              }
                              loadData();
                            }}
                            className="text-xs px-1 py-0.5 border rounded w-20 bg-white border-gray-300"
                          >
                            <option value="0">-</option>
                            <option value="1">R1</option>
                            <option value="2">R2</option>
                            <option value="3">R3</option>
                            <option value="4">AF</option>
                            <option value="5">VF</option>
                            <option value="6">HF</option>
                            <option value="7f">Finale</option>
                            <option value="7s">Siegerin</option>
                          </select>
                          {/* Out-Checkbox nur für normale Runden, NICHT für Finale/Siegerin */}
                          {!isInFinale && currentRunde > 0 && (
                            <label className="flex items-center gap-1 cursor-pointer ml-1">
                              <input
                                type="checkbox"
                                checked={isOut}
                                onChange={async (e) => {
                                  await fetch('/api/turnier/ergebnisse', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      turnierId: aktivTurnier.id,
                                      spielerId: s.id,
                                      out: e.target.checked,
                                    }),
                                  });
                                  loadData();
                                }}
                                className="w-4 h-4 text-red-600 rounded border-gray-300"
                              />
                              <span className="text-xs font-medium text-red-600">Out</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>

          {/* Draw Visualization - always show after AF starts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Draw Herren (ab Achtelfinale)">
              <InteraktivesDraw
                ergebnisse={turnierErgebnisse}
                spieler={alleSpieler}
                geschlecht="herren"
                turnierId={aktivTurnier.id}
                onUpdateErgebnis={async (spielerId, runde) => {
                  const res = await fetch('/api/turnier/ergebnisse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      turnierId: aktivTurnier.id,
                      spielerId,
                      runde,
                    }),
                  });
                  if (res.ok) {
                    loadData();
                  }
                }}
                ausgewaehlteSpielerIds={Array.from(ausgewaehlteSpielerIds).filter(id => id.startsWith('h'))}
              />
            </Card>
            <Card title="Draw Damen (ab Achtelfinale)">
              <InteraktivesDraw
                ergebnisse={turnierErgebnisse}
                spieler={alleSpieler}
                geschlecht="damen"
                turnierId={aktivTurnier.id}
                onUpdateErgebnis={async (spielerId, runde) => {
                  const res = await fetch('/api/turnier/ergebnisse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      turnierId: aktivTurnier.id,
                      spielerId,
                      runde,
                    }),
                  });
                  if (res.ok) {
                    loadData();
                  }
                }}
                ausgewaehlteSpielerIds={Array.from(ausgewaehlteSpielerIds).filter(id => id.startsWith('d'))}
              />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Ergebnisse Herren">
              {herrenErgebnisse.length === 0 ? (
                <p className="text-gray-500">Noch keine Ergebnisse</p>
              ) : (
                <div className="space-y-2">
                  {herrenErgebnisse.map(e => (
                    <div key={e.spielerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{e.spielerName}</span>
                        <span className="text-gray-500 ml-2">{RUNDEN_NAMEN[e.runde as Runde]}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteErgebnis(e.spielerId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Ergebnisse Damen">
              {damenErgebnisse.length === 0 ? (
                <p className="text-gray-500">Noch keine Ergebnisse</p>
              ) : (
                <div className="space-y-2">
                  {damenErgebnisse.map(e => (
                    <div key={e.spielerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{e.spielerName}</span>
                        <span className="text-gray-500 ml-2">{RUNDEN_NAMEN[e.runde as Runde]}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteErgebnis(e.spielerId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-xl mb-4">Kein aktives Turnier</p>
            <p>Erstelle ein neues Turnier, um Ergebnisse einzutragen.</p>
          </div>
        </Card>
      )}

      {turniere.length > 0 && (
        <Card title="Alle Turniere">
          <div className="space-y-2">
            {turniere.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{t.name} {t.jahr}</span>
                  {t.aktiv && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Aktiv
                    </span>
                  )}
                  {t.abgabeSchluss && (
                    <span className="ml-2 text-gray-500 text-sm">
                      (Abgabeschluss: {formatDeadline(t.abgabeSchluss)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
