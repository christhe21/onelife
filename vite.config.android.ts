// Static (SPA) build used to bundle the web app into the Android APK
// (android/app/src/main/assets/www). The regular web/Cloudflare build in
// vite.config.ts is untouched — build with:
//   bun run build:android   (vite build --config vite.config.android.ts)
//
// Differences from the web build:
//   - nitro/Cloudflare packaging disabled (no server runtime inside the APK)
//   - TanStack Start SPA mode: prerenders a client shell to /index.html so the
//     Kotlin WebViewAssetLoader can serve every route (/, /home, /create-goal)
//     from a single static entry point.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
      },
    },
  },
});
