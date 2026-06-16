'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Organization, Member, Program, CallAssignment, Profile } from '@/lib/db';
import { 
  FileSpreadsheet, Download, ShieldAlert, BarChart3, 
  Users, CheckCircle2, Calendar, Layers 
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [assignments, setAssignments] = useState<CallAssignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  const [selectedReportType, setSelectedReportType] = useState<'org' | 'member' | 'program' | 'calling'>('member');
  const [selectedProgId, setSelectedProgId] = useState('');

  useEffect(() => {
    if (!user) return;

    const allOrgs = db.getOrganizations();
    const allMembers = db.getMembers();
    const allProgs = db.getPrograms();
    const allAssigns = db.getCallAssignments();
    const allProfiles = db.getProfiles();

    setProfiles(allProfiles);

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
      
      const orgProgIds = allProgs.filter(p => p.orgId === orgId).map(p => p.id);
      setAssignments(allAssigns.filter(a => orgProgIds.includes(a.programId)));
    }
  }, [user]);

  // Set default program for calling report
  useEffect(() => {
    if (programs.length > 0 && !selectedProgId) {
      setSelectedProgId(programs[0].id);
    }
  }, [programs, selectedProgId]);

  if (!user) return null;

  // RBAC Guard
  if (user.role !== 'super_admin' && user.role !== 'org_admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center space-y-4 my-10 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-red-50 text-red-650 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only administrators are authorized to generate and download system reports.
          </p>
        </div>
      </AppShell>
    );
  }

  // Calculate demographics breakdown
  const ageStats = {
    child: members.filter(m => m.ageCategory === 'child').length,
    youth: members.filter(m => m.ageCategory === 'youth').length,
    middle: members.filter(m => m.ageCategory === 'middle').length,
    senior: members.filter(m => m.ageCategory === 'senior').length,
  };

  const locStats = {
    local: members.filter(m => m.locationStatus === 'local').length,
    expatriate: members.filter(m => m.locationStatus === 'expatriate').length,
    studying_outside: members.filter(m => m.locationStatus === 'studying_outside').length,
    working_outside: members.filter(m => m.locationStatus === 'working_outside').length,
  };

  const bloodGroups = Array.from(new Set(members.map(m => m.bloodGroup).filter(Boolean)));
  const bloodStats: { [key: string]: number } = {};
  bloodGroups.forEach(bg => {
    bloodStats[bg!] = members.filter(m => m.bloodGroup === bg).length;
  });

  // Export CSV Functions
  const exportOrgReport = () => {
    const headers = 'Organization ID,Name,Slug,Description,Status,Theme Color,Members Count\n';
    const rows = orgs.map(o => {
      const count = members.filter(m => m.orgId === o.id).length;
      return `"${o.id}","${o.name}","${o.slug}","${o.description || ''}","${o.status}","${o.themeColor}",${count}`;
    }).join('\n');

    downloadCSV(headers + rows, 'organization_report');
  };

  const exportMemberReport = () => {
    const headers = 'Member ID,Full Name,Mobile,WhatsApp,Address,Ward/Unit,Age Category,Occupation,Blood Group,Location Status,Status,Organization\n';
    const rows = members.map(m => {
      const orgName = orgs.find(o => o.id === m.orgId)?.name || '';
      return `"${m.memberId}","${m.fullName}","${m.mobileNumber}","${m.whatsappNumber || ''}","${m.address || ''}","${m.wardUnit || ''}","${m.ageCategory}","${m.occupation || ''}","${m.bloodGroup || ''}","${m.locationStatus}","${m.status}","${orgName}"`;
    }).join('\n');

    downloadCSV(headers + rows, 'member_demographics_report');
  };

  const exportProgramReport = () => {
    const headers = 'Program ID,Name,Description,Date,Status,Organization,Total Assignments,Completed,Confirmed\n';
    const rows = programs.map(p => {
      const orgName = orgs.find(o => o.id === p.orgId)?.name || '';
      const assigns = assignments.filter(a => a.programId === p.id);
      const done = assigns.filter(a => a.status !== 'not_called').length;
      const yes = assigns.filter(a => a.status === 'confirmed').length;
      return `"${p.id}","${p.name}","${p.description || ''}","${p.date}","${p.status}","${orgName}",${assigns.length},${done},${yes}`;
    }).join('\n');

    downloadCSV(headers + rows, 'program_campaigns_report');
  };

  const exportCallingReport = () => {
    const prog = programs.find(p => p.id === selectedProgId);
    if (!prog) return;

    const headers = 'Assignment ID,Member Name,Member ID,Mobile,Caller,Call Status,Notes\n';
    const assigns = assignments.filter(a => a.programId === selectedProgId);
    const rows = assigns.map(a => {
      const mem = db.getMembers().find(m => m.id === a.memberId);
      const caller = profiles.find(p => p.id === a.callerId);
      return `"${a.id}","${mem?.fullName || ''}","${mem?.memberId || ''}","${mem?.mobileNumber || ''}","${caller?.fullName || ''}","${a.status}","${a.notes || ''}"`;
    }).join('\n');

    downloadCSV(headers + rows, `calling_report_${prog.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${Date.now()}.csv`);
    link.click();
  };

  // Get campaign stats for calling report
  const activeProg = programs.find(p => p.id === selectedProgId);
  const progAssignments = assignments.filter(a => a.programId === selectedProgId);
  const callersAssigned = Array.from(new Set(progAssignments.map(a => a.callerId)));

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{t('reports')}</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Export demographic datasets and caller feedback logs.</p>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold text-slate-500 gap-2">
          {([
            { id: 'member', label: 'Members & Demographics', icon: Users },
            { id: 'program', label: 'Programs & Campaigns', icon: Calendar },
            { id: 'calling', label: 'Call Feedback Report', icon: BarChart3 },
            { id: 'org', label: 'Organizations Summary', icon: Layers, roles: ['super_admin'] }
          ] as { id: typeof selectedReportType, label: string, icon: any, roles?: string[] }[])
            .filter(tab => !tab.roles || tab.roles.includes(user.role))
            .map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedReportType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReportType(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isSelected 
                      ? 'border-emerald-800 text-emerald-800 font-extrabold'
                      : 'border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>

        {/* Report Content Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Member Demographics Report */}
          {selectedReportType === 'member' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Members & Demographics</h3>
                <button
                  onClick={exportMemberReport}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Member List</span>
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {/* Age categories card */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1.5">Age Demographics</h4>
                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between"><span>Youth (15 - 35)</span><span className="font-bold text-slate-800">{ageStats.youth}</span></div>
                    <div className="flex justify-between"><span>Middle Age (36 - 60)</span><span className="font-bold text-slate-800">{ageStats.middle}</span></div>
                    <div className="flex justify-between"><span>Senior Citizens (60+)</span><span className="font-bold text-slate-800">{ageStats.senior}</span></div>
                    <div className="flex justify-between"><span>Children (Under 15)</span><span className="font-bold text-slate-800">{ageStats.child}</span></div>
                  </div>
                </div>

                {/* Location status card */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1.5">Location Registry</h4>
                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between"><span>Resident (Local)</span><span className="font-bold text-slate-800">{locStats.local}</span></div>
                    <div className="flex justify-between"><span>Expatriate (Gulf/Abroad)</span><span className="font-bold text-slate-800">{locStats.expatriate}</span></div>
                    <div className="flex justify-between"><span>Studying Outside</span><span className="font-bold text-slate-800">{locStats.studying_outside}</span></div>
                    <div className="flex justify-between"><span>Working Outside</span><span className="font-bold text-slate-800">{locStats.working_outside}</span></div>
                  </div>
                </div>

                {/* Blood Group registry card */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1.5">Blood Groups</h4>
                  <div className="space-y-2 text-xs font-semibold text-slate-600 max-h-[140px] overflow-y-auto pr-1">
                    {Object.keys(bloodStats).map(bg => (
                      <div key={bg} className="flex justify-between">
                        <span className="text-red-650 font-bold">{bg} Group</span>
                        <span className="font-bold text-slate-800">{bloodStats[bg]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Program campaigns report */}
          {selectedReportType === 'program' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Programs & Campaign Progress</h3>
                <button
                  onClick={exportProgramReport}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Program Summary</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                  <thead className="bg-slate-50 text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Event Name</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-center">Assignments</th>
                      <th className="px-6 py-3.5 text-center">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-normal">
                    {programs.map(p => {
                      const assigns = assignments.filter(a => a.programId === p.id);
                      const done = assigns.filter(a => a.status !== 'not_called').length;
                      const percent = assigns.length > 0 ? Math.round((done / assigns.length) * 100) : 0;
                      return (
                        <tr key={p.id}>
                          <td className="px-6 py-3.5 font-bold text-slate-800">{p.name}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">{p.date}</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              p.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{assigns.length} tasks</td>
                          <td className="px-6 py-3.5 text-center font-bold text-emerald-700">{percent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Call feedback report */}
          {selectedReportType === 'calling' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <h3 className="font-bold text-slate-800 text-sm">Campaign Call Logs Feedback</h3>
                
                {programs.length > 0 && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={selectedProgId}
                      onChange={(e) => setSelectedProgId(e.target.value)}
                      className="border border-slate-300 bg-white rounded-xl px-3 py-2 text-xs font-bold flex-1 sm:w-48 outline-none"
                    >
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={exportCallingReport}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Logs</span>
                    </button>
                  </div>
                )}
              </div>

              {!activeProg ? (
                <p className="text-xs text-slate-400 italic">No program campaigns found.</p>
              ) : (
                <div className="space-y-4">
                  {/* Campaign stats overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Event Target</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">{activeProg.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Callers Enrolled</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">{callersAssigned.length} Callers</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tasks</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">{progAssignments.length} Members</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Confirmed (Yes)</span>
                      <span className="text-sm font-bold text-emerald-800 block mt-0.5">
                        {progAssignments.filter(a => a.status === 'confirmed').length} Members
                      </span>
                    </div>
                  </div>

                  {/* Assignments registry table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                      <thead className="bg-slate-50 text-slate-500 uppercase">
                        <tr>
                          <th className="px-6 py-3.5">Member Name</th>
                          <th className="px-6 py-3.5">Contact</th>
                          <th className="px-6 py-3.5">Assigned Caller</th>
                          <th className="px-6 py-3.5">Call Status</th>
                          <th className="px-6 py-3.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700 font-normal">
                        {progAssignments.map(a => {
                          const mem = db.getMembers().find(m => m.id === a.memberId);
                          const caller = profiles.find(p => p.id === a.callerId);
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-3 font-bold text-slate-800">{mem?.fullName}</td>
                              <td className="px-6 py-3 font-mono text-slate-500">{mem?.mobileNumber}</td>
                              <td className="px-6 py-3 font-medium text-slate-800">{caller?.fullName}</td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-850' :
                                  a.status === 'not_attending' ? 'bg-red-100 text-red-800' :
                                  a.status === 'not_called' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t(a.status as any)}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-slate-500 italic max-w-xs truncate">{a.notes || '---'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organizations Summary */}
          {selectedReportType === 'org' && user.role === 'super_admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Organizations Directory Registry</h3>
                <button
                  onClick={exportOrgReport}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Org Summary</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                  <thead className="bg-slate-50 text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Org Name</th>
                      <th className="px-6 py-3.5">Slug</th>
                      <th className="px-6 py-3.5 text-center">Total Members</th>
                      <th className="px-6 py-3.5 text-center">Active Campaigns</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-normal">
                    {orgs.map(o => {
                      const count = members.filter(m => m.orgId === o.id).length;
                      const activeCamCount = programs.filter(p => p.orgId === o.id && p.status === 'active').length;
                      return (
                        <tr key={o.id}>
                          <td className="px-6 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: o.themeColor }} />
                            <span>{o.name}</span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">{o.slug}</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{count} Members</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800">{activeCamCount} Active</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </AppShell>
  );
}
