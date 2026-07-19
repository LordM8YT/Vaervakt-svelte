import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const pluginDirectory = resolve("no.vaervakt.streamdeck.sdPlugin");

function normalizeGeneratedLineEndings() {
  return {
    name: "normalize-generated-line-endings",
    async closeBundle() {
      await Promise.all(
        ["plugin.html", "vaervakt.html"].map(async (fileName) => {
          const filePath = resolve(pluginDirectory, fileName);
          const source = await readFile(filePath, "utf8");
          const normalized = source
            .replace(/\r\n?/g, "\n")
            .replace(/\n[ \t]*\n(?=[ \t]*<\/body>)/g, "\n");
          await writeFile(filePath, normalized, "utf8");
        })
      );
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [svelte(), normalizeGeneratedLineEndings()],
  build: {
    outDir: pluginDirectory,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        plugin: resolve("plugin.html"),
        vaervakt: resolve("vaervakt.html"),
      },
      output: {
        entryFileNames: "bin/[name].js",
        chunkFileNames: "bin/[name].js",
        assetFileNames: "bin/[name][extname]",
      },
    },
  },
});
