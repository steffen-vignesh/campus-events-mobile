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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  year?: string;
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
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ? await loadProfile(session.user.id, session.user.email!) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ? await loadProfile(session.user.id, session.user.email!) : null);
    });

    return () => subscription.unsubscribe();
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

  const register = async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: "student",
          department: data.department,
          year: data.year,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    if (authData.user) setUser(await loadProfile(authData.user.id, authData.user.email!));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
