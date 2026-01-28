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
      <Card title={turniername ? `Rangliste – ${turniername}` : 'Rangliste'}>
        <div className="empty-state">
          <p className="empty-state-text">Noch keine Tipps abgegeben</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={turniername ? `Rangliste – ${turniername}` : 'Rangliste'} noPadding>
      {/* Desktop Table */}
      <div className="hidden md:block table-container">
        <table>
          <thead className="table-header">
            <tr>
              <th className="w-16">#</th>
              <th>Teilnehmer</th>
              <th className="text-right">Herren</th>
              <th className="text-right">Damen</th>
              <th className="text-right">Gesamt</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rangliste.map((stand, index) => {
              const platz = index + 1;
              return (
                <tr key={stand.teilnehmerName} className="table-row">
                  <td className="font-medium text-slate-500">
                    {platz === 1 && <span title="1. Platz">🥇</span>}
                    {platz === 2 && <span title="2. Platz">🥈</span>}
                    {platz === 3 && <span title="3. Platz">🥉</span>}
                    {platz > 3 && platz}
                  </td>
                  <td>
                    <Link
                      href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
                      className="font-medium text-slate-900 hover:text-emerald-600 transition-colors"
                    >
                      {stand.teilnehmerName}
                    </Link>
                  </td>
                  <td className="text-right text-slate-600 tabular-nums">
                    {stand.punkteHerren.toFixed(1)}
                    {stand.bonusHerren > 0 && (
                      <span className="text-amber-600 ml-1">+{stand.bonusHerren}</span>
                    )}
                  </td>
                  <td className="text-right text-slate-600 tabular-nums">
                    {stand.punkteDamen.toFixed(1)}
                    {stand.bonusDamen > 0 && (
                      <span className="text-amber-600 ml-1">+{stand.bonusDamen}</span>
                    )}
                  </td>
                  <td className="text-right font-semibold text-slate-900 tabular-nums">
                    {stand.punkteGesamt.toFixed(1)}
                  </td>
                  <td className="text-center">
                    {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined && (
                      <div className="flex justify-center gap-1.5">
                        <span className="badge badge-blue text-xs" title="Herren noch dabei">
                          H:{stand.verbleibendeHerren}
                        </span>
                        <span className="badge bg-pink-100 text-pink-700 text-xs" title="Damen noch dabei">
                          D:{stand.verbleibendeDamen}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {rangliste.map((stand, index) => {
          const platz = index + 1;
          return (
            <Link
              key={stand.teilnehmerName}
              href={`/teilnehmer/${encodeURIComponent(stand.teilnehmerName)}`}
              className="block p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg w-8 text-center flex-shrink-0">
                    {platz === 1 && '🥇'}
                    {platz === 2 && '🥈'}
                    {platz === 3 && '🥉'}
                    {platz > 3 && <span className="text-sm text-slate-400 font-medium">{platz}</span>}
                  </span>
                  <span className="font-medium text-slate-900 truncate">{stand.teilnehmerName}</span>
                </div>
                <span className="font-bold text-lg text-emerald-600 tabular-nums flex-shrink-0">
                  {stand.punkteGesamt.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 ml-11">
                <div className="flex gap-3 text-sm text-slate-500">
                  <span>H: {stand.punkteHerren.toFixed(1)}</span>
                  <span>D: {stand.punkteDamen.toFixed(1)}</span>
                </div>
                {stand.verbleibendeHerren !== undefined && stand.verbleibendeDamen !== undefined && (
                  <div className="flex gap-1">
                    <span className="badge badge-blue text-xs">H:{stand.verbleibendeHerren}</span>
                    <span className="badge bg-pink-100 text-pink-700 text-xs">D:{stand.verbleibendeDamen}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
