'use client';

import React, { useState, useEffect } from 'react';
import { db, Organization, Profile } from '@/lib/db';
import { useLocale } from '@/lib/locale';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Phone, 
  ChevronLeft, 
  Languages, 
  Compass, 
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Briefcase,
  MapPin
} from 'lucide-react';

export default function PublicDirectory() {
  const { locale, setLocale, t } = useLocale();
  const { user } = useAuth();
  
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [bearers, setBearers] = useState<any[]>([]);
  const [executives, setExecutives] = useState<any[]>([]);

  // Load organizations
  useEffect(() => {
    setOrgs(db.getOrganizations().filter(o => o.status === 'active'));
  }, []);

  // Load bearers and executives when org is selected
  useEffect(() => {
    if (selectedOrgId) {
      const profiles = db.getProfilesByOrg(selectedOrgId);
      const customEntries = db.getOrgDirectoryEntries().filter(e => e.orgId === selectedOrgId);
      const allMembers = db.getMembers();

      const customBearers = customEntries
        .filter(e => e.roleCategory === 'office_bearer')
        .map(e => {
          const m = allMembers.find(mem => mem.id === e.memberId);
          return {
            id: e.id,
            fullName: m ? m.fullName : 'Unknown',
            phone: m ? m.mobileNumber : '',
            roleTitle: e.responsibility
          };
        }).filter(b => b.phone !== '');

      const customExecutives = customEntries
        .filter(e => e.roleCategory === 'executive')
        .map(e => {
          const m = allMembers.find(mem => mem.id === e.memberId);
          return {
            id: e.id,
            fullName: m ? m.fullName : 'Unknown',
            phone: m ? m.mobileNumber : '',
            roleTitle: e.responsibility
          };
        }).filter(e => e.phone !== '');

      const legacyBearers = profiles
        .filter(p => p.role === 'office_bearer')
        .map(p => ({
          id: p.id,
          fullName: p.fullName,
          phone: p.phone || '',
          roleTitle: t('office_bearer')
        }));

      const legacyExecutives = profiles
        .filter(p => p.role === 'executive')
        .map(p => ({
          id: p.id,
          fullName: p.fullName,
          phone: p.phone || '',
          roleTitle: t('executive')
        }));

      setBearers([...legacyBearers, ...customBearers]);
      setExecutives([...legacyExecutives, ...customExecutives]);
    } else {
      setBearers([]);
      setExecutives([]);
    }
  }, [selectedOrgId, locale]);

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);

  // Helper to construct WhatsApp link
  const getWhatsAppLink = (phone: string) => {
    // Strip non-numbers
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Assalamu%20Alaikum`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-emerald-950 text-white border-b border-amber-500/20 shadow-md">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕌</span>
            <span className="font-bold text-base md:text-lg tracking-tight">
              {t('appName')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ml' : 'en')}
              className="flex items-center gap-1 rounded-full bg-emerald-900 border border-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-850 cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5 text-amber-400" />
              <span>{locale === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>

            {/* Admin Console Link */}
            {user ? (
              <Link 
                href="/dashboard"
                className="flex items-center gap-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link 
                href="/auth/login"
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 font-semibold px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>{t('login')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-10">
        
        {!selectedOrgId ? (
          /* Landing Directory List */
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 md:p-10 shadow-xl border border-amber-500/10 text-center space-y-4">
              <span className="inline-block text-4xl">🕌</span>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                {t('welcomeText')}
              </h2>
              <p className="text-emerald-200 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                {t('welcomeSub')}
              </p>
            </div>

            {/* Organizations Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                {t('selectOrg')}
              </h3>

              <div className="grid gap-4 sm:grid-cols-1">
                {orgs.map((org) => {
                  return (
                    <div 
                      key={org.id}
                      onClick={() => setSelectedOrgId(org.id)}
                      style={{ borderLeftColor: org.themeColor }}
                      className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 border-l-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: org.themeColor }}
                          />
                          <h4 className="font-bold text-lg text-slate-800 group-hover:text-emerald-800 transition-colors">
                            {org.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-xl">
                          {org.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors self-end sm:self-center">
                        <span>View Directory</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Organization Details Page */
          selectedOrg && (
            <div className="space-y-8 animate-fadeIn">
              {/* Back Navigation */}
              <button
                onClick={() => setSelectedOrgId(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-850 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Organizations</span>
              </button>

              {/* Organization Profile Banner */}
              <div 
                className="text-white rounded-2xl p-6 md:p-8 shadow-xl space-y-4 relative overflow-hidden"
                style={{ backgroundColor: selectedOrg.themeColor }}
              >
                {/* Decorative Pattern Background */}
                <div className="absolute right-0 bottom-0 opacity-10 text-8xl pointer-events-none translate-x-6 translate-y-6">
                  🕌
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 border border-white/30 text-2xl font-bold">
                      {selectedOrg.name[0]}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                        {selectedOrg.name}
                      </h2>
                      <span className="bg-black/20 text-white/90 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 inline-block">
                        {selectedOrg.slug}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/80 text-xs md:text-sm leading-relaxed max-w-2xl pt-2 border-t border-white/10 font-normal">
                    {selectedOrg.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Office Bearers Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold text-lg text-slate-800">
                    {t('viewOfficeBearers')}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-850 text-xs px-2 py-0.5 rounded-full font-bold">
                    {bearers.length}
                  </span>
                </div>

                {bearers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 pl-1">No office bearers listed.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {bearers.map((bearer) => (
                      <div key={bearer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
                        <div className="flex gap-3 items-start mb-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 font-bold text-lg flex items-center justify-center border border-emerald-200">
                            {bearer.fullName[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm md:text-base truncate">{bearer.fullName}</h4>
                            <p className="text-xs text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                              <Briefcase className="h-3 w-3 shrink-0" />
                              <span>{bearer.roleTitle}</span>
                            </p>
                          </div>
                        </div>

                        {bearer.phone && (
                          <div className="space-y-3 pt-3 border-t border-slate-100">
                            <div className="text-xs text-slate-500 font-mono text-center bg-slate-50 py-1.5 rounded-lg border border-slate-100 select-all">
                              📞 {bearer.phone}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={`tel:${bearer.phone}`}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-850 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 transition-colors border border-emerald-950"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                <span>{t('call')}</span>
                              </a>
                              <a
                                href={getWhatsAppLink(bearer.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 transition-colors"
                              >
                                💬
                                <span>{t('whatsapp')}</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Executive Members Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-bold text-lg text-slate-800">
                    {t('viewExecutives')}
                  </h3>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {executives.length}
                  </span>
                </div>

                {executives.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 pl-1">No executive committee members listed.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {executives.map((exec) => (
                      <div key={exec.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex gap-2.5 items-center min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center border border-slate-200 shrink-0">
                            {exec.fullName[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{exec.fullName}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">{exec.roleTitle}</span>
                          </div>
                        </div>

                        {exec.phone && (
                          <div className="flex gap-1">
                            <a
                              href={`tel:${exec.phone}`}
                              className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={getWhatsAppLink(exec.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                              title="WhatsApp"
                            >
                              💬
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-300 border-t border-amber-500/20 py-8 text-center text-xs space-y-2">
        <p className="font-semibold text-emerald-200">
          🕌 {t('appName')} &copy; 2026
        </p>
        <p className="text-[10px] text-emerald-400 font-light max-w-xs mx-auto px-4 leading-normal">
          Designed for Kerala Muslim Jamaath, Samastha Kerala Sunni Yuvajana Sangham, and Sunni Students' Federation.
        </p>
      </footer>
    </div>
  );
}
