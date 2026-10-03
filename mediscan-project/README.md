# MediScan: scan any medicine, know everything

Quick start (5 minutes, needs Docker and Node.js 20):

```bash
docker compose up -d --build                  # starts PostgreSQL + API
docker compose run --rm api npm run seed      # creates tables, loads 5 sample medicines
curl http://localhost:3000/api/health         # {"status":"ok","database":"up"}
npx serve frontend -l 8080                 # open http://localhost:8080
```

Everything is explained in **DOCUMENTATION.md** (setup, code walkthrough, reasons for each choice, APK build, deployment).

```
mediscan-project/
├── DOCUMENTATION.md          full explanation
├── docker-compose.yml        PostgreSQL + API in containers
├── frontend/                 the mobile web app (index.html + config.js)
├── backend/                  Node.js + Express REST API
│   ├── src/ (server.js, routes.js, db.js)
│   ├── db/schema.sql         tables
│   ├── data/medicines.json   sample data (5 medicines, 3 languages)
│   └── scripts/seed.js       loads the data
└── mobile/                   Capacitor files to wrap the app as an Android APK
```
