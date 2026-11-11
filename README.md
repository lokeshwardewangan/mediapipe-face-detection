# Quiz Proctor Test

A browser-based camera demo built with React, Vite, and MediaPipe Face Detector. It opens the front camera, detects faces in the video stream, and draws a bounding box with the detection confidence.

## Features

- Front-camera access for desktop and mobile browsers
- Local MediaPipe face-detection model and WASM runtime
- Face count, confidence, and video overlay
- No backend, database, identity verification, or video recording

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, then select **Start Proctoring** and allow camera access.

## Commands

```bash
npm run dev      # Start the development server
npm run lint     # Lint the project
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build
```

## Important files

```text
src/components/ProctorCamera.jsx  Camera UI, detection loop, and face overlay
src/vision/FaceDetector.js        MediaPipe detector setup
public/models/                    Face detection model
public/mediapipe/                 MediaPipe WASM runtime files
```

## Deploy to Netlify

This repository includes `netlify.toml` with the required build settings:

- Build command: `npm run build`
- Publish directory: `dist`

To deploy, push this project to a Git provider, then import the repository in Netlify. Netlify reads `netlify.toml` automatically. You can also run `npm run build` locally and upload the generated `dist` folder through Netlify Drop.

Netlify serves the site over HTTPS, which is required for camera access in production browsers.

## Limitations

Face detection only indicates that the model sees a face-like object. It does not prove identity or liveness, so a photo or replayed video can still be detected as a face. Production proctoring needs a separate liveness/anti-spoofing and backend auditing solution.
