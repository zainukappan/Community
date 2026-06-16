'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Organization, Member, Program, CallAssignment, useLocalDBSync } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  Calendar, 
  Globe, 
  Activity,
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const syncVersion = useLocalDBSync();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [assignments, setAssignments] = useState<CallAssignment[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const allOrgs = db.getOrganizations();
    const allMembers = db.getMembers();
    const allProgs = db.getPrograms();
    const allAssigns = db.getCallAssignments();

    if (user.role === 'super_admin') {
      setOrgs(allOrgs);
      setMembers(allMembers);
      setPrograms(allProgs);
      setAssignments(allAssigns);
    } else {
      const orgId = user.orgId || '';
      setOrgs(allOrgs.filter(o => o.id === orgId));
      setMembers(allMembers.filter(m => m.orgId === orgId));
      setPrograms(allProgs.filter(p => p.orgId === orgId));
      
      // Filter assignments by programs belonging to this organization
      const orgProgIds = allProgs.filter(p => p.orgId === orgId).map(p => p.id);
      setAssignments(allAssigns.filter(a => orgProgIds.includes(a.programId)));
    }
  }, [user, syncVersion]);

  if (!user) return null;

  // Compute stats
  const totalOrgs = orgs.length;
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const expatriates = members.filter(m => m.locationStatus === 'expatriate').length;
  const totalPrograms = programs.length;
  const upcomingPrograms = programs.filter(p => p.status === 'upcoming').length;

  const totalAssignedCalls = assignments.length;
  const completedCalls = assignments.filter(a => a.status !== 'not_called').length;
  const confirmedAttendance = assignments.filter(a => a.status === 'confirmed').length;

  // Percentage calculations
  const callCompletionRate = totalAssignedCalls > 0 
    ? Math.round((completedCalls / totalAssignedCalls) * 100) 
    : 0;
  
  const attendanceRate = completedCalls > 0
    ? Math.round((confirmedAttendance / completedCalls) * 100)
    : 0;

  // Caller specific stats
  const myAssignments = assignments.filter(a => a.callerId === user.id);
  const myTotalCalls = myAssignments.length;
  const myCompletedCalls = myAssignments.filter(a => a.status !== 'not_called').length;
  const myConfirmedCalls = myAssignments.filter(a => a.status === 'confirmed').length;
  const myPendingCalls = myTotalCalls - myCompletedCalls;
  const myCompletionRate = myTotalCalls > 0 
    ? Math.round((myCompletedCalls / myTotalCalls) * 100) 
    : 0;

  // Call status breakdown
  const statusCounts = {
    not_called: assignments.filter(a => a.status === 'not_called').length,
    called: assignments.filter(a => a.status === 'called').length,
    confirmed: assignments.filter(a => a.status === 'confirmed').length,
    not_attending: assignments.filter(a => a.status === 'not_attending').length,
    no_response: assignments.filter(a => a.status === 'no_response').length,
    call_back_later: assignments.filter(a => a.status === 'call_back_later').length,
  };

  // Location status breakdown
  const locationCounts = {
    local: members.filter(m => m.locationStatus === 'local').length,
    expatriate: members.filter(m => m.locationStatus === 'expatriate').length,
    studying_outside: members.filter(m => m.locationStatus === 'studying_outside').length,
    working_outside: members.filter(m => m.locationStatus === 'working_outside').length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-amber-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              Assalamu Alaikum, {user.fullName}!
            </h2>
            <p className="text-emerald-200 text-xs md:text-sm mt-1">
              {user.role === 'super_admin' 
                ? 'Super Admin Dashboard - managing all organizations.'
                : `Dashboard for ${orgs[0]?.name || 'Organization'}`}
            </p>
          </div>
          <span className="bg-amber-500 text-emerald-950 font-bold px-3 py-1 rounded-lg text-xs tracking-wider uppercase">
            {t(user.role as any)}
          </span>
        </div>

        {/* Caller Dashboard Summary Panel */}
        {(user.role === 'office_bearer' || user.role === 'executive') && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 hover:border-emerald-200 transition-all space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Inbox className="h-5 w-5 text-emerald-600" />
                <span>My Calling Campaign Assignments</span>
              </h3>
              <Link 
                href="/calling"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/50"
              >
                <span>Launch Calling Panel</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {myTotalCalls === 0 ? (
              <p className="text-xs text-slate-400 italic">You currently do not have any active members assigned for calling campaigns.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block">Total Assigned</span>
                  <span className="text-2xl font-bold text-slate-800 block mt-1">{myTotalCalls}</span>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                  <span className="text-xs font-medium text-amber-700 block">Pending Calls</span>
                  <span className="text-2xl font-bold text-amber-800 block mt-1">{myPendingCalls}</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 block">Completed</span>
                  <span className="text-2xl font-bold text-emerald-800 block mt-1">{myCompletedCalls}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                  <span className="text-xs font-medium text-blue-700 block">Confirmed Yes</span>
                  <span className="text-2xl font-bold text-blue-800 block mt-1">{myConfirmedCalls}</span>
                </div>
              </div>
            )}

            {myTotalCalls > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>My Campaign Progress</span>
                  <span>{myCompletionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${myCompletionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {user.role === 'super_admin' ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Organizations</span>
                <span className="text-lg md:text-2xl font-extrabold text-slate-800 block">{totalOrgs}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Programs</span>
                <span className="text-lg md:text-2xl font-extrabold text-slate-800 block">{totalPrograms}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Members</span>
              <span className="text-lg md:text-2xl font-extrabold text-slate-800 block">{totalMembers}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Expatriates</span>
              <span className="text-lg md:text-2xl font-extrabold text-slate-800 block">{expatriates}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Attendance Yes</span>
              <span className="text-lg md:text-2xl font-extrabold text-slate-800 block">{confirmedAttendance}</span>
            </div>
          </div>
        </div>

        {/* Calling Progress Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-emerald-700" />
              <span>Event Call Campaigns Completion</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {completedCalls} / {totalAssignedCalls} Calls
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Overall Completion Rate</span>
              <span>{callCompletionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${callCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Mini campaign details */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2 border border-slate-100 rounded-xl">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Response Rate</span>
              <span className="text-sm font-bold text-slate-700 block mt-0.5">
                {totalAssignedCalls > 0 ? Math.round(((completedCalls - statusCounts.no_response) / totalAssignedCalls) * 100) : 0}%
              </span>
            </div>
            <div className="p-2 border border-slate-100 rounded-xl">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Attendance Rate</span>
              <span className="text-sm font-bold text-slate-700 block mt-0.5">{attendanceRate}%</span>
            </div>
            <div className="p-2 border border-slate-100 rounded-xl">
              <span className="text-slate-400 block text-[9px] font-bold uppercase">Pending Calls</span>
              <span className="text-sm font-bold text-amber-600 block mt-0.5">{statusCounts.not_called}</span>
            </div>
          </div>
        </div>

        {/* Charts & Distributions */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Attendance Status Chart (Custom SVG Donut) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-700" />
              <span>Call Campaign Responses</span>
            </h3>

            {totalAssignedCalls === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-xs text-slate-400 italic">
                No active campaign call logs found.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* SVG Donut */}
                <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                    
                    {/* Confirmed Circle */}
                    {statusCounts.confirmed > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" 
                        strokeDasharray={`${(statusCounts.confirmed / totalAssignedCalls) * 100} ${100 - (statusCounts.confirmed / totalAssignedCalls) * 100}`}
                        strokeDashoffset="0"
                      />
                    )}

                    {/* Not Attending Circle */}
                    {statusCounts.not_attending > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" 
                        strokeDasharray={`${(statusCounts.not_attending / totalAssignedCalls) * 100} ${100 - (statusCounts.not_attending / totalAssignedCalls) * 100}`}
                        strokeDashoffset={`-${(statusCounts.confirmed / totalAssignedCalls) * 100}`}
                      />
                    )}

                    {/* Call Back Later / No Response Circle */}
                    {(statusCounts.call_back_later + statusCounts.no_response) > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" 
                        strokeDasharray={`${((statusCounts.call_back_later + statusCounts.no_response) / totalAssignedCalls) * 100} ${100 - ((statusCounts.call_back_later + statusCounts.no_response) / totalAssignedCalls) * 100}`}
                        strokeDashoffset={`-${((statusCounts.confirmed + statusCounts.not_attending) / totalAssignedCalls) * 100}`}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-slate-800">{completedCalls}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Called</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 w-full text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Confirmed (Yes)</span>
                    </div>
                    <span className="font-bold text-slate-800">{statusCounts.confirmed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-slate-600">Not Attending</span>
                    </div>
                    <span className="font-bold text-slate-800">{statusCounts.not_attending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Pending / Call Back</span>
                    </div>
                    <span className="font-bold text-slate-800">{statusCounts.call_back_later + statusCounts.no_response}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 font-bold">
                    <span className="text-slate-500">Uncalled Tasks</span>
                    <span className="text-slate-800">{statusCounts.not_called}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Status Breakdown (Progress bars) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Globe className="h-4.5 w-4.5 text-emerald-700" />
              <span>Members Location Status</span>
            </h3>

            {totalMembers === 0 ? (
              <p className="text-xs text-slate-400 italic">No members found.</p>
            ) : (
              <div className="space-y-3">
                {/* Local */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Local (Resident)</span>
                    <span className="font-bold text-slate-800">{locationCounts.local} ({Math.round((locationCounts.local / totalMembers) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full" 
                      style={{ width: `${(locationCounts.local / totalMembers) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Expatriate */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Expatriate (Gulf/Abroad)</span>
                    <span className="font-bold text-slate-800">{locationCounts.expatriate} ({Math.round((locationCounts.expatriate / totalMembers) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${(locationCounts.expatriate / totalMembers) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Studying Outside */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Studying Outside</span>
                    <span className="font-bold text-slate-800">{locationCounts.studying_outside} ({Math.round((locationCounts.studying_outside / totalMembers) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${(locationCounts.studying_outside / totalMembers) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Working Outside */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Working Outside</span>
                    <span className="font-bold text-slate-800">{locationCounts.working_outside} ({Math.round((locationCounts.working_outside / totalMembers) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${(locationCounts.working_outside / totalMembers) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
