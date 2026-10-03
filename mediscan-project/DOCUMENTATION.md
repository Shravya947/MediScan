# MediScan: Complete Technical Documentation

*Scan any medicine, know everything.*
This document explains every part of the MediScan project: what it is built with, how to set up your computer, how to run the backend and the app, what each piece of code does, and why it was chosen.

> **Important:** the medicine data in this project is **sample data for a hackathon demo**. It is not medical advice. Before real use, replace it with data from a verified source and have a doctor or pharmacist review it.

---

## 1. What the project is

MediScan lets a person scan the barcode or QR code on a medicine pack (or type the name) and instantly see simple, trusted information in their own language.

### 1.1 Features from the presentation, and where they live

| Feature in the slides | Where it is implemented |
|---|---|
| Scan a barcode or QR code | `frontend/index.html`, function `startCam()` (browser `BarcodeDetector` + camera) |
| Search by medicine name | `frontend/index.html` search box, `look()`; backend `GET /api/medicines/lookup` |
| Photo, uses, side effects, dosage, storage | `resultHTML()` in the frontend; `medicines` table in the database |
| Interaction warnings | `ixFor()` in the frontend; `interactions` table; `POST /api/interactions/check` |
| Expiry warning | `expStatus()` in the frontend |
| Fake or unverified medicine check | A code that is not in the database shows the "not verified" alert (`msg === "unver"`) |
| Local languages (Hindi, Kannada, English) | `T` dictionary (screen text) and JSON text fields (medicine text) |
| Voice read-out | `speak()` using the browser `speechSynthesis` |
| Saved results work offline | `saved` list stored in `localStorage`; built-in sample data; automatic fallback when the server is unreachable |
| Backend API + medicine database | `backend/` (Node.js, Express, PostgreSQL) |
| Works on Android and iOS | Mobile-first web app; wrap as an Android APK with Capacitor (section 10) |

### 1.2 Architecture

```
 ┌────────────────────┐    HTTPS / JSON     ┌──────────────────────┐        ┌──────────────┐
 │  Mobile app (UI)   │ ──────────────────▶ │  Node.js + Express   │ ─────▶ │ PostgreSQL   │
 │  frontend/         │ ◀────────────────── │  REST API (backend/) │ ◀───── │ medicines,   │
 │  camera, search,   │                     └──────────────────────┘        │ interactions │
 │  voice, offline    │                                                     └──────────────┘
 └────────────────────┘
   If the server is unreachable, the app falls back to its built-in sample data.
```

**Flow:** user scans or types, then the app calls `GET /api/medicines/lookup?q=...`, the API runs a parameterised SQL query, the database returns the record, and the result screen shows details and alerts.

---

## 2. Requirements

### 2.1 Software you must install

| Software | Version | Why it is needed |
|---|---|---|
| **Node.js** | 18 or newer (20 LTS recommended) | Runs the backend and the helper scripts |
| **npm** | Comes with Node | Installs backend packages |
| **PostgreSQL** | 13 or newer (16 recommended) | The medicine database |
| **Docker Desktop** *(optional but easiest)* | Latest | Runs PostgreSQL and the API with one command, so you avoid installing PostgreSQL by hand |
| **Git** | Any recent | Version control, and the slides list GitHub |
| **VS Code** (or any editor) | Any | Editing code |
| **Google Chrome** (Android or desktop) | Recent | Supports `BarcodeDetector` for camera scanning |
| **Android Studio + JDK 17** *(only for building an APK)* | Latest | Builds the Android app (section 10) |

### 2.2 Backend packages (`backend/package.json`)

| Package | Purpose | Why this one |
|---|---|---|
| `express` 4.x | Web server and routing | Most widely used Node framework; simple, well documented |
| `pg` 8.x | PostgreSQL driver | The standard driver; supports parameterised queries (protects against SQL injection) and JSONB |
| `cors` | Allows the app (a different origin) to call the API | Browsers block cross-origin calls unless the server allows them |
| `helmet` | Adds safe HTTP security headers | One line gives sensible protection |
| `express-rate-limit` | Limits requests per IP (120 per minute) | Stops abuse and accidental request loops |
| `dotenv` | Loads settings from the `.env` file | Keeps passwords and URLs out of the code |

### 2.3 Frontend requirements

The frontend has **no build step and no npm packages**. It is one HTML file with CSS and JavaScript.

| Item | Purpose |
|---|---|
| Browser `BarcodeDetector` API | Reads barcodes and QR codes from the camera. Built in to Chrome on Android, so no library is needed |
| `navigator.mediaDevices.getUserMedia` | Opens the rear camera. Requires **HTTPS or localhost** |
| `speechSynthesis` | Reads results aloud. Voices depend on the phone |
| `localStorage` | Remembers saved medicines and the chosen language |
| Google Font **Atkinson Hyperlegible** | Designed by the Braille Institute for maximum character clarity, so it suits elderly and low-vision readers |

### 2.4 Mobile packaging (optional, `mobile/package.json`)

`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` wrap the web app as a real Android app. `@capacitor-mlkit/barcode-scanning` adds Google ML Kit native scanning (the slides name ML Kit).

---

## 3. Project structure

```
mediscan-project/
├── README.md
├── DOCUMENTATION.md
├── docker-compose.yml          PostgreSQL + API containers
├── frontend/
│   ├── index.html              the whole app (HTML + CSS + JS)
│   └── config.js               sets the backend URL
├── backend/
│   ├── package.json            dependencies and scripts
│   ├── .env.example            settings template
│   ├── Dockerfile              container recipe for the API
│   ├── db/schema.sql           table definitions
│   ├── data/medicines.json     44 sample medicines and 13 interactions
│   ├── scripts/seed.js         creates tables and loads the data
│   └── src/
│       ├── server.js           starts Express, adds security, health check, error handling
│       ├── routes.js           the API endpoints
│       └── db.js               PostgreSQL connection pool
└── mobile/
    ├── package.json            Capacitor dependencies and scripts
    └── capacitor.config.json   app id and name
```

---

## 4. Environment setup

### 4.1 Install the tools

**Windows (PowerShell):**
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Docker.DockerDesktop      # restart the PC afterwards
winget install Microsoft.VisualStudioCode
```

**macOS (Homebrew):**
```bash
brew install node git
brew install --cask docker visual-studio-code
```

**Ubuntu / Debian:**
```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Docker: follow https://docs.docker.com/engine/install/ubuntu/
```

Check the installs:
```bash
node -v        # v20.x or newer (v18 minimum)
npm -v
git --version
docker --version
```

### 4.2 Get the project

Unzip `mediscan-project.zip`, then open the folder in VS Code. Optionally track it with Git:
```bash
cd mediscan-project
git init && git add . && git commit -m "MediScan first version"
```

---

## 5. Backend setup

You can use **Option A (Docker, easiest)** or **Option B (PostgreSQL installed directly)**.

### 5.1 Option A: Docker

```bash
cd mediscan-project
docker compose up -d --build                  # builds the API image and starts PostgreSQL + API
docker compose run --rm api npm run seed      # creates tables and loads the sample data
curl http://localhost:3000/api/health
```
Expected: `{"status":"ok","database":"up"}`

Useful commands: `docker compose logs -f api` (see logs), `docker compose down` (stop), `docker compose down -v` (stop and delete the database).

**Why Docker:** everyone on the team gets the same PostgreSQL version and settings, with no manual database installation.

### 5.2 Option B: local PostgreSQL

1. Install PostgreSQL 16 and make sure it is running.
2. Create the database and user:
   ```bash
   psql -U postgres
   ```
   ```sql
   CREATE USER mediscan WITH PASSWORD 'mediscan';
   CREATE DATABASE mediscan OWNER mediscan;
   \q
   ```
3. Configure and start the API:
   ```bash
   cd backend
   npm install
   cp .env.example .env        # Windows: copy .env.example .env
   npm run seed
   npm start
   ```
   You should see `MediScan API listening on port 3000`.

### 5.3 Environment variables (`backend/.env`)

| Variable | Meaning | Example |
|---|---|---|
| `PORT` | Port the API listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://mediscan:mediscan@localhost:5432/mediscan` |
| `PGSSL` | `true` for hosted databases that require SSL | `false` locally, `true` on Neon/Supabase/Render |
| `CORS_ORIGINS` | Which websites may call the API (comma separated, or `*`) | `https://my-app.web.app` |

Never commit `.env` to Git (it is listed in `backend/.gitignore`).

### 5.4 Test the API

```bash
curl "http://localhost:3000/api/medicines/lookup?q=8901000000011"     # by barcode -> Paracetamol
curl "http://localhost:3000/api/medicines/lookup?q=ibuprofen"          # by name
curl "http://localhost:3000/api/medicines/search?q=a"                  # suggestions
curl "http://localhost:3000/api/medicines"                             # all medicines (for offline cache)
curl "http://localhost:3000/api/medicines/lookup?q=8909999999999"      # unknown code -> 404 with code UNVERIFIED
curl -X POST http://localhost:3000/api/interactions/check \
     -H "Content-Type: application/json" -d '{"ids":["ibu","asp"]}'    # returns the warning
```

You can also import these into **Postman** (named in the slides) as GET/POST requests.

### 5.5 API reference

| Method and path | Description | Success | Errors |
|---|---|---|---|
| `GET /api/health` | Server and database status | `200 {status:"ok"}` | `503` if the database is down |
| `GET /api/medicines/lookup?q=` | One medicine by barcode (8 to 14 digits), name or id | `200` medicine object | `400` missing q; `404` not found (`code: UNVERIFIED` for numeric codes) |
| `GET /api/medicines/search?q=` | Up to 10 name matches | `200` array | none |
| `GET /api/medicines` | All medicines (max 500) | `200` array | none |
| `GET /api/medicines/:id` | One medicine by id | `200` | `404` |
| `POST /api/interactions/check` | Body `{"ids":[...]}`, returns known bad pairs | `200` array of `{a,b,message}` | `400` invalid body |

A medicine object looks like:
```json
{ "id":"para", "c":"8901000000011", "n":"Paracetamol 500 mg", "e":"🟡", "img":null,
  "u":{"en":"...","hi":"...","kn":"..."}, "s":{...}, "d":{...} }
```
The keys are short (`c` code, `n` name, `e` emoji icon, `u` uses, `s` side effects, `d` dosage) because the frontend uses the same names for its built-in data, so one rendering code path serves both server data and offline data.

---

## 6. Frontend setup

1. Open `frontend/config.js` and set the backend URL:
   ```js
   window.MEDISCAN_API = "http://localhost:3000";   // or "" to run fully offline
   ```
2. Serve the folder (opening the file directly will not allow the camera):
   ```bash
   npx serve frontend -l 8080
   ```
   Open **http://localhost:8080** in Chrome.
3. Try the sample chips, type `paracetamol`, or type `8901000000011`.

**Testing on a real phone:** the camera only works on **HTTPS** (or localhost), so a plain `http://192.168.x.x` address will not open it. Use one of:
- `npx localtunnel --port 8080` or `ngrok http 8080` to get a temporary HTTPS link (the backend then also needs an HTTPS link, or put the API behind the same tunnel), or
- deploy both parts (section 11).

If the backend is not reachable, the app **automatically falls back** to its built-in sample data, so a demo never breaks without internet.

---

## 7. Backend code explained

### 7.1 `backend/src/db.js`
Creates one **connection pool**. A pool keeps a few database connections open and reuses them, which is far faster than opening a new connection per request. `ssl` is switched on by `PGSSL=true` because cloud databases require encrypted connections.

### 7.2 `backend/src/server.js`
The entry point. In order:
1. `dotenv` loads `.env`.
2. `helmet()` adds security headers.
3. `cors()` allows the app's origin (set by `CORS_ORIGINS`).
4. `express.json({limit:'10kb'})` parses JSON bodies and rejects huge ones.
5. `rateLimit` allows 120 requests per minute per IP.
6. `/api/health` runs `SELECT 1`, so hosting platforms and you can check that the API **and** the database are alive.
7. `/api` routes are mounted from `routes.js`.
8. A 404 handler and a central **error handler** return clean JSON. The error handler logs details on the server but sends only `Server error` to the client, so internals are never leaked.

### 7.3 `backend/src/routes.js`
- `COLS` renames database columns to the short keys the app expects.
- `wrap()` lets `async` handlers pass errors to the error handler (Express 4 does not do this by itself).
- `isCode()` decides whether the query looks like a barcode (8 to 14 digits). Barcodes use an **exact** match on the unique `barcode` column. Anything else uses a **case-insensitive partial name match** (`ILIKE`).
- `likeEscape()` escapes `%` and `_` so user input cannot act as wildcards.
- **All queries use `$1, $2` placeholders** (parameterised queries), which prevents **SQL injection**.
- A numeric code with no match returns `404` with `code: "UNVERIFIED"`. This is the basis of the fake-medicine warning: *a real pack's code should exist in a verified database*.
- `/interactions/check` uses `a = ANY($1) AND b = ANY($1)` to find every stored pair where both medicines are in the user's list.

### 7.4 `backend/db/schema.sql`
- `medicines.barcode` is `UNIQUE` (one record per pack code) and `lower(name)` is indexed for faster name search.
- `uses`, `side_effects`, `dosage` are **JSONB** objects keyed by language (`{"en":..,"hi":..,"kn":..}`). Adding a new language needs **no schema change**.
- `interactions(a, b)` has a composite primary key and `ON DELETE CASCADE` so removing a medicine removes its interaction rows.
- `updated_at` supports the "regular updates" plan on the slides.

### 7.5 `backend/scripts/seed.js`
Runs the schema and loads `data/medicines.json` inside a **transaction** (all or nothing). It uses `ON CONFLICT ... DO UPDATE` (an **upsert**), so you can edit the JSON and run `npm run seed` again safely.

### 7.6 `backend/Dockerfile` and `docker-compose.yml`
The Dockerfile builds a small Node 20 Alpine image and starts `src/server.js`. Compose starts PostgreSQL first (with a health check), then the API, and keeps the data in a Docker volume `pgdata`, so it survives restarts.

---

## 8. Frontend code explained (`frontend/index.html`)

### 8.1 Head and CSS
- `viewport-fit=cover` and `env(safe-area-inset-*)` keep content clear of phone notches and system bars.
- **Design tokens** (`--bg`, `--pri`, `--warn`, `--bad`, ...) define the colours once. The palette is a medical teal with amber (caution) and red (danger), and a dark theme follows the phone setting via `prefers-color-scheme`.
- Body text is 17px with generous line height, buttons are large, and `:focus-visible` outlines help keyboard and accessibility users. These choices target elderly users.
- `max-width: 480px` makes it feel like a phone app even on a desktop browser.

### 8.2 `config.js` and `API`
`config.js` sets `window.MEDISCAN_API`. The app reads it as `API`. If it is empty, the app is fully offline.

### 8.3 `T`: translations of the screen text
`T.en`, `T.hi`, `T.kn` hold every label and message. `t("key")` returns the text for the current language `L`. Keeping text in one dictionary means a new language is one more block, with no code changes.

### 8.4 `DB` and `IX`: built-in sample data
`DB` has all 44 medicines, each with `u`, `s`, `d` text in English, Hindi and Kannada. `g()` falls back to English if a translation is ever missing. `IX` has the interaction pairs. This is the **offline fallback** and matches the backend's output shape.

### 8.5 State and storage
Variables: `L` (language), `tab`, `cur` (medicine shown), `saved` (list of ids), `stream`/`timer` (camera), `msg` (message type). Saved items and language are kept with `localStorage` inside `try/catch`, because storage can be blocked (private mode).

### 8.6 Functions

| Function | What it does | Why |
|---|---|---|
| `find(q)` | Local search by code, name or id | Offline lookup |
| `look(q)` | Asks the API; on `404` shows "not found / unverified"; on a network error falls back to `find()` | Online-first with offline safety, so the app always responds |
| `ixFor(id, list)` | Finds interaction warnings between a medicine and the saved list | Safety alert before taking a medicine |
| `expStatus(date)` | Compares the pack's expiry date to today and to today plus 3 months | Expired = red, within 3 months = amber, else green |
| `speak()` | Builds a sentence from the result and reads it with `speechSynthesis` using `en-IN`, `hi-IN` or `kn-IN` | Elderly users and low literacy |
| `startCam()` | Opens the rear camera and runs `BarcodeDetector.detect()` every 500 ms; when a code is found it calls `look()` | Barcode and QR scanning with no extra library. Shows a friendly message if unsupported |
| `stopCam()` | Stops the timer and releases the camera | Saves battery and releases the camera |
| `resultHTML(m)` | Builds the result screen: icon, verified tick, alerts, uses, side effects, dosage, storage, expiry, buttons | One function for online and offline data |
| `toggleSave(id)` | Adds to "My medicines" and persists | Offline-viewable list |
| `render()` | Redraws the screen from the current state | Simple state-to-HTML pattern, so the app needs no framework |

### 8.7 Why plain HTML/JS instead of Flutter or React Native?
The slides list "Flutter or React Native". For a hackathon, plain HTML/JS gives a **working demo in one file**, with no build tools, that runs on any phone through Chrome. **Capacitor** (section 10) then wraps it as a real Android app. If you later want a native rewrite, the API, database and screen design carry over unchanged.

---

## 9. Database design choices

- **PostgreSQL** (as on the slides): reliable, free, strong text search, and **JSONB** for multi-language fields.
- **Barcode as a unique column**: guarantees one verified record per pack code and fast exact lookups.
- **Separate `interactions` table**: lets the list grow without touching medicine rows.
- **Source of truth for data**: `backend/data/medicines.json`. Edit it, run `npm run seed`.

To add a medicine, append an object like this to `medicines` and re-seed:
```json
{ "id":"met", "barcode":"8901000000066", "name":"Metformin 500 mg", "emoji":"⚪",
  "uses":{"en":"...","hi":"...","kn":"..."}, "side_effects":{...}, "dosage":{...} }
```
Then add the same entry to `DB` in `index.html` if you want it to work offline too, or add a client sync (section 13).

---

## 10. Building an Android app (optional)

This wraps the web app in a native shell with **Capacitor**. *These steps were prepared but not run in the build environment, so expect to fix small version-specific details.*

Prerequisites: Node 18+, **Android Studio**, JDK 17, and an Android phone with USB debugging or an emulator.

```bash
cd mobile
npm install
npm run prepare:web          # copies ../frontend into mobile/www
npx cap add android          # creates the android/ project (run once)
npm run sync                 # copy web files + plugins into the Android project
npx cap open android         # opens Android Studio -> press Run, or Build > Build APK(s)
```

Notes:
1. **Camera permission:** add to `android/app/src/main/AndroidManifest.xml`:
   `<uses-permission android:name="android.permission.CAMERA" />`
2. **HTTPS backend:** the app page is served from a secure origin, so the API URL in `frontend/config.js` must be `https://...` (browsers block insecure calls from secure pages). Deploy the backend first (section 11).
3. **CORS:** set `CORS_ORIGINS=https://localhost,capacitor://localhost` on the server (plus your web URL if you also host the web version).
4. **Native ML Kit scanning (recommended in the APK):** Android's web view may not provide `BarcodeDetector`, so use the plugin installed in `mobile/package.json`. Replace the body of `startCam()` with:
   ```js
   async function startCam(){
     const BS = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner;
     if(!BS){ /* keep the existing browser BarcodeDetector code here */ return; }
     await BS.requestPermissions();
     const { barcodes } = await BS.scan();
     if(barcodes.length) look(barcodes[0].rawValue);
   }
   ```
   Then run `npm run sync` again. Check the plugin's page for the "Google Barcode Scanner module" install step on some devices.
5. **iOS:** `npm i @capacitor/ios`, `npx cap add ios`, then build on a Mac with Xcode (needs `NSCameraUsageDescription` in `Info.plist`).

---

## 11. Deployment

**Database (free options):** Neon, Supabase or Render PostgreSQL. Copy the connection string into `DATABASE_URL`, set `PGSSL=true`, then run the seed once from your computer:
```bash
cd backend && DATABASE_URL="postgres://..." PGSSL=true npm run seed
```
(Windows PowerShell: `$env:DATABASE_URL="..."; $env:PGSSL="true"; npm run seed`)

**API:** Render, Railway or Fly.io. Point it at the `backend` folder, build command `npm install`, start command `npm start`, and set the environment variables from section 5.3. Health check path: `/api/health`.

**Frontend (Firebase Hosting, as on the slides):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting        # public directory: frontend, single-page app: No
# edit frontend/config.js to the deployed API URL
firebase deploy
```

---

## 12. Security and privacy summary

| Risk | Protection |
|---|---|
| SQL injection | Parameterised queries everywhere |
| Wildcard abuse in search | `likeEscape()` |
| Abuse or floods | `express-rate-limit`, 10 KB body limit |
| Clickjacking, sniffing | `helmet` headers |
| Leaking errors | Central error handler hides details |
| Secrets in code | `.env` and `.gitignore` |
| User privacy | The app stores only the saved medicine ids and language on the **user's own device**. No accounts, no personal data are sent to the server |

---

## 13. Testing checklist

1. `GET /api/health` returns `ok`.
2. Lookup by each sample code (`8901000000011` to `8901000000059`) returns the right medicine.
3. Unknown code `8909999999999` shows the red "not verified" alert.
4. Gibberish name shows "No match".
5. Switch language to Hindi and Kannada. All labels and medicine text change.
6. Save Ibuprofen and Aspirin, then open "My medicines". The interaction warning appears.
7. Enter a past date as expiry. The red "EXPIRED" alert appears.
8. Press "Read aloud".
9. Stop the backend and search again. The app still answers from built-in data.
10. Camera: scan an EAN-13 barcode printed or shown on another screen with the matching number.

---

## 14. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `ECONNREFUSED 5432` | PostgreSQL is not running or `DATABASE_URL` is wrong |
| `password authentication failed` | Username or password in `DATABASE_URL` does not match the database user |
| `relation "medicines" does not exist` | You have not run `npm run seed` |
| Browser shows a CORS error | Add the app's origin to `CORS_ORIGINS`, or use `*` while developing |
| Camera does not open | Page is not on HTTPS or localhost, or permission was denied |
| "Camera scanning is not supported" | The browser has no `BarcodeDetector` (use Chrome on Android, or the Capacitor build with ML Kit) |
| No Hindi or Kannada voice | The phone has no voice installed. Add it in the phone's text-to-speech settings |
| Port 3000 busy | Change `PORT` in `.env` and the URL in `config.js` |
| Android app cannot reach API | API must be HTTPS; check `CORS_ORIGINS` |

---

## 15. Limitations and roadmap

**Current limits (be honest with judges):**
- Only 44 sample medicines. Text (English, Hindi and Kannada) was written for the demo and needs expert review.
- Real medicine barcodes vary by brand and batch. Real "fake medicine" detection needs manufacturer or regulator data (for example batch verification), not only a lookup. The current check means "this code is not in our verified database".
- The app does not yet sync the full database to the device. The offline list uses the built-in data.
- Translations were machine-assisted and should be checked by native speakers.
- There are no automated tests yet, and the backend was syntax-checked but not run against a live PostgreSQL in the build environment.

**Next steps:** import a larger verified dataset (check each source's licence), call `GET /api/medicines` on first launch and store it in IndexedDB for full offline use, add real pack photos (`image_url`), add a pharmacist review workflow and `updated_at` based refresh, add prescription linking and more languages, and write tests (for example with Jest and Supertest).

---

## 16. Quick command cheat sheet

```bash
# Start everything with Docker
docker compose up -d --build
docker compose run --rm api npm run seed

# Or run the API without Docker
cd backend && npm install && cp .env.example .env && npm run seed && npm start

# Serve the app
npx serve frontend -l 8080

# Build the Android project
cd mobile && npm install && npm run prepare:web && npx cap add android && npm run sync && npx cap open android
```

---

## 17. Medicine list (version 2)

The database now covers the common groups from the general medicine list: fever and pain, allergy, acidity, diarrhea, constipation, nausea, cough, nasal congestion, skin fungus, bacterial infections, asthma, blood pressure, diabetes, cholesterol, blood clot prevention, thyroid, iron, vitamin B12, anxiety and depression, and seizures (44 medicines, 13 interaction pairs).

**Prescription flag.** Each medicine has `rx` (true or false) in `medicines.json`, a `rx` column in the database and in the API result. When it is true, the result screen shows an amber alert: *Prescription medicine. Use only as your doctor says.*

**Dose policy.** For over-the-counter medicines the dosage text gives the usual adult label instruction. For prescription medicines (antibiotics, blood pressure, diabetes, blood thinners, antidepressants, seizure medicines and similar) the app deliberately gives **no dose numbers**. It says "only as prescribed" and adds the key safety message, such as "finish the full course" or "never stop suddenly". The correct dose depends on age, weight, other medicines, pregnancy, allergies and kidney or liver function, so an app should not suggest one.

**New interaction pairs:** aspirin with clopidogrel, clopidogrel with omeprazole, ibuprofen with losartan, telmisartan or enalapril, levothyroxine with iron, and sertraline or escitalopram with ibuprofen, aspirin or dextromethorphan.

**Languages.** All 44 medicines and all 13 interaction warnings have English, Hindi and Kannada text. Medicines appear as one flat list on the home screen, sorted A to Z, and every one opens the same full result screen (uses, side effects, dosage, storage, alerts, expiry check, read aloud, save). To add a language, add its key (for example `ta`) to each text field in `medicines.json`, add a block to `T` in `index.html`, and add an option to the language selector.

**Upgrading an existing database.** The schema file now includes `ALTER TABLE medicines ADD COLUMN IF NOT EXISTS rx ...`, so run `npm run seed` again and nothing is lost.

**Barcodes.** The numbers for the new medicines (from `8901000000066` upward) are made-up demo codes, not real pack codes. Replace them with real codes from your data source.

**Clinical review.** All medicine text was drafted for this demo and has not been reviewed by a doctor or pharmacist.

---

## 18. Notes on version 3

- Version 3 listed every medicine on the home screen. Version 4 (section 19) replaced that with recent searches only. There is no disease or category grouping in the app.
- The database still has an optional `purpose` column (a group key such as `bp`). The app does not use it. You can ignore it or remove it.
- Medicine icons for pills use coloured circles (as for the first five); special forms use their own icon (insulin, inhalers, creams, ORS, nasal spray).
- Hindi and Kannada text for the 39 added medicines was written for this demo from the English text. It is shorter and simpler than the English in places, and it has not been checked by native speakers or a clinician.

---

## 19. Recent searches and online lookup (version 4)

**Home screen.** It no longer lists the medicines stored in the backend. It shows only the medicines the person has searched before ("Recent searches", up to 10, newest first), with a "Clear history" button. The history is stored on the device in `localStorage` (key `ms_recent`), so it works offline and nothing about it is sent to the server. Tapping the **Scan** tab returns to this home screen.

**Search order (`look()` in `index.html`):**
1. Look in the backend (or the built-in data if the server is unreachable). A match shows the full trilingual details.
2. A long number that is not found shows the red "not verified" alert.
3. A name that is not found is looked up online (`fda()` and `wiki()` run together). If the US FDA label database has it, the details are shown and the medicine is added to recent searches (including its text, so it can be reopened offline). If not, the app says "Medicine not found, even online".

**Online sources (both free, no key, allow browser requests):**

| Source | What it gives | Endpoint |
|---|---|---|
| openFDA drug labels | Uses (indications), side effects (adverse reactions), dosage text, and whether it is prescription or over the counter | `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"NAME"` (then `openfda.brand_name`) |
| Wikipedia REST API | Photo (thumbnail), short description, link | `https://en.wikipedia.org/api/rest_v1/page/summary/TITLE` |

**Image.** Wikipedia's picture for a drug is often a chemical structure diagram or a generic product photo, not the exact pack the person is holding. The app says so under the image. If the image fails to load, the card removes itself. Showing real pack photos needs a licensed image source or your own photos (`image_url` in the database).

**Code added:**
- `jf(url)`: fetch with an 8 second time limit that returns `null` on any failure, so the app never freezes or crashes without internet.
- `fda(k)`, `wiki(k)`: the two lookups. `GEN` maps international names to US names (paracetamol to acetaminophen, salbutamol to albuterol). `WK` maps a few items to the right Wikipedia page. `key()` turns "Paracetamol 500 mg" into "paracetamol".
- `clip()`: shortens long label text at a sentence end (about 380 characters) and removes headings such as "INDICATIONS AND USAGE".
- `esc()`: escapes all text before it is placed in the page. Online text is untrusted, so this stops script injection.
- `show()`, `addRecent()`, `openRecent()`, `clearRecent()`: show a result, and keep the history.
- A newer search cancels an older one still loading (`reqId`).
- Online medicines cannot be saved to "My medicines" (they live in Recent searches). Interaction checks use only the built-in medicines.

**Important limits:**
- **Not available in the published preview.** The Claude preview page blocks requests to other websites and outside images, so online lookup and images only work when you run or host the project yourself (section 6, 11) or in the Capacitor app (section 10). In the preview, the app uses its built-in data only.
- openFDA contains **US** labels in **English**. Indian brand names (for example Dolo) are usually not found. Searching the generic name works best (for example paracetamol, diclofenac).
- The first label found may be a combination product or a different strength. The app tells the person to confirm with a pharmacist.
- Online text is not translated into Hindi or Kannada. A note explains this.
- Privacy: the medicine name that is typed is sent from the person's device to api.fda.gov and wikipedia.org. Say so in your privacy policy.
- openFDA data is described by the FDA as unvalidated for clinical use. Wikipedia text is under CC BY-SA, so the app links to the source.
- Both services have usage limits (openFDA allows a limited number of requests per minute without a key). For heavy use, add an openFDA API key and move these calls to the backend with caching.

**Test it:** after serving the frontend (section 6), type `diclofenac` or `omeprazole` (online or built-in), then `paracetamol` (built-in plus image), then return to the home screen to see both under Recent searches. Turn off the internet and reopen a recent search; it still opens.
