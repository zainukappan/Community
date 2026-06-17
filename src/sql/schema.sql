-- Database Schema for Community Organization Management System (Supabase PostgreSQL)

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    theme_color TEXT DEFAULT '#0F5132',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'executive' CHECK (role IN ('super_admin', 'org_admin', 'office_bearer', 'executive')),
    org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for profile lookups by organization
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    father_name TEXT,
    photo_url TEXT,
    mobile_number TEXT NOT NULL,
    whatsapp_number TEXT,
    occupation TEXT,
    blood_group TEXT,
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    location_status TEXT DEFAULT 'local' CHECK (location_status IN ('local', 'expatriate', 'studying_outside', 'working_outside')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for member filtering & search
CREATE INDEX IF NOT EXISTS idx_members_org_id ON members(org_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_location ON members(location_status);
CREATE INDEX IF NOT EXISTS idx_members_father_name ON members(father_name);

-- 4. Programs Table
CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_org_id ON programs(org_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- 5. Call Assignments Table (Random assignment campaigns)
CREATE TABLE IF NOT EXISTS call_assignments (
    id TEXT PRIMARY KEY,
    program_id TEXT REFERENCES programs(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    caller_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_called' CHECK (status IN ('not_called', 'called', 'confirmed', 'not_attending', 'no_response', 'call_back_later')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, member_id) -- A member cannot be assigned twice in the same program campaign
);

CREATE INDEX IF NOT EXISTS idx_assignments_program ON call_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_assignments_caller ON call_assignments(caller_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON call_assignments(status);

-- 6. Org Directory Entries Table (Custom Public Directory)
CREATE TABLE IF NOT EXISTS org_directory_entries (
    id TEXT PRIMARY KEY,
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    responsibility TEXT NOT NULL,
    role_category TEXT CHECK (role_category IN ('office_bearer', 'executive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dir_org ON org_directory_entries(org_id);

-- Enable Row Level Security (RLS) on all tables (if deploying on Supabase)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_directory_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public (anonymous) read and write operations
-- Note: The application uses a mock authentication structure in AuthContext.tsx, which communicates with the Supabase client anonymously.
CREATE POLICY "Allow public access" ON organizations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON members FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON programs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON call_assignments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON org_directory_entries FOR ALL TO public USING (true) WITH CHECK (true);
