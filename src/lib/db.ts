// Database Wrapper & Mock State Engine for Community Organization Management System

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
  photoUrl?: string;
  mobileNumber: string;
  whatsappNumber?: string;
  address?: string;
  wardUnit?: string;
  ageCategory: 'child' | 'youth' | 'middle' | 'senior';
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
  },
  {
    id: 'user-kmjadmin',
    email: 'kmjadmin@org.com',
    fullName: 'KMJ Admin',
    role: 'org_admin',
    orgId: 'org-kmj',
    phone: '+91 9995551001',
    status: 'active'
  },
  {
    id: 'user-sysadmin',
    email: 'sysadmin@org.com',
    fullName: 'SYS Admin',
    role: 'org_admin',
    orgId: 'org-sys',
    phone: '+91 9995552001',
    status: 'active'
  },
  {
    id: 'user-ssfadmin',
    email: 'ssfadmin@org.com',
    fullName: 'SSF Admin',
    role: 'org_admin',
    orgId: 'org-ssf',
    phone: '+91 9995553001',
    status: 'active'
  },
  // KMJ Callers
  {
    id: 'user-kmj-bearer1',
    email: 'jamal@org.com',
    fullName: 'K.P. Jamal (President)',
    role: 'office_bearer',
    orgId: 'org-kmj',
    phone: '+91 9876543210',
    status: 'active'
  },
  {
    id: 'user-kmj-bearer2',
    email: 'yusuf@org.com',
    fullName: 'T.M. Yusuf (Secretary)',
    role: 'office_bearer',
    orgId: 'org-kmj',
    phone: '+91 9876543211',
    status: 'active'
  },
  {
    id: 'user-kmj-exec1',
    email: 'salim@org.com',
    fullName: 'Salim K. (Treasurer)',
    role: 'executive',
    orgId: 'org-kmj',
    phone: '+91 9876543212',
    status: 'active'
  },
  {
    id: 'user-kmj-exec2',
    email: 'haris@org.com',
    fullName: 'Haris P. (Committee Member)',
    role: 'executive',
    orgId: 'org-kmj',
    phone: '+91 9876543213',
    status: 'active'
  },
  // SYS Callers
  {
    id: 'user-sys-bearer',
    email: 'hameed@org.com',
    fullName: 'Abdul Hameed (Secretary)',
    role: 'office_bearer',
    orgId: 'org-sys',
    phone: '+91 8876543210',
    status: 'active'
  },
  {
    id: 'user-sys-exec',
    email: 'majeed@org.com',
    fullName: 'Majeed K. (Committee Member)',
    role: 'executive',
    orgId: 'org-sys',
    phone: '+91 8876543211',
    status: 'active'
  },
  // SSF Callers
  {
    id: 'user-ssf-bearer',
    email: 'suhail@org.com',
    fullName: 'Suhail Anwar (President)',
    role: 'office_bearer',
    orgId: 'org-ssf',
    phone: '+91 7776543210',
    status: 'active'
  },
  {
    id: 'user-ssf-exec',
    email: 'faisal@org.com',
    fullName: 'Faisal Rahman (Working Secretary)',
    role: 'executive',
    orgId: 'org-ssf',
    phone: '+91 7776543211',
    status: 'active'
  }
];

// Seed generator for members
const generateMembers = (): Member[] => {
  const membersList: Member[] = [];
  const orgIds = ['org-kmj', 'org-sys', 'org-ssf'];
  const prefixes = { 'org-kmj': 'KMJ', 'org-sys': 'SYS', 'org-ssf': 'SSF' };
  
  const names = [
    'Muhammed Ali', 'Ahammed Kabir', 'K.V. Ibrahim', 'Rasheed Ahmed', 'Sayyid Jifri',
    'Ashraf Thangal', 'Faisal Haji', 'Zakariya V.K.', 'Musthafa Darimi', 'Sharafudheen',
    'Naseer Ahmed', 'Suhail K.T.', 'Noufal P.K.', 'Sidheequl Akbar', 'Abdul Rasheed',
    'Ubaidullah', 'Hamza Musliyar', 'Jafar Sadique', 'Luqmanul Hakeem', 'Bilal K.'
  ];
  
  const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'];
  const locations: ('local' | 'expatriate' | 'studying_outside' | 'working_outside')[] = [
    'local', 'local', 'expatriate', 'local', 'studying_outside', 'working_outside', 'local'
  ];
  const ageCats: ('child' | 'youth' | 'middle' | 'senior')[] = ['youth', 'middle', 'senior', 'youth', 'middle'];
  const occupations = ['Business', 'Teacher', 'Engineer', 'Driver', 'Student', 'Gulf Job', 'Accountant'];
  const wards = ['Ward 01', 'Ward 02', 'Ward 03', 'Ward 04', 'Ward 05'];

  orgIds.forEach((orgId) => {
    const prefix = prefixes[orgId as keyof typeof prefixes];
    for (let i = 1; i <= 20; i++) {
      const idx = i - 1;
      const numStr = i < 10 ? `00${i}` : `0${i}`;
      const name = `${names[idx % names.length]} ${String.fromCharCode(65 + (i % 26))}`;
      const phone = `+91 9895${100000 + i + (orgId === 'org-sys' ? 200000 : orgId === 'org-ssf' ? 400000 : 0)}`;
      
      membersList.push({
        id: `member-${prefix.toLowerCase()}-${i}`,
        memberId: `${prefix}-${numStr}`,
        fullName: name,
        mobileNumber: phone,
        whatsappNumber: phone,
        address: `House No. ${i * 4}, Green Valley, Malappuram`,
        wardUnit: wards[i % wards.length],
        ageCategory: ageCats[i % ageCats.length],
        occupation: occupations[i % occupations.length],
        bloodGroup: bloodGroups[i % bloodGroups.length],
        orgId: orgId,
        status: i === 20 ? 'inactive' : 'active', // Make one inactive for test
        locationStatus: locations[i % locations.length]
      });
    }
  });

  return membersList;
};

const initialPrograms = (): Program[] => {
  return [
    {
      id: 'prog-kmj-1',
      name: 'Monthly General Body Meet',
      description: 'Review committee activities, finance audit and ward reorganization.',
      date: '2026-06-20',
      orgId: 'org-kmj',
      status: 'upcoming'
    },
    {
      id: 'prog-kmj-2',
      name: 'Milad Shareef Rally & Cultural Feast',
      description: 'Annual Meelad celebrations with public speeches and cultural competitions.',
      date: '2026-06-12',
      orgId: 'org-kmj',
      status: 'completed'
    },
    {
      id: 'prog-sys-1',
      name: 'Sunni Youth Meet & Volunteers Training',
      description: 'Training program for SYS Santhuwanam relief volunteers in first aid and civic support.',
      date: '2026-06-25',
      orgId: 'org-sys',
      status: 'upcoming'
    },
    {
      id: 'prog-ssf-1',
      name: 'Sahithyotsav Sector Level Fest',
      description: 'Literary and cultural art festival for students across wards.',
      date: '2026-06-22',
      orgId: 'org-ssf',
      status: 'upcoming'
    }
  ];
};

const initialAssignments: CallAssignment[] = [];

// Storage Manager
class LocalDB {
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.init();
  }

  private init() {
    if (!this.isBrowser) return;

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
  }

  deleteMember(id: string) {
    const list = this.getMembers();
    this.set('members', list.filter(m => m.id !== id));
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
  }

  deleteProgram(id: string) {
    const list = this.getPrograms();
    this.set('programs', list.filter(p => p.id !== id));
    // cascade delete call assignments
    const assignments = this.getCallAssignments();
    this.set('call_assignments', assignments.filter(a => a.programId !== id));
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
    }
  }

  clearAssignmentsByProgram(programId: string) {
    const current = this.getCallAssignments();
    this.set('call_assignments', current.filter(a => a.programId !== programId));
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
  }

  deleteOrgDirectoryEntry(id: string) {
    const list = this.getOrgDirectoryEntries();
    this.set('org_directory_entries', list.filter(e => e.id !== id));
  }
}

export const db = new LocalDB();
