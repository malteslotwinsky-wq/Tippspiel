'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Teilnehmer } from '@/lib/types';

export default function AdminTeilnehmerPage() {
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTeilnehmer();
  }, []);

  async function loadTeilnehmer() {
    const res = await fetch('/api/teilnehmer');
    const data = await res.json();
    setTeilnehmer(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/teilnehmer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.ok) {
      setMessage({ type: 'success', text: 'Teilnehmer hinzugefügt' });
      setNewName('');
      loadTeilnehmer();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error });
    }

    setSaving(false);
  }

  async function handleDelete(name: string) {
    if (!confirm(`Teilnehmer "${name}" wirklich löschen?`)) return;

    const res = await fetch(`/api/teilnehmer?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setMessage({ type: 'success', text: 'Teilnehmer gelöscht' });
      loadTeilnehmer();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error });
    }
  }

  if (loading) {
    return <div className="text-center py-12">Lade...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-green-600 hover:underline text-sm">
          ← Zurück zum Admin-Bereich
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Teilnehmer verwalten</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <Card title="Neuen Teilnehmer hinzufügen">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name des Teilnehmers"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Hinzufügen...' : 'Hinzufügen'}
          </Button>
        </form>
      </Card>

      <Card title={`Teilnehmer (${teilnehmer.length})`}>
        {teilnehmer.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Noch keine Teilnehmer vorhanden
          </p>
        ) : (
          <div className="space-y-2">
            {teilnehmer.map(t => (
              <div
                key={t.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    (seit {new Date(t.erstelltAm).toLocaleDateString('de-DE')})
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/teilnehmer/${encodeURIComponent(t.name)}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Tipp ansehen
                  </Link>
                  <button
                    onClick={() => handleDelete(t.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
