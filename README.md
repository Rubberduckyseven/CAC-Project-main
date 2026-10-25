# 🔦 Searchlight

An AI-powered Chrome extension that helps students research smarter, not harder. Built for the Congressional App Challenge.

## Why Searchlight?

Research usually means a dozen open tabs, scattered notes, and no clear picture of how your sources connect. Searchlight keeps everything in one place and uses AI to guide your thinking instead of handing you answers.

## Features

| Feature | What it does |
| --- | --- |
|Explore sources | Find and open relevant sources without losing your place |
|Save webpages | Save useful pages with one click |
|Organize into projects | Group pages and notes by topic or assignment |
|Research Map | See how your ideas and sources connect on an interactive graph |
|Gemini-powered guidance | Prompts you to think critically and explore on your own |

## Installation

Searchlight is loaded as an unpacked extension in Chrome.

1. Clone the repo:

```sh
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

2. Install dependencies and build the Research Map editor:

```sh
npm install
npm run build:graph
```

The build writes the local Excalidraw bundle to `vendor/excalidraw/`. No editor code is loaded from a CDN.

3. Load the extension in Chrome:
   1. Open `chrome://extensions`
   2. Turn on Developer mode
   3. Click `Load unpacked` and select this project folder
   4. Add your Gemini API key in the extension settings

> After changing code, re-run `npm run build:graph` and click the reload icon on the extension card.

## How to Use

1. Click the Searchlight icon in your Chrome toolbar.
2. Create a project for your topic.
3. Save pages and add notes as you research.
4. Open the Research Map to see connections between your ideas.

## Built With

- JavaScript, HTML, CSS (Chrome Extension, Manifest V3)
- Google Gemini API
- Excalidraw for the Research Map
- Vite for bundling

## Project Structure

```text
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── popup.js / .css     # Extension popup UI
├── research-map.html   # Research Map page
├── research-map.js     # Research Map logic
├── src/                # Source for the graph editor build
├── vendor/             # Built Excalidraw bundle (generated)
├── vite.config.mjs     # Build configuration
├── package.json        # Dependencies and scripts
├── README.md           # Project overview and setup
└── index.css           # Shared styling
```

## About

Created for the Congressional App Challenge 2026.
