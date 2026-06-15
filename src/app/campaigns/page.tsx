'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Program, Member, Profile, CallAssignment } from '@/lib/db';
import { 
  PhoneCall, Play, Users, RefreshCw, ChevronDown, ChevronUp, 
  Trash, Save, ArrowRight, UserCheck, ShieldAlert, Award, Grid
} from 'lucide-react';

interface CallerDistribution {
  caller: Profile;
  assignedMembers: Member[];
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [callers, setCallers] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Workflow State
  const [selectedProgramId, setSelectedProgramId] = useState('');
  
  // Target Member Filters
  const [filterWard, setFilterWard] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  
  // Selected Callers
  const [selectedCallerIds, setSelectedCallerIds] = useState<string[]>([]);
  
  // Distribution Results
  const [distribution, setDistribution] = useState<CallerDistribution[]>([]);
  const [expandedCallerId, setExpandedCallerId] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (!user) return;
    
    const allProgs = db.getPrograms();
    const allOrgs = db.getOrganizations();
    setOrganizations(allOrgs);

    if (user.role === 'super_admin') {
      setPrograms(allProgs.filter(p => p.status !== 'completed'));
    } else {
      setPrograms(allProgs.filter(p => p.orgId === user.orgId && p.status !== 'completed'));
    }
  }, [user]);

  // Load members and callers when program is selected
  useEffect(() => {
    if (!selectedProgramId) {
      setMembers([]);
      setCallers([]);
      setSelectedCallerIds([]);
      setDistribution([]);
      return;
    }

    const prog = db.getPrograms().find(p => p.id === selectedProgramId);
    if (!prog) return;

    const allMembers = db.getMembersByOrg(prog.orgId).filter(m => m.status === 'active');
    setMembers(allMembers);

    // Callers are profiles in this organization with office_bearer or executive roles
    const allProfiles = db.getProfilesByOrg(prog.orgId);
    const eligibleCallers = allProfiles.filter(p => p.role === 'office_bearer' || p.role === 'executive');
    setCallers(eligibleCallers);
    
    // Auto-select all callers initially as a convenience
    setSelectedCallerIds(eligibleCallers.map(c => c.id));
    setDistribution([]);
  }, [selectedProgramId]);

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
            Only Organization Administrators or Super Admins are authorized to set up and distribute calling campaigns.
          </p>
        </div>
      </AppShell>
    );
  }

  // Get active organization details
  const activeProgram = db.getPrograms().find(p => p.id === selectedProgramId);
  const activeOrg = organizations.find(o => o.id === activeProgram?.orgId);

  // Wards matching selected program's organization members
  const uniqueWards = Array.from(new Set(members.map(m => m.wardUnit).filter(Boolean)));

  // Target Members matching active filters
  const filteredTargetMembers = members.filter(m => {
    const matchesWard = filterWard ? m.wardUnit === filterWard : true;
    const matchesAge = filterAge ? m.ageCategory === filterAge : true;
    const matchesLocation = filterLocation ? m.locationStatus === filterLocation : true;
    return matchesWard && matchesAge && matchesLocation;
  });

  // Toggle caller selection
  const toggleCaller = (callerId: string) => {
    setSelectedCallerIds(prev => 
      prev.includes(callerId) ? prev.filter(id => id !== callerId) : [...prev, callerId]
    );
  };

  // Generate Random Assignment
  const generateRandomAssignment = () => {
    if (filteredTargetMembers.length === 0) {
      alert('No target members match the selected filters.');
      return;
    }
    if (selectedCallerIds.length === 0) {
      alert('Please select at least one caller.');
      return;
    }

    // Shuffle members (Fisher-Yates)
    const shuffledMembers = [...filteredTargetMembers];
    for (let i = shuffledMembers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledMembers[i], shuffledMembers[j]] = [shuffledMembers[j], shuffledMembers[i]];
    }

    // Initialize distribution list
    const activeCallers = callers.filter(c => selectedCallerIds.includes(c.id));
    const dist: CallerDistribution[] = activeCallers.map(caller => ({
      caller,
      assignedMembers: []
    }));

    // Equal distribution
    // E.g. 24 members, 5 callers -> 24 / 5 = 4 members base, 4 members remainder
    shuffledMembers.forEach((member, index) => {
      const callerIndex = index % activeCallers.length;
      dist[callerIndex].assignedMembers.push(member);
    });

    setDistribution(dist);
    // Expand first caller by default to show preview
    if (dist.length > 0) {
      setExpandedCallerId(dist[0].caller.id);
    }
  };

  // Manual Adjustment: move member from one caller to another
  const handleReassignMember = (memberId: string, sourceCallerId: string, targetCallerId: string) => {
    if (sourceCallerId === targetCallerId) return;

    setDistribution(prev => {
      return prev.map(d => {
        // Remove from source
        if (d.caller.id === sourceCallerId) {
          return {
            ...d,
            assignedMembers: d.assignedMembers.filter(m => m.id !== memberId)
          };
        }
        // Add to target
        if (d.caller.id === targetCallerId) {
          const movingMember = members.find(m => m.id === memberId);
          return {
            ...d,
            assignedMembers: movingMember ? [...d.assignedMembers, movingMember] : d.assignedMembers
          };
        }
        return d;
      });
    });
  };

  // Save Campaign
  const handleSaveCampaign = () => {
    if (distribution.length === 0) return;

    const allAssignments: CallAssignment[] = [];
    distribution.forEach(d => {
      d.assignedMembers.forEach(m => {
        allAssignments.push({
          id: `call-assign-${selectedProgramId.slice(-4)}-${m.id.slice(-4)}`,
          programId: selectedProgramId,
          memberId: m.id,
          callerId: d.caller.id,
          status: 'not_called',
          notes: ''
        });
      });
    });

    // Save assignments to Local DB
    db.saveCallAssignments(allAssignments);
    
    // Update program status to active once campaign starts
    if (activeProgram && activeProgram.status === 'upcoming') {
      db.saveProgram({
        ...activeProgram,
        status: 'active'
      });
    }

    alert(`Successfully launched campaign! Created ${allAssignments.length} call tasks across ${distribution.length} callers.`);
    
    // Reset state
    setDistribution([]);
    setSelectedProgramId('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{t('campaigns')}</h2>
          <p className="text-slate-500 text-xs mt-0.5">Initialize calling programs and distribute members equally among executive committee members.</p>
        </div>

        {/* Campaign Settings Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Step 1 & 2: Select Program & Target Filters */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 md:col-span-2">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">1</span>
              <span>Select Program & Filters</span>
            </h3>

            {/* Select Program */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Active/Upcoming Event</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full border border-slate-350 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white text-xs font-semibold"
              >
                <option value="">Choose an Event</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.date})
                  </option>
                ))}
              </select>
            </div>

            {selectedProgramId && (
              <div className="space-y-4 pt-2 animate-fadeIn">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Members Selector
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Ward filter */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Ward/Unit</label>
                    <select
                      value={filterWard}
                      onChange={(e) => setFilterWard(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs font-normal outline-none"
                    >
                      <option value="">All Wards</option>
                      {uniqueWards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age filter */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Age Category</label>
                    <select
                      value={filterAge}
                      onChange={(e) => setFilterAge(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs font-normal outline-none"
                    >
                      <option value="">All Ages</option>
                      <option value="child">{t('child')}</option>
                      <option value="youth">{t('youth')}</option>
                      <option value="middle">{t('middle')}</option>
                      <option value="senior">{t('senior')}</option>
                    </select>
                  </div>

                  {/* Location filter */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">Location Status</label>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs font-normal outline-none"
                    >
                      <option value="">All Locations</option>
                      <option value="local">{t('local')}</option>
                      <option value="expatriate">{t('expatriate')}</option>
                      <option value="studying_outside">{t('studying_outside')}</option>
                      <option value="working_outside">{t('working_outside')}</option>
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-800" />
                    <div>
                      <span className="text-xs text-emerald-950 font-bold block">Selected Calling Audience</span>
                      <span className="text-[10px] text-emerald-800 font-medium">Matching the filter criteria above.</span>
                    </div>
                  </div>
                  <span className="bg-emerald-800 text-white font-mono font-bold px-3 py-1.5 rounded-lg text-sm">
                    {filteredTargetMembers.length} Members
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Select Callers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">2</span>
              <span>Assign Callers</span>
            </h3>

            {!selectedProgramId ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Choose an event first to see eligible callers.</p>
            ) : (
              <div className="space-y-3 pt-1 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  <span>Committee Callers</span>
                  <span>{selectedCallerIds.length} / {callers.length} selected</span>
                </div>

                {callers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No office bearers or executives found in this organization.</p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {callers.map((caller) => (
                      <label 
                        key={caller.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCallerIds.includes(caller.id)}
                            onChange={() => toggleCaller(caller.id)}
                            className="rounded text-emerald-700 h-4 w-4 border-slate-350 focus:ring-emerald-700/20 cursor-pointer"
                          />
                          <span>{caller.fullName}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-500 scale-90 px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase tracking-wide">
                          {caller.role === 'office_bearer' ? 'Bearer' : 'Exec'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generateRandomAssignment}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-800/10 cursor-pointer transition-all mt-4 border border-emerald-950"
                >
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span>{t('generateAssignment')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Distribution Preview & Manual Adjustments */}
        {distribution.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-6 animate-fadeIn">
            
            {/* Header / Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-4 gap-4">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-emerald-800" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Campaign Allocation & Adjustment</h3>
                  <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Verify assignment numbers and swap members manually if required.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={generateRandomAssignment}
                  className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-shuffle</span>
                </button>
                <button
                  onClick={handleSaveCampaign}
                  className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-800/15 cursor-pointer border border-emerald-900"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{t('saveAssignment')}</span>
                </button>
              </div>
            </div>

            {/* Distribution statistics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {distribution.map((d) => (
                <div key={d.caller.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 truncate block">{d.caller.fullName}</span>
                  <span className="text-xl font-extrabold text-emerald-800 block mt-1">{d.assignedMembers.length}</span>
                  <span className="text-[9px] text-slate-450 uppercase font-medium">assigned</span>
                </div>
              ))}
            </div>

            {/* Collapsible lists for adjustments */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider pl-0.5">
                Manual Assignments List
              </h4>

              <div className="divide-y divide-slate-150 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                {distribution.map((d) => {
                  const isExpanded = expandedCallerId === d.caller.id;
                  return (
                    <div key={d.caller.id} className="bg-white">
                      {/* Header block for caller */}
                      <div 
                        onClick={() => setExpandedCallerId(isExpanded ? null : d.caller.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4.5 w-4.5 text-emerald-700" />
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{d.caller.fullName}</span>
                          <span className="bg-emerald-50 text-emerald-850 font-bold px-2 py-0.5 rounded-md text-[9px] border border-emerald-150">
                            {d.assignedMembers.length} Members
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>

                      {/* Caller's assigned member items */}
                      {isExpanded && (
                        <div className="bg-slate-50 p-3 border-t border-slate-150 divide-y divide-slate-150/60 max-h-[300px] overflow-y-auto">
                          {d.assignedMembers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic p-3">No members assigned to this caller.</p>
                          ) : (
                            d.assignedMembers.map((member) => (
                              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-2 gap-2 text-xs font-semibold">
                                <div className="min-w-0">
                                  <span className="text-[9px] font-mono text-slate-400 font-bold block">{member.memberId}</span>
                                  <span className="text-slate-850 block font-bold text-[12px]">{member.fullName}</span>
                                  <span className="text-[9px] text-slate-450 font-medium block">🏡 {member.wardUnit || 'No Ward'} • Location: {t(member.locationStatus as any)}</span>
                                </div>

                                {/* Reassignment selector dropdown */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                  <span className="text-[10px] text-slate-400 uppercase font-medium">Reassign to:</span>
                                  <select
                                    value={d.caller.id}
                                    onChange={(e) => handleReassignMember(member.id, d.caller.id, e.target.value)}
                                    className="bg-white border border-slate-355 rounded-lg px-2.5 py-1.5 outline-none font-normal text-[11px] font-medium text-slate-700"
                                  >
                                    {distribution.map(item => (
                                      <option key={item.caller.id} value={item.caller.id}>
                                        {item.caller.fullName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
