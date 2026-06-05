// vite.config.ts
import { defineConfig } from "file:///C:/Users/Ahmed/OneDrive/Documents/resbonder/responder/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Ahmed/OneDrive/Documents/resbonder/responder/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/Ahmed/OneDrive/Documents/resbonder/responder/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Ahmed\\OneDrive\\Documents\\resbonder\\responder";
var vite_config_default = defineConfig(({ mode }) => ({
  define: {
    // Define global constants that will be replaced during build
    __APP_ENV__: JSON.stringify(mode)
  },
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Define environment variables for production
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion") || id.includes("motion") || id.includes("motion-dom")) {
              return "vendor-animations";
            }
            if (id.includes("gsap") || id.includes("@gsap")) {
              return "vendor-gsap";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("@tanstack")) {
              return "vendor-query";
            }
          }
        }
      }
    },
    // Enable source maps for production debugging (optional, can be removed for smaller bundles)
    sourcemap: false,
    // Optimize for production - using esbuild (default, faster) instead of terser
    minify: "esbuild",
    // Optimize chunk splitting
    chunkSizeWarningLimit: 1e3
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBaG1lZFxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxccmVzYm9uZGVyXFxcXHJlc3BvbmRlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWhtZWRcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXHJlc2JvbmRlclxcXFxyZXNwb25kZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FobWVkL09uZURyaXZlL0RvY3VtZW50cy9yZXNib25kZXIvcmVzcG9uZGVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIGRlZmluZToge1xyXG4gICAgLy8gRGVmaW5lIGdsb2JhbCBjb25zdGFudHMgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIGR1cmluZyBidWlsZFxyXG4gICAgX19BUFBfRU5WX186IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIC8vIERlZmluZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHByb2R1Y3Rpb25cclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBleHRlcm5hbDogW10sXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XHJcbiAgICAgICAgICAvLyBTcGxpdCB2ZW5kb3IgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgICAgLy8gSU1QT1JUQU5UOiBEb24ndCBzcGxpdCBSZWFjdCAtIGl0IG5lZWRzIHRvIGJlIGluIHRoZSBtYWluIGJ1bmRsZVxyXG4gICAgICAgICAgLy8gb3IgaGFuZGxlZCBieSBWaXRlJ3MgYXV0b21hdGljIGNodW5raW5nIHRvIGF2b2lkIGxvYWRpbmcgb3JkZXIgaXNzdWVzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgc3BsaXQgdGhlIGxhcmdlc3QgbGlicmFyaWVzIHRoYXQgZG9uJ3QgaGF2ZSB0aWdodCBSZWFjdCBjb3VwbGluZ1xyXG4gICAgICAgICAgICAvLyBTZXBhcmF0ZSBsYXJnZSBhbmltYXRpb24gbGlicmFyaWVzICh0aGV5IGNhbiBsb2FkIGluZGVwZW5kZW50bHkpXHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpIHx8IGlkLmluY2x1ZGVzKCdtb3Rpb24nKSB8fCBpZC5pbmNsdWRlcygnbW90aW9uLWRvbScpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItYW5pbWF0aW9ucyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdnc2FwJykgfHwgaWQuaW5jbHVkZXMoJ0Bnc2FwJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1nc2FwJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTZXBhcmF0ZSBTdXBhYmFzZSAobGFyZ2UsIGNhbiBsb2FkIGluZGVwZW5kZW50bHkpXHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1zdXBhYmFzZSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU2VwYXJhdGUgVGFuU3RhY2sgUXVlcnkgKGNhbiBsb2FkIGluZGVwZW5kZW50bHkpXHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1xdWVyeSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gTGV0IFZpdGUgaGFuZGxlIFJlYWN0IGFuZCBvdGhlciBkZXBlbmRlbmNpZXMgYXV0b21hdGljYWxseVxyXG4gICAgICAgICAgICAvLyBUaGlzIGVuc3VyZXMgcHJvcGVyIGxvYWRpbmcgb3JkZXIgYW5kIGF2b2lkcyB1bmRlZmluZWQgUmVhY3QgZXJyb3JzXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgZm9yIHByb2R1Y3Rpb24gZGVidWdnaW5nIChvcHRpb25hbCwgY2FuIGJlIHJlbW92ZWQgZm9yIHNtYWxsZXIgYnVuZGxlcylcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICAvLyBPcHRpbWl6ZSBmb3IgcHJvZHVjdGlvbiAtIHVzaW5nIGVzYnVpbGQgKGRlZmF1bHQsIGZhc3RlcikgaW5zdGVhZCBvZiB0ZXJzZXJcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc3BsaXR0aW5nXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgfSxcclxufSkpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBK1YsU0FBUyxvQkFBb0I7QUFDNVgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQTtBQUFBLElBRU4sYUFBYSxLQUFLLFVBQVUsSUFBSTtBQUFBLEVBQ2xDO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQzlFLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDTixjQUFjLENBQUMsT0FBTztBQUlwQixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFHL0IsZ0JBQUksR0FBRyxTQUFTLGVBQWUsS0FBSyxHQUFHLFNBQVMsUUFBUSxLQUFLLEdBQUcsU0FBUyxZQUFZLEdBQUc7QUFDdEYscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLE1BQU0sS0FBSyxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQy9DLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUFJLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDNUIscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUdGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFdBQVc7QUFBQTtBQUFBLElBRVgsUUFBUTtBQUFBO0FBQUEsSUFFUix1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
