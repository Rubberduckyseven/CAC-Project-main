import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
    plugins: [{
        name: "copy-excalidraw-runtime-assets",
        closeBundle() {
            cpSync(
                resolve("node_modules/@excalidraw/excalidraw/dist/excalidraw-assets"),
                resolve("vendor/excalidraw-assets"),
                { recursive: true }
            );
        }
    }],
    define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.IS_PREACT": JSON.stringify("false")
    },
    build: {
        outDir: "vendor/excalidraw",
        emptyOutDir: true,
        lib: {
            entry: "src/excalidraw-graph.js",
            formats: ["es"],
            fileName: () => "excalidraw-graph.js"
        },
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css")
                    ? "excalidraw-graph.css"
                    : "assets/[name]-[hash][extname]"
            }
        }
    }
});
