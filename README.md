# Pocket Cam

[**Open Pocket Cam →**](https://igor-div.github.io/POCKET-CAM/)

Game Boy-style camera: 160 × 144 canvas, four shades, contrast, pixel size, pause, and PNG saving. No dependencies.

## GitHub Pages

To make the app link work, enable GitHub Pages in this repository: **Settings → Pages → Build and deployment → Deploy from a branch**, then select **main** and **/ (root)** and click **Save**. After deployment finishes, the link above opens the app directly. The HTTPS page supports camera access with your browser permission.

## Запуск

```sh
npm run dev
```

Open http://localhost:5173 and click “Turn on Camera.” To access the camera, you’ll need to use localhost or HTTPS and grant browser permission. No audio is requested; video is not sent to the server. An animated demo mode is active until the camera is turned on.

Buttons: A — Pause, B — Snapshot, SELECT — Reset Settings, START — Screen Power. You can turn off the camera using a separate button in the source window.

Translated with DeepL.com (free version)

```sh
npm run check
```
