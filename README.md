# Searchlight

## Build the graph editor

The research graph uses a locally bundled Excalidraw editor. Install dependencies and build the extension assets before loading or reloading the unpacked extension:

```sh
npm install
npm run build:graph
```

The build writes the local editor bundle to `vendor/excalidraw/`. It does not load editor code from a CDN.

Excalidraw is loaded only when a graph is opened. Use the **Backup** and **Restore** buttons in the research library to export or restore saved research, categories, and graphs. Backups do not include the Gemini API key; restoring replaces the current research library.
