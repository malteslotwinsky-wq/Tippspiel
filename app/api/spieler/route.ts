import { NextResponse } from 'next/server';
import { getSpieler, saveSpieler } from '@/lib/daten';
import { Spieler } from '@/lib/types';

export async function GET() {
  try {
    const spieler = await getSpieler();
    return NextResponse.json(spieler);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spieler' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ranking, geschlecht } = body;

    if (!name || !ranking || !geschlecht) {
      return NextResponse.json(
        { error: 'Name, Ranking und Geschlecht sind erforderlich' },
        { status: 400 }
      );
    }

    const spieler = await getSpieler();
    const liste = geschlecht === 'herren' ? spieler.herren : spieler.damen;

    // Generate new ID
    const prefix = geschlecht === 'herren' ? 'h' : 'd';
    const maxId = liste.reduce((max, s) => {
      const num = parseInt(s.id.slice(1));
      return num > max ? num : max;
    }, 0);
    const newId = `${prefix}${maxId + 1}`;

    const neuerSpieler: Spieler = {
      id: newId,
      name,
      ranking: parseInt(ranking),
      geschlecht,
    };

    if (geschlecht === 'herren') {
      spieler.herren.push(neuerSpieler);
      spieler.herren.sort((a, b) => a.ranking - b.ranking);
    } else {
      spieler.damen.push(neuerSpieler);
      spieler.damen.sort((a, b) => a.ranking - b.ranking);
    }

    await saveSpieler(spieler);
    return NextResponse.json(neuerSpieler, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spielers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, ranking, geschlecht } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Spieler-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const spieler = await getSpieler();

    const updateList = (liste: Spieler[]) => {
      const index = liste.findIndex(s => s.id === id);
      if (index !== -1) {
        liste[index] = { ...liste[index], name, ranking: parseInt(ranking) };
        liste.sort((a, b) => a.ranking - b.ranking);
        return true;
      }
      return false;
    };

    const updated = updateList(spieler.herren) || updateList(spieler.damen);

    if (!updated) {
      return NextResponse.json(
        { error: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    await saveSpieler(spieler);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spielers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Spieler-ID ist erforderlich' },
        { status: 400 }
      );
    }

    const spieler = await getSpieler();

    spieler.herren = spieler.herren.filter(s => s.id !== id);
    spieler.damen = spieler.damen.filter(s => s.id !== id);

    await saveSpieler(spieler);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spielers' },
      { status: 500 }
    );
  }
}
