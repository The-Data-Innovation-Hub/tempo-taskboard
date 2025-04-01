import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";
import type { Database } from "@/types/supabase";

type AuthResponse = {
  data: {
    user: any;
    session: any;
  };
  error: Error | null;
};

type SignOutResponse = {
  error: Error | null;
};

type SessionResponse = {
  data: {
    session: any;
  };
  error: Error | null;
};

type ProfileResponse = {
  data: Database["public"]["Tables"]["profiles"]["Row"] | null;
  error: Error | null;
};

type UserResponse = {
  data: any;
  error: Error | null;
};

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  jobTitle?: string;
  organizationId?: string;
  organization?: any;
  projects?: any[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// No mock users - using Supabase authentication only

// Version to force state reset when needed
const AUTH_STORE_VERSION = "1.0.3";

export const useAuth = create<AuthState>(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          // Supabase login attempt
          console.log("Attempting Supabase login for", email);
          const { data, error } = (await supabase.auth.signInWithPassword({
            email,
            password,
          })) as AuthResponse;

          if (error) {
            console.error("Supabase login error:", error);
            console.log("Error details:", JSON.stringify(error));
            throw new Error(`Login failed: ${error.message}`);
          }

          if (!data.user) {
            throw new Error("No user returned from Supabase");
          }

          // Try to fetch profile data, but handle errors gracefully
          let profileData = null;
          try {
            const { data: profile, error } = (await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single()) as ProfileResponse;

            if (!error) {
              profileData = profile;
              console.log("Profile data fetched successfully:", profileData);
            } else {
              console.warn("Could not fetch profile data during login:", error);
            }
          } catch (profileError) {
            console.warn("Error fetching profile during login:", profileError);
          }

          // Check for role in user metadata first, then profile data
          const userMetaRole = data.user.user_metadata?.role as UserRole;
          const appMetaRole = data.user.app_metadata?.role as UserRole;

          const role =
            profileData?.role || userMetaRole || appMetaRole || "user";
          console.log("Determined user role:", role);
          console.log("User metadata:", data.user.user_metadata);
          console.log("App metadata:", data.user.app_metadata);

          const user: User = {
            id: data.user.id,
            email: data.user.email || "",
            name: profileData?.name || data.user.email?.split("@")[0] || "",
            role: role,
            avatar:
              profileData?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
            jobTitle: profileData?.job_title || undefined,
            organizationId: profileData?.organization_id || undefined,
          };

          console.log("Final user object:", user);
          set({ user, isAuthenticated: true });
          return user;
        } catch (error: any) {
          console.error("Login error:", error);
          throw new Error(error.message || "Login failed");
        }
      },
      signup: async (
        name: string,
        email: string,
        password: string,
        role: UserRole = "user",
        sendEmail: boolean = true,
      ) => {
        try {
          // Use regular signUp instead of admin API
          const { data, error } = (await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role,
              },
            },
          })) as AuthResponse;

          if (error) {
            throw new Error(error.message);
          }

          if (!data.user) {
            throw new Error("No user returned from Supabase");
          }

          // IMPORTANT: Create the user record in public.users FIRST
          // This is critical for RLS policies to work correctly
          const { error: userError } = (await supabase
            .from("users")
            .insert([{ id: data.user.id }])) as UserResponse;

          if (userError) {
            console.error("Error creating user record:", userError);
            throw new Error(
              `Failed to create user record: ${userError.message}`,
            );
          }

          // Now create the profile record AFTER the user record exists
          const { error: profileError } = (await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                name,
                email,
                role,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              },
            ])) as UserResponse;

          if (profileError) {
            console.error("Error creating profile:", profileError);
            throw new Error(
              `Error creating user profile: ${profileError.message}`,
            );
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email || "",
            name,
            role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            jobTitle: undefined,
            organizationId: undefined,
          };

          // Email functionality has been removed
          if (sendEmail) {
            console.log("Mock welcome email would be sent to:", email);
            // No actual email is sent
          }

          set({ user, isAuthenticated: true });
          return user;
        } catch (error: any) {
          console.error("Signup error:", error);
          throw new Error(error.message || "Signup failed");
        }
      },
      logout: async () => {
        try {
          // Real Supabase logout
          const { error } = (await supabase.auth.signOut()) as SignOutResponse;
          if (error) {
            console.error("Error signing out:", error);
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },
      updateUser: async (userData) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          console.log("Updating user profile with data:", userData);

          // Update profile in the database
          const { error } = (await supabase
            .from("profiles")
            .update(userData)
            .eq("id", currentUser.id)) as UserResponse;

          if (error) {
            console.error("Supabase update error:", error);
            throw new Error("Error updating user profile");
          }

          console.log("Profile updated successfully in database");

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        } catch (error: any) {
          console.error("Update user error:", error);
          throw new Error(error.message || "Failed to update user");
        }
      },
      refreshSession: async () => {
        try {
          const { data } =
            (await supabase.auth.getSession()) as SessionResponse;

          if (data.session) {
            // Fetch user profile
            // Try to fetch profile data, but handle errors gracefully
            let profileData = null;
            try {
              const { data: profile, error } = (await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.session.user.id)
                .single()) as ProfileResponse;

              if (!error) {
                profileData = profile;
                console.log(
                  "Profile data fetched during refresh:",
                  profileData,
                );
              } else {
                console.warn("Could not fetch profile data:", error);
              }
            } catch (profileError) {
              console.warn("Error fetching profile:", profileError);
            }

            // Check for role in user metadata first, then profile data
            const userMetaRole = data.session.user.user_metadata
              ?.role as UserRole;
            const appMetaRole = data.session.user.app_metadata
              ?.role as UserRole;

            const role =
              profileData?.role || userMetaRole || appMetaRole || "user";
            console.log("Determined user role during refresh:", role);

            const user: User = {
              id: data.session.user.id,
              email: data.session.user.email || "",
              name:
                profileData?.name ||
                data.session.user.email?.split("@")[0] ||
                "",
              role: role,
              avatar:
                profileData?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.session.user.email}`,
              jobTitle: profileData?.job_title || undefined,
              organizationId: profileData?.organization_id || undefined,
            };

            console.log("Final user object after refresh:", user);
            set({ user, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error("Session refresh error:", error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
      version: AUTH_STORE_VERSION,
      onRehydrateStorage: () => (state) => {
        // Reset to logged out state with version change
        if (state) {
          console.log(
            "Auth storage rehydrated with version",
            AUTH_STORE_VERSION,
          );
        }
      },
    },
  ),
);

// Auth guard hook for protecting routes
export const useAuthGuard = () => {
  const { isAuthenticated, user } = useAuth();

  return {
    isAuthenticated,
    isAdmin: isAuthenticated && user?.role === "admin",
    isUser: isAuthenticated && user?.role === "user",
    user,
  };
};
