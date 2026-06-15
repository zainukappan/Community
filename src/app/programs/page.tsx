'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Program, Organization } from '@/lib/db';
import { Plus, Edit2, Trash2, Calendar, FileText, Save, X, ShieldAlert } from 'lucide-react';

export default function ProgramManagement() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  
  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [programOrgId, setProgramOrgId] = useState('');

  const reloadData = () => {
    if (!user) return;
    const allProgs = db.getPrograms();
    const allOrgs = db.getOrganizations().filter(o => o.status === 'active');
    setOrgs(allOrgs);

    if (user.role === 'super_admin') {
      setPrograms(allProgs);
    } else {
      const orgId = user.orgId || '';
      setPrograms(allProgs.filter(p => p.orgId === orgId));
    }
  };

  useEffect(() => {
    reloadData();
  }, [user]);

  if (!user) return null;

  // Access Control Guard (Only Admins can manage programs)
  if (user.role !== 'super_admin' && user.role !== 'org_admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center space-y-4 my-10 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-red-50 text-red-650 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only Organization Administrators and Super Admins are authorized to manage programs.
          </p>
        </div>
      </AppShell>
    );
  }

  const openEdit = (prog: Program) => {
    setEditingProgram(prog);
    setName(prog.name);
    setDescription(prog.description || '');
    setDate(prog.date);
    setStatus(prog.status);
    setProgramOrgId(prog.orgId);
    setIsModalOpen(true);
  };

  const clearForm = () => {
    setEditingProgram(null);
    setName('');
    setDescription('');
    // Prefill with today's date formatted as YYYY-MM-DD
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('upcoming');
    setProgramOrgId(user.role === 'super_admin' ? '' : (user.orgId || ''));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    const targetOrgId = user.role === 'super_admin' ? programOrgId : (user.orgId || '');
    if (!targetOrgId) {
      alert('Please select an Organization');
      return;
    }

    const progData: Program = {
      id: editingProgram ? editingProgram.id : `prog-${Date.now()}`,
      name,
      description,
      date,
      orgId: targetOrgId,
      status
    };

    db.saveProgram(progData);
    setIsModalOpen(false);
    clearForm();
    reloadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this program? All call assignments for this program will be deleted permanently.')) {
      db.deleteProgram(id);
      reloadData();
    }
  };

  // Helper for status styling
  const getStatusBadge = (s: Program['status']) => {
    switch (s) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{t('programs')}</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Create and oversee organizational events, meetings, and volunteer campaigns.</p>
          </div>

          <button
            onClick={() => { clearForm(); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-800/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Program</span>
          </button>
        </div>

        {/* Programs List */}
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.length === 0 ? (
            <div className="sm:col-span-2 p-8 text-center text-slate-400 italic text-xs bg-white rounded-2xl border border-slate-200">
              No programs found. Click 'Create Program' to add your first event.
            </div>
          ) : (
            programs.map((prog) => {
              const progOrg = orgs.find(o => o.id === prog.orgId);
              return (
                <div 
                  key={prog.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-350 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Date & Status */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prog.date}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(prog.status)}`}>
                        {prog.status}
                      </span>
                    </div>

                    {/* Title & Organization Info */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-slate-900 leading-snug">{prog.name}</h4>
                      {user.role === 'super_admin' && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: progOrg?.themeColor }} />
                          <span>{progOrg?.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-normal font-normal min-h-[40px]">
                      {prog.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 pt-4 border-t border-slate-150 mt-4">
                    <button
                      onClick={() => openEdit(prog)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(prog.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 bg-red-50 border border-red-100 text-red-700 hover:bg-red-100 hover:text-red-800 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create/Edit Program Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-emerald-950 text-white p-5 flex justify-between items-center">
                <h3 className="font-bold text-sm">{editingProgram ? 'Edit Program Details' : 'Create New Program'}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-semibold text-slate-750">
                <div>
                  <label className="block text-slate-550 mb-1">Program Name</label>
                  <input 
                    type="text" 
                    required
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Relief Campaign Launch"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-550 mb-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Purpose, agenda or notes..."
                    rows={3}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-550 mb-1">Event Date</label>
                    <input 
                      type="date" 
                      required
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-550 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {user.role === 'super_admin' && (
                  <div>
                    <label className="block text-slate-550 mb-1">Organization Link</label>
                    <select
                      value={programOrgId}
                      required
                      onChange={(e) => setProgramOrgId(e.target.value)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="">Select Organization</option>
                      {orgs.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
