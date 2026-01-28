import { NextResponse } from 'next/server';
import { getTeilnehmer, saveTeilnehmer, addTeilnehmer } from '@/lib/daten';
import { Teilnehmer } from '@/lib/types';

export async function GET() {
  try {
    const teilnehmer = await getTeilnehmer();
    return NextResponse.json(teilnehmer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Teilnehmer' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    const neuerTeilnehmer = await addTeilnehmer(name.trim());
    return NextResponse.json(neuerTeilnehmer, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Teilnehmer existiert bereits') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Teilnehmers' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Name ist erforderlich' },
        { status: 400 }
      );
    }

    const teilnehmer = await getTeilnehmer();
    const filtered = teilnehmer.filter(t => t.name !== name);

    if (filtered.length === teilnehmer.length) {
      return NextResponse.json(
        { error: 'Teilnehmer nicht gefunden' },
        { status: 404 }
      );
    }

    await saveTeilnehmer(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Teilnehmers' },
      { status: 500 }
    );
  }
}
