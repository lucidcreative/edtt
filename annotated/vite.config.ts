// Vite configuration for development server and build process
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    // React plugin for JSX transformation and Hot Module Replacement
    react(),
    // Runtime error overlay plugin for better development experience
    runtimeErrorOverlay(),
    // Conditionally load Replit cartographer plugin only in development and on Replit
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // Dynamic import of Replit cartographer for code mapping
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []), // Empty array for production or non-Replit environments
  ],
  resolve: {
    alias: {
      // Path alias for client source directory - enables @/ imports
      "@": path.resolve(import.meta.dirname, "client", "src"),
      // Path alias for shared types directory - enables @shared/ imports
      "@shared": path.resolve(import.meta.dirname, "shared"),
      // Path alias for attached assets directory - enables @assets/ imports
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Set root directory to client folder for frontend files
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    // Output directory for production build files
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    // Clear output directory before building
    emptyOutDir: true,
  },
  server: {
    fs: {
      // Enable strict file system access for security
      strict: true,
      // Deny access to hidden files and directories
      deny: ["**/.*"],
    },
  },
});