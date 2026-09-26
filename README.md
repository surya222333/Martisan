# Martisan

The current deliverable is the responsive React web demo and FastAPI/SQLite backend. The SIH requirement audit in [SIH_REQUIREMENTS_STATUS.md](SIH_REQUIREMENTS_STATUS.md) lists what is implemented and the items that still need production services or a mobile rewrite.

## Run from VS Code on Windows

1. Open this project folder in VS Code.
2. In the integrated terminal, run `npm install` if `node_modules` is missing.
3. Run `npm run setup:backend` once to create `backend/.venv` and install the Python requirements.
4. Run `npm run dev:all` to start the frontend and API together. Open `http://127.0.0.1:5173/index.source.html`.

You can also press **F5** and choose **Martisan: Run in VS Code** after backend setup. The frontend uses port 5173 and proxies `/api` requests to the backend on port 8001.

Verification: run `npm test`, then `backend/.venv/Scripts/python.exe -m unittest discover -s backend -p test_workflows.py` in PowerShell. The Python tests use a temporary database.

For AI catalog suggestions, speech transcription, and spoken questions, add `OPENAI_API_KEY` to `backend/.env`. Image background removal works through the backend's local rembg model.

## Open directly from `index.html`

1. Run `npm install` and `npm run setup:backend` once, as above.
2. Run `npm run build:static` to embed the frontend in the root `index.html`.
3. Start the API in VS Code with `npm run dev:backend` (or keep `npm run dev:all` running), then double-click `index.html`.

The browser cannot start the Python API from a file. With the standalone file and no API, core marketplace demo data is stored in the browser; image processing and voice transcription still need the local API. Speech transcription/translation and AI generated speech also need a valid `OPENAI_API_KEY` in `backend/.env`. For VS Code development, open `http://127.0.0.1:5173/index.source.html`; the launch profile does this automatically.

## Run locally without an internet connection

Install the frontend and Python dependencies once while online, then double-click `START_MARTISAN_OFFLINE.bat`. It starts the local API and frontend and opens `http://127.0.0.1:5173/`. Keep its server window open while using the app. You can also use VS Code: open this folder, run `npm run dev:all` in the terminal, and open `http://127.0.0.1:5173/` (or press F5 and choose **Martisan: Run in VS Code**).

If you double-click the standalone `index.html` without starting the API, the app now falls back to browser-local demo data for browsing, product edits, cart, orders, and indicative pricing. That data is stored in the browser when file-origin storage is available. AI transcription and generated speech require internet and `OPENAI_API_KEY`; background removal requires the local model to have been downloaded once. Direct file opening cannot start the Python service by itself, so use the offline launcher when you need the complete local backend.
