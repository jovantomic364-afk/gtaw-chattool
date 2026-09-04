# GTAW ChatTool

A browser-based chatlog formatter and screenshot tool for **GTA World** roleplay.

GTAW ChatTool takes large GTAW chatlogs and makes it easier to isolate a scene, clean it up, recreate GTAW chat formatting, and turn it into a screenshot-ready image.

## Features

### Chat Formatter

Paste a GTAW chatlog and quickly isolate the RP you actually want.

- Supports **GTAW UCP exports**
- Supports **GTAW Assistant logs**
- Automatic log format detection
- Preserves embedded UCP colour codes
- Reconstructs GTAW colours for Assistant logs
- Filter by character
- Filter messages by contact
- Separate **in-person RP** and **phone calls**
- Include/exclude OOC and system lines
- Filter by time range
- Editable filtered output
- Delete unwanted lines or fix typos before export
- Live GTAW-style preview
- Adjustable font size and chat width
- Optional timestamps and chat background
- Export chat as PNG
- Copy cleaned log text

### Screenshot Composer

Turn your cleaned RP into a finished screenshot.

- Send the current scene directly from Chat Formatter
- Upload a GTA screenshot
- Overlay GTAW-formatted chat
- Drag the chat into position
- Adjust chat width and font size
- Adjustable chat background opacity
- Toggle timestamps
- Supports UCP and Assistant formatting
- Output presets for:
  - 1920×1080
  - 2560×1440
  - 3840×2160
  - 1080×1080
  - 1080×1350
- Export the completed composition as PNG

## Workflow

1. Paste your GTAW log into **Chat Formatter**.
2. Select the characters involved in the scene.
3. Choose whether you want in-person RP, phone calls, messages, OOC, etc.
4. Use the time filter if needed.
5. Edit the resulting **Filtered Log** to remove unwanted lines, fix typos or condense RP.
6. Check the live GTAW preview.
7. Export the chat directly, or choose **Open in Screenshot Composer**.
8. Upload your GTA screenshot, position the chat and export the finished image.

## GTAW Log Support

### UCP

UCP exports contain GTAW's original colour information, including codes such as:

`!{#C2A2DA}`

GTAW ChatTool uses these embedded colours rather than attempting to guess them.

### GTAW Assistant

Assistant logs are plain text and don't contain the same colour metadata.

ChatTool detects common GTAW syntax including:

- Speech
- `/me` emotes
- `>` emotes
- Phone speech
- Phone emotes
- `Message from`
- `Message sent to`
- OOC
- System lines

Because Assistant logs don't contain all of GTAW's original colour information, some colours are reconstructed based on the type of message.

## Privacy

GTAW ChatTool is designed to run entirely in your browser.

Your pasted roleplay logs and screenshots do not need to be uploaded to a ChatTool server for processing.

## Project Structure

```text
gtaw-chattool/
├── index.html
├── composer.html
│
├── css/
│   ├── app.css
│   └── composer.css
│
├── js/
│   ├── app.js
│   ├── parser.js
│   ├── exporter.js
│   └── composer.js
│
├── README.md
└── LICENSE
