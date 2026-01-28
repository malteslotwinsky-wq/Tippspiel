import { NextResponse } from 'next/server';
import { getTipps, saveTipps, getSpieler, getTurniere } from '@/lib/daten';
import { validateKompletteTipps } from '@/lib/validierung';
import { Tipp } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turnierId = searchParams.get('turnierId');
    const teilnehmerName = searchParams.get('teilnehmerName');

    let tipps = await getTipps();

    if (turnierId) {
      tipps = tipps.filter(t => t.turnierId === turnierId);
    }

    if (teilnehmerName) {
      tipps = tipps.filter(t => t.teilnehmerName === teilnehmerName);
    }

    return NextResponse.json(tipps);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Tipps' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teilnehmerName, turnierId, herren, damen, siegerHerren, siegerDamen } = body;

    if (!teilnehmerName || !turnierId) {
      return NextResponse.json(
        { error: 'Teilnehmername und Turnier-ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Check deadline
    const turniere = await getTurniere();
    const turnier = turniere.find(t => t.id === turnierId);

    if (!turnier) {
      return NextResponse.json(
        { error: 'Turnier nicht gefunden' },
        { status: 404 }
      );
    }

    if (turnier.abgabeSchluss) {
      const deadline = new Date(turnier.abgabeSchluss);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Abgabeschluss ist vorbei. Tipps können nicht mehr abgegeben werden.' },
          { status: 403 }
        );
      }
    }

    // Get player data for validation
    const spielerData = await getSpieler();
    const herrenSpieler = herren.map((id: string) =>
      spielerData.herren.find(s => s.id === id)
    ).filter(Boolean);
    const damenSpieler = damen.map((id: string) =>
      spielerData.damen.find(s => s.id === id)
    ).filter(Boolean);

    // Validate
    const validation = validateKompletteTipps(
      herrenSpieler,
      damenSpieler,
      siegerHerren,
      siegerDamen
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validation.errors },
        { status: 400 }
      );
    }

    const tipps = await getTipps();

    // Check if tip already exists for this participant and tournament
    const existingIndex = tipps.findIndex(
      t => t.teilnehmerName === teilnehmerName && t.turnierId === turnierId
    );

    const neuerTipp: Tipp = {
      teilnehmerName,
      turnierId,
      herren,
      damen,
      siegerHerren,
      siegerDamen,
      abgegebenAm: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      tipps[existingIndex] = neuerTipp;
    } else {
      tipps.push(neuerTipp);
    }

    await saveTipps(tipps);
    return NextResponse.json(neuerTipp, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Tipps' },
      { status: 500 }
    );
  }
}
