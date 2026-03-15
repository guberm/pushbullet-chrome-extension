# Pushbullet Chrome Extension

A community-maintained Chrome extension that brings together your devices and the things you care about — push notifications, SMS, file sharing, and more. Fully migrated to **Manifest V3** with all Pro/paid gates removed so every feature works for free.

## What's different from the official extension

- **Manifest V3** — migrated from the deprecated MV2. Uses a service worker (`sw.js`) and an offscreen document (`background.html`) instead of a persistent background page. An RPC bridge (`page.js` / `rpc-server.js`) lets UI pages communicate with the background context.
- **All features unlocked** — every Pro/paid restriction has been removed. SMS replies, notification actions, quick replies, and all other gated features work without a subscription.
- **Bug fixes** — numerous runtime errors from the MV3 migration have been fixed, including notification delivery, button onclick proxying, offscreen document race conditions, and `checkNativeClient` callback handling.
- **Live Log Viewer** — built-in real-time log viewer with filtering, auto-scroll, and file download (accessible from Options).

## Features

- Push links, notes, files, and addresses between devices
- SMS messaging from your browser (send & reply)
- Android notification mirroring with action buttons
- Phone call notifications on your desktop
- Quick reply to SMS and notifications
- End-to-end encryption
- Dark mode
- Keyboard shortcuts
- Live debug log viewer (Options → Debug Logs)

## Installation

### Option A — Load unpacked (recommended for development)

1. Clone this repository:
   ```bash
   git clone https://github.com/guberm/pushbullet-chrome-extension.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `src/` folder
5. Click the Pushbullet icon in the toolbar and sign in

### Option B — Install from ZIP

1. Download `pushbullet-extension.zip` from this repository
2. Extract it — you'll get a folder with the extension files
3. Follow steps 2–5 above, selecting the extracted folder

## Project Structure

```
├── src/
│   ├── manifest.json         # MV3 manifest
│   ├── sw.js                 # Service worker entry point
│   ├── background.html       # Offscreen document (WebSocket, notifications)
│   ├── rpc-server.js         # RPC bridge: exposes pb object to UI pages
│   ├── page.js               # RPC client: proxies pb calls from UI pages
│   ├── panel.html / panel.js # Main popup UI
│   ├── options.html / options.js  # Settings page
│   ├── log-viewer.html / log-viewer.js  # Real-time log viewer
│   ├── _locales/             # i18n strings (29 languages)
│   └── ...                   # Additional JS, CSS, and assets
├── pushbullet-extension.zip  # Ready-to-install package
└── README.md
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` / `Cmd+Shift+K` | Dismiss the most recent notification |
| `Ctrl+Shift+X` / `Cmd+Shift+X` | Instantly push the current tab |
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Pop out the push panel |

Customize shortcuts at `chrome://extensions/shortcuts`.

## Debug Logging

1. Open **Options** → scroll to **Debug Logs**
2. Enable **"Enable full logging"**
3. Click **"📋 Open Live Log Viewer"** — a new tab opens with real-time logs
4. Use the filter bar to search, **⬇ Download** to save to a file, **🗑 Clear** to reset

## Requirements

- Google Chrome 109 or later (or any Chromium-based browser)
- A [Pushbullet](https://www.pushbullet.com) account (free account works — all features unlocked)

## License

Original extension © Pushbullet. Community modifications in this repository are provided as-is for personal use.
- Pushbullet app installed on your Android or iOS device (for mirroring features)

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Access the current tab URL when pushing |
| `contextMenus` | Right-click menu to push links/images |
| `cookies` | Authenticate with Pushbullet |
| `notifications` | Show desktop notifications |
| `idle` | Detect when the computer is idle |
| `offscreen` | Background audio/alert playback |

## Development Notes

- The extension uses **Manifest V3** and a service worker (`sw.js`) as the background script.
- End-to-end encryption is handled by `end-to-end.js` using the bundled `forge.min.js` crypto library.
- SMS and calling features require the Pushbullet Android app with the appropriate permissions granted.

## License

This extension is the property of [Pushbullet](https://www.pushbullet.com). This repository is for personal/archival use only.
