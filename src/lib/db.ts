// Database Wrapper & Mock State Engine for Community Organization Management System
import { supabase } from './supabaseClient';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  themeColor: string;
  status: 'active' | 'inactive';
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'org_admin' | 'office_bearer' | 'executive';
  orgId?: string; // null for super_admin
  phone?: string;
  status: 'active' | 'inactive';
}

export interface Member {
  id: string;
  memberId: string; // e.g. KMJ-001
  fullName: string;
  fatherName?: string;
  photoUrl?: string;
  mobileNumber: string;
  whatsappNumber?: string;
  occupation?: string;
  bloodGroup?: string;
  orgId: string;
  status: 'active' | 'inactive';
  locationStatus: 'local' | 'expatriate' | 'studying_outside' | 'working_outside';
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  date: string;
  orgId: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface CallAssignment {
  id: string;
  programId: string;
  memberId: string;
  callerId: string; // Profile ID
  status: 'not_called' | 'called' | 'confirmed' | 'not_attending' | 'no_response' | 'call_back_later';
  notes?: string;
}

export interface OrgDirectoryEntry {
  id: string;
  orgId: string;
  memberId: string;
  responsibility: string; // e.g. President, Secretary, etc.
  roleCategory: 'office_bearer' | 'executive';
}

// Initial Seeds
const initialOrganizations: Organization[] = [
  {
    id: 'org-kmj',
    name: 'Kerala Muslim Jamaath',
    slug: 'kerala-muslim-jamaath',
    description: 'Promoting moral, educational, and spiritual empowerment for the community.',
    logoUrl: '',
    themeColor: '#055938',
    status: 'active',
  },
  {
    id: 'org-sys',
    name: 'SYS (Sunni Yuvajana Sangham)',
    slug: 'sys',
    description: 'Empowering youth through moral education, cultural leadership, and relief activities.',
    logoUrl: '',
    themeColor: '#0f8c3b',
    status: 'active',
  },
  {
    id: 'org-ssf',
    name: 'SSF (Sunni Students\' Federation)',
    slug: 'ssf',
    description: 'Fostering academic excellence, moral values, and student leadership in Kerala.',
    logoUrl: '',
    themeColor: '#1ba345',
    status: 'active',
  }
];

const initialProfiles: Profile[] = [
  {
    id: 'user-super',
    email: 'superadmin@org.com',
    fullName: 'Super Admin',
    role: 'super_admin',
    phone: '+91 9995550001',
    status: 'active'
  }
];

// Seed generator for members
const generateMembers = (): Member[] => {
  return [];
};

const initialPrograms = (): Program[] => {
  return [];
};

const initialAssignments: CallAssignment[] = [];

// Helper functions to map database fields from camelCase to snake_case and vice-versa
const toCamel = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

function mapKeys(obj: any, transform: (s: string) => string): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => mapKeys(item, transform));
  if (typeof obj === 'object') {
    const n: any = {};
    Object.keys(obj).forEach(k => {
      n[transform(k)] = mapKeys(obj[k], transform);
    });
    return n;
  }
  return obj;
}

const mapToCamel = (obj: any) => mapKeys(obj, toCamel);
const mapToSnake = (obj: any) => mapKeys(obj, toSnake);

// Storage Manager
class LocalDB {
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.init();
  }

  private init() {
    if (!this.isBrowser) return;

    // One-time migration reset to wipe sample seed data in client browser
    const cleanDbKey = 'db_clean_prod_v2';
    if (!localStorage.getItem(cleanDbKey)) {
      localStorage.clear();
      localStorage.setItem(cleanDbKey, 'true');
    }

    if (!localStorage.getItem('organizations')) {
      localStorage.setItem('organizations', JSON.stringify(initialOrganizations));
    }
    if (!localStorage.getItem('profiles')) {
      localStorage.setItem('profiles', JSON.stringify(initialProfiles));
    }
    if (!localStorage.getItem('members')) {
      localStorage.setItem('members', JSON.stringify(generateMembers()));
    }
    if (!localStorage.getItem('programs')) {
      localStorage.setItem('programs', JSON.stringify(initialPrograms()));
    }
    if (!localStorage.getItem('call_assignments')) {
      localStorage.setItem('call_assignments', JSON.stringify(initialAssignments));
    }
    if (!localStorage.getItem('org_directory_entries')) {
      localStorage.setItem('org_directory_entries', JSON.stringify([]));
    }
  }

  // Sync Methods
  isSyncEnabled(): boolean {
    return !!supabase;
  }

  async syncFromSupabase() {
    if (!this.isBrowser) return;
    if (!supabase) {
      console.warn("Supabase client is not initialized. Running in local-only mode.");
      return;
    }

    try {
      console.log("Starting sync with Supabase...");
      // Check if remote organizations table is empty
      const { data: remoteOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (orgsError) {
        console.error("Failed to fetch from Supabase:", orgsError);
        return;
      }

      if (!remoteOrgs || remoteOrgs.length === 0) {
        console.log("Supabase database is empty. Uploading local cache as seeds...");
        await this.seedRemoteSupabase();
      } else {
        console.log("Supabase database has data. Downloading to localStorage...");
        await this.downloadFromSupabase();
      }

      // Notify listening components that data has synced
      window.dispatchEvent(new CustomEvent('localdb-sync-complete'));
      console.log("Sync complete!");
    } catch (err) {
      console.error("Error during Supabase sync:", err);
    }
  }

  private async seedRemoteSupabase() {
    if (!supabase) return;

    const tables = [
      { name: 'organizations', data: this.getOrganizations() },
      { name: 'profiles', data: this.getProfiles() },
      { name: 'members', data: this.getMembers() },
      { name: 'programs', data: this.getPrograms() },
      { name: 'call_assignments', data: this.getCallAssignments() },
      { name: 'org_directory_entries', data: this.getOrgDirectoryEntries() }
    ];

    for (const table of tables) {
      if (table.data.length > 0) {
        const dbData = table.data.map(mapToSnake);
        const { error } = await supabase.from(table.name).upsert(dbData);
        if (error) {
          console.error(`Failed to seed table ${table.name} in Supabase:`, error);
        } else {
          console.log(`Successfully seeded table ${table.name} with ${table.data.length} records.`);
        }
      }
    }
  }

  private async downloadFromSupabase() {
    if (!supabase) return;

    const tables = [
      { name: 'organizations', storageKey: 'organizations' },
      { name: 'profiles', storageKey: 'profiles' },
      { name: 'members', storageKey: 'members' },
      { name: 'programs', storageKey: 'programs' },
      { name: 'call_assignments', storageKey: 'call_assignments' },
      { name: 'org_directory_entries', storageKey: 'org_directory_entries' }
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table.name).select('*');
      if (error) {
        console.error(`Failed to download table ${table.name} from Supabase:`, error);
      } else if (data) {
        const camelData = data.map(mapToCamel);
        this.set(table.storageKey, camelData);
        console.log(`Downloaded ${data.length} records for ${table.name} and cached locally.`);
      }
    }
  }

  private bgSync(action: () => Promise<any>) {
    if (!supabase) return;
    action().catch(err => {
      console.error("Background sync error:", err);
    });
  }

  // Generic Helpers
  private get<T>(key: string): T[] {
    if (!this.isBrowser) return [];
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  }

  private set<T>(key: string, data: T[]) {
    if (!this.isBrowser) return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Organizations API
  getOrganizations(): Organization[] {
    return this.get<Organization>('organizations');
  }

  saveOrganization(org: Organization) {
    const list = this.getOrganizations();
    const idx = list.findIndex(o => o.id === org.id);
    if (idx >= 0) {
      list[idx] = org;
    } else {
      list.push(org);
    }
    this.set('organizations', list);

    this.bgSync(async () => {
      const { error } = await supabase!.from('organizations').upsert(mapToSnake(org));
      if (error) throw error;
    });
  }

  // Profiles / Users API
  getProfiles(): Profile[] {
    return this.get<Profile>('profiles');
  }

  getProfilesByOrg(orgId: string): Profile[] {
    return this.getProfiles().filter(p => p.orgId === orgId && p.status === 'active');
  }

  saveProfile(profile: Profile) {
    const list = this.getProfiles();
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    this.set('profiles', list);

    this.bgSync(async () => {
      const { error } = await supabase!.from('profiles').upsert(mapToSnake(profile));
      if (error) throw error;
    });
  }

  // Members API
  getMembers(): Member[] {
    return this.get<Member>('members');
  }

  getMembersByOrg(orgId: string): Member[] {
    return this.getMembers().filter(m => m.orgId === orgId);
  }

  saveMember(member: Member) {
    const list = this.getMembers();
    const idx = list.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      list[idx] = member;
    } else {
      list.push(member);
    }
    this.set('members', list);

    this.bgSync(async () => {
      const { error } = await supabase!.from('members').upsert(mapToSnake(member));
      if (error) throw error;
    });
  }

  deleteMember(id: string) {
    const list = this.getMembers();
    this.set('members', list.filter(m => m.id !== id));

    this.bgSync(async () => {
      const { error } = await supabase!.from('members').delete().eq('id', id);
      if (error) throw error;
    });
  }

  // Programs API
  getPrograms(): Program[] {
    return this.get<Program>('programs');
  }

  getProgramsByOrg(orgId: string): Program[] {
    return this.getPrograms().filter(p => p.orgId === orgId);
  }

  saveProgram(prog: Program) {
    const list = this.getPrograms();
    const idx = list.findIndex(p => p.id === prog.id);
    if (idx >= 0) {
      list[idx] = prog;
    } else {
      list.push(prog);
    }
    this.set('programs', list);

    this.bgSync(async () => {
      const { error } = await supabase!.from('programs').upsert(mapToSnake(prog));
      if (error) throw error;
    });
  }

  deleteProgram(id: string) {
    const list = this.getPrograms();
    this.set('programs', list.filter(p => p.id !== id));
    // cascade delete call assignments
    const assignments = this.getCallAssignments();
    this.set('call_assignments', assignments.filter(a => a.programId !== id));

    this.bgSync(async () => {
      const { error } = await supabase!.from('programs').delete().eq('id', id);
      if (error) throw error;
    });
  }

  // Call Assignments API
  getCallAssignments(): CallAssignment[] {
    return this.get<CallAssignment>('call_assignments');
  }

  getCallAssignmentsByProgram(programId: string): CallAssignment[] {
    return this.getCallAssignments().filter(a => a.programId === programId);
  }

  getCallAssignmentsByCaller(callerId: string): CallAssignment[] {
    return this.getCallAssignments().filter(a => a.callerId === callerId);
  }

  saveCallAssignments(assignments: CallAssignment[]) {
    // Overwrites or saves multiple assignments
    const current = this.getCallAssignments();
    const filtered = current.filter(
      c => !assignments.some(a => a.programId === c.programId && a.memberId === c.memberId)
    );
    this.set('call_assignments', [...filtered, ...assignments]);

    this.bgSync(async () => {
      const dbAssignments = assignments.map(mapToSnake);
      const { error } = await supabase!.from('call_assignments').upsert(dbAssignments);
      if (error) throw error;
    });
  }

  updateCallAssignmentStatus(assignmentId: string, status: CallAssignment['status'], notes?: string) {
    const list = this.getCallAssignments();
    const idx = list.findIndex(a => a.id === assignmentId);
    if (idx >= 0) {
      list[idx].status = status;
      if (notes !== undefined) {
        list[idx].notes = notes;
      }
      this.set('call_assignments', list);

      this.bgSync(async () => {
        const updateObj: any = { status };
        if (notes !== undefined) {
          updateObj.notes = notes;
        }
        const { error } = await supabase!
          .from('call_assignments')
          .update(mapToSnake(updateObj))
          .eq('id', assignmentId);
        if (error) throw error;
      });
    }
  }

  clearAssignmentsByProgram(programId: string) {
    const current = this.getCallAssignments();
    this.set('call_assignments', current.filter(a => a.programId !== programId));

    this.bgSync(async () => {
      const { error } = await supabase!.from('call_assignments').delete().eq('program_id', programId);
      if (error) throw error;
    });
  }

  // Custom Public Directory API
  getOrgDirectoryEntries(): OrgDirectoryEntry[] {
    return this.get<OrgDirectoryEntry>('org_directory_entries');
  }

  saveOrgDirectoryEntry(entry: OrgDirectoryEntry) {
    const list = this.getOrgDirectoryEntries();
    const idx = list.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }
    this.set('org_directory_entries', list);

    this.bgSync(async () => {
      const { error } = await supabase!.from('org_directory_entries').upsert(mapToSnake(entry));
      if (error) throw error;
    });
  }

  deleteOrgDirectoryEntry(id: string) {
    const list = this.getOrgDirectoryEntries();
    this.set('org_directory_entries', list.filter(e => e.id !== id));

    this.bgSync(async () => {
      const { error } = await supabase!.from('org_directory_entries').delete().eq('id', id);
      if (error) throw error;
    });
  }
}

export const db = new LocalDB();

import { useState, useEffect } from 'react';

export function useLocalDBSync() {
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => {
      setSyncVersion(v => v + 1);
    };
    window.addEventListener('localdb-sync-complete', handleSync);
    return () => window.removeEventListener('localdb-sync-complete', handleSync);
  }, []);

  return syncVersion;
}

