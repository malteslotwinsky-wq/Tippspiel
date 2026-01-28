'use client';

import { useState, useRef } from 'react';
import { Spieler, TurnierErgebnis, RUNDEN_NAMEN, Runde } from '@/lib/types';

interface DrawPosition {
  position: number; // 1-16 for AF positions
  spielerId: string | null;
}

interface InteraktivesDrawProps {
  ergebnisse: TurnierErgebnis[];
  spieler: Spieler[];
  geschlecht: 'herren' | 'damen';
  turnierId: string;
  onUpdateErgebnis: (spielerId: string, runde: number) => Promise<void>;
  ausgewaehlteSpielerIds: string[]; // Player IDs that were picked by participants
}

export default function InteraktivesDraw({
  ergebnisse,
  spieler,
  geschlecht,
  turnierId,
  onUpdateErgebnis,
  ausgewaehlteSpielerIds,
}: InteraktivesDrawProps) {
  const [draggedPlayer, setDraggedPlayer] = useState<Spieler | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawPositions, setDrawPositions] = useState<DrawPosition[]>(() => {
    // Initialize with 16 empty positions (8 matches in AF)
    return Array.from({ length: 16 }, (_, i) => ({ position: i + 1, spielerId: null }));
  });

  // Filter players and results for this gender
  const genderSpieler = spieler.filter(s => s.geschlecht === geschlecht);
  const genderErgebnisse = ergebnisse.filter(e =>
    spieler.find(s => s.id === e.spielerId)?.geschlecht === geschlecht
  );

  // Get players who reached at least Achtelfinale (round 4+)
  const afSpieler = genderErgebnisse
    .filter(e => e.runde >= 4)
    .map(e => {
      const s = spieler.find(sp => sp.id === e.spielerId);
      return s ? { ...s, maxRunde: e.runde } : null;
    })
    .filter(Boolean) as (Spieler & { maxRunde: number })[];

  // Categorize players by round
  const vfSpieler = afSpieler.filter(s => s.maxRunde >= 5);
  const hfSpieler = afSpieler.filter(s => s.maxRunde >= 6);
  const finaleSpieler = afSpieler.filter(s => s.maxRunde >= 7);

  // Get available players for search (either picked ones or all if searching)
  const availableSpieler = genderSpieler.filter(s => {
    // Not already in AF results
    if (genderErgebnisse.some(e => e.spielerId === s.id && e.runde >= 4)) return false;

    // Filter by search
    if (searchQuery.length >= 2) {
      const terms = searchQuery.toLowerCase().split(' ');
      return terms.every(term => s.name.toLowerCase().includes(term));
    }

    return true;
  }).slice(0, 8);

  const handleDragStart = (e: React.DragEvent, spieler: Spieler) => {
    setDraggedPlayer(spieler);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetRunde: number) => {
    e.preventDefault();
    if (draggedPlayer) {
      await onUpdateErgebnis(draggedPlayer.id, targetRunde);
      setDraggedPlayer(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAddPlayer = async (spielerId: string, runde: number) => {
    await onUpdateErgebnis(spielerId, runde);
    setShowAddPlayer(null);
    setSearchQuery('');
  };

  const renderPlayer = (player: Spieler | undefined, runde: number, isWinner: boolean = false) => {
    if (!player) {
      return (
        <div
          className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200 hover:border-gray-400"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, runde)}
          onClick={() => setShowAddPlayer(runde)}
        >
          + Spieler hinzufügen
        </div>
      );
    }

    const isPicked = ausgewaehlteSpielerIds.includes(player.id);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, player)}
        className={`h-10 flex items-center px-2 rounded text-sm cursor-move select-none ${
          isWinner
            ? 'bg-yellow-100 border-2 border-yellow-400 font-bold'
            : isPicked
            ? 'bg-green-50 border-2 border-green-400'
            : 'bg-white border border-gray-300'
        }`}
        title={`${player.name} (Ranking: ${player.ranking})${isPicked ? ' - Von Teilnehmern gewählt' : ''}`}
      >
        <span className="text-gray-400 mr-1.5 text-xs w-6">{player.ranking}.</span>
        <span className="truncate flex-1">{player.name}</span>
        {isPicked && <span className="text-green-500 ml-1">●</span>}
      </div>
    );
  };

  // Add player modal
  const renderAddPlayerModal = () => {
    if (showAddPlayer === null) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 w-96 max-h-96 overflow-hidden">
          <h3 className="font-bold mb-3">Spieler für {RUNDEN_NAMEN[showAddPlayer as Runde]} hinzufügen</h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Spieler suchen..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableSpieler.map(s => {
              const isPicked = ausgewaehlteSpielerIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleAddPlayer(s.id, showAddPlayer)}
                  className={`w-full px-3 py-2 text-left rounded flex items-center gap-2 ${
                    isPicked ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-gray-500 w-8 text-right font-mono text-sm">{s.ranking}</span>
                  <span className="font-medium flex-1">{s.name}</span>
                  {isPicked && <span className="text-green-500 text-xs">Gewählt</span>}
                </button>
              );
            })}
            {availableSpieler.length === 0 && (
              <p className="text-gray-500 text-center py-2">Keine Spieler gefunden</p>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => { setShowAddPlayer(null); setSearchQuery(''); }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      {renderAddPlayerModal()}

      <div className="text-xs text-gray-500 mb-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span> = Von Teilnehmern gewählt
        </span>
        <span className="ml-3">Drag & Drop zum Verschieben, Klick auf + zum Hinzufügen</span>
      </div>

      <div className="flex gap-6 min-w-max p-4 bg-gray-50 rounded-lg">
        {/* Achtelfinale */}
        <div className="flex flex-col min-w-44">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600 bg-blue-100 rounded py-1">
            {RUNDEN_NAMEN[4]}
          </div>
          <div className="space-y-1">
            {afSpieler.length > 0 ? (
              afSpieler.map((s) => (
                <div key={s.id}>{renderPlayer(s, 4, s.maxRunde >= 5)}</div>
              ))
            ) : (
              <div
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(4)}
              >
                + Spieler hinzufügen
              </div>
            )}
            {afSpieler.length > 0 && afSpieler.length < 8 && (
              <div
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(4)}
              >
                + Weitere
              </div>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Viertelfinale */}
        <div className="flex flex-col min-w-44">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600 bg-green-100 rounded py-1">
            {RUNDEN_NAMEN[5]}
          </div>
          <div className="space-y-2">
            {vfSpieler.length > 0 ? (
              vfSpieler.map((s) => (
                <div key={s.id}>{renderPlayer(s, 5, s.maxRunde >= 6)}</div>
              ))
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 5)}
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(5)}
              >
                + Spieler hinzufügen
              </div>
            )}
            {vfSpieler.length > 0 && vfSpieler.length < 4 && (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 5)}
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(5)}
              >
                + Weitere
              </div>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Halbfinale */}
        <div className="flex flex-col min-w-44">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600 bg-orange-100 rounded py-1">
            {RUNDEN_NAMEN[6]}
          </div>
          <div className="space-y-4">
            {hfSpieler.length > 0 ? (
              hfSpieler.map((s) => (
                <div key={s.id}>{renderPlayer(s, 6, s.maxRunde >= 7)}</div>
              ))
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 6)}
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(6)}
              >
                + Spieler hinzufügen
              </div>
            )}
            {hfSpieler.length > 0 && hfSpieler.length < 2 && (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 6)}
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(6)}
              >
                + Weitere
              </div>
            )}
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Finale / Sieger */}
        <div className="flex flex-col min-w-44">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600 bg-yellow-100 rounded py-1">
            {RUNDEN_NAMEN[7]} / Sieger
          </div>
          <div>
            {finaleSpieler.length > 0 ? (
              finaleSpieler.map((s) => (
                <div key={s.id} className="mb-2">{renderPlayer(s, 7, true)}</div>
              ))
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 7)}
                className="h-10 flex items-center justify-center px-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm cursor-pointer hover:bg-gray-200"
                onClick={() => setShowAddPlayer(7)}
              >
                + Sieger hinzufügen
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
