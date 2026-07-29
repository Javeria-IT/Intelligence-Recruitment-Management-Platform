import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "candidate" | "recruiter";
export interface User {
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  title?: string;
  phone?: string;
  location?: string;
  about?: string;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => void;
  register: (name: string, email: string, role: Role) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);
  const login = (email: string, role: Role) => {
    const name = email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setUser({ name, email, role, avatar: `https://i.pravatar.cc/150?u=${email}`, title: role === "candidate" ? "Software Engineer" : "Senior Recruiter" });
  };
  const register = (name: string, email: string, role: Role) => {
    setUser({ name, email, role, avatar: `https://i.pravatar.cc/150?u=${email}`, title: role === "candidate" ? "Software Engineer" : "Senior Recruiter" });
  };
  const logout = () => setUser(null);
  const updateUser = (patch: Partial<User>) =>
    setUser((u) => (u ? { ...u, ...patch } : u));
  return <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
