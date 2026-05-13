// utils/scraper.js — Puppeteer scraper for Amazon & Flipkart

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// ─── AMAZON ──────────────────────────────────────────────────────────────────

function buildAmazonReviewsUrl(rawUrl, page = 1) {
  const url = new URL(rawUrl);
  const asinMatch =
    url.pathname.match(/(?:\/dp\/|\/gp\/product\/|\/product-reviews\/|\/ASIN\/)([A-Z0-9]{10})/) ||
    rawUrl.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/);
  if (!asinMatch)
    throw new Error("Could not find Amazon ASIN in URL. Paste the product page URL.");
  const asin = asinMatch[1];
  const host = url.hostname;
  return `https://${host}/product-reviews/${asin}?pageSize=10&pageNumber=${page}&sortBy=recent&reviewerType=all_reviews`;
}

async function scrapeAmazon(rawUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });

    const allReviews = [];

    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      const reviewsUrl = buildAmazonReviewsUrl(rawUrl, pageNum);
      console.log(`🔗 Amazon reviews URL (page ${pageNum}):`, reviewsUrl);

      await page.goto(reviewsUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise((r) => setTimeout(r, 1200));
      }

      const html = await page.content();
      const $ = cheerio.load(html);
      const title = $("title").text().trim();

      if (pageNum === 1) {
        console.log("📄 Amazon page title:", title);
        if (title.toLowerCase().includes("sign-in") || title.toLowerCase().includes("signin"))
          throw new Error("Amazon is blocking automated access. Try Demo Mode or a Flipkart URL.");
      }

      let pageReviews = 0;
      $('[data-hook="review"]').each((_, el) => {
        const text = $('[data-hook="review-body"] span', el).not('[class*="cr-original"]').first().text().trim();
        const ratingRaw = $('[data-hook="review-star-rating"] span', el).first().text() ||
          $('[data-hook="cmps-review-star-rating"] span', el).first().text();
        const rating = parseFloat(ratingRaw);
        if (text && rating >= 1 && rating <= 5) {
          allReviews.push({ text, rating: Math.round(rating) });
          pageReviews++;
        }
      });

      console.log(`  Page ${pageNum}: got ${pageReviews} reviews`);
      if (pageReviews === 0) break; // no more pages
    }

    console.log(`📊 Amazon total: ${allReviews.length} reviews`);
    if (!allReviews.length)
      throw new Error("Amazon blocked this request or no reviews found. Try Demo Mode.");
    return allReviews;
  } finally {
    await browser.close();
  }
}

// ─── FLIPKART ─────────────────────────────────────────────────────────────────

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

// Extract reviews from the current page using confirmed DOM structure
async function extractFlipkartReviewsFromPage(page) {
  return page.evaluate(() => {
    const results = [];
    const seen = new Set();

    document.querySelectorAll("div.css-g5y9jx").forEach((card) => {
      // Must contain "Review for:" to be a review card
      const hasReviewFor = Array.from(card.querySelectorAll("*")).some(
        (el) => el.children.length === 0 && el.textContent.trim().startsWith("Review for:")
      );
      if (!hasReviewFor) return;

      // Review body: <span class="css-1jxf684">
      const bodySpan = card.querySelector("span.css-1jxf684");
      const bodyText = bodySpan ? bodySpan.textContent.trim() : "";
      if (!bodyText || bodyText.length < 5 || seen.has(bodyText)) return;

      // Review title: first short div.css-146c3p1 that isn't "Review for:"
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

      // Rating: aria-label on any element in/around the card
      let rating = 0;
      const parent = card.parentElement;
      const searchRoot = parent || card;
      searchRoot.querySelectorAll("[aria-label]").forEach((el) => {
        const label = el.getAttribute("aria-label") || "";
        const m = label.match(/^(\d)(\.\d+)?\s*(out of \d+\s*)?stars?/i);
        if (m) rating = parseInt(m[1]);
      });

      // Fallback: sibling element with lone digit 1-5
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
      results.push({
        text: title ? `${title} — ${bodyText}` : bodyText,
        rating,
      });
    });

    return results;
  });
}

async function scrapeFlipkart(rawUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9", Referer: "https://www.flipkart.com/" });

    const allReviews = [];
    const seenTexts = new Set();

    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      const reviewsUrl = buildFlipkartReviewsUrl(rawUrl, pageNum);
      console.log(`🔗 Flipkart reviews URL (page ${pageNum}):`, reviewsUrl);

      await page.goto(reviewsUrl, { waitUntil: "networkidle2", timeout: 40000 });

      // Scroll to load all cards on this page
      for (let i = 0; i < 6; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (pageNum === 1)
        console.log("📄 Flipkart page title:", await page.title());

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

      // Stop if no new reviews found on this page
      if (newCount === 0) {
        console.log(`  No new reviews on page ${pageNum}, stopping.`);
        break;
      }
    }

    console.log(`📊 Flipkart total: ${allReviews.length} reviews`);
    if (!allReviews.length)
      throw new Error("Could not extract Flipkart reviews. Try Demo Mode.");
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
  throw new Error("Unsupported site. Only Amazon and Flipkart URLs are supported.");
}

module.exports = { scrapeReviews };