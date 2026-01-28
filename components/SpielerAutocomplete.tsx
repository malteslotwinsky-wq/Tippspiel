'use client';

import { useState, useRef, useEffect } from 'react';
import { Spieler } from '@/lib/types';

interface SpielerAutocompleteProps {
  spieler: Spieler[];
  onSelect: (spieler: Spieler) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
  geschlecht?: 'herren' | 'damen' | 'alle';
}

export default function SpielerAutocomplete({
  spieler,
  onSelect,
  placeholder = 'Spieler suchen...',
  disabled = false,
  excludeIds = [],
  geschlecht = 'alle',
}: SpielerAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredSpieler = spieler
    .filter(s => {
      if (excludeIds.includes(s.id)) return false;
      if (geschlecht !== 'alle' && s.geschlecht !== geschlecht) return false;
      if (!query) return true;

      const searchTerms = query.toLowerCase().split(' ');
      const spielerName = s.name.toLowerCase();

      return searchTerms.every(term => spielerName.includes(term));
    })
    .slice(0, 10);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredSpieler.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && filteredSpieler[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredSpieler[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (spieler: Spieler) => {
    onSelect(spieler);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {isOpen && filteredSpieler.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSpieler.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                index === highlightedIndex
                  ? 'bg-green-100'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-gray-500 w-8 text-right font-mono text-sm">
                {s.ranking}
              </span>
              <span className="font-medium">{s.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                s.geschlecht === 'herren'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {s.geschlecht === 'herren' ? 'H' : 'D'}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && filteredSpieler.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-gray-500 text-center">
          Kein Spieler gefunden
        </div>
      )}
    </div>
  );
}
