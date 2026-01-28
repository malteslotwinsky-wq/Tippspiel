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

  const NavLink = ({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) => {
    const isActive = pathname === href;

    if (mobile) {
      return (
        <Link
          href={href}
          className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 touch-target
            ${isActive
              ? 'bg-green-50 text-green-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          {label}
        </Link>
      );
    }

    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus-ring
          ${isActive
            ? 'bg-green-600 text-white'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="section">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg text-slate-900 hover:text-green-600 transition-colors focus-ring rounded-lg px-2 py-1 -ml-2"
            >
              <span className="text-2xl">🎾</span>
              <span className="hidden sm:inline">Tennis Tippspiel</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map(link => (
                <NavLink key={link.href} {...link} />
              ))}

              {!loading && (
                <div className="ml-3 pl-3 border-l border-slate-200">
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Logout
                    </button>
                  ) : (
                    <Link href="/login" className="btn-primary text-sm py-2">
                      Admin Login
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-xl z-50 md:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200">
                <span className="font-semibold text-slate-900">Menü</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus-ring touch-target"
                  aria-label="Menü schließen"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {visibleLinks.map(link => (
                  <NavLink key={link.href} {...link} mobile />
                ))}
              </nav>

              {!loading && (
                <div className="p-4 border-t border-slate-200">
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors touch-target"
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full px-4 py-3 rounded-xl text-base font-medium text-center text-white bg-green-600 hover:bg-green-700 transition-colors touch-target"
                    >
                      Admin Login
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
