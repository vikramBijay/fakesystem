// utils/scraper.js — Puppeteer (Flipkart) + RapidAPI (Amazon)

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

process.env.PUPPETEER_CACHE_DIR = '/opt/render/.cache/puppeteer';
puppeteer.use(StealthPlugin());

// ─── AMAZON via RapidAPI ──────────────────────────────────────────────────────

function extractAsin(rawUrl) {
  const m =
    rawUrl.match(/(?:\/dp\/|\/gp\/product\/|\/product-reviews\/|\/ASIN\/)([A-Z0-9]{10})/) ||
    rawUrl.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
  if (!m) throw new Error("Amazon ASIN nahi mila URL mein. Product page ka URL paste karo.");
  return m[1];
}

async function scrapeAmazon(rawUrl) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey)
    throw new Error("RAPIDAPI_KEY nahi mili. backend/.env mein RAPIDAPI_KEY=your_key daal do.");

  const asin = extractAsin(rawUrl);
  console.log("✅ ASIN:", asin);

  const allReviews = [];
  const seenTexts = new Set();

  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    const apiUrl = `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&page=${pageNum}&country=IN&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`;
    console.log(`📡 Fetching Amazon reviews (page ${pageNum}) via RapidAPI...`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 401 || response.status === 403)
        throw new Error("RapidAPI key invalid hai. Check karo backend/.env mein sahi key hai.");
      if (response.status === 429)
        throw new Error("RapidAPI rate limit exceed ho gaya. Thodi der baad try karo.");
      throw new Error(`RapidAPI error: ${response.status} — ${errText.slice(0, 200)}`);
    }

    const json = await response.json();
    const reviews = json?.data?.reviews;
    if (!reviews || reviews.length === 0) { console.log(`  Page ${pageNum}: no reviews.`); break; }

    let pageCount = 0;
    for (const r of reviews) {
      const comment = (r.review_comment || "").trim();
      const title   = (r.review_title   || "").trim();
      const rating  = parseInt(r.review_star_rating) || 0;
      if (rating < 1 || rating > 5) continue;

      const text = comment.length >= 10 ? comment : title.length >= 3 ? title : null;
      if (!text) continue;

      const key = text.toLowerCase().slice(0, 80);
      if (seenTexts.has(key)) continue;
      seenTexts.add(key);
      allReviews.push({ text, rating });
      pageCount++;
    }

    console.log(`  Page ${pageNum}: got ${pageCount} new reviews`);
    if (pageCount === 0) break;
  }

  console.log(`📊 Amazon total: ${allReviews.length} reviews`);
  if (!allReviews.length)
    throw new Error("Amazon se reviews nahi mile. Product ka koi review nahi hai ya ASIN galat hai.");
  return allReviews;
}

// ─── FLIPKART via Puppeteer ───────────────────────────────────────────────────

function randomUA() {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function buildFlipkartReviewsUrl(rawUrl, pageNum = 1) {
  const url = new URL(rawUrl);
  if (!url.pathname.includes("/product-reviews/"))
    url.pathname = url.pathname.replace("/p/", "/product-reviews/");
  const pid = url.searchParams.get("pid");
  const clean = new URL(`https://www.flipkart.com${url.pathname}`);
  if (pid) clean.searchParams.set("pid", pid);
  clean.searchParams.set("sortBy", "MOST_RECENT");
  if (pageNum > 1) clean.searchParams.set("page", pageNum);
  return clean.toString();
}

async function extractFlipkartReviewsFromPage(page) {
  return page.evaluate(() => {
    const results = [];
    const seen = new Set();

    // Strategy 1: New Flipkart React layout
    const allCards = Array.from(document.querySelectorAll("div.css-g5y9jx"));
    const reviewCards = allCards.filter((card) => {
      const bodySpan = card.querySelector("span.css-1jxf684");
      return bodySpan && bodySpan.textContent.trim().length >= 5;
    });

    for (const card of reviewCards) {
      const bodySpan = card.querySelector("span.css-1jxf684");
      const bodyText = bodySpan ? bodySpan.textContent.trim() : "";
      if (!bodyText || seen.has(bodyText)) continue;

      // FIX: Skip any leaf that looks like a rating float ("5.0", "4.0" etc)
      //      AND skip "Overall" which is Flipkart's placeholder title
      let title = "";
      const leafDivs = Array.from(card.querySelectorAll("div.css-146c3p1")).filter(
        (el) => el.children.length === 0
      );
      for (const d of leafDivs) {
        const t = d.textContent.trim();
        const isRatingFloat = /^\d(\.\d)?$/.test(t);          // "5.0", "4", "3.5"
        const isOverall     = t.toLowerCase() === "overall";  // Flipkart placeholder
        if (
          !isRatingFloat && !isOverall &&
          !t.startsWith("Review for:") && !t.startsWith("·") &&
          !t.startsWith(",") && !t.startsWith("Helpful") &&
          t !== "Verified Purchase" && t.length > 2 && t.length < 100
        ) { title = t; break; }
      }

      // Walk UP to find rating bubble (lone int 1-5 outside this card)
      let rating = 0;
      let ancestor = card.parentElement;
      for (let depth = 0; depth < 8 && ancestor && !rating; depth++) {
        const leaves = Array.from(ancestor.querySelectorAll("*")).filter(
          (el) => el.children.length === 0 && !card.contains(el)
        );
        for (const leaf of leaves) {
          const t = leaf.textContent.trim();
          const n = parseInt(t);
          if (n >= 1 && n <= 5 && t === String(n)) { rating = n; break; }
        }
        ancestor = ancestor.parentElement;
      }

      seen.add(bodyText);
      // Only prepend title if it's genuinely different from bodyText start
      const useTitle = title && !bodyText.toLowerCase().startsWith(title.toLowerCase());
      results.push({ text: useTitle ? `${title} — ${bodyText}` : bodyText, rating: rating || 3 });
    }

    // Strategy 2: Legacy Flipkart class names
    if (results.length === 0) {
      const combos = [
        { card: "._27M-vq", body: ".t-ZTKy",  star: "._3LWZlK" },
        { card: ".EPCmJX",  body: ".iCSeDn",  star: "._3LWZlK" },
        { card: "._2sc7ZR", body: "._6K-7Co", star: "._1lRcqv" },
      ];
      for (const sel of combos) {
        document.querySelectorAll(sel.card).forEach((card) => {
          const bodyEl = card.querySelector(sel.body);
          const bodyText = bodyEl ? bodyEl.textContent.trim() : "";
          if (!bodyText || bodyText.length < 5 || seen.has(bodyText)) return;
          const starEl = card.querySelector(sel.star);
          let rating = starEl ? parseInt(starEl.textContent.trim()) : 3;
          if (rating < 1 || rating > 5) rating = 3;
          seen.add(bodyText);
          results.push({ text: bodyText, rating });
        });
        if (results.length) break;
      }
    }

    return results;
  });
}

async function scrapeFlipkart(rawUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage", "--disable-gpu",
      "--single-process", "--window-size=1366,768",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(randomUA());
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-IN,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Referer": "https://www.flipkart.com/",
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    const allReviews = [];
    const seenTexts = new Set();

    for (let pageNum = 1; pageNum <= 2; pageNum++) {
      const reviewsUrl = buildFlipkartReviewsUrl(rawUrl, pageNum);
      console.log(`🔗 Flipkart URL (page ${pageNum}):`, reviewsUrl);

      try {
        await page.goto(reviewsUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (navErr) {
        console.warn(`  ⚠️  Nav warning page ${pageNum}: ${navErr.message}`);
      }

      await sleep(4000);
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await sleep(1000);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(500);

      if (pageNum === 1) {
        const title = await page.title();
        console.log("📄 Page title:", title);
        if (title.toLowerCase().includes("sign") || title.toLowerCase().includes("login"))
          throw new Error("Flipkart login page aa gaya. Direct product-reviews URL paste karo.");
      }

      const pageReviews = await extractFlipkartReviewsFromPage(page);
      console.log(`  Page ${pageNum}: extracted ${pageReviews.length} reviews`);

      let newCount = 0;
      for (const r of pageReviews) {
        if (!seenTexts.has(r.text)) {
          seenTexts.add(r.text);
          allReviews.push(r);
          newCount++;
        }
      }
      if (newCount === 0) { console.log(`  No new reviews, stopping.`); break; }
      await sleep(1500);
    }

    console.log(`📊 Flipkart total: ${allReviews.length} reviews`);
    if (!allReviews.length)
      throw new Error("Flipkart se reviews nahi mile. Direct product-reviews URL paste karo ya Demo Mode try karo.");
    return allReviews;
  } finally {
    await browser.close();
  }
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
async function scrapeReviews(url) {
  const hostname = new URL(url).hostname;
  if (hostname.includes("amazon"))   return scrapeAmazon(url);
  if (hostname.includes("flipkart")) return scrapeFlipkart(url);
  throw new Error("Sirf Amazon aur Flipkart URLs supported hain.");
}

module.exports = { scrapeReviews };