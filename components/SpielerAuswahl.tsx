'use client';

import { useState, useRef } from 'react';
import { Spieler } from '@/lib/types';
import { getAuswahlStats } from '@/lib/validierung';

interface SpielerAuswahlProps {
  spieler: Spieler[];
  ausgewaehlt: string[];
  onToggle: (id: string) => void;
  geschlecht: 'herren' | 'damen';
  disabled?: boolean;
}

export default function SpielerAuswahl({
  spieler,
  ausgewaehlt,
  onToggle,
  geschlecht,
  disabled = false,
}: SpielerAuswahlProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ausgewaehlteSpieler = spieler.filter(s => ausgewaehlt.includes(s.id));
  const stats = getAuswahlStats(ausgewaehlteSpieler);

  // Filter players based on search
  const filteredSpieler = spieler.filter(s => {
    if (!searchQuery) return true;
    const terms = searchQuery.toLowerCase().split(' ');
    const name = s.name.toLowerCase();
    return terms.every(term => name.includes(term));
  });

  // Get suggestions for autocomplete
  const suggestions = searchQuery.length >= 2
    ? filteredSpieler.filter(s => !ausgewaehlt.includes(s.id)).slice(0, 5)
    : [];

  const handleSuggestionClick = (id: string) => {
    onToggle(id);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getRankingKategorie = (ranking: number) => {
    if (ranking <= 8) return 'top8';
    if (ranking <= 32) return 'top32';
    return 'ausserhalb';
  };

  const istDeaktiviert = (spieler: Spieler) => {
    if (disabled) return true;
    if (ausgewaehlt.includes(spieler.id)) return false;
    if (ausgewaehlt.length >= 8) return true;

    const kategorie = getRankingKategorie(spieler.ranking);

    if (kategorie === 'top8' && stats.top8 >= 4) return true;
    if ((kategorie === 'top8' || kategorie === 'top32') && stats.top32 >= 6) return true;

    return false;
  };

  const getHintergrundfarbe = (ranking: number) => {
    if (ranking <= 8) return 'bg-yellow-50';
    if (ranking <= 32) return 'bg-blue-50';
    return 'bg-gray-50';
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
        <div className="font-medium mb-2">Auswahlregeln:</div>
        <div className="grid grid-cols-3 gap-2">
          <div className={stats.top8 > 4 ? 'text-red-600 font-bold' : ''}>
            Top 8: {stats.top8}/4
          </div>
          <div className={stats.top32 > 6 ? 'text-red-600 font-bold' : ''}>
            Top 32: {stats.top32}/6
          </div>
          <div className={stats.ausserhalb32 < 2 ? 'text-orange-600 font-bold' : 'text-green-600'}>
            Außerhalb 32: {stats.ausserhalb32}/2+
          </div>
        </div>
        <div className="mt-2 font-medium">
          Ausgewählt: {ausgewaehlt.length}/8
        </div>
      </div>

      {/* Search/Autocomplete Input */}
      <div className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Spieler suchen und hinzufügen..."
          disabled={disabled || ausgewaehlt.length >= 8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s, index) => {
              const deaktiviert = istDeaktiviert(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => !deaktiviert && handleSuggestionClick(s.id)}
                  disabled={deaktiviert}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                    deaktiviert
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-green-100'
                  }`}
                >
                  <span className="text-gray-500 w-8 text-right font-mono text-sm">
                    {s.ranking}
                  </span>
                  <span className="font-medium">{s.name}</span>
                  {s.ranking <= 8 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Top 8</span>
                  )}
                  {s.ranking > 8 && s.ranking <= 32 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Top 32</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {spieler.map(s => {
          const istAusgewaehlt = ausgewaehlt.includes(s.id);
          const deaktiviert = istDeaktiviert(s);

          return (
            <button
              key={s.id}
              onClick={() => !deaktiviert && onToggle(s.id)}
              disabled={deaktiviert && !istAusgewaehlt}
              className={`w-full flex items-center justify-between p-2 rounded-md transition-colors text-left ${
                istAusgewaehlt
                  ? 'bg-green-100 border-2 border-green-500'
                  : deaktiviert
                  ? 'opacity-50 cursor-not-allowed ' + getHintergrundfarbe(s.ranking)
                  : getHintergrundfarbe(s.ranking) + ' hover:bg-green-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-8 text-right font-mono">
                  {s.ranking}
                </span>
                <span className="font-medium">{s.name}</span>
              </div>
              {istAusgewaehlt && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
