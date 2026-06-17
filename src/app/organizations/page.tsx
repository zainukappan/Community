'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { db, Organization, Profile, Member } from '@/lib/db';
import { Plus, Edit2, ShieldAlert, Key, Users, Settings, FolderOpen, Save, X } from 'lucide-react';

export default function OrganizationsManagement() {
  const { user } = useAuth();
  
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // Modal & Form States
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('#055938');
  const [orgStatus, setOrgStatus] = useState<'active' | 'inactive'>('active');

  // User Form Fields
  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<'org_admin' | 'office_bearer' | 'executive'>('org_admin');
  const [userOrgId, setUserOrgId] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const reloadData = () => {
    setOrgs(db.getOrganizations());
    setProfiles(db.getProfiles());
    setAllMembers(db.getMembers());
  };

  useEffect(() => {
    reloadData();
  }, []);

  if (!user) return null;

  // RBAC Guard
  if (user.role !== 'super_admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center space-y-4 my-10 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-red-50 text-red-650 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only Super Administrators are authorized to view and manage community organizations.
          </p>
        </div>
      </AppShell>
    );
  }

  // Handle Org Save
  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    const orgData: Organization = {
      id: editingOrg ? editingOrg.id : `org-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description,
      themeColor,
      status: orgStatus,
    };

    db.saveOrganization(orgData);
    setIsOrgModalOpen(false);
    setEditingOrg(null);
    clearOrgForm();
    reloadData();
  };

  // Handle User Save
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userFullName || !userOrgId) return;

    const userData: Profile = {
      id: editingUser ? editingUser.id : `user-${Math.random().toString(36).substr(2, 9)}`,
      email: userEmail,
      fullName: userFullName,
      role: userRole,
      orgId: userOrgId,
      phone: userPhone,
      status: 'active'
    };

    db.saveProfile(userData);
    setIsUserModalOpen(false);
    setEditingUser(null);
    clearUserForm();
    reloadData();
  };

  const openOrgEdit = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setSlug(org.slug);
    setDescription(org.description || '');
    setThemeColor(org.themeColor);
    setOrgStatus(org.status);
    setIsOrgModalOpen(true);
  };

  const openUserEdit = (prof: Profile) => {
    setEditingUser(prof);
    setUserEmail(prof.email);
    setUserFullName(prof.fullName);
    setUserRole(prof.role as any);
    setUserOrgId(prof.orgId || '');
    setUserPhone(prof.phone || '');
    setIsUserModalOpen(true);
  };

  const clearOrgForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setThemeColor('#055938');
    setOrgStatus('active');
  };

  const clearUserForm = () => {
    setUserEmail('');
    setUserFullName('');
    setUserRole('org_admin');
    setUserOrgId('');
    setUserPhone('');
    setSelectedMemberId('');
  };

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Organizations & Admins</h2>
            <p className="text-slate-500 text-xs mt-1">Super Admin Panel to provision organizations and administrative credentials.</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => { clearOrgForm(); setEditingOrg(null); setIsOrgModalOpen(true); }}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-800/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Organization</span>
            </button>

            <button
              onClick={() => { clearUserForm(); setEditingUser(null); setIsUserModalOpen(true); }}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md cursor-pointer border border-amber-600/10"
            >
              <Key className="h-4 w-4" />
              <span>Create User Admin</span>
            </button>
          </div>
        </div>

        {/* Organizations Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            Registered Organizations ({orgs.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => {
              const orgUsers = profiles.filter(p => p.orgId === org.id);
              return (
                <div 
                  key={org.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: org.themeColor }} />
                        <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{org.name}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        org.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {org.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-normal font-normal">
                      {org.description || 'No description added yet.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>{orgUsers.length} Users</span>
                      </span>
                      <span className="font-mono text-slate-400">theme: {org.themeColor}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openOrgEdit(org)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Admins Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            Assigned User Roles & Accounts ({profiles.length})
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-normal">
                  {profiles.map((prof) => {
                    const profOrg = orgs.find(o => o.id === prof.orgId);
                    return (
                      <tr key={prof.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800">{prof.fullName}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">{prof.email}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {prof.orgId ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: profOrg?.themeColor || '#666' }} />
                              <span className="truncate max-w-[120px]">{profOrg?.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No Organization</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap font-semibold">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide ${
                            prof.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            prof.role === 'org_admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {prof.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-500">{prof.phone || '---'}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={() => openUserEdit(prof)}
                            className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Organization Creation/Edit Modal */}
        {isOrgModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-emerald-950 text-white p-5 flex justify-between items-center border-b border-amber-500/10">
                <h3 className="font-bold text-sm">{editingOrg ? 'Edit Organization' : 'Create New Organization'}</h3>
                <button 
                  onClick={() => setIsOrgModalOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOrg} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    required
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingOrg) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    placeholder="e.g. Kerala Muslim Jamaath"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Slug (Identifier)</label>
                  <input 
                    type="text" 
                    required
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. kerala-muslim-jamaath"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description about the organization objectives..."
                    rows={3}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Theme Color</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color" 
                        value={themeColor} 
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-10 h-10 border border-slate-350 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={themeColor} 
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full border border-slate-300 bg-slate-50 rounded-xl p-2.5 outline-none font-mono font-normal text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Status</label>
                    <select
                      value={orgStatus}
                      onChange={(e) => setOrgStatus(e.target.value as any)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsOrgModalOpen(false)}
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

        {/* User Credential Creation/Edit Modal */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-emerald-950 text-white p-5 flex justify-between items-center border-b border-amber-500/10">
                <h3 className="font-bold text-sm">{editingUser ? 'Edit User Admin' : 'Create User Credentials'}</h3>
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-500 mb-1">Organization Link</label>
                  <select
                    value={userOrgId}
                    required
                    onChange={(e) => {
                      setUserOrgId(e.target.value);
                      setSelectedMemberId('');
                    }}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  >
                    <option value="">Select Org</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Select Member (Optional pre-fill)</label>
                  <select
                    value={selectedMemberId}
                    disabled={!userOrgId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMemberId(val);
                      const member = allMembers.find(m => m.id === val);
                      if (member) {
                        setUserFullName(member.fullName);
                        setUserPhone(member.mobileNumber);
                      }
                    }}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 font-normal"
                  >
                    <option value="">-- Choose Member --</option>
                    {allMembers.filter(m => m.orgId === userOrgId).map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} ({m.memberId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={userFullName} 
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="e.g. K.P. Jamal"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={userEmail} 
                    disabled={editingUser !== null} // email immutable in mock
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. jamal@org.com"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white disabled:bg-slate-200 disabled:text-slate-500 font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Assigned Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  >
                    <option value="org_admin">Organization Admin</option>
                    <option value="office_bearer">Office Bearer (Caller)</option>
                    <option value="executive">Executive Member (Caller)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Contact Phone</label>
                  <input 
                    type="text" 
                    value={userPhone} 
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsUserModalOpen(false)}
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
