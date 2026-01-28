'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Spieler } from '@/lib/types';

export default function AdminSpielerPage() {
  const [spieler, setSpieler] = useState<{ herren: Spieler[]; damen: Spieler[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [editingSpieler, setEditingSpieler] = useState<Spieler | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ranking: '',
    geschlecht: 'herren' as 'herren' | 'damen',
  });
  const [csvData, setCsvData] = useState({
    text: '',
    geschlecht: 'herren' as 'herren' | 'damen',
    ersetzen: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSpieler();
  }, []);

  async function loadSpieler() {
    const res = await fetch('/api/spieler');
    const data = await res.json();
    setSpieler(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const method = editingSpieler ? 'PUT' : 'POST';
      const body = editingSpieler
        ? { id: editingSpieler.id, ...formData }
        : formData;

      const res = await fetch('/api/spieler', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingSpieler ? 'Spieler aktualisiert' : 'Spieler hinzugefügt' });
        setShowForm(false);
        setEditingSpieler(null);
        setFormData({ name: '', ranking: '', geschlecht: 'herren' });
        loadSpieler();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern' });
    }

    setSaving(false);
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/spieler/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv: csvData.text,
          geschlecht: csvData.geschlecht,
          ersetzen: csvData.ersetzen,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setShowCsvImport(false);
        setCsvData({ text: '', geschlecht: 'herren', ersetzen: false });
        loadSpieler();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Import' });
    }

    setSaving(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(prev => ({ ...prev, text }));
    };
    reader.readAsText(file);
  }

  async function handleDelete(id: string) {
    if (!confirm('Spieler wirklich löschen?')) return;

    const res = await fetch(`/api/spieler?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSpieler();
    }
  }

  function startEdit(s: Spieler) {
    setEditingSpieler(s);
    setFormData({
      name: s.name,
      ranking: s.ranking.toString(),
      geschlecht: s.geschlecht,
    });
    setShowForm(true);
    setShowCsvImport(false);
  }

  if (loading) {
    return <div className="text-center py-12">Lade...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin" className="text-green-600 hover:underline text-sm">
            ← Zurück zum Admin-Bereich
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Spieler verwalten</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setShowCsvImport(true);
              setShowForm(false);
              setEditingSpieler(null);
            }}
          >
            CSV Import
          </Button>
          <Button onClick={() => {
            setShowForm(true);
            setShowCsvImport(false);
            setEditingSpieler(null);
            setFormData({ name: '', ranking: '', geschlecht: 'herren' });
          }}>
            Neuer Spieler
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {showCsvImport && (
        <Card title="Spieler per CSV importieren">
          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">CSV-Format:</p>
              <p>Eine Zeile pro Spieler, Format: <code>Ranking,Name</code> oder <code>Ranking;Name</code></p>
              <p className="mt-1">Beispiel:</p>
              <pre className="bg-blue-100 p-2 rounded mt-1">1,Jannik Sinner
2,Alexander Zverev
3,Carlos Alcaraz</pre>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht</label>
              <select
                value={csvData.geschlecht}
                onChange={e => setCsvData({ ...csvData, geschlecht: e.target.value as 'herren' | 'damen' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="herren">Herren</option>
                <option value="damen">Damen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSV-Datei hochladen</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oder CSV direkt eingeben</label>
              <textarea
                value={csvData.text}
                onChange={e => setCsvData({ ...csvData, text: e.target.value })}
                rows={8}
                placeholder="1,Spieler Name&#10;2,Anderer Spieler&#10;..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ersetzen"
                checked={csvData.ersetzen}
                onChange={e => setCsvData({ ...csvData, ersetzen: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="ersetzen" className="text-sm text-gray-700">
                Alle bestehenden Spieler dieses Geschlechts ersetzen
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !csvData.text.trim()}>
                {saving ? 'Importieren...' : 'Importieren'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => {
                setShowCsvImport(false);
                setCsvData({ text: '', geschlecht: 'herren', ersetzen: false });
              }}>
                Abbrechen
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showForm && (
        <Card title={editingSpieler ? 'Spieler bearbeiten' : 'Neuer Spieler'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ranking</label>
              <input
                type="number"
                value={formData.ranking}
                onChange={e => setFormData({ ...formData, ranking: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht</label>
              <select
                value={formData.geschlecht}
                onChange={e => setFormData({ ...formData, geschlecht: e.target.value as 'herren' | 'damen' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!!editingSpieler}
              >
                <option value="herren">Herren</option>
                <option value="damen">Damen</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Speichern...' : 'Speichern'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => {
                setShowForm(false);
                setEditingSpieler(null);
              }}>
                Abbrechen
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card title={`Herren (${spieler?.herren.length || 0})`}>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {spieler?.herren.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-gray-500 mr-2">{s.ranking}</span>
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`Damen (${spieler?.damen.length || 0})`}>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {spieler?.damen.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-gray-500 mr-2">{s.ranking}</span>
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
