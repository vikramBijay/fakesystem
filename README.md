# FakeGuard 🛡️

> AI-powered fake review detector for Amazon & Flipkart

![FakeGuard](https://img.shields.io/badge/FakeGuard-v2.0.0-7c3aed?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Scraping-40b5a4?style=for-the-badge)

---

## What is FakeGuard?

FakeGuard analyzes product reviews from Amazon and Flipkart to detect fake, spam, or suspicious reviews using pattern-based AI detection. Paste any product URL and get an instant authenticity report.

---

## Features

- 🔍 **Live Scraping** — Scrapes up to 30 reviews from Amazon (via RapidAPI) and Flipkart (via Puppeteer)
- 🧠 **AI Detection** — Detects duplicates, repetitive language, spam patterns, and suspicious review behavior
- 📊 **Dashboard** — Visual breakdown with fake %, rating distribution, and per-review analysis
- 🌍 **3D Globe UI** — Interactive Three.js globe on homepage and loading screen
- 🎵 **Background Music** — Optional ambient music toggle
- 💡 **Demo Mode** — Works without any URL for instant demo

---

## Tech Stack

### Frontend
- React 18 + Vite
- Three.js + three-globe (3D interactive globe)
- Pure CSS (no UI library)

### Backend
- Node.js + Express
- Puppeteer + puppeteer-extra-plugin-stealth (Flipkart scraping)
- RapidAPI — Real-Time Amazon Data (Amazon reviews)
- dotenv, cheerio, axios, cors

---

## Project Structure

```
fakeguard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── LoadingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HeroGlobe.jsx
│   │   │   ├── EarthGlobe.jsx
│   │   │   ├── StarCanvas.jsx
│   │   │   └── PricingModal.jsx
│   │   ├── utils/
│   │   │   ├── API.js          # GeoJSON data for globe
│   │   │   └── detection.js    # Client-side fallback detection
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
└── backend/
    ├── controllers/
    │   └── analyzeController.js
    ├── routes/
    │   └── index.js
    ├── utils/
    │   ├── scraper.js          # Amazon + Flipkart scraping
    │   └── detector.js         # Fake review detection logic
    ├── server.js
    ├── .env                    # ← your API key goes here
    └── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- A free RapidAPI key (for Amazon reviews)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/fakeguard.git
cd fakeguard
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```
RAPIDAPI_KEY=your_rapidapi_key_here
```

Get your free key at:
[https://rapidapi.com/letscrape-6baf62aa91cd4f8480a55a85/api/real-time-amazon-data](https://rapidapi.com/letscrape-6baf62aa91cd4f8480a55a85/api/real-time-amazon-data)

Start the backend:

```bash
npm run dev
# Server runs on http://localhost:4000
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## Usage

1. Open the app in your browser
2. Click **Analyze Reviews**
3. Paste an Amazon or Flipkart product URL
4. Click **Analyze** and wait for results
5. View the dashboard with fake review breakdown

**Supported URLs:**
- `https://www.amazon.in/dp/ASIN`
- `https://www.flipkart.com/product-name/product-reviews/itemid?pid=...`

---

## How Detection Works

FakeGuard uses a rule-based scoring system:

| Signal | Description | Confidence Added |
|--------|-------------|-----------------|
| **Duplicate** | Exact same review text appears multiple times | +50 |
| **Too Short** | Review is 2 words or less | +45 |
| **Repetitive** | Same meaningful word used 3+ times | +30 |
| **Extreme Positive** | Short review packed with positive words | +20 |
| **Extreme Negative** | Short review packed with negative words | +20 |
| **Spam Pattern** | Matches known spam phrases or formatting | +20 |

A review with confidence ≥ 45 is flagged as **fake**.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze reviews for a product URL |
| `POST` | `/debug` | Debug endpoint — dumps raw HTML/JSON from a URL |
| `GET` | `/` | Health check |

**Request body for `/api/analyze`:**
```json
{
  "url": "https://www.amazon.in/dp/B0XXXXXXXX"
}
```

**Response:**
```json
{
  "reviews": [...],
  "fakePercentage": 25,
  "insights": { ... },
  "source": "live"
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAPIDAPI_KEY` | ✅ Yes | RapidAPI key for Amazon review scraping |
| `PORT` | ❌ Optional | Backend port (default: 4000) |

---

## Known Limitations

- Amazon scraping uses RapidAPI free tier (200 requests/month)
- Flipkart scraping uses Puppeteer — takes ~30-60 seconds
- Detection is pattern-based, not ML — may have false positives/negatives
- Some products with very few reviews may return limited results

---

## License

MIT License — free to use and modify.

---

## Author

Built by **Vikram** — a smart fake review detection tool for Indian e-commerce.