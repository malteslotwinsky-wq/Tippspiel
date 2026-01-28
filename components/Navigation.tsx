'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Start' },
    { href: '/teilnehmer', label: 'Teilnehmer' },
    { href: '/tipps', label: 'Alle Tipps' },
    { href: '/rangliste', label: 'Rangliste' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Tennis Tippspiel
          </Link>
          <div className="flex space-x-4">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-green-800'
                    : 'hover:bg-green-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
