'use client';

import React from 'react';
import { LocaleProvider } from '@/lib/locale';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LocaleProvider>
  );
}
