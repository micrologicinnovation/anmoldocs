import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // This forces Lovable to build for Vercel instead of Cloudflare
      nitro({ preset: "vercel" }),
    ],
  },
});