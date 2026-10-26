# 🔦 Searchlight

An AI-powered Chrome extension that helps students research smarter, not harder. Built for the Congressional App Challenge.

## Why Searchlight?

Research usually means a dozen open tabs, scattered notes, and no clear picture of how your sources connect. Searchlight keeps everything in one place, helping students discover relevant sources, save webpages, organize notes into projects, and visualize connections through an interactive Research Map. Gemini AI guides students to think critically and explore independently instead of simply giving them answers.

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

1. Open the GitHub repository link for this project.
2. Click the green `Code` button.
3. Select `Download ZIP` to download the project files.
4. Extract the ZIP file to a location on your computer.
5. Open `chrome://extensions` in Google Chrome.
6. Turn on Developer mode.
7. Click `Load unpacked` and select the extracted project folder.
8. Add your Gemini API key in the extension settings.

> Note: You must load the extracted folder, not the ZIP file itself. If you want to make changes to the project later, you can repeat the build steps in a local terminal and reload the extension in Chrome.

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
