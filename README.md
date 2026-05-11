# GLB Studio Viewer

A modern, responsive website for uploading and viewing `.glb` 3D files directly in the browser.

## Features

- Upload and preview GLB files
- Orbit, pan, and zoom controls
- Automatic camera framing for loaded models
- Loading and error states
- Modern dark UI

## Run locally

Because browsers restrict module loading from `file://`, serve this folder with a local HTTP server.

### Python

```bash
cd /path/to/project-directory
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Usage

1. Click **Upload GLB**.
2. Choose a `.glb` file.
3. Use mouse/touch gestures to inspect the model.
