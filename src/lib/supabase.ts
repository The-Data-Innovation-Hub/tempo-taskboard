import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

// Define hardcoded values for Supabase connection
const HARDCODED_URL = "https://gwyfopiauplascaofhii.supabase.co";
const HARDCODED_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eWZvcGlhdXBsYXNjYW9maGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjQ1NTksImV4cCI6MjA1ODQwMDU1OX0.bHQnCfb5GM3IUh_Y6U-LF2LzL0FBrgRPSqbcVVPbtec";

// Use environment variables with fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// Only log environment variables in development mode
if (import.meta.env.DEV) {
  console.log("Supabase environment variables check:");
  console.log(
    `VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? "Set" : "Not set"}`,
  );
  console.log(
    `VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Not set"}`,
  );

  // Log connection status for debugging
  console.log("Supabase connection status:", {
    usingRealUrl:
      supabaseUrl === HARDCODED_URL ? "Using hardcoded URL" : "Using env URL",
    usingRealKey:
      supabaseAnonKey === HARDCODED_KEY
        ? "Using hardcoded key"
        : "Using env key",
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length || 0,
  });
}

// Create a complete mock implementation of the Supabase client
const createMockClient = () => {
  console.warn(
    "Using mock Supabase implementation - this may cause issues with real data.",
  );

  // Create a more complete mock auth object
  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      if (import.meta.env.PROD) {
        console.error("Mock Supabase client used in production environment");
        return {
          data: { user: null },
          error: { message: "Supabase configuration error" },
        };
      }
      return {
        data: { user: null },
        error: { message: "Invalid credentials" },
      };
    },
    signUp: async ({ email, password, options }: any) => ({
      data: { user: null },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      if (import.meta.env.DEV) {
        console.log("Mock onAuthStateChange called");
      }
      // Immediately call the callback with null session to simulate no auth
      setTimeout(() => {
        callback("SIGNED_OUT", { session: null });
      }, 0);

      return {
        data: { subscription: { unsubscribe: () => {} } },
      };
    },
  };

  return {
    auth: mockAuth,
    from: (table: string) => ({
      select: (columns: string = "*") => ({
        eq: (column: string, value: any) => ({
          single: async () => ({ data: null, error: null }),
          order: (column: string, { ascending }: any = {}) => ({
            data: [],
            error: null,
          }),
        }),
        order: (column: string, { ascending }: any = {}) => ({
          data: [],
          error: null,
        }),
        neq: (column: string, value: any) => ({ data: [], error: null }),
      }),
      insert: (values: any) => ({
        select: (columns: string = "*") => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({ error: null }),
        neq: (column: string, value: any) => ({ error: null }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({ error: null }),
      }),
      count: (options: any = {}) => ({ count: 0, error: null }),
    }),
    rpc: (functionName: string, params: any = {}) => ({
      data: null,
      error: null,
    }),
    functions: {
      invoke: (functionName: string, options: any = {}) => ({
        data: null,
        error: null,
      }),
    },
  };
};

// Create the real Supabase client
const createRealClient = () => {
  if (import.meta.env.DEV) {
    console.log("Creating real Supabase client with:", {
      supabaseUrl,
      keyLength: supabaseAnonKey?.length || 0,
    });
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { "x-application-name": "project-management-app" },
    },
  });
};

// Use the real client if environment variables are available, otherwise use mock
const isRealSupabase =
  !!import.meta.env.VITE_SUPABASE_URL &&
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variables status for debugging only in development
if (import.meta.env.DEV) {
  console.log("Supabase environment variables status:", {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "Set" : "Not set",
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
      ? "Set"
      : "Not set",
  });
}

const client = isRealSupabase ? createRealClient() : createMockClient();

// Export the client
export const supabase = client;
