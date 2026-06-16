import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ml';

export const translations = {
  en: {
    appName: "Community Org Manager",
    title: "Community Organization Management System",
    publicDirectory: "Public Directory",
    organizations: "Organizations",
    members: "Members",
    programs: "Programs",
    campaigns: "Calling Campaigns",
    myCalls: "My Assigned Calls",
    dashboard: "Dashboard",
    reports: "Reports",
    login: "Login",
    logout: "Logout",
    language: "Language",
    
    // Roles
    super_admin: "Super Admin",
    org_admin: "Organization Admin",
    office_bearer: "Office Bearer",
    executive: "Executive Member",
    public: "Public Visitor",
    
    // Stats
    totalOrgs: "Total Organizations",
    totalMembers: "Total Members",
    activeMembers: "Active Members",
    expatriates: "Expatriate Members",
    totalPrograms: "Total Programs",
    assignedCalls: "Assigned Calls",
    completedCalls: "Completed Calls",
    confirmedAttendance: "Confirmed Attendance",
    
    // Member Fields
    memberId: "Member ID",
    fullName: "Full Name",
    photo: "Photo",
    mobileNumber: "Mobile Number",
    whatsappNumber: "WhatsApp Number",
    fatherName: "Father's Name",
    occupation: "Occupation",
    bloodGroup: "Blood Group",
    org: "Organization",
    locationStatus: "Location Status",
    status: "Status",
    actions: "Actions",
    
    // Location options
    local: "Local",
    expatriate: "Expatriate (Gulf/Abroad)",
    studying_outside: "Studying Outside",
    working_outside: "Working Outside",
    
    // Age categories
    child: "Child (Below 15)",
    youth: "Youth (15 - 35)",
    middle: "Middle Age (36 - 60)",
    senior: "Senior Citizen (Above 60)",
    
    // Status
    active: "Active",
    inactive: "Inactive",
    
    // Call Statuses
    not_called: "Not Called",
    called: "Called",
    confirmed: "Confirmed",
    not_attending: "Not Attending",
    no_response: "No Response",
    call_back_later: "Call Back Later",
    
    // Program Statuses
    upcoming: "Upcoming",
    completed: "Completed",
    
    // Buttons & Actions
    addMember: "Add Member",
    editMember: "Edit Member",
    deleteMember: "Delete Member",
    searchMember: "Search Member...",
    importExcel: "Import CSV",
    exportExcel: "Export CSV",
    filterBy: "Filter By",
    save: "Save",
    cancel: "Cancel",
    call: "Call",
    whatsapp: "WhatsApp",
    notes: "Notes / Comments",
    addNotes: "Add Notes",
    generateAssignment: "Generate Random Assignment",
    reGenerate: "Re-generate",
    saveAssignment: "Save & Launch Campaign",
    caller: "Caller",
    selectCallers: "Select Callers",
    selectTargetMembers: "Select Target Members",
    equalDistribution: "Equal Distribution Summary",
    manualAdjustment: "Manual Adjustment",
    
    // Public directory page
    viewOfficeBearers: "Office Bearers",
    viewExecutives: "Executive Committee",
    contactDetails: "Contact Details",
    aboutUs: "About the Organization",
    welcomeText: "Welcome to Community Portal",
    welcomeSub: "Access directories, program reports, and organizational contacts.",
    selectOrg: "Select an Organization to view details"
  },
  ml: {
    appName: "കമ്മ്യൂണിറ്റി മാനേജർ",
    title: "കമ്മ്യൂണിറ്റി ഓർഗനൈസേഷൻ മാനേജ്മെന്റ് സിസ്റ്റം",
    publicDirectory: "പൊതു ഡയറക്ടറി",
    organizations: "സംഘടനകൾ",
    members: "മെമ്പർമാർ",
    programs: "പരിപാടികൾ",
    campaigns: "വിളിക്കൽ ക്യാമ്പയിനുകൾ",
    myCalls: "എന്റെ കോളുകൾ",
    dashboard: "ഡാഷ്‌ബോർഡ്",
    reports: "റിപ്പോർട്ടുകൾ",
    login: "ലോഗിൻ",
    logout: "ലോഗൗട്ട്",
    language: "ഭാഷ",
    
    // Roles
    super_admin: "സൂപ്പർ അഡ്മിൻ",
    org_admin: "ഓർഗനൈസേഷൻ അഡ്മിൻ",
    office_bearer: "ഭാരവാഹി",
    executive: "എക്സിക്യൂട്ടീവ് അംഗം",
    public: "സന്ദർശകൻ",
    
    // Stats
    totalOrgs: "ആകെ സംഘടനകൾ",
    totalMembers: "ആകെ മെമ്പർമാർ",
    activeMembers: "സജീവ മെമ്പർമാർ",
    expatriates: "പ്രവാസി മെമ്പർമാർ",
    totalPrograms: "ആകെ പരിപാടികൾ",
    assignedCalls: "നിശ്ചയിച്ച കോളുകൾ",
    completedCalls: "പൂർത്തിയായ കോളുകൾ",
    confirmedAttendance: "ഉറപ്പായ പങ്കാളിത്തം",
    
    // Member Fields
    memberId: "മെമ്പർ ഐഡി",
    fullName: "പൂർണ്ണനാമം",
    photo: "ഫോട്ടോ",
    mobileNumber: "മൊബൈൽ നമ്പർ",
    whatsappNumber: "വാട്സാപ്പ് നമ്പർ",
    fatherName: "പിതാവിന്റെ പേര്",
    occupation: "ജോലി",
    bloodGroup: "രക്തഗ്രൂപ്പ്",
    org: "സംഘടന",
    locationStatus: "ലൊക്കേഷൻ സ്റ്റാറ്റസ്",
    status: "നില",
    actions: "നടപടികൾ",
    
    // Location options
    local: "സ്ഥലത്തുള്ളവർ (Local)",
    expatriate: "പ്രവാസി (Gulf/Abroad)",
    studying_outside: "പുറത്തു പഠിക്കുന്നവർ",
    working_outside: "പുറത്തു ജോലി ചെയ്യുന്നവർ",
    
    // Age categories
    child: "കുട്ടികൾ (15 വയസ്സിന് താഴെ)",
    youth: "യുവജനങ്ങൾ (15 - 35)",
    middle: "മദ്യവയസ്കർ (36 - 60)",
    senior: "മുതിർന്ന പൗരന്മാർ (60-ന് മുകളിൽ)",
    
    // Status
    active: "സജീവം",
    inactive: "അസജീവം",
    
    // Call Statuses
    not_called: "വിളിച്ചിട്ടില്ല",
    called: "വിളിച്ചു",
    confirmed: "പങ്കെടുക്കുമെന്ന് ഉറപ്പിച്ചു",
    not_attending: "പങ്കെടുക്കുന്നില്ല",
    no_response: "ഫോൺ എടുത്തില്ല",
    call_back_later: "പിന്നീട് വിളിക്കുക",
    
    // Program Statuses
    upcoming: "വരാനിരിക്കുന്നത്",
    completed: "പൂർത്തിയായത്",
    
    // Buttons & Actions
    addMember: "മെമ്പറെ ചേർക്കുക",
    editMember: "വിവരങ്ങൾ പുതുക്കുക",
    deleteMember: "മെമ്പറെ ഒഴിവാക്കുക",
    searchMember: "മെമ്പറെ തിരയുക...",
    importExcel: "CSV ഇമ്പോർട്ട്",
    exportExcel: "CSV എക്സ്പോർട്ട്",
    filterBy: "ഫിൽട്ടർ ചെയ്യുക",
    save: "സേവ് ചെയ്യുക",
    cancel: "ക്യാൻസൽ",
    call: "വിളിക്കുക",
    whatsapp: "വാട്സാപ്പ്",
    notes: "കുറിപ്പുകൾ",
    addNotes: "കുറിപ്പ് ചേർക്കുക",
    generateAssignment: "റാൻഡം അസൈൻമെന്റ് നടത്തുക",
    reGenerate: "വീണ്ടും വിഭജിക്കുക",
    saveAssignment: "ക്യാമ്പയിൻ സേവ് ചെയ്യുക",
    caller: "വിളിക്കുന്നയാൾ",
    selectCallers: "വിളിക്കുന്നവരെ തിരഞ്ഞെടുക്കുക",
    selectTargetMembers: "വിളിക്കേണ്ട മെമ്പർമാരെ തിരഞ്ഞെടുക്കുക",
    equalDistribution: "തുല്യ വിഭജന സംഗ്രഹം",
    manualAdjustment: "മാനുവൽ മാറ്റങ്ങൾ",
    
    // Public directory page
    viewOfficeBearers: "ഭാരവാഹികൾ",
    viewExecutives: "എക്സിക്യൂട്ടീവ് കമ്മിറ്റി",
    contactDetails: "ബന്ധപ്പെടേണ്ട വിവരങ്ങൾ",
    aboutUs: "സംഘടനയെക്കുറിച്ച്",
    welcomeText: "കമ്മ്യൂണിറ്റി പോർട്ടലിലേക്ക് സ്വാഗതം",
    welcomeSub: "ഡയറക്ടറികൾ, പ്രോഗ്രാം റിപ്പോർട്ടുകൾ, ഓർഗനൈസേഷൻ കോൺടാക്റ്റുകൾ എന്നിവ പരിശോധിക്കുക.",
    selectOrg: "വിശദവിവരങ്ങൾക്ക് ഒരു സംഘടന തിരഞ്ഞെടുക്കുക"
  }
};

interface LocaleContextProps {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_locale') as Language;
    if (saved === 'en' || saved === 'ml') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (lang: Language) => {
    setLocaleState(lang);
    localStorage.setItem('app_locale', lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[locale][key] || translations['en'][key] || String(key);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
