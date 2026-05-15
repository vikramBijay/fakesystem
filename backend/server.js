require("dotenv").config();  // ← ADDED
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// ── Debug endpoint: dumps raw HTML/JSON from a URL so you can inspect selectors
// Usage: POST /debug with { "url": "..." }
app.post("/debug", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  try {
    const { data, headers } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept-Language": "en-IN,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        Referer: "https://www.flipkart.com/",
      },
      timeout: 15000,
    });

    const contentType = headers["content-type"] || "";

    if (contentType.includes("json")) {
      return res.json({ type: "json", data });
    }

    // HTML: extract title + body text + script tags summary
    const $ = cheerio.load(data);
    const title = $("title").text().trim();
    const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 2000);
    const scriptCount = $("script").length;
    const scripts = [];
    $("script").each((i, el) => {
      const src = $(el).attr("src") || "";
      const inline = ($(el).html() || "").slice(0, 200);
      scripts.push({ src, inline });
    });

    const hasReviewBody = data.includes("reviewBody") || data.includes("reviewText");
    const hasInitialState = data.includes("__INITIAL_STATE__") || data.includes("__initial_data");
    const htmlSnippet = data.slice(0, 3000);

    return res.json({
      type: "html",
      title,
      bodyText,
      scriptCount,
      hasReviewBody,
      hasInitialState,
      scripts: scripts.slice(0, 10),
      htmlSnippet,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "FakeGuard API running", version: "2.0.0" });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`✅ FakeGuard API running on http://localhost:${PORT}`);
  console.log(`🔧 Debug endpoint: POST http://localhost:${PORT}/debug { "url": "..." }`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} already in use!`);
    console.error(`   Run: netstat -ano | findstr :${PORT}`);
    console.error(`   Then: taskkill /PID <pid> /F\n`);
    process.exit(1);
  } else throw err;
});