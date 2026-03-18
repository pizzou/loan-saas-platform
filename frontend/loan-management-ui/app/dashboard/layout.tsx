'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../../services/authService';
import { AuthResponse } from '../../types/index';

const NAV = [
  { group: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard' }
  ]},
  { group: 'Lending', items: [
    { href: '/dashboard/borrowers', label: 'Borrowers' },
    { href: '/dashboard/loans',     label: 'Loans'     },
    { href: '/dashboard/approvals', label: 'Approvals' },
  ]},
  { group: 'Finance', items: [
    { href: '/dashboard/payments', label: 'Payments' },
    { href: '/dashboard/reports',  label: 'Reports'  },
  ]},
  { group: 'Admin', items: [
    { href: '/dashboard/organizations', label: 'Organizations' },
    { href: '/dashboard/users',         label: 'Users'         },
    { href: '/dashboard/audit',         label: 'Audit Log'     },
    { href: '/dashboard/settings',      label: 'Settings'      },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  const active = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const title = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard';

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">LoanSaaS</p>
            <p className="text-slate-400 text-xs truncate max-w-[120px]">{user.organizationName}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map(section => (
            <div key={section.group}>
              <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">
                {section.group}
              </p>
              {section.items.map(item => (
                <Link key={item.href} href={item.href}
                  className={'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ' +
                    (active(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800')}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-slate-400 text-[11px]">{user.role}</p>
            </div>
            <button onClick={logout} title="Sign out"
              className="text-slate-500 hover:text-red-400 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-base font-semibold text-gray-700 capitalize">{title}</h1>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}