import Link from 'next/link';
import Card from '@/components/ui/Card';
import { getTurniere, getTeilnehmer, getTipps } from '@/lib/daten';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const turniere = await getTurniere();
  const teilnehmer = await getTeilnehmer();
  const tipps = await getTipps();

  const aktivTurnier = turniere.find(t => t.aktiv);
  const tippsFuerAktiv = aktivTurnier
    ? tipps.filter(t => t.turnierId === aktivTurnier.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-5">
          <span aria-hidden="true">🎾</span>
          <span>Grand Slam 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
          Tennis Tippspiel
        </h1>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Tippe auf die besten Spieler und gewinne gegen deine Freunde.
        </p>
      </section>

      {/* Current Tournament */}
      {aktivTurnier && (
        <section>
          <h2 className="section-header">Aktuelles Turnier</h2>
          <Card className="overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-green">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {aktivTurnier.name} {aktivTurnier.jahr}
                  </h3>
                  <p className="text-slate-500 mt-1">
                    {tippsFuerAktiv.length} Teilnehmer
                  </p>
                </div>
                <Link
                  href="/rangliste"
                  className="btn-primary btn-lg w-full sm:w-auto justify-center"
                >
                  Zur Rangliste
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* No Tournament */}
      {!aktivTurnier && (
        <Card>
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="empty-state-title">Kein aktives Turnier</p>
            <p className="empty-state-text">Das nächste Grand Slam kommt bald!</p>
          </div>
        </Card>
      )}
    </div>
  );
}
