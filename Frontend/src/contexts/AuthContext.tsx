import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getProfileRequest, loginRequest, registerRequest } from "@/api/auth";
import { Role, User } from "@/types/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, role: Role) => Promise<User>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  // True when the current session still needs an OTP step before the
  // dashboard is accessible — either a never-verified registration, or a
  // fresh login-time 2FA challenge (when OTP_LOGIN_2FA_ENABLED=true server-side).
  otpPending: boolean;
  otpPurpose: "registration" | "login";
  clearOtpPending: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

// Sessions where a login-time 2FA challenge was issued (OTP_LOGIN_2FA_ENABLED
// server-side) need a lightweight flag independent of user.isVerified,
// since the user's account itself is already verified — only sessionStorage
// (not persisted across browser restarts) so it can't strand someone
// mid-session-forever if they navigate away before completing it.
const OTP_SESSION_KEY = "irm_otp_pending_purpose";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readStoredUser);
  // True while we re-validate an existing token against the backend on load.
  const [loading, setLoading] = useState(true);
  const [loginOtpPending, setLoginOtpPending] = useState(
    () => sessionStorage.getItem(OTP_SESSION_KEY) === "login"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    getProfileRequest()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalid/expired — api.ts interceptor already clears storage on 401.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (nextUser: User, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    const { user: loggedInUser, token, requiresOtpVerification, otpPurpose } = await loginRequest({
      email,
      password,
    });
    persist(loggedInUser, token);
    if (requiresOtpVerification && otpPurpose === "login") {
      sessionStorage.setItem(OTP_SESSION_KEY, "login");
      setLoginOtpPending(true);
    }
    return loggedInUser;
  };

  const register = async (fullName: string, email: string, password: string, role: Role) => {
    const { user: newUser, token } = await registerRequest({ fullName, email, password, role });
    persist(newUser, token);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem(OTP_SESSION_KEY);
    setLoginOtpPending(false);
    setUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const clearOtpPending = () => {
    sessionStorage.removeItem(OTP_SESSION_KEY);
    setLoginOtpPending(false);
  };

  const otpPending = Boolean(user && (!user.isVerified || loginOtpPending));
  const otpPurpose: "registration" | "login" = user && !user.isVerified ? "registration" : "login";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, otpPending, otpPurpose, clearOtpPending }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export type { Role };
