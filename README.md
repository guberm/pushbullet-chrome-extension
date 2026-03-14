# Pushbullet Chrome Extension

A Chrome extension that brings together your devices, friends, and the things you care about. Built on Manifest V3 with Dark Mode support.

## Features

- Push links, notes, files, and addresses between devices
- SMS messaging from your browser
- Phone call notifications mirrored to your desktop
- Real-time notifications mirroring from your Android device
- End-to-end encryption support
- Dark mode
- Keyboard shortcuts

## Project Structure

```
├── src/                  # Extension source files
│   ├── manifest.json     # Extension manifest (MV3)
│   ├── sw.js             # Service worker (background)
│   ├── panel.html        # Main popup UI
│   ├── panel.js          # Popup logic
│   ├── options.html      # Options/settings page
│   ├── options.js        # Settings logic
│   ├── _locales/         # Internationalization strings (29 languages)
│   └── ...               # Additional JS, CSS, and asset files
└── README.md
```

## Installation (Load Unpacked)

1. Clone this repository:
   ```bash
   git clone https://github.com/guberm/pushbullet-chrome-extension.git
   cd pushbullet-chrome-extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`.

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **Load unpacked** and select the `src/` folder inside the cloned repository.

5. The Pushbullet icon will appear in your Chrome toolbar. Click it and sign in with your Pushbullet account.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` / `Cmd+Shift+K` | Dismiss the most recent notification |
| `Ctrl+Shift+X` / `Cmd+Shift+X` | Instantly push the current tab |

You can customise shortcuts at `chrome://extensions/shortcuts`.

## Requirements

- Google Chrome 109 or later
- A [Pushbullet](https://www.pushbullet.com) account
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
