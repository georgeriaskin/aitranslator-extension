# Aitranlator Chrome Extension

## Setup

To test locally:
- In root directory: `npm install` (if not done)
- Run local server: `npm run dev` (starts API at http://localhost:3000)

## Load Extension

Open `chrome://extensions/`, enable "Developer mode", click "Load unpacked", select the `chrome-extension/` folder.

## Testing

Click the extension icon in toolbar to open popup. Enter text, select languages, translate—ensure local server is running for API calls.

## Note

After deployment, update `API_BASE` in [`script.js`](script.js) to Vercel URL.

## Icons

Placeholder PNGs in `icons/`; replace with real ones later.