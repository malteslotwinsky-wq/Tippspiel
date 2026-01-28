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
          Tennis Grand Slam Tippspiel
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Tippe auf deine Favoriten und gewinne!
        </p>
      </div>

      {aktivTurnier && (
        <Card title="Aktuelles Turnier">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-green-700 mb-2">
              {aktivTurnier.name} {aktivTurnier.jahr}
            </h2>
            <p className="text-gray-600 mb-4">
              {tippsFuerAktiv.length} von {teilnehmer.length} Tipps abgegeben
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link
                href="/teilnehmer"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
              >
                Tipp abgeben
              </Link>
              <Link
                href="/rangliste"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
              >
                Rangliste
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Spielregeln">
          <ul className="space-y-2 text-gray-700">
            <li>• Wähle <strong>8 Herren</strong> und <strong>8 Damen</strong></li>
            <li>• Max. 4 Spieler aus Top 8</li>
            <li>• Max. 6 Spieler aus Top 32</li>
            <li>• Min. 2 Spieler außerhalb Top 32</li>
            <li>• Zusätzlich: 1 Siegertipp pro Geschlecht</li>
          </ul>
        </Card>

        <Card title="Punktesystem">
          <table className="w-full text-gray-700">
            <tbody>
              <tr><td>2. Runde</td><td className="text-right font-medium">0,5 Punkte</td></tr>
              <tr><td>3. Runde</td><td className="text-right font-medium">1 Punkt</td></tr>
              <tr><td>Achtelfinale</td><td className="text-right font-medium">2 Punkte</td></tr>
              <tr><td>Viertelfinale</td><td className="text-right font-medium">3 Punkte</td></tr>
              <tr><td>Halbfinale</td><td className="text-right font-medium">4 Punkte</td></tr>
              <tr><td>Finale</td><td className="text-right font-medium">5 Punkte</td></tr>
              <tr><td>Turniersieg</td><td className="text-right font-medium">6 Punkte</td></tr>
              <tr className="border-t"><td>Richtiger Siegertipp</td><td className="text-right font-medium text-yellow-600">+1 Bonus</td></tr>
            </tbody>
          </table>
        </Card>
      </div>

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
