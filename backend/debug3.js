// debug3.js — run from backend/ folder: node debug3.js
const puppeteer = require("puppeteer");
const fs = require("fs");

const URL =
  "https://www.flipkart.com/vivo-t3-pro-5g-sandstone-orange-256-gb/product-reviews/itmcf52c1fcffbf3?pid=MOBH3XHR46RHEMVH&sortBy=MOST_RECENT";

(async () => {
  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-IN,en;q=0.9",
    Referer: "https://www.flipkart.com/",
  });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 40000 });

  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 2000));
  }

  const data = await page.evaluate(() => {
    const results = [];

    // Find all elements that contain "Review for:" — these mark individual review cards
    const allEls = Array.from(document.querySelectorAll("*"));

    const reviewForEls = allEls.filter((el) => {
      if (el.children.length > 0) return false;
      return el.textContent.trim().startsWith("Review for:");
    });

    console.log("Found Review for: elements:", reviewForEls.length);

    reviewForEls.slice(0, 3).forEach((el, idx) => {
      // Walk UP until we find a container with 5+ leaf text nodes (the full review card)
      let node = el;
      const cardInfo = [];

      for (let i = 0; i < 15; i++) {
        node = node.parentElement;
        if (!node) break;

        const leaves = [];
        node.querySelectorAll("*").forEach((child) => {
          if (child.children.length === 0) {
            const txt = child.textContent.trim();
            if (txt.length > 5) {
              leaves.push({
                tag: child.tagName,
                cls: (child.className || "").slice(0, 100),
                len: txt.length,
                text: txt.slice(0, 150),
              });
            }
          }
        });

        cardInfo.push({
          depth: i,
          tag: node.tagName,
          cls: (node.className || "").slice(0, 80),
          leafCount: leaves.length,
          leaves: leaves.slice(0, 8),
        });

        // Stop when we have enough text — this is probably the review card
        if (leaves.length >= 5) break;
      }

      results.push({ reviewForEl: idx, cardInfo });
    });

    return results;
  });

  fs.writeFileSync("debug3-output.json", JSON.stringify(data, null, 2));
  console.log("💾 Saved debug3-output.json\n");

  data.forEach((item) => {
    console.log(`\n====== Review card #${item.reviewForEl + 1} ======`);
    item.cardInfo.forEach((a) => {
      console.log(`  depth=${a.depth} <${a.tag}> class="${a.cls}" leafCount=${a.leafCount}`);
      a.leaves.forEach((l) =>
        console.log(`    [${l.len}] <${l.tag}> cls="${l.cls.slice(0, 60)}" → "${l.text}"`)
      );
    });
  });

  await browser.close();
})();