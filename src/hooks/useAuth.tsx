import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthSession, UserProfile, Role } from '@/api/types';
import { loadSession, saveSession } from '@/api/client';
import { loginUser, logoutUser, getMyProfile, type LoginCredentials } from '@/api/auth.api';

interface AuthContextType {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  role: Role | null;
  dept: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMaintenanceStaff: boolean;
  isReporter: boolean; // Student or Faculty or other non-admin reporter
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => void;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load check
  useEffect(() => {
    const active = loadSession();
    if (active) {
      setSession(active);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const authSession = await loginUser(credentials);
      setSession(authSession);
      return authSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!session?.accessToken) return null;
    try {
      const profile = await getMyProfile();
      // Update session with latest returned profile
      const updatedSession: AuthSession = {
        ...session,
        user: {
          ...session.user,
          name: profile.name,
          email: profile.email_id,
          role: profile.role,
          dept: profile.dept,
        },
      };
      setSession(updatedSession);
      saveSession(updatedSession);
      return profile;
    } catch {
      return null;
    }
  }, [session]);

  const user = session?.user ?? null;
  const role = user?.role ?? null;
  const dept = user?.dept ?? null;
  const isAuthenticated = Boolean(session && session.accessToken && session.expiresAt > Date.now());

  // Maintenance operator detection rule:
  // Role must be 'office_staff' and department must be 'Campus Maintenance'
  const isMaintenanceStaff = useMemo(() => {
    if (!user) return false;
    if (user.role !== 'office_staff') return false;
    const cleanDept = (user.dept || '').trim().toLowerCase();
    return cleanDept.includes('maintenance');
  }, [user]);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  // Reporters are student, faculty, or office staff
  const isReporter = useMemo(() => {
    if (!user) return false;
    return user.role === 'student' || user.role === 'faculty' || user.role === 'office_staff';
  }, [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      dept,
      isAuthenticated,
      isLoading,
      isMaintenanceStaff,
      isReporter,
      isAdmin,
      login,
      logout,
      refreshProfile,
    }),
    [session, user, role, dept, isAuthenticated, isLoading, isMaintenanceStaff, isReporter, isAdmin, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
