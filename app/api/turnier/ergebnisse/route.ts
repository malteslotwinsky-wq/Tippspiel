import { NextResponse } from 'next/server';
import { getErgebnisse, upsertErgebnis, deleteErgebnis } from '@/lib/daten';
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

    // Get existing result if any
    const ergebnisse = await getErgebnisse();
    const existing = ergebnisse.find(
      e => e.spielerId === spielerId && e.turnierId === turnierId
    );

    if (existing) {
      // Update existing - preserve values if not provided
      const updatedErgebnis: TurnierErgebnis = {
        turnierId,
        spielerId,
        runde: runde !== undefined ? parseInt(runde) as Runde : existing.runde,
        out: out !== undefined ? out : existing.out,
      };
      await upsertErgebnis(updatedErgebnis);
      return NextResponse.json(updatedErgebnis, { status: 200 });
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
      await upsertErgebnis(neuesErgebnis);
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

    await deleteErgebnis(turnierId, spielerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Ergebnisses' },
      { status: 500 }
    );
  }
}
