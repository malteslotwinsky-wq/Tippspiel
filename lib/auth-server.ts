// Server-side auth functions - only import in Server Components
import { createServerSupabase } from './supabase-server';

// Server-side: Get current session
export async function getSession() {
    const supabase = await createServerSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error);
        return null;
    }

    return session;
}

// Server-side: Get current user
export async function getUser() {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error);
        return null;
    }

    return user;
}

// Server-side: Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const user = await getUser();
    return user !== null;
}
