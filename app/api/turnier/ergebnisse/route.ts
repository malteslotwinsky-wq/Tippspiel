import { NextResponse } from 'next/server';
import { getErgebnisse, saveErgebnisse } from '@/lib/daten';
import { TurnierErgebnis, Runde } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turnierId = searchParams.get('turnierId');

    let ergebnisse = await getErgebnisse();

    if (turnierId) {
      ergebnisse = ergebnisse.filter(e => e.turnierId === turnierId);
    }

    return NextResponse.json(ergebnisse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Ergebnisse' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { turnierId, spielerId, runde, out } = body;

    if (!turnierId || !spielerId) {
      return NextResponse.json(
        { error: 'Turnier-ID und Spieler-ID sind erforderlich' },
        { status: 400 }
      );
    }

    const ergebnisse = await getErgebnisse();

    // Check if result already exists for this player and tournament
    const existingIndex = ergebnisse.findIndex(
      e => e.spielerId === spielerId && e.turnierId === turnierId
    );

    if (existingIndex !== -1) {
      // Update existing - preserve values if not provided
      if (runde !== undefined) {
        ergebnisse[existingIndex].runde = parseInt(runde) as Runde;
      }
      if (out !== undefined) {
        ergebnisse[existingIndex].out = out;
      }
      await saveErgebnisse(ergebnisse);
      return NextResponse.json(ergebnisse[existingIndex], { status: 200 });
    } else {
      // Create new - runde is required for new entries
      if (!runde) {
        return NextResponse.json(
          { error: 'Runde ist erforderlich für neue Einträge' },
          { status: 400 }
        );
      }
      const neuesErgebnis: TurnierErgebnis = {
        turnierId,
        spielerId,
        runde: parseInt(runde) as Runde,
        out: out || false,
      };
      ergebnisse.push(neuesErgebnis);
      await saveErgebnisse(ergebnisse);
      return NextResponse.json(neuesErgebnis, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Ergebnisses' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turnierId = searchParams.get('turnierId');
    const spielerId = searchParams.get('spielerId');

    if (!turnierId || !spielerId) {
      return NextResponse.json(
        { error: 'Turnier-ID und Spieler-ID sind erforderlich' },
        { status: 400 }
      );
    }

    let ergebnisse = await getErgebnisse();
    ergebnisse = ergebnisse.filter(
      e => !(e.spielerId === spielerId && e.turnierId === turnierId)
    );

    await saveErgebnisse(ergebnisse);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Ergebnisses' },
      { status: 500 }
    );
  }
}
