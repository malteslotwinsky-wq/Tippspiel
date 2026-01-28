/**
 * Migration Script: JSON Data → Supabase
 * 
 * Run this script ONCE to migrate all existing JSON data to Supabase.
 * 
 * Prerequisites:
 * 1. Run the schema.sql in Supabase SQL Editor first
 * 2. Install dependencies: npm install @supabase/supabase-js dotenv tsx
 * 3. Run: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dataDir = path.join(process.cwd(), 'data');

async function migrateData() {
    console.log('🚀 Starting migration to Supabase...\n');

    try {
        // 1. Migrate Spieler (Players)
        console.log('📦 Migrating Spieler...');
        const spielerData = JSON.parse(fs.readFileSync(path.join(dataDir, 'spieler.json'), 'utf-8'));
        const alleSpieler = [
            ...spielerData.herren.map((s: any) => ({ ...s, geschlecht: 'herren' })),
            ...spielerData.damen.map((s: any) => ({ ...s, geschlecht: 'damen' })),
        ];

        const { error: spielerError } = await supabase
            .from('spieler')
            .upsert(alleSpieler, { onConflict: 'id' });

        if (spielerError) throw new Error(`Spieler: ${spielerError.message}`);
        console.log(`   ✅ ${alleSpieler.length} Spieler migrated\n`);

        // 2. Migrate Turniere (Tournaments)
        console.log('📦 Migrating Turniere...');
        const turniereData = JSON.parse(fs.readFileSync(path.join(dataDir, 'turniere.json'), 'utf-8'));
        const turniere = turniereData.map((t: any) => ({
            id: t.id,
            name: t.name,
            jahr: t.jahr,
            aktiv: t.aktiv,
            abgabe_schluss: t.abgabeSchluss || null,
        }));

        const { error: turniereError } = await supabase
            .from('turniere')
            .upsert(turniere, { onConflict: 'id' });

        if (turniereError) throw new Error(`Turniere: ${turniereError.message}`);
        console.log(`   ✅ ${turniere.length} Turniere migrated\n`);

        // 3. Migrate Teilnehmer (Participants)
        console.log('📦 Migrating Teilnehmer...');
        const teilnehmerData = JSON.parse(fs.readFileSync(path.join(dataDir, 'teilnehmer.json'), 'utf-8'));
        const teilnehmer = teilnehmerData.map((t: any) => ({
            name: t.name,
            erstellt_am: t.erstelltAm,
        }));

        const { error: teilnehmerError } = await supabase
            .from('teilnehmer')
            .upsert(teilnehmer, { onConflict: 'name' });

        if (teilnehmerError) throw new Error(`Teilnehmer: ${teilnehmerError.message}`);
        console.log(`   ✅ ${teilnehmer.length} Teilnehmer migrated\n`);

        // 4. Migrate Tipps (Picks)
        console.log('📦 Migrating Tipps...');
        const tippsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tipps.json'), 'utf-8'));
        const tipps = tippsData.map((t: any) => ({
            teilnehmer_name: t.teilnehmerName,
            turnier_id: t.turnierId,
            herren: t.herren,
            damen: t.damen,
            sieger_herren: t.siegerHerren,
            sieger_damen: t.siegerDamen,
            abgegeben_am: t.abgegebenAm,
        }));

        // Delete existing tipps first to avoid conflicts
        await supabase.from('tipps').delete().neq('id', 0);

        const { error: tippsError } = await supabase
            .from('tipps')
            .insert(tipps);

        if (tippsError) throw new Error(`Tipps: ${tippsError.message}`);
        console.log(`   ✅ ${tipps.length} Tipps migrated\n`);

        // 5. Migrate Ergebnisse (Results)
        console.log('📦 Migrating Ergebnisse...');
        const ergebnisseData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ergebnisse.json'), 'utf-8'));
        const ergebnisse = ergebnisseData.map((e: any) => ({
            turnier_id: e.turnierId,
            spieler_id: e.spielerId,
            runde: e.runde,
            out: e.out || false,
        }));

        // Delete existing ergebnisse first
        await supabase.from('ergebnisse').delete().neq('id', 0);

        const { error: ergebnisseError } = await supabase
            .from('ergebnisse')
            .insert(ergebnisse);

        if (ergebnisseError) throw new Error(`Ergebnisse: ${ergebnisseError.message}`);
        console.log(`   ✅ ${ergebnisse.length} Ergebnisse migrated\n`);

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateData();
