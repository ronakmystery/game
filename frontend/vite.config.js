import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",   // allow external connections
    port: 5175,        // match your Dockerfile
    strictPort: true,

    watch: {
      usePolling: true,
      interval: 100,
    },

    // 👇 MOST IMPORTANT PART FOR LAN + DOCKER
    hmr: {
      host: "10.226.221.155",   // your laptop's LAN IP
      port: 5175,
    },
  },
});
