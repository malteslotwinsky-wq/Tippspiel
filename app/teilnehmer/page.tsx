import Link from 'next/link';
import Card from '@/components/ui/Card';
import { getTeilnehmer, getAktivesTurnier, getTipps } from '@/lib/daten';

export const dynamic = 'force-dynamic';

function isDeadlinePassed(dateString: string | undefined): boolean {
  if (!dateString) return false;
  return new Date() > new Date(dateString);
}

function formatDeadline(dateString: string | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function TeilnehmerPage() {
  const teilnehmer = await getTeilnehmer();
  const turnier = await getAktivesTurnier();
  const tipps = await getTipps();

  if (!turnier) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p className="text-xl mb-4">Kein aktives Turnier</p>
          <Link href="/admin" className="text-green-600 hover:underline">
            Als Admin ein Turnier erstellen
          </Link>
        </div>
      </Card>
    );
  }

  const deadlinePassed = isDeadlinePassed(turnier.abgabeSchluss);
  const turnierTipps = tipps.filter(t => t.turnierId === turnier.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Teilnehmer</h1>

      <Card title={`${turnier.name} ${turnier.jahr}`}>
        {/* Deadline Info */}
        {turnier.abgabeSchluss && (
          <div className={`mb-4 p-3 rounded-lg ${deadlinePassed ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {deadlinePassed ? (
              <>
                <strong>Abgabeschluss vorbei!</strong> ({formatDeadline(turnier.abgabeSchluss)})
                <p className="text-sm mt-1">Tipps können nicht mehr geändert werden. Alle Tipps sind jetzt sichtbar.</p>
              </>
            ) : (
              <>
                <strong>Abgabeschluss:</strong> {formatDeadline(turnier.abgabeSchluss)}
                <p className="text-sm mt-1">Tipps sind bis zum Abgabeschluss für andere nicht sichtbar.</p>
              </>
            )}
          </div>
        )}

        {deadlinePassed ? (
          <p className="text-gray-600 mb-4">
            Klicke auf einen Namen, um den Tipp anzusehen.
          </p>
        ) : (
          <p className="text-gray-600 mb-4">
            Wähle deinen Namen, um deinen Tipp abzugeben oder zu ändern.
          </p>
        )}

        {teilnehmer.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">Noch keine Teilnehmer vorhanden</p>
            <Link href="/admin/teilnehmer" className="text-green-600 hover:underline">
              Teilnehmer im Admin-Bereich hinzufügen
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teilnehmer.map(t => {
              const hatTipp = turnierTipps.some(
                tip => tip.teilnehmerName === t.name
              );

              return (
                <Link
                  key={t.name}
                  href={`/teilnehmer/${encodeURIComponent(t.name)}`}
                  className={`p-4 rounded-lg border-2 transition-colors text-center ${
                    hatTipp
                      ? 'border-green-500 bg-green-50 hover:bg-green-100'
                      : deadlinePassed
                      ? 'border-red-300 bg-red-50 hover:bg-red-100'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-lg">{t.name}</div>
                  <div className={`text-sm mt-1 ${
                    hatTipp ? 'text-green-600' : deadlinePassed ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {hatTipp
                      ? 'Tipp abgegeben ✓'
                      : deadlinePassed
                      ? 'Kein Tipp ✗'
                      : 'Noch kein Tipp'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {deadlinePassed && turnierTipps.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/tipps"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
            >
              Alle Tipps ansehen
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
