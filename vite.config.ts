import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const isProd = mode === "production" || command === "build";
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  // Hardcoded Supabase values for development
  const supabaseUrl = "https://gwyfopiauplascaofhii.supabase.co";
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eWZvcGlhdXBsYXNjYW9maGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjQ1NTksImV4cCI6MjA1ODQwMDU1OX0.bHQnCfb5GM3IUh_Y6U-LF2LzL0FBrgRPSqbcVVPbtec";

  // Only log environment variables in development mode
  if (mode === "development") {
    console.log("Environment variables loaded:", {
      SUPABASE_URL: env.SUPABASE_URL ? "[set]" : "[not set]",
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? "[set]" : "[not set]",
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? "[set]" : "[not set]",
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
        ? "[set]"
        : "[not set]",
      HARDCODED_URL: supabaseUrl,
      HARDCODED_KEY: "[set]", // Not showing the actual key in logs
    });
  }

  return {
    build: {
      // Production optimizations
      minify: isProd ? "terser" : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
      sourcemap: !isProd,
      // Split chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-toast",
            ],
            supabase: ["@supabase/supabase-js"],
          },
        },
      },
    },
    base: "/",
    appType: "spa",
    optimizeDeps: {
      entries: ["src/main.tsx", "src/tempobook/**/*"],
    },
    plugins: [
      react({
        plugins: conditionalPlugins,
      }),
      tempo(),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // @ts-ignore
      allowedHosts: true,
    },
    // Make all environment variables available to the app
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.SUPABASE_URL || env.VITE_SUPABASE_URL || supabaseUrl,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey,
      ),
    },
  };
});
