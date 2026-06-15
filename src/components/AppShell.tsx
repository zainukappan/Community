'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  PhoneCall, 
  Layers, 
  LogOut, 
  Languages, 
  User, 
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import Login from '@/app/auth/login/LoginClient';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout, isLoading } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, render the login page inline for simple, reliable routing
  if (!user) {
    return <Login />;
  }

  // Get active color theme based on user's organization
  // Super Admins don't have an org, so they get the default deep green theme
  const orgColor = '#055938'; 

  // Define navigation based on user roles
  const navItems = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'org_admin', 'office_bearer', 'executive'],
    },
    {
      name: t('organizations'),
      href: '/organizations',
      icon: Layers,
      roles: ['super_admin'],
    },
    {
      name: t('members'),
      href: '/members',
      icon: Users,
      roles: ['super_admin', 'org_admin', 'office_bearer'],
    },
    {
      name: t('programs'),
      href: '/programs',
      icon: Calendar,
      roles: ['super_admin', 'org_admin'],
    },
    {
      name: t('campaigns'),
      href: '/campaigns',
      icon: PhoneCall,
      roles: ['super_admin', 'org_admin'],
    },
    {
      name: t('reports'),
      href: '/reports',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'org_admin'],
    },
    {
      name: t('myCalls'),
      href: '/calling',
      icon: PhoneCall,
      roles: ['office_bearer', 'executive'],
    },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-emerald-950 text-white md:flex">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-emerald-900 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-emerald-100">
            <span className="text-xl">🕌</span>
            <span className="tracking-tight text-sm font-semibold truncate max-w-[170px]">
              {t('appName')}
            </span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-800 text-white font-medium shadow-md shadow-emerald-950/20'
                    : 'text-emerald-200 hover:bg-emerald-900/50 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-emerald-300'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Profile */}
        <div className="border-t border-emerald-900 p-4 bg-emerald-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-emerald-100 font-bold border border-amber-500/30">
              {user.fullName[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-emerald-50">{user.fullName}</p>
              <p className="truncate text-xs text-amber-400 font-medium">
                {t(user.role as any)}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <span className="text-xl">🕌</span>
            </Link>
            <h1 className="text-base font-bold text-slate-800 md:text-xl truncate max-w-[200px] sm:max-w-md">
              {t('title')}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Public Link */}
            <Link 
              href="/"
              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-200"
            >
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">{t('publicDirectory')}</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ml' : 'en')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Languages className="h-4 w-4 text-emerald-700" />
              <span>{locale === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>

            {/* Profile Avatar (Mobile) */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Sub-header on Mobile to show logged-in user role */}
        <div className="bg-emerald-900/5 px-4 py-2 border-b border-slate-100 md:hidden flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="truncate">👤 {user.fullName}</span>
          <span className="bg-emerald-800 text-white px-2 py-0.5 rounded-md font-semibold scale-90">
            {t(user.role as any)}
          </span>
        </div>

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-slate-200 bg-white shadow-lg md:hidden justify-around items-center px-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all ${
                isActive
                  ? 'text-emerald-800 font-bold scale-105'
                  : 'text-slate-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-700 stroke-[2.5px]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
