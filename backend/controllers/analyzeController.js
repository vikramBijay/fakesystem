const { DEMO_REVIEWS, analyzeReviews } = require("../utils/detector");
const { scrapeReviews } = require("../utils/scraper");

async function analyzeController(req, res) {
  console.log("✅ /api/analyze called");
  const { url } = req.body;

  // Demo mode
  if (!url || url.trim() === "") {
    const result = analyzeReviews(DEMO_REVIEWS);
    return res.json({ ...result, source: "demo" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    console.log("📡 Scraping:", parsedUrl.href);
    const rawReviews = await scrapeReviews(parsedUrl.href);
    console.log(`✅ Got ${rawReviews.length} reviews`);
    const result = analyzeReviews(rawReviews);
    return res.json({ ...result, source: "live" });
  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    return res.status(422).json({
      error: err.message,
      hint: "Try pasting the product-reviews URL directly from your browser.",
    });
  }
}

module.exports = { analyzeController };