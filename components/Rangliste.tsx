'use client';

import { PunkteStand } from '@/lib/types';
import Card from './ui/Card';

interface RanglisteProps {
  rangliste: PunkteStand[];
  turniername?: string;
}

export default function Rangliste({ rangliste, turniername }: RanglisteProps) {
  if (rangliste.length === 0) {
    return (
      <Card title={turniername ? `Rangliste - ${turniername}` : 'Rangliste'}>
        <p className="text-gray-500 text-center py-4">
          Noch keine Tipps abgegeben
        </p>
      </Card>
    );
  }

  return (
    <Card title={turniername ? `Rangliste - ${turniername}` : 'Rangliste'}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platz
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teilnehmer
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Herren
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Damen
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gesamt
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Verbleibende Spieler im Turnier">
                Noch dabei
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rangliste.map((stand, index) => {
              const platz = index + 1;
              const medalColors: Record<number, string> = {
                1: 'bg-yellow-100',
                2: 'bg-gray-100',
                3: 'bg-orange-100',
              };

              return (
                <tr
                  key={stand.teilnehmerName}
                  className={medalColors[platz] || ''}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-lg">
                      {platz === 1 && '🥇'}
                      {platz === 2 && '🥈'}
                      {platz === 3 && '🥉'}
                      {platz > 3 && platz}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {stand.teilnehmerName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {stand.punkteHerren.toFixed(1)}
                    {stand.bonusHerren > 0 && (
                      <span className="text-yellow-600 ml-1" title="Richtiger Siegertipp">
                        (+{stand.bonusHerren})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {stand.punkteDamen.toFixed(1)}
                    {stand.bonusDamen > 0 && (
                      <span className="text-yellow-600 ml-1" title="Richtiger Siegertipp">
                        (+{stand.bonusDamen})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-lg">
                    {stand.punkteGesamt.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined ? (
                      <div className="flex justify-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800" title="Herren">
                          H: {stand.verbleibendeHerren}/8
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-800" title="Damen">
                          D: {stand.verbleibendeDamen}/8
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
