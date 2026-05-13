// debug-flipkart.js
// Run: node debug-flipkart.js
// This will dump the actual class names used in the rendered Flipkart page

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const URL = "https://www.flipkart.com/vivo-t3-pro-5g-sandstone-orange-256-gb/product-reviews/itmcf52c1fcffbf3?pid=MOBH3XHR46RHEMVH&sortBy=MOST_RECENT";

(async () => {
  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({
    headless: false, // visible so you can see what's happening
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
    Referer: "https://www.flipkart.com/",
  });

  console.log("🌐 Navigating to:", URL);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 40000 });

  // Scroll to load reviews
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 2000));
  }

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);

  console.log("\n📄 Page title:", $("title").text().trim());

  // ── 1. Find all divs that contain ONLY a single digit 1-5 (rating bubbles) ──
  console.log("\n🔍 Looking for rating bubbles (divs with single digit 1-5):");
  const ratingDivs = [];
  $("div").each((_, el) => {
    const ownText = $(el).clone().children().remove().end().text().trim();
    const n = parseInt(ownText);
    if (n >= 1 && n <= 5 && ownText === String(n)) {
      const classes = $(el).attr("class") || "(no class)";
      ratingDivs.push({ rating: n, classes });
    }
  });
  // Deduplicate class names
  const uniqueRatingClasses = [...new Set(ratingDivs.map((d) => d.classes))];
  console.log("Unique rating div classes:", uniqueRatingClasses.slice(0, 10));
  console.log("Sample rating divs:", ratingDivs.slice(0, 5));

  // ── 2. Find divs with long text (review bodies) ───────────────────────────
  console.log("\n🔍 Looking for review text divs (text length 30-800 chars):");
  const textDivs = [];
  $("div, p").each((_, el) => {
    const ownText = $(el).clone().children().remove().end().text().trim();
    if (ownText.length >= 30 && ownText.length <= 800) {
      const classes = $(el).attr("class") || "(no class)";
      textDivs.push({ len: ownText.length, classes, text: ownText.slice(0, 80) });
    }
  });
  console.log("Sample text divs:");
  textDivs.slice(0, 15).forEach((d) =>
    console.log(`  [${d.len}] class="${d.classes}" → "${d.text}..."`)
  );

  // ── 3. Check known class names ────────────────────────────────────────────
  console.log("\n🔍 Checking known Flipkart class names:");
  const knownClasses = [
    "_27M-vq", "ZmyHeo", "_6K-7Co", "_3LWZlK", "XQDdHH",
    "EPCmJX", "iCSeDn", "t-ZTKy", "col._2wzgFH", "_2sc7ZR",
    "_11pzQk", "row", "_3BSf3l", "_1lRcqv", "_2_R_DZ"
  ];
  for (const cls of knownClasses) {
    const count = $(`.${cls}`).length;
    if (count > 0) console.log(`  ✅ .${cls} → ${count} elements`);
    else console.log(`  ❌ .${cls} → not found`);
  }

  // ── 4. Save full HTML for manual inspection ───────────────────────────────
  fs.writeFileSync("flipkart-debug.html", html);
  console.log("\n💾 Full HTML saved to flipkart-debug.html");
  console.log("   Open it in VS Code and search for a visible review text to find its class.");
})();