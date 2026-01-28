import Link from 'next/link';
import Card from '@/components/ui/Card';
import { getTurniere, getTeilnehmer, getSpieler, getTipps } from '@/lib/daten';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const turniere = await getTurniere();
  const teilnehmer = await getTeilnehmer();
  const spielerData = await getSpieler();
  const tipps = await getTipps();

  const aktivTurnier = turniere.find(t => t.aktiv);

  const adminLinks = [
    {
      href: '/admin/spieler',
      title: 'Spieler verwalten',
      description: `${spielerData.herren.length} Herren, ${spielerData.damen.length} Damen`,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      href: '/admin/turnier',
      title: 'Turnier & Ergebnisse',
      description: aktivTurnier ? `${aktivTurnier.name} ${aktivTurnier.jahr}` : 'Kein aktives Turnier',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
    {
      href: '/admin/teilnehmer',
      title: 'Teilnehmer verwalten',
      description: `${teilnehmer.length} Teilnehmer`,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin-Bereich</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {adminLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block p-6 rounded-lg border-2 transition-colors ${link.color}`}
          >
            <h2 className="text-xl font-bold mb-2">{link.title}</h2>
            <p className="text-gray-600">{link.description}</p>
          </Link>
        ))}
      </div>

      {aktivTurnier && (
        <Card title="Übersicht aktuelles Turnier">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {tipps.filter(t => t.turnierId === aktivTurnier.id).length}
              </div>
              <div className="text-gray-600">Tipps abgegeben</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {teilnehmer.length}
              </div>
              <div className="text-gray-600">Teilnehmer</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {spielerData.herren.length}
              </div>
              <div className="text-gray-600">Herren</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">
                {spielerData.damen.length}
              </div>
              <div className="text-gray-600">Damen</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
