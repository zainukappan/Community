'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { Languages, LogIn, Key, Mail, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginClient() {
  const { user, login } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    const success = login(email);
    if (!success) {
      setError('Invalid email or account is inactive.');
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    const success = login(quickEmail);
    if (!success) {
      setError('Failed to login with quick account.');
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@org.com', desc: 'Manage all organizations' },
    { label: 'KMJ Admin', email: 'kmjadmin@org.com', desc: 'Manage Kerala Muslim Jamaath' },
    { label: 'KMJ Bearer', email: 'jamal@org.com', desc: 'Office Bearer (Caller)' },
    { label: 'KMJ Exec', email: 'salim@org.com', desc: 'Executive Member (Caller)' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ml' : 'en')}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <Languages className="h-3.5 w-3.5 text-emerald-700" />
          <span>{locale === 'en' ? 'മലയാളം' : 'English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo / Header */}
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-800 text-5xl shadow-xl shadow-emerald-800/10 border-2 border-amber-400">
            🕌
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {t('appName')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            {t('title')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-emerald-950 p-6 text-white text-center border-b border-amber-500/20">
            <h3 className="text-lg font-bold tracking-wide flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5 text-amber-400" />
              <span>{t('login')}</span>
            </h3>
            <p className="text-xs text-emerald-300 mt-1 font-light">
              Enter your credentials to manage community accounts
            </p>
          </div>

          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@org.com"
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/50 transition-all duration-150 cursor-pointer border border-emerald-900/50"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Quick Demo Login Panel */}
          <div className="bg-slate-50 border-t border-slate-200/60 p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Quick Login (Demo Accounts)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account.email)}
                  className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all text-left shadow-sm cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">{account.label}</span>
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
