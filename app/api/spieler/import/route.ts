import { NextResponse } from 'next/server';
import { getSpieler, saveSpieler } from '@/lib/daten';
import { Spieler } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csv, geschlecht, ersetzen } = body;

    if (!csv || !geschlecht) {
      return NextResponse.json(
        { error: 'CSV und Geschlecht sind erforderlich' },
        { status: 400 }
      );
    }

    // Parse CSV
    const lines = csv.trim().split('\n');
    const neueSpieler: Spieler[] = [];
    const prefix = geschlecht === 'herren' ? 'h' : 'd';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Support formats: "Ranking,Name" or "Ranking;Name" or just "Name" (uses line number as ranking)
      let ranking: number;
      let name: string;

      if (line.includes(',') || line.includes(';')) {
        const parts = line.split(/[,;]/).map((p: string) => p.trim());
        if (parts.length >= 2) {
          // First column is ranking, second is name
          const possibleRanking = parseInt(parts[0]);
          if (!isNaN(possibleRanking)) {
            ranking = possibleRanking;
            name = parts[1];
          } else {
            // First column is name, second might be ranking
            name = parts[0];
            ranking = parseInt(parts[1]) || (i + 1);
          }
        } else {
          name = parts[0];
          ranking = i + 1;
        }
      } else {
        name = line;
        ranking = i + 1;
      }

      if (name) {
        neueSpieler.push({
          id: `${prefix}${ranking}`,
          name,
          ranking,
          geschlecht,
        });
      }
    }

    if (neueSpieler.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Spieler in der CSV gefunden' },
        { status: 400 }
      );
    }

    // Sort by ranking
    neueSpieler.sort((a, b) => a.ranking - b.ranking);

    // Re-assign IDs to avoid duplicates
    neueSpieler.forEach((s, idx) => {
      s.id = `${prefix}${idx + 1}`;
    });

    const spieler = await getSpieler();

    if (ersetzen) {
      // Replace all players of this gender
      if (geschlecht === 'herren') {
        spieler.herren = neueSpieler;
      } else {
        spieler.damen = neueSpieler;
      }
    } else {
      // Add to existing, avoiding duplicate names
      const liste = geschlecht === 'herren' ? spieler.herren : spieler.damen;
      const existingNames = new Set(liste.map(s => s.name.toLowerCase()));

      for (const neu of neueSpieler) {
        if (!existingNames.has(neu.name.toLowerCase())) {
          liste.push(neu);
          existingNames.add(neu.name.toLowerCase());
        }
      }

      // Re-sort and re-assign IDs
      liste.sort((a, b) => a.ranking - b.ranking);
      liste.forEach((s, idx) => {
        s.id = `${prefix}${idx + 1}`;
      });
    }

    await saveSpieler(spieler);

    return NextResponse.json({
      success: true,
      imported: neueSpieler.length,
      message: `${neueSpieler.length} Spieler importiert`,
    });
  } catch (error) {
    console.error('CSV Import Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Importieren der CSV' },
      { status: 500 }
    );
  }
}
