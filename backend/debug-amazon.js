// debug-amazon.js — backend/ folder mein rakho aur chalaao: node debug-amazon.js
// Yeh Amazon ka actual HTML dump karega taaki pata chale kya block ho raha hai

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

// ✏️  Apna Amazon product URL yahan daal
const TEST_URL = "https://www.amazon.in/dp/B0CX4JQBGB"; // example — apna daal

async function main() {
  const browser = await puppeteer.launch({
    headless: false, // <-- VISIBLE window — dekh kya ho raha hai
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
    Referer: "https://www.amazon.in/",
  });

  // Step 1: Homepage first (cookies set hoti hain — less suspicious)
  console.log("🏠 Opening Amazon homepage first...");
  await page.goto("https://www.amazon.in", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Step 2: Product page
  console.log("📦 Going to product page...");
  await page.goto(TEST_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Extract ASIN
  const asinMatch = TEST_URL.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/);
  if (!asinMatch) { console.error("❌ ASIN nahi mila"); await browser.close(); return; }
  const asin = asinMatch[1];
  console.log("✅ ASIN:", asin);

  // Step 3: Reviews page
  const reviewsUrl = `https://www.amazon.in/product-reviews/${asin}?ie=UTF8&reviewerType=all_reviews&sortBy=recent&pageNumber=1`;
  console.log("⭐ Going to reviews page:", reviewsUrl);
  await page.goto(reviewsUrl, { waitUntil: "domcontentloaded", timeout: 40000 });
  await new Promise((r) => setTimeout(r, 3000));

  const title = await page.title();
  console.log("📄 Page title:", title);

  // Count review elements
  const reviewCount = await page.evaluate(() => {
    return {
      dataHookReview: document.querySelectorAll('[data-hook="review"]').length,
      dataHookReviewBody: document.querySelectorAll('[data-hook="review-body"]').length,
      reviewsSection: document.querySelectorAll("#cm_cr-review_list").length,
      // Try alternate selectors Amazon sometimes uses
      reviewCard: document.querySelectorAll(".review").length,
      reviewText: document.querySelectorAll(".review-text").length,
    };
  });
  console.log("\n🔍 Element counts:", reviewCount);

  // Save HTML for inspection
  const html = await page.content();
  fs.writeFileSync("amazon-debug.html", html);
  console.log("\n💾 Full HTML saved to amazon-debug.html");
  console.log("   Open it in browser to inspect DOM structure\n");

  // Show first 3000 chars of body text
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log("📝 Page body text (first 2000 chars):\n");
  console.log(bodyText);

  await new Promise((r) => setTimeout(r, 5000)); // 5 sec window open raho dekh lo
  await browser.close();
}

main().catch(console.error);