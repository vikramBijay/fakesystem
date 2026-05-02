# FakeGuard — AI Review Detector

Monorepo containing the React frontend and Express backend.

## Structure

```
fakeguard/
├── frontend/           # Vite + React app
│   ├── src/
│   │   ├── FakeGuard.jsx   # Main component + all UI
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── package.json
│
├── backend/            # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   └── index.js            # POST /api/analyze
│   │   ├── controllers/
│   │   │   └── analyzeController.js
│   │   └── utils/
│   │       └── detector.js         # Detection logic
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Quick Start

**Backend** (runs on port 4000):
```bash
cd backend
npm install
npm run dev
```

**Frontend** (runs on port 5173):
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173
