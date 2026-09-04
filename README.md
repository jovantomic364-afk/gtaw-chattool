# GTAW ChatTool

A browser-based GTA World chatlog formatter and scene builder for creating screenshot-ready RP chat.

## Features
- Auto-detect GTAW UCP vs GTAW Assistant logs
- Exact UCP `!{#RRGGBB}` colour parsing
- GTAW Assistant colour reconstruction
- Phone speech and `(Phone) *` emotes
- RP-only, OOC/system, time and character filtering
- Select, edit, hide, restore and reorder scene lines
- Undo/redo
- Live GTAW-style preview
- Browser-local project save/load
- Transparent PNG and plain-text export
- 720/1080p/1440p/4K width presets

## Privacy
The app is static and client-side. Logs are processed in the browser and saved projects use browser local storage.

## Deployment
This repository is designed for static hosting such as Cloudflare Pages. No build command is required; publish the repository root.

## Status
v1.0 alpha — parser rules will continue to be refined against real GTA World exports.
