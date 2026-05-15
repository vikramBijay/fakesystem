// utils/scraper.js — Puppeteer (Flipkart) + RapidAPI (Amazon)

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cheerio = require("cheerio");

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

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY nahi mili. backend/.env mein RAPIDAPI_KEY=your_key daal do.");
  }

  const asin = extractAsin(rawUrl);
  console.log("✅ ASIN:", asin);

  const allReviews = [];
  const seenTexts = new Set(); // ← dedup across pages

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

    if (!reviews || reviews.length === 0) {
      console.log(`  Page ${pageNum}: no reviews, stopping.`);
      break;
    }

    let pageCount = 0;
    for (const r of reviews) {
      const comment = (r.review_comment || "").trim();
      const title = (r.review_title || "").trim();
      const rating = parseInt(r.review_star_rating) || 0;

      if (rating < 1 || rating > 5) continue;

      // Prefer full comment body; fallback to title only if no comment
      let text = "";
      if (comment.length >= 10) {
        text = comment;
      } else if (title.length >= 3) {
        text = title;
      } else {
        continue;
      }

      // Skip duplicates across pages (RapidAPI sometimes repeats same page)
      const key = text.toLowerCase().slice(0, 80);
      if (seenTexts.has(key)) continue;
      seenTexts.add(key);

      allReviews.push({ text, rating });
      pageCount++;
    }

    console.log(`  Page ${pageNum}: got ${pageCount} new reviews`);
    if (pageCount === 0) {
      console.log(`  All duplicates, stopping.`);
      break;
    }
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

    document.querySelectorAll("div.css-g5y9jx").forEach((card) => {
      const hasReviewFor = Array.from(card.querySelectorAll("*")).some(
        (el) => el.children.length === 0 && el.textContent.trim().startsWith("Review for:")
      );
      if (!hasReviewFor) return;

      const bodySpan = card.querySelector("span.css-1jxf684");
      const bodyText = bodySpan ? bodySpan.textContent.trim() : "";
      if (!bodyText || bodyText.length < 5 || seen.has(bodyText)) return;

      let title = "";
      const leafDivs = Array.from(card.querySelectorAll("div.css-146c3p1")).filter(
        (el) => el.children.length === 0
      );
      for (const d of leafDivs) {
        const t = d.textContent.trim();
        if (!t.startsWith("Review for:") && t.length > 3 && t.length < 80) {
          title = t;
          break;
        }
      }

      let rating = 0;
      const parent = card.parentElement;
      const searchRoot = parent || card;
      searchRoot.querySelectorAll("[aria-label]").forEach((el) => {
        const label = el.getAttribute("aria-label") || "";
        const m = label.match(/^(\d)(\.\d+)?\s*(out of \d+\s*)?stars?/i);
        if (m) rating = parseInt(m[1]);
      });

      if (!rating && parent) {
        const siblings = Array.from(parent.children);
        const cardIndex = siblings.indexOf(card);
        for (let i = Math.max(0, cardIndex - 3); i <= cardIndex; i++) {
          const sib = siblings[i];
          if (!sib) continue;
          sib.querySelectorAll("*").forEach((el) => {
            if (el.children.length === 0) {
              const t = el.textContent.trim();
              const n = parseInt(t);
              if (n >= 1 && n <= 5 && t === String(n)) rating = n;
            }
          });
          if (rating) break;
        }
      }

      if (!rating) rating = 3;
      seen.add(bodyText);
      results.push({ text: title ? `${title} — ${bodyText}` : bodyText, rating });
    });

    return results;
  });
}

async function scrapeFlipkart(rawUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(randomUA());
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-IN,en;q=0.9",
      Referer: "https://www.flipkart.com/",
    });

    const allReviews = [];
    const seenTexts = new Set();

    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      const reviewsUrl = buildFlipkartReviewsUrl(rawUrl, pageNum);
      console.log(`🔗 Flipkart URL (page ${pageNum}):`, reviewsUrl);

      await page.goto(reviewsUrl, { waitUntil: "networkidle2", timeout: 40000 });
      for (let i = 0; i < 6; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (pageNum === 1) console.log("📄 Flipkart title:", await page.title());

      const pageReviews = await extractFlipkartReviewsFromPage(page);
      console.log(`  Page ${pageNum}: got ${pageReviews.length} reviews`);

      let newCount = 0;
      for (const r of pageReviews) {
        if (!seenTexts.has(r.text)) {
          seenTexts.add(r.text);
          allReviews.push(r);
          newCount++;
        }
      }

      if (newCount === 0) { console.log(`  No new reviews, stopping.`); break; }
    }

    console.log(`📊 Flipkart total: ${allReviews.length} reviews`);
    if (!allReviews.length)
      throw new Error("Flipkart se reviews nahi mile. Demo Mode try karo.");
    return allReviews;
  } finally {
    await browser.close();
  }
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

async function scrapeReviews(url) {
  const hostname = new URL(url).hostname;
  if (hostname.includes("amazon")) return scrapeAmazon(url);
  if (hostname.includes("flipkart")) return scrapeFlipkart(url);
  throw new Error("Sirf Amazon aur Flipkart URLs supported hain.");
}

module.exports = { scrapeReviews };