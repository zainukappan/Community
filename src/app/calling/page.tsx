'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Program, Member, CallAssignment } from '@/lib/db';
import { 
  Phone, Search, ChevronRight, CheckCircle2, AlertCircle, Save, 
  HelpCircle, MessageSquare, Clipboard, Loader2, PhoneCall
} from 'lucide-react';

interface AssignedMemberTask {
  assignmentId: string;
  member: Member;
  status: CallAssignment['status'];
  notes: string;
}

export default function CallingPage() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [tasks, setTasks] = useState<AssignedMemberTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Editing Note State (stores the active note being typed for each assignment)
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user) return;

    // Load active campaigns for this caller
    const allAssigns = db.getCallAssignmentsByCaller(user.id);
    const assignedProgIds = Array.from(new Set(allAssigns.map(a => a.programId)));
    
    const allProgs = db.getPrograms();
    const activeProgs = allProgs.filter(p => assignedProgIds.includes(p.id));
    setPrograms(activeProgs);

    if (activeProgs.length > 0) {
      setSelectedProgramId(activeProgs[0].id);
    }
  }, [user]);

  // Load tasks when program is selected
  useEffect(() => {
    if (!selectedProgramId || !user) {
      setTasks([]);
      return;
    }

    const allAssigns = db.getCallAssignmentsByProgram(selectedProgramId);
    const callerAssigns = allAssigns.filter(a => a.callerId === user.id);
    
    const allMembers = db.getMembers();
    
    const taskList: AssignedMemberTask[] = callerAssigns.map(assign => {
      const member = allMembers.find(m => m.id === assign.memberId);
      return {
        assignmentId: assign.id,
        member: member!,
        status: assign.status,
        notes: assign.notes || ''
      };
    }).filter(t => t.member !== undefined); // sanity filter

    setTasks(taskList);

    // Initialize editing notes dictionary
    const notesMap: { [key: string]: string } = {};
    taskList.forEach(t => {
      notesMap[t.assignmentId] = t.notes;
    });
    setEditingNotes(notesMap);
  }, [selectedProgramId, user]);

  if (!user) return null;

  const handleStatusChange = (assignId: string, newStatus: CallAssignment['status']) => {
    const activeNote = editingNotes[assignId] || '';
    db.updateCallAssignmentStatus(assignId, newStatus, activeNote);
    
    // Update local state
    setTasks(prev => prev.map(t => 
      t.assignmentId === assignId ? { ...t, status: newStatus } : t
    ));
  };

  const handleSaveNotes = (assignId: string) => {
    const activeNote = editingNotes[assignId] || '';
    const currentTask = tasks.find(t => t.assignmentId === assignId);
    if (!currentTask) return;

    db.updateCallAssignmentStatus(assignId, currentTask.status, activeNote);
    alert('Call status notes saved successfully.');
  };

  const handleNoteInputChange = (assignId: string, val: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [assignId]: val
    }));
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=Assalamu%2520Alaikum`;
  };

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.member.wardUnit && t.member.wardUnit.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus ? t.status === filterStatus : true;

    return matchesSearch && matchesStatus;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status !== 'not_called').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status badges color map
  const statusColors = {
    not_called: 'bg-slate-100 text-slate-700 border-slate-200',
    called: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    not_attending: 'bg-red-100 text-red-800 border-red-200',
    no_response: 'bg-amber-100 text-amber-800 border-amber-200',
    call_back_later: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{t('myCalls')}</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Follow up with assigned members and register attendance feedback.</p>
          </div>

          {/* Program Select */}
          {programs.length > 0 && (
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="border border-slate-300 bg-white rounded-xl px-4 py-2.5 outline-none focus:border-emerald-700 text-xs font-bold w-full sm:max-w-xs cursor-pointer shadow-sm"
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {totalTasks === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-xs bg-white rounded-2xl border border-slate-200 shadow-sm">
            No active calling campaigns assigned to you.
          </div>
        ) : (
          <>
            {/* Caller Progress Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Personal Campaign Completion Progress</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {completedTasks} / {totalTasks} Calls Done ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assigned member by name, ID or ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-normal outline-none focus:border-emerald-700 focus:bg-white transition-all"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none w-full sm:w-48"
              >
                <option value="">All Call Statuses</option>
                <option value="not_called">Not Called</option>
                <option value="called">Called</option>
                <option value="confirmed">Confirmed</option>
                <option value="not_attending">Not Attending</option>
                <option value="no_response">No Response</option>
                <option value="call_back_later">Call Back Later</option>
              </select>
            </div>

            {/* Assignments Grid */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 italic text-xs">
                  No assigned members match your query.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const m = task.member;
                  const assignId = task.assignmentId;
                  
                  return (
                    <div 
                      key={assignId}
                      className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 flex flex-col justify-between ${
                        task.status === 'confirmed' ? 'border-emerald-100 hover:border-emerald-250 shadow-emerald-50/20' :
                        task.status === 'not_attending' ? 'border-red-100 hover:border-red-200' :
                        task.status === 'not_called' ? 'border-slate-200' : 'border-slate-250'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Member Meta Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {m.memberId}
                            </span>
                            <h4 className="font-extrabold text-sm md:text-base text-slate-900 pt-1.5">{m.fullName}</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              🏡 {m.wardUnit || 'No Ward'} • Location: <span className="text-emerald-850 font-bold">{t(m.locationStatus as any)}</span>
                            </p>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${statusColors[task.status]}`}>
                            {t(task.status as any)}
                          </span>
                        </div>

                        {/* Quick Action Dial Buttons */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <a 
                            href={`tel:${m.mobileNumber}`}
                            onClick={() => handleStatusChange(assignId, 'called')}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-850 hover:bg-emerald-950 text-white font-bold text-xs py-2.5 transition-colors shadow-sm"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>{t('call')}</span>
                          </a>
                          <a 
                            href={getWhatsAppLink(m.mobileNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleStatusChange(assignId, 'called')}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 transition-colors shadow-sm"
                          >
                            💬
                            <span>{t('whatsapp')}</span>
                          </a>
                        </div>

                        {/* Call Feedback Status Dropdown Group */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Update Call Status</label>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-slate-700">
                            {([
                              { s: 'confirmed', label: 'Confirmed' },
                              { s: 'not_attending', label: 'Not Attending' },
                              { s: 'call_back_later', label: 'Call Back' },
                              { s: 'no_response', label: 'No Response' },
                              { s: 'called', label: 'Other' },
                              { s: 'not_called', label: 'Reset' }
                            ] as { s: CallAssignment['status'], label: string }[]).map((btn) => {
                              const isSelected = task.status === btn.s;
                              return (
                                <button
                                  key={btn.s}
                                  type="button"
                                  onClick={() => handleStatusChange(assignId, btn.s)}
                                  className={`py-1.5 border rounded-lg transition-all text-center cursor-pointer ${
                                    isSelected 
                                      ? 'bg-emerald-800 border-emerald-900 text-white shadow-sm'
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notes input */}
                        <div className="space-y-1 pt-1">
                          <label htmlFor={`notes-${assignId}`} className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Call Notes</label>
                          <div className="relative">
                            <input
                              id={`notes-${assignId}`}
                              type="text"
                              value={editingNotes[assignId] || ''}
                              onChange={(e) => handleNoteInputChange(assignId, e.target.value)}
                              placeholder="e.g. Will attend, Abroad, Busy..."
                              className="w-full bg-slate-50 border border-slate-350 rounded-xl py-2 pl-3 pr-10 text-xs font-normal outline-none focus:border-emerald-700 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNotes(assignId)}
                              className="absolute right-2 top-1.5 p-1 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Save Notes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
