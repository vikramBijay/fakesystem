// controllers/analyzeController.js
const { DEMO_REVIEWS, analyzeReviews } = require("../utils/detector");
const { scrapeReviews } = require("../utils/scraper");

// ── Groq AI — only borderline reviews bhejo ───────────────────────────────────
async function groqAnalyzeBatch(reviews, ruleReviews) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Sirf borderline cases — clear fake/genuine skip
  // conf 0-14  → clearly genuine, skip
  // conf 15-44 → uncertain, send to Groq
  // conf 45+   → clearly fake, skip
  const borderline = reviews
    .map((r, i) => ({ ...r, originalIndex: i, ruleConf: ruleReviews[i].confidence }))
    .filter((r) => r.ruleConf >= 15 && r.ruleConf < 45);

  if (borderline.length === 0) {
    console.log("  No borderline reviews — skipping Groq");
    return null;
  }

  console.log(`  Sending ${borderline.length}/${reviews.length} borderline reviews to Groq`);

  // Short prompt — less tokens
  const numbered = borderline
    .map((r, i) => `${i + 1}. [${r.rating}★] "${r.text}"`)
    .join("\n");

  const prompt = `Fake review detector for Indian e-commerce.
FAKE: vague only, no product details (battery/camera/display/heating/performance), short filler, bot-like, rating contradicts text.
GENUINE: specific features mentioned, real experience described.

${numbered}

JSON only, no markdown: [{"index":1,"isFake":false,"confidence":20,"reason":"one sentence"}]`;

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 800,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You output only valid JSON arrays. No markdown, no explanation.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      console.warn("⚠️  Groq API error:", resp.status);
      return null;
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Log token usage
    const usage = data.usage;
    if (usage) {
      console.log(`  📊 Groq tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`);
    }

    // Groq sometimes returns multiple separate arrays — collect all and merge
    const matches = [...raw.matchAll(/\[[^\[\]]*\]/g)];
    if (!matches.length) {
      console.warn("⚠️  Groq: no JSON found:", raw.slice(0, 200));
      return null;
    }
    const parsed = matches.flatMap((m) => { try { return JSON.parse(m[0]); } catch { return []; } });
    if (!parsed.length) return null;

    // Re-map Groq's 1-based index back to originalIndex
    return parsed.map((v) => ({
      ...v,
      originalIndex: borderline[v.index - 1]?.originalIndex ?? -1,
    }));
  } catch (err) {
    console.warn("⚠️  Groq parse error:", err.message);
    return null;
  }
}

// ── Merge results ─────────────────────────────────────────────────────────────
function mergeResults(ruleResults, aiVerdicts) {
  if (!aiVerdicts) return ruleResults;

  // Map by originalIndex
  const verdictMap = {};
  for (const v of aiVerdicts) {
    if (v.originalIndex >= 0) verdictMap[v.originalIndex] = v;
  }

  return ruleResults.map((r, i) => {
    const cv = verdictMap[i];
    if (!cv) return r; // not borderline — keep rule result as-is

    const blendedConf = Math.round(cv.confidence * 0.7 + r.confidence * 0.3);
    const isFake = blendedConf >= 45;

    return {
      ...r,
      isFake,
      confidence: Math.min(blendedConf, 97),
      explanation: cv.reason,
      reasons: isFake
        ? [...new Set([...r.reasons, "ai_flagged"])]
        : r.reasons.filter((x) => x === "duplicate"),
    };
  });
}

// ─── Main controller ──────────────────────────────────────────────────────────
async function analyzeController(req, res) {
  console.log("✅ /api/analyze called");
  const { url } = req.body;

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

    // Step 1: Rule-based (always runs, no API needed)
    const ruleResult = analyzeReviews(rawReviews);

    // Step 2: Groq AI — only for borderline reviews
    console.log("🤖 Groq AI checking borderline reviews...");
    const aiVerdicts = await groqAnalyzeBatch(rawReviews, ruleResult.reviews);

    if (aiVerdicts) {
      console.log(`✅ Groq resolved ${aiVerdicts.length} borderline reviews`);
      ruleResult.reviews = mergeResults(ruleResult.reviews, aiVerdicts);
      const fakeCount = ruleResult.reviews.filter((r) => r.isFake).length;
      ruleResult.fakePercentage = Math.round((fakeCount / ruleResult.reviews.length) * 100);
      ruleResult.insights.fakeCount = fakeCount;
      ruleResult.insights.genuineCount = ruleResult.reviews.length - fakeCount;
    } else {
      console.log("⚠️  Groq unavailable — rule-based results used");
    }

    return res.json({ ...ruleResult, source: "live", aiPowered: !!aiVerdicts });
  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    return res.status(422).json({
      error: err.message,
      hint: "Try pasting the product-reviews URL directly from your browser.",
    });
  }
}

module.exports = { analyzeController };