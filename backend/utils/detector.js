const DEMO_REVIEWS = [
  { text: "Amazing product, highly recommend!", rating: 5 },
  { text: "Worst product, stopped working in 2 days", rating: 1 },
  { text: "Good good good good best best best", rating: 5 },
  { text: "Nice", rating: 5 },
  { text: "Not worth the money", rating: 2 },
  { text: "Amazing product, highly recommend!", rating: 5 },
  { text: "Absolutely love this! Best purchase ever made in my life, 10/10 would buy again!", rating: 5 },
  { text: "Works as described, solid quality for the price point.", rating: 4 },
  { text: "ok", rating: 3 },
  { text: "Super super super great great great amazing amazing!", rating: 5 },
  { text: "I purchased this for my home office and it has exceeded all expectations. Build quality is excellent.", rating: 4 },
  { text: "Broke after one week. Complete waste of money. Never buying again!", rating: 1 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getWordCounts(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return { words, counts };
}

function hasRepetitiveWords(text) {
  const { words, counts } = getWordCounts(text);
  const maxCount = Math.max(...Object.values(counts));
  return maxCount >= 3 || (words.length > 0 && maxCount / words.length > 0.4);
}

function getRepeatedWords(text) {
  const { counts } = getWordCounts(text);
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([word]) => word);
}

const POS_WORDS = ["amazing", "best", "love", "fantastic", "excellent", "perfect",
  "wonderful", "incredible", "outstanding", "superb", "flawless", "great"];
const NEG_WORDS = ["worst", "terrible", "horrible", "awful", "waste", "garbage",
  "useless", "broken", "never", "disgusting", "pathetic", "scam"];
const SPAM_PHRASES = [
  /\b(\w+)( \1){2,}/i,           // word repeated 3+ times in a row
  /!{3,}/,                        // 3+ exclamation marks
  /[A-Z]{5,}/,                    // ALL CAPS run
  /\b(buy now|click here|order now|limited offer|act fast)\b/i,
  /10\/10|5\/5|100%/,
];

function isExtremePositive(text, rating) {
  const wordCount = countWords(text);
  const matchCount = POS_WORDS.filter(w => text.toLowerCase().includes(w)).length;
  return rating === 5 && matchCount >= 3 && wordCount < 15;
}

function isExtremeNegative(text, rating) {
  const matchCount = NEG_WORDS.filter(w => text.toLowerCase().includes(w)).length;
  return rating === 1 && matchCount >= 2 && countWords(text) < 10;
}

function matchedSpamPhrases(text) {
  return SPAM_PHRASES.filter(p => p.test(text)).map(p => p.toString());
}

// ─── AI Explanation Builder ──────────────────────────────────────────────────

function buildExplanation(reasons, confidence) {
  if (reasons.length === 0) {
    return "This review appears genuine — it shows natural language patterns and a balanced tone.";
  }

  const parts = [];
  if (reasons.includes("duplicate"))
    parts.push("it is an exact copy of another review");
  if (reasons.includes("too_short"))
    parts.push("it is unusually short and lacks detail");
  if (reasons.includes("repetitive"))
    parts.push("it contains words repeated in an unnatural pattern");
  if (reasons.includes("extreme_positive"))
    parts.push("it uses excessive positive language with very few words");
  if (reasons.includes("extreme_negative"))
    parts.push("it uses extreme negative language with very few words");
  if (reasons.includes("spam_pattern"))
    parts.push("it matches known spam patterns");

  const joined = parts.length === 1
    ? parts[0]
    : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];

  const certainty = confidence >= 80 ? "very likely" : confidence >= 60 ? "likely" : "possibly";
  return `This review is ${certainty} fake because ${joined}.`;
}

// ─── Core Detection ──────────────────────────────────────────────────────────

function detectFake(review, allTexts) {
  const text = review.text;
  const wordCount = countWords(text);
  let confidence = 10;
  const reasons = [];

  const duplicates = allTexts.filter(t => t.toLowerCase() === text.toLowerCase());
  if (duplicates.length > 1) { confidence += 45; reasons.push("duplicate"); }

  if (wordCount < 5) { confidence += 30; reasons.push("too_short"); }

  if (hasRepetitiveWords(text)) { confidence += 25; reasons.push("repetitive"); }

  if (isExtremePositive(text, review.rating)) { confidence += 20; reasons.push("extreme_positive"); }

  if (isExtremeNegative(text, review.rating)) { confidence += 15; reasons.push("extreme_negative"); }

  if (matchedSpamPhrases(text).length > 0) { confidence += 15; reasons.push("spam_pattern"); }

  confidence = Math.min(confidence, 97);
  const isFake = confidence >= 40;

  return {
    text: review.text,
    rating: review.rating,
    isFake,
    confidence,
    reasons,
    explanation: buildExplanation(isFake ? reasons : [], confidence),
  };
}

// ─── Insights Generator ──────────────────────────────────────────────────────

function buildInsights(rawReviews, analyzed) {
  // Collect all repeated words across all reviews
  const repeatedWordsSet = new Set();
  for (const r of rawReviews) {
    getRepeatedWords(r.text).forEach(w => repeatedWordsSet.add(w));
  }

  // Suspicious patterns found across the dataset
  const suspiciousPatterns = [];

  const duplicateTexts = rawReviews
    .map(r => r.text.toLowerCase())
    .filter((t, i, arr) => arr.indexOf(t) !== i);
  if (duplicateTexts.length > 0)
    suspiciousPatterns.push(`${duplicateTexts.length} duplicate review(s) detected`);

  const tooShort = analyzed.filter(r => r.reasons.includes("too_short")).length;
  if (tooShort > 0)
    suspiciousPatterns.push(`${tooShort} review(s) are suspiciously short`);

  const repetitive = analyzed.filter(r => r.reasons.includes("repetitive")).length;
  if (repetitive > 0)
    suspiciousPatterns.push(`${repetitive} review(s) have repetitive word patterns`);

  const spamCount = analyzed.filter(r => r.reasons.includes("spam_pattern")).length;
  if (spamCount > 0)
    suspiciousPatterns.push(`${spamCount} review(s) match known spam patterns`);

  // Rating distribution
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rawReviews) ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;

  // Fake reviews by rating
  const fakeByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of analyzed) {
    if (r.isFake) fakeByRating[r.rating] = (fakeByRating[r.rating] || 0) + 1;
  }

  return {
    repeatedWords: [...repeatedWordsSet].slice(0, 20),
    suspiciousPatterns,
    ratingDistribution: ratingDist,
    fakeByRating,
    totalReviews: rawReviews.length,
    fakeCount: analyzed.filter(r => r.isFake).length,
    genuineCount: analyzed.filter(r => !r.isFake).length,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

function analyzeReviews(rawReviews) {
  const allTexts = rawReviews.map(r => r.text);
  const analyzed = rawReviews.map(r => detectFake(r, allTexts));
  const fakeCount = analyzed.filter(r => r.isFake).length;
  const fakePercentage = Math.round((fakeCount / analyzed.length) * 100);
  const insights = buildInsights(rawReviews, analyzed);
  return { reviews: analyzed, fakePercentage, insights };
}

module.exports = { DEMO_REVIEWS, analyzeReviews };