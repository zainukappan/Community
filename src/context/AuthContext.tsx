'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, Profile } from '@/lib/db';
import { useRouter } from 'next/navigation';

interface AuthContextProps {
  user: Profile | null;
  login: (email: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Initial load from local cache
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const profiles = db.getProfiles();
        const activeProfile = profiles.find(p => p.id === parsed.id && p.status === 'active');
        if (activeProfile) {
          setUser(activeProfile);
        } else {
          localStorage.removeItem('auth_user');
        }
      } catch (e) {
        console.error('Failed to parse auth user', e);
      }
    }
    setIsLoading(false);

    // 2. Perform background sync from Supabase
    if (db.isSyncEnabled()) {
      db.syncFromSupabase().then(() => {
        const updatedSavedUser = localStorage.getItem('auth_user');
        if (updatedSavedUser) {
          try {
            const parsed = JSON.parse(updatedSavedUser);
            const profiles = db.getProfiles();
            const activeProfile = profiles.find(p => p.id === parsed.id && p.status === 'active');
            if (activeProfile) {
              setUser(activeProfile);
            } else {
              setUser(null);
              localStorage.removeItem('auth_user');
            }
          } catch (e) {
            console.error('Failed to parse auth user after sync', e);
          }
        }
      });
    }
  }, []);

  const login = (email: string): boolean => {
    const profiles = db.getProfiles();
    const found = profiles.find(
      p => p.email.toLowerCase() === email.toLowerCase() && p.status === 'active'
    );
    
    if (found) {
      setUser(found);
      localStorage.setItem('auth_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
