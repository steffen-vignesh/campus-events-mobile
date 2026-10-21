import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  year?: string;
  phone?: string;
  homeCountry?: string;
  studyProgram?: string;
  studentStatus?: string;
  germanLevel?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  homeCountry?: string;
  studyProgram?: string;
  studentStatus?: string;
  germanLevel?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Role and profile fields are authoritative in the `profiles` table (matches
// the web app) — auth user_metadata is only used at signup time and can go
// stale (e.g. an account promoted to admin directly in `profiles`).
async function loadProfile(userId: string, fallbackEmail: string): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name ?? fallbackEmail,
    email: data.email ?? fallbackEmail,
    role: (data.role as UserRole) ?? "student",
    department: data.department ?? undefined,
    year: data.year ?? undefined,
    phone: data.phone ?? undefined,
    homeCountry: data.home_country ?? undefined,
    studyProgram: data.study_program ?? undefined,
    studentStatus: data.student_status ?? undefined,
    germanLevel: data.german_level ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = session?.user ? await loadProfile(session.user.id, session.user.email!) : null;
      if (!mounted) return;
      setUser(profile);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user ? await loadProfile(session.user.id, session.user.email!) : null;
      if (!mounted) return;
      setUser(profile);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) setUser(await loadProfile(data.user.id, data.user.email!));
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setUser(await loadProfile(session.user.id, session.user.email!));
  };

  const register = async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: "student",
          department: data.studyProgram,
          year: data.studentStatus,
          phone: data.phone,
          home_country: data.homeCountry,
          study_program: data.studyProgram,
          student_status: data.studentStatus,
          german_level: data.germanLevel,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    if (authData.user) setUser(await loadProfile(authData.user.id, authData.user.email!));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
