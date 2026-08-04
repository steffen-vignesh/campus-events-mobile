import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

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

const DEMO_USERS: (User & { password: string })[] = [
  { id: "admin1", name: "Dr. Ramesh Kumar", email: "admin@college.edu", password: "admin123", role: "admin", department: "Computer Science" },
  { id: "student1", name: "Arjun Mehta", email: "student@college.edu", password: "student123", role: "student", department: "Computer Science", year: "3rd Year" },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("campus_user").then((stored) => {
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: "Invalid email or password." };
    const { password: _, ...userData } = found;
    setUser(userData);
    await SecureStore.setItemAsync("campus_user", JSON.stringify(userData));
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync("campus_user");
  };

  const register = async (data: RegisterData) => {
    const exists = DEMO_USERS.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: "An account with this email already exists." };
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      year: data.year,
    };
    setUser(newUser);
    await SecureStore.setItemAsync("campus_user", JSON.stringify(newUser));
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
