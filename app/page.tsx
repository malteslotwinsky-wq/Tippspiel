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
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6">
          <span className="text-lg">🎾</span>
          <span>Grand Slam 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          Tennis Tippspiel
        </h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">
          Tritt gegen deine Freunde an und beweise dein Tennis-Wissen.
        </p>
      </section>

      {/* Current Tournament */}
      {aktivTurnier && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-green-500 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Aktuelles Turnier</h2>
          </div>

          <Card className="overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              {/* Tournament Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>

              {/* Tournament Name */}
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
                {aktivTurnier.name} {aktivTurnier.jahr}
              </h3>

              {/* Participants */}
              <p className="text-base text-slate-600 mb-8">
                <span className="font-semibold text-slate-900">{tippsFuerAktiv.length}</span> Teilnehmer aktiv
              </p>

              {/* CTA Button */}
              <Link href="/rangliste" className="btn-primary text-base px-8 py-4">
                Zur Rangliste
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* No Active Tournament */}
      {!aktivTurnier && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-3xl">🎾</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Kein aktives Turnier</h3>
            <p className="text-base text-slate-600 mb-6">
              Aktuell läuft kein Turnier. Schau später wieder vorbei!
            </p>
            <Link href="/admin" className="btn-secondary">
              Admin-Bereich
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
