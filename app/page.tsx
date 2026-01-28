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
    <div className="space-y-6 md:space-y-8">
      <div className="text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
          🎾 Tennis Grand Slam Tippspiel
        </h1>
      </div>

      {aktivTurnier && (
        <Card title="Aktuelles Turnier">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-2">
              {aktivTurnier.name} {aktivTurnier.jahr}
            </h2>
            <p className="text-gray-600 mb-4">
              {tippsFuerAktiv.length} Teilnehmer
            </p>
            <Link
              href="/rangliste"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
            >
              Zur Rangliste
            </Link>
          </div>
        </Card>
      )}

      {!aktivTurnier && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="text-xl mb-4">Kein aktives Turnier</p>
            <Link
              href="/admin"
              className="text-green-600 hover:underline"
            >
              Als Admin ein Turnier erstellen
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
