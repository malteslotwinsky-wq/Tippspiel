import Link from 'next/link';
import Rangliste from '@/components/Rangliste';
import Card from '@/components/ui/Card';
import { getTurniere, getTipps, getErgebnisse, getSpieler } from '@/lib/daten';
import { berechneRangliste } from '@/lib/punkte';

export const dynamic = 'force-dynamic';

export default async function RanglistePage() {
  const turniere = await getTurniere();
  const tipps = await getTipps();
  const ergebnisse = await getErgebnisse();
  const spielerData = await getSpieler();

  const aktivTurnier = turniere.find(t => t.aktiv);

  if (!aktivTurnier) {
    return (
      <Card>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="empty-state-title">Kein aktives Turnier</p>
          <p className="empty-state-text mb-4">Erstelle ein Turnier im Admin-Bereich.</p>
          <Link href="/admin" className="btn-secondary btn-sm">
            Zum Admin-Bereich
          </Link>
        </div>
      </Card>
    );
  }

  const rangliste = berechneRangliste(tipps, ergebnisse, aktivTurnier.id, true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Rangliste</h1>
        <p className="page-subtitle">{aktivTurnier.name} {aktivTurnier.jahr}</p>
      </div>

      {/* Main Rangliste */}
      <Rangliste rangliste={rangliste} />
    </div>
  );
}
