// Keep Lovable's Vite/TanStack integration for local development, but emit
// Vercel Functions output when the project is built by Vercel.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: process.env.VERCEL ? { preset: "vercel" } : true,
  tanstackStart: {
    server: { entry: "server" },
  },
});
