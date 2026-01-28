import { NextResponse } from 'next/server';
import { getTipps, getErgebnisse, getAktivesTurnier, getSpieler } from '@/lib/daten';
import { berechneRangliste, getSpielerPunkteDetails } from '@/lib/punkte';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let turnierId = searchParams.get('turnierId');

    // If no tournament ID provided, use active tournament
    if (!turnierId) {
      const aktivTurnier = await getAktivesTurnier();
      if (!aktivTurnier) {
        return NextResponse.json(
          { error: 'Kein aktives Turnier gefunden' },
          { status: 404 }
        );
      }
      turnierId = aktivTurnier.id;
    }

    const tipps = await getTipps();
    const ergebnisse = await getErgebnisse();

    const rangliste = berechneRangliste(tipps, ergebnisse, turnierId);

    return NextResponse.json({
      turnierId,
      rangliste,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Berechnen der Rangliste' },
      { status: 500 }
    );
  }
}
