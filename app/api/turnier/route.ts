import { NextResponse } from 'next/server';
import { getTurniere, saveTurniere, getErgebnisse, saveErgebnisse } from '@/lib/daten';
import { Turnier, TurnierErgebnis, Runde } from '@/lib/types';

export async function GET() {
  try {
    const turniere = await getTurniere();
    return NextResponse.json(turniere);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Turniere' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, jahr, abgabeSchluss } = body;

    if (!name || !jahr) {
      return NextResponse.json(
        { error: 'Name und Jahr sind erforderlich' },
        { status: 400 }
      );
    }

    const turniere = await getTurniere();

    // Generate ID from name and year
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${jahr}`;

    // Deactivate all other tournaments
    turniere.forEach(t => t.aktiv = false);

    const neuesTurnier: Turnier = {
      id,
      name,
      jahr: parseInt(jahr),
      aktiv: true,
      abgabeSchluss,
    };

    turniere.push(neuesTurnier);
    await saveTurniere(turniere);

    return NextResponse.json(neuesTurnier, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Turniers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, aktiv, abgabeSchluss } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Turnier-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const turniere = await getTurniere();
    const turnier = turniere.find(t => t.id === id);

    if (!turnier) {
      return NextResponse.json(
        { error: 'Turnier nicht gefunden' },
        { status: 404 }
      );
    }

    if (aktiv !== undefined) {
      // Deactivate all others if this one becomes active
      if (aktiv) {
        turniere.forEach(t => t.aktiv = false);
      }
      turnier.aktiv = aktiv;
    }

    if (abgabeSchluss !== undefined) {
      turnier.abgabeSchluss = abgabeSchluss;
    }

    await saveTurniere(turniere);
    return NextResponse.json(turnier);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Turniers' },
      { status: 500 }
    );
  }
}
