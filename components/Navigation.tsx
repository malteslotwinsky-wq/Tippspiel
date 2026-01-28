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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClientSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const publicLinks = [
    { href: '/', label: 'Start' },
    { href: '/rangliste', label: 'Rangliste' },
  ];

  const protectedLinks = [
    { href: '/teilnehmer', label: 'Teilnehmer' },
    { href: '/tipps', label: 'Alle Tipps' },
    { href: '/admin', label: 'Admin' },
  ];

  const visibleLinks = user ? [...publicLinks, ...protectedLinks] : publicLinks;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="container-app">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-slate-900 hover:text-emerald-600 transition-colors focus-ring rounded-lg px-1 -ml-1"
            >
              <span className="text-xl" aria-hidden="true">🎾</span>
              <span className="hidden sm:inline">Tennis Tippspiel</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                <div className="ml-2 pl-2 border-l border-slate-200">
                  {user ? (
                    <button onClick={handleLogout} className="btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50">
                      Logout
                    </button>
                  ) : (
                    <Link href="/login" className="btn-primary btn-sm">
                      Login
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus-ring touch-target"
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl z-50 md:hidden flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
              <span className="font-semibold text-slate-900">Menü</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus-ring touch-target"
                aria-label="Menü schließen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {visibleLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link ${pathname === link.href ? 'mobile-nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {!loading && (
              <div className="p-4 border-t border-slate-100">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full btn btn-ghost text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className="w-full btn btn-primary text-center">
                    Login
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
