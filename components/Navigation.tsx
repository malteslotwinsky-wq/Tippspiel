'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientSupabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Public links (always visible)
  const publicLinks = [
    { href: '/', label: 'Start' },
    { href: '/rangliste', label: 'Rangliste' },
  ];

  // Protected links (only visible when logged in)
  const protectedLinks = [
    { href: '/teilnehmer', label: 'Teilnehmer' },
    { href: '/tipps', label: 'Alle Tipps' },
    { href: '/admin', label: 'Admin' },
  ];

  const visibleLinks = user ? [...publicLinks, ...protectedLinks] : publicLinks;

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            🎾 Tennis Tippspiel
          </Link>
          <div className="flex items-center space-x-4">
            {visibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                    ? 'bg-green-800'
                    : 'hover:bg-green-600'
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium bg-green-800 hover:bg-green-900 transition-colors"
                  >
                    Admin Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
