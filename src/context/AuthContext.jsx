import { createContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);
const K = "bi-session";
const DEMO_EMAIL = "analyst@bamboo.io";
const DEMO_PASSWORD = "bamboo123";

function toAppUser(sessionUser) {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id || "demo-user",
    name:
      sessionUser.user_metadata?.name ||
      sessionUser.email?.split("@")[0] ||
      "User",
    email: sessionUser.email || "",
    role: sessionUser.user_metadata?.role || "Sustainability Analyst",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(K));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ? toAppUser(session.user) : null;

        if (nextUser) {
          localStorage.setItem(K, JSON.stringify(nextUser));
          setUser(nextUser);
        } else {
          localStorage.removeItem(K);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function login({ email, password }) {
    setLoading(true);

    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedPassword = String(password || "");

      if (!normalizedEmail.includes("@") || normalizedPassword.length < 6) {
        throw new Error("Use a valid email and at least six password characters.");
      }

      if (!supabase) {
        const isDemoUser =
          normalizedEmail === DEMO_EMAIL && normalizedPassword === DEMO_PASSWORD;

        if (!isDemoUser) {
          throw new Error(
            "Invalid demo credentials. Use analyst@bamboo.io / bamboo123, or configure Supabase in your environment."
          );
        }

        const demoUser = {
          id: "demo-user",
          name: "Abdul Raheem",
          email: normalizedEmail,
          role: "Sustainability Analyst",
        };

        localStorage.setItem(K, JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) throw error;

      const nextUser = toAppUser(data.user);
      if (nextUser) {
        localStorage.setItem(K, JSON.stringify(nextUser));
        setUser(nextUser);
      }

      return nextUser;
    } finally {
      setLoading(false);
    }
  }

  async function signup({ name, email, password }) {
    setLoading(true);

    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedPassword = String(password || "");
      const normalizedName = String(name || "").trim();

      if (!normalizedEmail.includes("@") || normalizedPassword.length < 6) {
        throw new Error("Use a valid email and at least six password characters.");
      }

      if (!supabase) {
        const demoUser = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name: normalizedName || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          role: "Sustainability Analyst",
        };

        localStorage.setItem(K, JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          data: {
            name: normalizedName || normalizedEmail.split("@")[0],
            role: "Sustainability Analyst",
          },
        },
      });

      if (error) throw error;

      if (data?.user && data.session) {
        const nextUser = toAppUser(data.user);
        localStorage.setItem(K, JSON.stringify(nextUser));
        setUser(nextUser);
        return nextUser;
      }

      return { created: true, email: normalizedEmail };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    if (supabase) {
      supabase.auth.signOut();
    }

    localStorage.removeItem(K);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, signup, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
