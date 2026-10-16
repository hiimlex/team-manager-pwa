import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3333";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        // Prompt user to reload when new content is available
        devOptions: { enabled: true, type: "module" },
        includeAssets: ["favicon.png", "apple-touch-icon.png", "icons/*.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              // Cache API responses for 5 minutes (stale-while-revalidate)
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Cache player photos from Cloudinary
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              },
            },
          ],
        },
        manifest: {
          name: "Racha Vôlei",
          short_name: "Racha Vôlei",
          description:
            "Gerenciador de peladas de vôlei de areia — dupla e quarteto",
          theme_color: "#0D1117",
          background_color: "#0D1117",
          display: "standalone",
          display_override: ["standalone", "minimal-ui"],
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          lang: "pt-BR",
          categories: ["sports", "utilities"],
          icons: [
            { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
            { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
            { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
            { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
            { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          screenshots: [
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              form_factor: "narrow",
              label: "Racha Vôlei",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      // Expose on all interfaces so mobile on the same Wi-Fi can connect
      host: "0.0.0.0",
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/socket.io": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
