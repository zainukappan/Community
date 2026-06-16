'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/lib/locale';
import { db, Member, Organization } from '@/lib/db';
import { 
  Plus, Search, Edit2, Trash2, Filter, 
  Download, Upload, Save, X, Phone, UserCheck, ShieldAlert 
} from 'lucide-react';

export default function MemberManagement() {
  const { user } = useAuth();
  const { t } = useLocale();

  const [members, setMembers] = useState<Member[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [wardUnit, setWardUnit] = useState('');
  const [ageCategory, setAgeCategory] = useState<'child' | 'youth' | 'middle' | 'senior'>('youth');
  const [occupation, setOccupation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [memberOrgId, setMemberOrgId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [locationStatus, setLocationStatus] = useState<'local' | 'expatriate' | 'studying_outside' | 'working_outside'>('local');

  // Import CSV text state
  const [csvText, setCsvText] = useState('');
  const [importError, setImportError] = useState('');

  const reloadData = () => {
    if (!user) return;
    const allMembers = db.getMembers();
    const allOrgs = db.getOrganizations().filter(o => o.status === 'active');
    setOrgs(allOrgs);

    if (user.role === 'super_admin') {
      setMembers(allMembers);
    } else {
      const orgId = user.orgId || '';
      setMembers(allMembers.filter(m => m.orgId === orgId));
      setFilterOrg(orgId); // Lock filter for non-superadmin
    }
  };

  useEffect(() => {
    reloadData();
  }, [user]);

  if (!user) return null;

  // Form prefill for edit
  const openEdit = (member: Member) => {
    setEditingMember(member);
    setFullName(member.fullName);
    setMemberId(member.memberId);
    setMobileNumber(member.mobileNumber);
    setWhatsappNumber(member.whatsappNumber || '');
    setAddress(member.address || '');
    setWardUnit(member.wardUnit || '');
    setAgeCategory(member.ageCategory);
    setOccupation(member.occupation || '');
    setBloodGroup(member.bloodGroup || '');
    setMemberOrgId(member.orgId);
    setStatus(member.status);
    setLocationStatus(member.locationStatus);
    setIsModalOpen(true);
  };

  // Clear Form
  const clearForm = () => {
    setEditingMember(null);
    setFullName('');
    // Auto-generate a dummy member ID for convenience if adding
    setMemberId(`${user.role === 'super_admin' ? 'ORG' : (orgs.find(o => o.id === user.orgId)?.slug.substring(0, 3).toUpperCase() || 'MEM')}-${Date.now().toString().slice(-4)}`);
    setMobileNumber('');
    setWhatsappNumber('');
    setAddress('');
    setWardUnit('');
    setAgeCategory('youth');
    setOccupation('');
    setBloodGroup('');
    setMemberOrgId(user.role === 'super_admin' ? '' : (user.orgId || ''));
    setStatus('active');
    setLocationStatus('local');
  };

  // Save Member
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !memberId || !mobileNumber) return;

    // Check if editing or adding
    const targetOrgId = user.role === 'super_admin' ? memberOrgId : (user.orgId || '');
    if (!targetOrgId) {
      alert('Please select an Organization');
      return;
    }

    const memberData: Member = {
      id: editingMember ? editingMember.id : `member-${Date.now()}`,
      memberId,
      fullName,
      mobileNumber,
      whatsappNumber: whatsappNumber || mobileNumber,
      address,
      wardUnit,
      ageCategory,
      occupation,
      bloodGroup,
      orgId: targetOrgId,
      status,
      locationStatus
    };

    db.saveMember(memberData);
    setIsModalOpen(false);
    clearForm();
    reloadData();
  };

  // Delete Member
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member? This action is permanent.')) {
      db.deleteMember(id);
      reloadData();
    }
  };

  // Filter and search logic
  const filteredMembers = members.filter(m => {
    // Search
    const matchesSearch = 
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mobileNumber.includes(searchQuery) ||
      (m.wardUnit && m.wardUnit.toLowerCase().includes(searchQuery.toLowerCase()));

    // Organization filter
    const matchesOrg = filterOrg ? m.orgId === filterOrg : true;
    // Ward filter
    const matchesWard = filterWard ? m.wardUnit === filterWard : true;
    // Age filter
    const matchesAge = filterAge ? m.ageCategory === filterAge : true;
    // Location filter
    const matchesLocation = filterLocation ? m.locationStatus === filterLocation : true;
    // Status filter
    const matchesStatus = filterStatus ? m.status === filterStatus : true;

    return matchesSearch && matchesOrg && matchesWard && matchesAge && matchesLocation && matchesStatus;
  });

  // Extract unique Wards for filter list
  const uniqueWards = Array.from(new Set(members.map(m => m.wardUnit).filter(Boolean)));

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Member ID,Full Name,Mobile,WhatsApp,Address,Ward/Unit,Age Category,Occupation,Blood Group,Location Status,Status\n';
    const rows = filteredMembers.map(m => 
      `"${m.memberId}","${m.fullName}","${m.mobileNumber}","${m.whatsappNumber || ''}","${m.address || ''}","${m.wardUnit || ''}","${m.ageCategory}","${m.occupation || ''}","${m.bloodGroup || ''}","${m.locationStatus}","${m.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `members_export_${Date.now()}.csv`);
    link.click();
  };

  // Import CSV
  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    if (!csvText.trim()) return;

    try {
      const lines = csvText.split('\n');
      let addedCount = 0;

      lines.forEach((line, index) => {
        // Skip header if it contains metadata
        if (index === 0 && line.toLowerCase().includes('member id')) return;
        if (!line.trim()) return;

        // Simple CSV splitter (handles basic quoted comma values)
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 3) return; // Need at least MemberID, Name, Mobile

        const mId = parts[0] || `MEM-${Math.random().toString().slice(-4)}`;
        const fName = parts[1];
        const mob = parts[2];
        
        if (!fName || !mob) return;

        const targetOrgId = user.role === 'super_admin' ? (parts[10] || orgs[0]?.id) : (user.orgId || '');

        const newMem: Member = {
          id: `member-csv-${Date.now()}-${index}`,
          memberId: mId,
          fullName: fName,
          mobileNumber: mob,
          whatsappNumber: parts[3] || mob,
          address: parts[4] || '',
          wardUnit: parts[5] || 'Ward 01',
          ageCategory: (parts[6] as any) || 'youth',
          occupation: parts[7] || '',
          bloodGroup: parts[8] || 'O+',
          orgId: targetOrgId,
          locationStatus: (parts[9] as any) || 'local',
          status: 'active'
        };

        db.saveMember(newMem);
        addedCount++;
      });

      alert(`Successfully imported ${addedCount} members!`);
      setIsImportOpen(false);
      setCsvText('');
      reloadData();
    } catch (err) {
      setImportError('Failed to parse CSV. Please ensure formatting matches: MemberID, Name, Mobile, WhatsApp, Address, Ward, AgeCategory, Occupation, BloodGroup, LocationStatus');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{t('members')}</h2>
            <p className="text-slate-500 text-xs mt-0.5">Manage directory entries, profile details and contact registries.</p>
          </div>

          {user.role !== 'office_bearer' && (
            <div className="flex gap-2">
              <button
                onClick={() => { clearForm(); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-800/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>{t('addMember')}</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
              >
                <Upload className="h-4 w-4 text-emerald-700" />
                <span>{t('importExcel')}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-700" />
                <span>{t('exportExcel')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchMember')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-normal outline-none focus:border-emerald-700 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-semibold text-slate-600">
            {/* Org Filter (Super Admin only) */}
            <div>
              <select
                value={filterOrg}
                disabled={user.role !== 'super_admin'}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-normal"
              >
                <option value="">All Organizations</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div>
              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-normal"
              >
                <option value="">All Wards/Units</option>
                {uniqueWards.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Age Filter */}
            <div>
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-normal"
              >
                <option value="">All Ages</option>
                <option value="child">{t('child')}</option>
                <option value="youth">{t('youth')}</option>
                <option value="middle">{t('middle')}</option>
                <option value="senior">{t('senior')}</option>
              </select>
            </div>

            {/* Location Status Filter */}
            <div>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-normal"
              >
                <option value="">All Locations</option>
                <option value="local">{t('local')}</option>
                <option value="expatriate">{t('expatriate')}</option>
                <option value="studying_outside">{t('studying_outside')}</option>
                <option value="working_outside">{t('working_outside')}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-normal"
              >
                <option value="">All Statuses</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Member Listings */}
        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-sm overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              No members match the active search or filters.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-[11px] font-semibold text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Ward / Unit</th>
                      <th className="px-6 py-4">Age / Location</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Blood</th>
                      <th className="px-6 py-4">Status</th>
                      {user.role !== 'office_bearer' && <th className="px-6 py-4 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-normal">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap font-mono font-bold text-slate-800">{member.memberId}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-900">{member.fullName}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-medium">{member.wardUnit || '---'}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-medium">
                          <span className="capitalize">{member.ageCategory}</span> / <span className="text-emerald-800 font-semibold">{t(member.locationStatus as any)}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-slate-500">{member.mobileNumber}</td>
                        <td className="px-6 py-3 whitespace-nowrap font-bold text-red-600">{member.bloodGroup || '---'}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {t(member.status as any)}
                          </span>
                        </td>
                        {user.role !== 'office_bearer' && (
                          <td className="px-6 py-3 whitespace-nowrap text-center space-x-2">
                            <button
                              onClick={() => openEdit(member)}
                              className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid gap-3 p-4 md:hidden">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                          {member.memberId}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 pt-1">{member.fullName}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          🏡 {member.wardUnit || 'No Ward'} • 🩸 <span className="text-red-600 font-bold">{member.bloodGroup || 'N/A'}</span>
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {t(member.status as any)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-slate-100 font-medium text-slate-600">
                      <span>{t(member.locationStatus as any)} ({member.ageCategory})</span>
                      <span className="font-mono text-slate-500">📞 {member.mobileNumber}</span>
                    </div>

                    {user.role !== 'office_bearer' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60 justify-end">
                        <button
                          onClick={() => openEdit(member)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Member Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
              <div className="bg-emerald-950 text-white p-5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-sm">{editingMember ? 'Edit Member Profile' : 'Add New Member'}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Member ID</label>
                    <input 
                      type="text" 
                      required
                      value={memberId} 
                      onChange={(e) => setMemberId(e.target.value)}
                      placeholder="e.g. KMJ-001"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Muhammed Ali"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      required
                      value={mobileNumber} 
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">WhatsApp Number</label>
                    <input 
                      type="tel" 
                      value={whatsappNumber} 
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential address details..."
                    rows={2}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Ward / Unit</label>
                    <input 
                      type="text" 
                      value={wardUnit} 
                      onChange={(e) => setWardUnit(e.target.value)}
                      placeholder="e.g. Ward 02"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Age Category</label>
                    <select
                      value={ageCategory}
                      onChange={(e) => setAgeCategory(e.target.value as any)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="child">Child (Under 15)</option>
                      <option value="youth">Youth (15 - 35)</option>
                      <option value="middle">Middle Age (36 - 60)</option>
                      <option value="senior">Senior (Above 60)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Location Status</label>
                    <select
                      value={locationStatus}
                      onChange={(e) => setLocationStatus(e.target.value as any)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="local">Local</option>
                      <option value="expatriate">Expatriate</option>
                      <option value="studying_outside">Studying Outside</option>
                      <option value="working_outside">Working Outside</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={occupation} 
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Business, Teacher"
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {user.role === 'super_admin' ? (
                    <div>
                      <label className="block text-slate-500 mb-1">Organization Link</label>
                      <select
                        value={memberOrgId}
                        required
                        onChange={(e) => setMemberOrgId(e.target.value)}
                        className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                      >
                        <option value="">Select Organization</option>
                        {orgs.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="invisible" />
                  )}

                  <div>
                    <label className="block text-slate-500 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-normal"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
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

        {/* CSV Import Modal */}
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-emerald-950 text-white p-5 flex justify-between items-center">
                <h3 className="font-bold text-sm">Batch Import Members (CSV)</h3>
                <button 
                  onClick={() => setIsImportOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleImportCSV} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                {importError && (
                  <div className="rounded-xl bg-red-50 p-3.5 text-red-650 border border-red-100 text-xs">
                    {importError}
                  </div>
                )}

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-150 text-[11px] text-emerald-800 space-y-1.5 font-normal leading-relaxed">
                  <p className="font-bold text-emerald-900">Required CSV Columns:</p>
                  <p className="font-mono text-[10px] bg-white/60 p-1.5 rounded border border-emerald-100">
                    MemberID, FullName, MobileNumber, WhatsAppNumber, Address, WardUnit, AgeCategory, Occupation, BloodGroup, LocationStatus
                  </p>
                  <p className="text-[10px] text-slate-500">
                    * Values for AgeCategory: <code className="bg-emerald-100 px-1 rounded text-emerald-900">child</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">youth</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">middle</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">senior</code>.
                    <br />
                    * Values for LocationStatus: <code className="bg-emerald-100 px-1 rounded text-emerald-900">local</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">expatriate</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">studying_outside</code>, <code className="bg-emerald-100 px-1 rounded text-emerald-900">working_outside</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Paste CSV Data</label>
                  <textarea 
                    value={csvText} 
                    required
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="KMJ-101,Ahammed Kabir,+91 9995551212,+91 9995551212,Valley Green,Ward 01,youth,Business,O+,expatriate"
                    rows={8}
                    className="w-full border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:border-emerald-700 focus:bg-white font-mono font-normal text-[11px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsImportOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import Rows</span>
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
