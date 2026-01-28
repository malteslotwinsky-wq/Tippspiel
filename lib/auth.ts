// Client-side auth functions only - safe to import in Client Components
import { createClientSupabase } from './supabase';

// Client-side: Sign in with email and password
export async function signIn(email: string, password: string) {
    const supabase = createClientSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// Client-side: Sign out
export async function signOut() {
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

// Client-side: Get current session
export function getClientSession() {
    const supabase = createClientSupabase();
    return supabase.auth.getSession();
}

// Client-side: Subscribe to auth changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClientSupabase();
    return supabase.auth.onAuthStateChange(callback);
}
