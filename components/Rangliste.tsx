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
            <tr className="bg-slate-800 text-white">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Platz
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider">
                Teilnehmer
              </th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">
                Herren
              </th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">
                Damen
              </th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">
                Gesamt
              </th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider" title="Verbleibende Spieler im Turnier">
                Noch dabei
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rangliste.map((stand, index) => {
              const platz = index + 1;
              const rowStyles: Record<number, string> = {
                1: 'bg-yellow-100 border-l-4 border-l-yellow-500',
                2: 'bg-slate-100 border-l-4 border-l-slate-400',
                3: 'bg-orange-100 border-l-4 border-l-orange-500',
              };

              return (
                <tr
                  key={stand.teilnehmerName}
                  className={`${rowStyles[platz] || 'bg-white hover:bg-slate-50'} transition-colors`}
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-xl">
                      {platz === 1 && '🥇'}
                      {platz === 2 && '🥈'}
                      {platz === 3 && '🥉'}
                      {platz > 3 && <span className="text-slate-700 text-lg font-semibold">{platz}.</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link
                      href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
                      className="font-semibold text-slate-900 hover:text-green-600 transition-colors text-base"
                    >
                      {stand.teilnehmerName}
                    </Link>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="text-slate-700 font-medium">{stand.punkteHerren.toFixed(1)}</span>
                    {stand.bonusHerren > 0 && (
                      <span className="text-amber-600 ml-1 font-bold" title="Richtiger Siegertipp">
                        (+{stand.bonusHerren})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="text-slate-700 font-medium">{stand.punkteDamen.toFixed(1)}</span>
                    {stand.bonusDamen > 0 && (
                      <span className="text-amber-600 ml-1 font-bold" title="Richtiger Siegertipp">
                        (+{stand.bonusDamen})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <span className="font-bold text-xl text-green-700">
                      {stand.punkteGesamt.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined ? (
                      <div className="flex justify-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white" title="Herren">
                          H: {stand.verbleibendeHerren}/8
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-pink-600 text-white" title="Damen">
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
      <div className="md:hidden divide-y divide-slate-200">
        {rangliste.map((stand, index) => {
          const platz = index + 1;
          const cardStyles: Record<number, string> = {
            1: 'bg-yellow-100 border-l-4 border-l-yellow-500',
            2: 'bg-slate-100 border-l-4 border-l-slate-400',
            3: 'bg-orange-100 border-l-4 border-l-orange-500',
          };

          return (
            <Link
              key={stand.teilnehmerName}
              href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
              className={`block p-4 ${cardStyles[platz] || 'bg-white'} hover:bg-slate-50 transition-colors active:bg-slate-100`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-2xl w-10">
                    {platz === 1 && '🥇'}
                    {platz === 2 && '🥈'}
                    {platz === 3 && '🥉'}
                    {platz > 3 && <span className="text-slate-700 text-xl">#{platz}</span>}
                  </span>
                  <span className="font-bold text-lg text-slate-900">{stand.teilnehmerName}</span>
                </div>
                <span className="font-bold text-2xl text-green-700">
                  {stand.punkteGesamt.toFixed(1)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm ml-13 pl-10">
                <div className="flex gap-4 text-slate-700">
                  <span className="font-medium">
                    Herren: <span className="font-bold">{stand.punkteHerren.toFixed(1)}</span>
                    {stand.bonusHerren > 0 && <span className="text-amber-600 font-bold"> (+{stand.bonusHerren})</span>}
                  </span>
                  <span className="font-medium">
                    Damen: <span className="font-bold">{stand.punkteDamen.toFixed(1)}</span>
                    {stand.bonusDamen > 0 && <span className="text-amber-600 font-bold"> (+{stand.bonusDamen})</span>}
                  </span>
                </div>
              </div>

              {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined && (
                <div className="flex gap-2 mt-3 pl-10">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white">
                    H: {stand.verbleibendeHerren}/8
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-pink-600 text-white">
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
