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
        console.log("Starting auth initialization...");

        // Simple session fetch without complex timeout
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session fetch error:", error);
        }

        console.log(
          "Initial session check:",
          session ? "Found session" : "No session"
        );

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("User found in session, fetching profile...");
          // Fetch profile with timeout protection
          try {
            const profile = await fetchProfile(session.user.id);
            if (mounted && profile) {
              console.log("Profile loaded successfully during initialization");
            }
          } catch (profileError) {
            console.error(
              "Profile fetch failed during initialization:",
              profileError
            );
          }
        }

        // Set loading to false after everything is complete
        if (mounted) {
          console.log(
            "Auth initialization completed, setting loading to false"
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);

        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add a fallback timeout to ensure loading is always resolved
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.log(
          "Auth initialization fallback timeout - setting loading to false"
        );
        setLoading(false);
      }
    }, 10000); // 10 second fallback

    initializeAuth().finally(() => {
      clearTimeout(fallbackTimeout);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("User authenticated, fetching profile...");
        // Fetch profile with timeout protection
        try {
          const profile = await fetchProfile(session.user.id);
          if (mounted && profile) {
            console.log("Profile loaded successfully during auth state change");
          }
        } catch (profileError) {
          console.error(
            "Profile fetch failed during auth state change:",
            profileError
          );
        }
      } else {
        setProfile(null);
      }

      // Set loading to false after profile fetch completes
      if (mounted) {
        console.log("Auth state change completed, setting loading to false");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log(`Fetching profile for user: ${userId}`);

      // Add a timeout to prevent hanging
      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Profile fetch timeout after 5 seconds")),
          5000
        )
      );

      const { data, error } = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as {
        data: Profile | null;
        error: {
          code: string;
          message: string;
          details?: string;
          hint?: string;
        } | null;
      };

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
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
      console.error("Profile fetch failed, setting profile to null");
      setProfile(null);
      return null;
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
