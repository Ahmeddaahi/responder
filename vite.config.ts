import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    // Define global constants that will be replaced during build
    __APP_ENV__: JSON.stringify(mode),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define environment variables for production
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // Split vendor chunks for better caching
          // IMPORTANT: Don't split React - it needs to be in the main bundle
          // or handled by Vite's automatic chunking to avoid loading order issues
          if (id.includes('node_modules')) {
            // Only split the largest libraries that don't have tight React coupling
            // Separate large animation libraries (they can load independently)
            if (id.includes('framer-motion') || id.includes('motion') || id.includes('motion-dom')) {
              return 'vendor-animations';
            }
            if (id.includes('gsap') || id.includes('@gsap')) {
              return 'vendor-gsap';
            }
            // Separate Supabase (large, can load independently)
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Separate TanStack Query (can load independently)
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            // Let Vite handle React and other dependencies automatically
            // This ensures proper loading order and avoids undefined React errors
          }
        },
      },
    },
    // Enable source maps for production debugging (optional, can be removed for smaller bundles)
    sourcemap: false,
    // Optimize for production - using esbuild (default, faster) instead of terser
    minify: 'esbuild',
    // Optimize chunk splitting
    chunkSizeWarningLimit: 1000,
  },
}));