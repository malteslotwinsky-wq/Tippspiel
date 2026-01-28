'use client';

import { Spieler, TurnierErgebnis, RUNDEN_NAMEN, Runde } from '@/lib/types';

interface TurnierDrawProps {
  ergebnisse: TurnierErgebnis[];
  spieler: Spieler[];
  geschlecht: 'herren' | 'damen';
  title?: string;
}

interface DrawMatch {
  spieler1?: Spieler;
  spieler2?: Spieler;
  winner?: Spieler;
}

export default function TurnierDraw({
  ergebnisse,
  spieler,
  geschlecht,
  title,
}: TurnierDrawProps) {
  // Filter results for this gender
  const genderErgebnisse = ergebnisse.filter(e =>
    spieler.find(s => s.id === e.spielerId)?.geschlecht === geschlecht
  );

  // Group players by round they reached
  const spielerByRunde: Record<number, Spieler[]> = {};
  genderErgebnisse.forEach(e => {
    const s = spieler.find(sp => sp.id === e.spielerId);
    if (s) {
      if (!spielerByRunde[e.runde]) spielerByRunde[e.runde] = [];
      spielerByRunde[e.runde].push(s);
    }
  });

  // Get players who reached at least Achtelfinale (round 4+)
  const afSpieler = genderErgebnisse
    .filter(e => e.runde >= 4)
    .map(e => {
      const s = spieler.find(sp => sp.id === e.spielerId);
      return s ? { ...s, maxRunde: e.runde } : null;
    })
    .filter(Boolean) as (Spieler & { maxRunde: number })[];

  // Get players for each round
  const getRoundPlayers = (minRunde: number) =>
    afSpieler.filter(s => s.maxRunde >= minRunde);

  const vfSpieler = getRoundPlayers(5);
  const hfSpieler = getRoundPlayers(6);
  const finaleSpieler = getRoundPlayers(7);

  if (afSpieler.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Noch keine Spieler im Achtelfinale
      </div>
    );
  }

  const renderPlayer = (player: Spieler | undefined, isWinner: boolean = false) => {
    if (!player) {
      return (
        <div className="h-8 flex items-center px-2 bg-gray-50 border border-gray-200 rounded text-gray-400 text-sm">
          TBD
        </div>
      );
    }

    return (
      <div
        className={`h-8 flex items-center px-2 rounded text-sm truncate ${
          isWinner
            ? 'bg-yellow-100 border-2 border-yellow-400 font-bold'
            : 'bg-white border border-gray-300'
        }`}
        title={player.name}
      >
        <span className="text-gray-500 mr-1 text-xs">{player.ranking}.</span>
        <span className="truncate">{player.name}</span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      {title && (
        <h3 className="text-lg font-bold mb-4 text-center">{title}</h3>
      )}

      <div className="flex gap-4 min-w-max p-4">
        {/* Achtelfinale */}
        <div className="flex flex-col justify-around min-w-40">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600">
            {RUNDEN_NAMEN[4]}
          </div>
          <div className="space-y-2">
            {afSpieler.map((s, i) => (
              <div key={s.id}>
                {renderPlayer(s, s.maxRunde >= 5)}
              </div>
            ))}
            {afSpieler.length < 8 &&
              Array(8 - afSpieler.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-af-${i}`}>{renderPlayer(undefined)}</div>
                ))}
          </div>
        </div>

        {/* Connector Lines */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Viertelfinale */}
        <div className="flex flex-col justify-around min-w-40">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600">
            {RUNDEN_NAMEN[5]}
          </div>
          <div className="space-y-4">
            {vfSpieler.map((s, i) => (
              <div key={s.id}>
                {renderPlayer(s, s.maxRunde >= 6)}
              </div>
            ))}
            {vfSpieler.length < 4 &&
              Array(4 - vfSpieler.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-vf-${i}`}>{renderPlayer(undefined)}</div>
                ))}
          </div>
        </div>

        {/* Connector Lines */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Halbfinale */}
        <div className="flex flex-col justify-around min-w-40">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600">
            {RUNDEN_NAMEN[6]}
          </div>
          <div className="space-y-8">
            {hfSpieler.map((s, i) => (
              <div key={s.id}>
                {renderPlayer(s, s.maxRunde >= 7)}
              </div>
            ))}
            {hfSpieler.length < 2 &&
              Array(2 - hfSpieler.length)
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-hf-${i}`}>{renderPlayer(undefined)}</div>
                ))}
          </div>
        </div>

        {/* Connector Lines */}
        <div className="flex items-center">
          <div className="w-4 border-t-2 border-gray-300" />
        </div>

        {/* Finale/Sieger */}
        <div className="flex flex-col justify-center min-w-40">
          <div className="text-xs font-semibold text-center mb-2 text-gray-600">
            {RUNDEN_NAMEN[7]} / Sieger
          </div>
          <div>
            {finaleSpieler.length > 0 ? (
              finaleSpieler.map((s) => (
                <div key={s.id} className="mb-2">
                  {renderPlayer(s, true)}
                </div>
              ))
            ) : (
              renderPlayer(undefined)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
