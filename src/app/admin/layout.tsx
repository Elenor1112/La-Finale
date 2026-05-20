// src/app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/puzzles', label: 'Puzzles', icon: '🧩' },
  { href: '/admin/players', label: 'Players', icon: '👥' },
  { href: '/admin/submissions', label: 'Submissions', icon: '📝' },
  { href: '/admin/qr-generator', label: 'QR Generator', icon: '🔳' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== '/admin' && pathname !== '/admin/';

  return (
    <div className="min-h-screen bg-[#090516] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),transparent_25%),radial-gradient(circle_at_80%_80%,_rgba(245,158,11,0.10),transparent_30%)] pointer-events-none" />
      {showNav && (
        <aside className="fixed left-0 top-0 h-full w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex h-full flex-col px-6 py-8">
            <div className="mb-8">
              <div className="text-4xl mb-3">🎮</div>
              <div className="text-2xl font-display text-white">Herts Quest</div>
              <p className="text-sm text-purple-300 mt-1">Admin Control Center</p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                      active ? 'bg-purple-500/15 text-white border border-purple-500/30' : 'text-purple-200 hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-3xl border border-purple-500/15 bg-purple-950/70 p-4 text-sm text-purple-300">
              <p className="font-semibold text-white">Secure admin</p>
              <p className="mt-2 text-xs leading-5 text-purple-400">Protect your dashboard with ADMIN_PASSWORD in your .env file.</p>
            </div>
          </div>
        </aside>
      )}

      <div className={showNav ? 'md:pl-72' : ''}>
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="min-h-screen px-4 py-6 md:px-8 lg:px-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
