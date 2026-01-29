import { NextResponse } from 'next/server';
import { getTipps, getErgebnisse, getTurniere } from '@/lib/daten';
import { PUNKTE_PRO_RUNDE, TurnierErgebnis, Runde } from '@/lib/types';

// Debug endpoint to trace exact point calculations
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const teilnehmerName = searchParams.get('name') || 'Kenny';

    try {
        const turniere = await getTurniere();
        const aktivTurnier = turniere.find(t => t.aktiv);

        if (!aktivTurnier) {
            return NextResponse.json({ error: 'Kein aktives Turnier' }, { status: 404 });
        }

        const tipps = await getTipps();
        const ergebnisse = await getErgebnisse();

        const tipp = tipps.find(t => t.teilnehmerName === teilnehmerName && t.turnierId === aktivTurnier.id);

        if (!tipp) {
            return NextResponse.json({ error: `Kein Tipp für ${teilnehmerName}` }, { status: 404 });
        }

        const turnierErgebnisse = ergebnisse.filter(e => e.turnierId === aktivTurnier.id);

        // Calculate detailed points for Herren
        const herrenDetails = tipp.herren.map(spielerId => {
            const ergebnis = turnierErgebnisse.find(e => e.spielerId === spielerId);
            if (!ergebnis) {
                return { spielerId, ergebnis: null, punkte: 0, status: 'Kein Ergebnis (noch dabei?)' };
            }

            let punkte = PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] || 0;
            const isSieger = ergebnis.runde === 7 && ergebnis.out !== true;
            if (isSieger) {
                punkte += 1; // Sieger bonus
            }

            return {
                spielerId,
                ergebnis,
                punkte,
                isSieger,
                status: ergebnis.out ? `Out in Runde ${ergebnis.runde}` : `Noch dabei in Runde ${ergebnis.runde}`,
            };
        });

        // Calculate detailed points for Damen
        const damenDetails = tipp.damen.map(spielerId => {
            const ergebnis = turnierErgebnisse.find(e => e.spielerId === spielerId);
            if (!ergebnis) {
                return { spielerId, ergebnis: null, punkte: 0, status: 'Kein Ergebnis (noch dabei?)' };
            }

            let punkte = PUNKTE_PRO_RUNDE[ergebnis.runde as Runde] || 0;
            const isSieger = ergebnis.runde === 7 && ergebnis.out !== true;
            if (isSieger) {
                punkte += 1; // Sieger bonus
            }

            return {
                spielerId,
                ergebnis,
                punkte,
                isSieger,
                status: ergebnis.out ? `Out in Runde ${ergebnis.runde}` : `Noch dabei in Runde ${ergebnis.runde}`,
            };
        });

        const punkteHerrenBase = herrenDetails.reduce((sum, d) => sum + d.punkte, 0);
        const punkteDamenBase = damenDetails.reduce((sum, d) => sum + d.punkte, 0);

        // Check for sieger bonus (correct winner prediction)
        const siegerHerren = turnierErgebnisse.find(
            e => e.runde === 7 && e.spielerId.startsWith('h') && e.out !== true
        );
        const siegerDamen = turnierErgebnisse.find(
            e => e.runde === 7 && e.spielerId.startsWith('d') && e.out !== true
        );

        const bonusHerren = siegerHerren && siegerHerren.spielerId === tipp.siegerHerren ? 1 : 0;
        const bonusDamen = siegerDamen && siegerDamen.spielerId === tipp.siegerDamen ? 1 : 0;

        const punkteHerren = punkteHerrenBase + bonusHerren;
        const punkteDamen = punkteDamenBase + bonusDamen;
        const punkteGesamt = punkteHerren + punkteDamen;

        return NextResponse.json({
            teilnehmerName,
            turnierId: aktivTurnier.id,
            tipp: {
                herren: tipp.herren,
                damen: tipp.damen,
                siegerHerren: tipp.siegerHerren,
                siegerDamen: tipp.siegerDamen,
            },
            herrenDetails,
            damenDetails,
            siegercheck: {
                siegerHerren: siegerHerren ? siegerHerren.spielerId : 'Noch kein Sieger',
                tippSiegerHerren: tipp.siegerHerren,
                bonusHerren,
                siegerDamen: siegerDamen ? siegerDamen.spielerId : 'Noch kein Sieger',
                tippSiegerDamen: tipp.siegerDamen,
                bonusDamen,
            },
            punkte: {
                herrenBase: punkteHerrenBase,
                damenBase: punkteDamenBase,
                bonusHerren,
                bonusDamen,
                herrenTotal: punkteHerren,
                damenTotal: punkteDamen,
                gesamt: punkteGesamt,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
