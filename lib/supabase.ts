import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for use in Client Components)
export function createClientSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Simple client for non-auth operations (works everywhere)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbSpieler {
  id: string;
  name: string;
  ranking: number;
  geschlecht: 'herren' | 'damen';
}

export interface DbTeilnehmer {
  name: string;
  erstellt_am: string;
}

export interface DbTurnier {
  id: string;
  name: string;
  jahr: number;
  aktiv: boolean;
  abgabe_schluss: string | null;
}

export interface DbTipp {
  id?: number;
  teilnehmer_name: string;
  turnier_id: string;
  herren: string[];
  damen: string[];
  sieger_herren: string;
  sieger_damen: string;
  abgegeben_am?: string;
}

export interface DbErgebnis {
  id?: number;
  turnier_id: string;
  spieler_id: string;
  runde: number;
  out: boolean;
}
