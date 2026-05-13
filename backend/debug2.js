// debug2.js — run from backend/ folder: node debug2.js
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
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9", Referer: "https://www.flipkart.com/" });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 40000 });

  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Run extraction inside real browser to get computed info
  const data = await page.evaluate(() => {
    const results = [];

    // Find all rating bubbles (small elements with text 1-5)
    document.querySelectorAll("*").forEach((el) => {
      if (el.children.length > 0) return;
      const t = el.textContent.trim();
      const n = parseInt(t);
      if (n < 1 || n > 5 || t !== String(n)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width > 80 || rect.height > 80) return; // skip big elements

      // Collect info about this rating bubble and its ancestors
      const ancestorInfo = [];
      let node = el;
      for (let i = 0; i < 12; i++) {
        node = node.parentElement;
        if (!node) break;

        // Get ALL direct text of leaf descendants
        const leafTexts = [];
        node.querySelectorAll("*").forEach((child) => {
          if (child.children.length === 0) {
            const txt = child.textContent.trim();
            if (txt.length > 20) leafTexts.push({ len: txt.length, text: txt.slice(0, 120), tag: child.tagName, cls: child.className });
          }
        });

        ancestorInfo.push({
          depth: i,
          tag: node.tagName,
          cls: (node.className || "").slice(0, 80),
          leafCount: leafTexts.length,
          leaves: leafTexts.slice(0, 5),
        });

        if (leafTexts.length >= 3) break; // found a card-level container
      }

      results.push({ rating: n, ancestors: ancestorInfo });
    });

    return results.slice(0, 5); // first 5 rating bubbles
  });

  fs.writeFileSync("debug2-output.json", JSON.stringify(data, null, 2));
  console.log("💾 Saved debug2-output.json");
  console.log("\n📋 Summary of first 3 rating bubbles:\n");

  data.slice(0, 3).forEach((item, i) => {
    console.log(`\n=== Rating bubble #${i + 1}: rating=${item.rating} ===`);
    item.ancestors.forEach((a) => {
      console.log(`  depth=${a.depth} <${a.tag}> class="${a.cls}" leafCount=${a.leafCount}`);
      a.leaves.forEach((l) => console.log(`    [${l.len}] <${l.tag}> cls="${l.cls}" → "${l.text}"`));
    });
  });

  await browser.close();
})();