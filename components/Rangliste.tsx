'use client';

import Link from 'next/link';
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
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                    <Link href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`} className="hover:text-green-600 hover:underline">
                      {stand.teilnehmerName}
                    </Link>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {rangliste.map((stand, index) => {
          const platz = index + 1;
          const medalColors: Record<number, string> = {
            1: 'bg-yellow-50 border-yellow-300',
            2: 'bg-gray-50 border-gray-300',
            3: 'bg-orange-50 border-orange-300',
          };

          return (
            <Link
              key={stand.teilnehmerName}
              href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
              className={`block p-4 rounded-lg border-2 ${medalColors[platz] || 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-2xl">
                    {platz === 1 && '🥇'}
                    {platz === 2 && '🥈'}
                    {platz === 3 && '🥉'}
                    {platz > 3 && <span className="text-gray-500 text-lg">#{platz}</span>}
                  </span>
                  <span className="font-semibold text-lg">{stand.teilnehmerName}</span>
                </div>
                <span className="font-bold text-2xl text-green-700">
                  {stand.punkteGesamt.toFixed(1)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <div className="flex gap-4">
                  <span>
                    Herren: {stand.punkteHerren.toFixed(1)}
                    {stand.bonusHerren > 0 && <span className="text-yellow-600"> (+{stand.bonusHerren})</span>}
                  </span>
                  <span>
                    Damen: {stand.punkteDamen.toFixed(1)}
                    {stand.bonusDamen > 0 && <span className="text-yellow-600"> (+{stand.bonusDamen})</span>}
                  </span>
                </div>
              </div>

              {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined && (
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                    H: {stand.verbleibendeHerren}/8
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-800">
                    D: {stand.verbleibendeDamen}/8
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
