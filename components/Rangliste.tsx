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
        <p className="text-slate-500 text-center py-4">
          Noch keine Tipps abgegeben
        </p>
      </Card>
    );
  }

  return (
    <Card title={turniername ? `Rangliste - ${turniername}` : 'Rangliste'} noPadding>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Platz
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Teilnehmer
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Herren
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Damen
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gesamt
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider" title="Verbleibende Spieler im Turnier">
                Noch dabei
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rangliste.map((stand, index) => {
              const platz = index + 1;
              const rowStyles: Record<number, string> = {
                1: 'bg-amber-50/50',
                2: 'bg-slate-50/50',
                3: 'bg-orange-50/50',
              };

              return (
                <tr
                  key={stand.teilnehmerName}
                  className={`${rowStyles[platz] || ''} hover:bg-slate-50 transition-colors`}
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-lg">
                      {platz === 1 && '🥇'}
                      {platz === 2 && '🥈'}
                      {platz === 3 && '🥉'}
                      {platz > 3 && <span className="text-slate-500">{platz}</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link
                      href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
                      className="font-medium text-slate-900 hover:text-green-600 transition-colors"
                    >
                      {stand.teilnehmerName}
                    </Link>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-slate-600">
                    {stand.punkteHerren.toFixed(1)}
                    {stand.bonusHerren > 0 && (
                      <span className="text-amber-600 ml-1 text-sm" title="Richtiger Siegertipp">
                        (+{stand.bonusHerren})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-slate-600">
                    {stand.punkteDamen.toFixed(1)}
                    {stand.bonusDamen > 0 && (
                      <span className="text-amber-600 ml-1 text-sm" title="Richtiger Siegertipp">
                        (+{stand.bonusDamen})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="font-bold text-lg text-slate-900">
                      {stand.punkteGesamt.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined ? (
                      <div className="flex justify-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700" title="Herren">
                          H: {stand.verbleibendeHerren}/8
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pink-50 text-pink-700" title="Damen">
                          D: {stand.verbleibendeDamen}/8
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {rangliste.map((stand, index) => {
          const platz = index + 1;
          const cardStyles: Record<number, string> = {
            1: 'bg-amber-50/50',
            2: 'bg-slate-50/50',
            3: 'bg-orange-50/50',
          };

          return (
            <Link
              key={stand.teilnehmerName}
              href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
              className={`block p-4 ${cardStyles[platz] || ''} hover:bg-slate-50 transition-colors active:bg-slate-100`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl w-8">
                    {platz === 1 && '🥇'}
                    {platz === 2 && '🥈'}
                    {platz === 3 && '🥉'}
                    {platz > 3 && <span className="text-slate-500 text-lg">#{platz}</span>}
                  </span>
                  <span className="font-semibold text-slate-900">{stand.teilnehmerName}</span>
                </div>
                <span className="font-bold text-xl text-green-600">
                  {stand.punkteGesamt.toFixed(1)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm text-slate-600 ml-11">
                <div className="flex gap-4">
                  <span>
                    H: {stand.punkteHerren.toFixed(1)}
                    {stand.bonusHerren > 0 && <span className="text-amber-600"> (+{stand.bonusHerren})</span>}
                  </span>
                  <span>
                    D: {stand.punkteDamen.toFixed(1)}
                    {stand.bonusDamen > 0 && <span className="text-amber-600"> (+{stand.bonusDamen})</span>}
                  </span>
                </div>
              </div>

              {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined && (
                <div className="flex gap-2 mt-2 ml-11">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    H: {stand.verbleibendeHerren}/8
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700">
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
