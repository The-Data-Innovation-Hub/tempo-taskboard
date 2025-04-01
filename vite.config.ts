import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// Security headers for the application
const securityHeaders = {
  // Content Security Policy
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://storage.googleapis.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://images.unsplash.com; img-src 'self' data: https://*.supabase.co https://api.dicebear.com https://images.unsplash.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-ancestors 'none';",

  // Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // X-Content-Type-Options
  "X-Content-Type-Options": "nosniff",

  // X-Frame-Options
  "X-Frame-Options": "DENY",

  // X-XSS-Protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const isProd = mode === "production" || command === "build";
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  // Use environment variables for Supabase connection
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";

  // Only log environment variables in development mode
  if (mode === "development") {
    console.log("Environment variables loaded:", {
      SUPABASE_URL: env.SUPABASE_URL ? "[set]" : "[not set]",
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ? "[set]" : "[not set]",
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? "[set]" : "[not set]",
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
        ? "[set]"
        : "[not set]",
      SUPABASE_URL: supabaseUrl ? "[set]" : "[not set]",
      SUPABASE_ANON_KEY: supabaseAnonKey ? "[set]" : "[not set]",
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
              pure_funcs: [
                "console.log",
                "console.info",
                "console.debug",
                "console.warn",
              ],
              passes: 2,
              ecma: 2020,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      sourcemap: !isProd,
      // Optimize CSS
      cssCodeSplit: true,
      cssMinify: isProd,
      // Enable tree shaking
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000,
      // Split chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-toast",
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
            forms: ["react-hook-form", "zod"],
          },
        },
      },
    },
    // Enable build-time optimizations
    esbuild: {
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
      legalComments: "none",
      treeShaking: true,
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
    // Optimize dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@supabase/supabase-js",
        "react-beautiful-dnd",
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "zustand",
        "framer-motion",
      ],
      esbuildOptions: {
        target: "es2020",
      },
    },
    // Preload critical assets
    preview: {
      port: 4173,
      host: true,
    },
    // Make all environment variables available to the app
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || env.SUPABASE_URL || "",
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "",
      ),
    },
  };
});
