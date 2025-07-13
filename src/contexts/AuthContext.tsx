import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface Profile {
  id: string;
  email: string;
  role: "client" | "admin";
  full_name: string | null;
  company_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: {
      full_name: string;
      company_name?: string;
      role?: "client" | "admin";
    }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log(
          "Initial session check:",
          session ? "Found session" : "No session"
        );

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          // Add a small delay to ensure smooth transitions
          setTimeout(() => {
            if (mounted) {
              setLoading(false);
            }
          }, 200);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              setLoading(false);
            }
          }, 200);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        // Add a small delay to ensure smooth transitions
        setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 200);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log(
        "Profile fetch result:",
        data ? "Profile found" : "No profile"
      );
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      return null;
    } finally {
      // Only set loading to false if we're not in the middle of an auth state change
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: {
      full_name: string;
      company_name?: string;
      role?: "client" | "admin";
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: userData.full_name,
        company_name: userData.company_name || null,
        role: userData.role || "client",
      });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local state
    setUser(null);
    setProfile(null);
    setSession(null);

    // Redirect to login page
    window.location.href = "/login";
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
