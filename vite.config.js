import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

function assetManifest() {
  return {
    name: "vaervakt-asset-manifest",
    generateBundle(_options, bundle) {
      const files = {};
      const entrypoints = [];

      Object.values(bundle).forEach((item) => {
        const sourceName = item.type === "chunk" ? item.name : item.name || item.fileName;
        files[sourceName] = `/${item.fileName}`;
        if (item.type === "chunk" && item.isEntry) {
          entrypoints.push(`/${item.fileName}`);
        }
      });

      this.emitFile({
        type: "asset",
        fileName: "asset-manifest.json",
        source: JSON.stringify({ files, entrypoints }, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), assetManifest()],
  build: {
    outDir: "build",
    emptyOutDir: true,
    assetsDir: "static",
    rollupOptions: {
      output: {
        entryFileNames: "static/js/[name].[hash].js",
        chunkFileNames: "static/js/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "static/css/[name].[hash][extname]";
          }
          return "static/media/[name].[hash][extname]";
        },
      },
    },
  },
});
