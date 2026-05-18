// utils/detector.js

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
  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return { words, counts };
}

const STOP_WORDS = new Set([
  "the","a","an","is","it","in","on","of","to","and","for","with",
  "this","that","my","i","very","so","but","not","are","was","its",
  "have","has","be","at","by","or","as","if","do","did","get","got",
  "me","we","he","she","they","you","your","our","their","will","can",
  "just","also","than","then","when","what","how","all","from","more",
  "even","after","about","been","would","could","should","which","there",
  "into","them","these","those","some","such","no","up","out","one",
  "phone","mobile","product","buy","purchased","bought","using","use",
]);

// Words that are so vague they add zero signal
const VAGUE_WORDS = new Set([
  "good","great","nice","best","awesome","amazing","excellent","superb",
  "wonderful","fantastic","perfect","outstanding","brilliant","fabulous",
  "love","loved","like","liked","fine","okay","ok","average","normal",
  "overall","recommended","recommend","must","buy","worth","value","money",
  "budget","price","cheap","expensive","satisfied","happy","pleased",
]);

function hasRepetitiveWords(text) {
  const { words, counts } = getWordCounts(text);
  const meaningful = Object.entries(counts).filter(
    ([word]) => !STOP_WORDS.has(word) && word.length > 2
  );
  if (meaningful.length === 0) return false;
  const maxCount = Math.max(...meaningful.map(([, c]) => c));
  const meaningfulTotal = words.filter(w => !STOP_WORDS.has(w) && w.length > 2).length;
  return maxCount >= 3 || (meaningfulTotal > 2 && maxCount / meaningfulTotal > 0.5);
}

function getRepeatedWords(text) {
  const { counts } = getWordCounts(text);
  return Object.entries(counts).filter(([, c]) => c >= 2).map(([w]) => w);
}

// ── NEW: Vagueness score ──────────────────────────────────────────────────────
// Measures what % of meaningful words are just generic praise/filler
function vaguenesScore(text) {
  const { words } = getWordCounts(text);
  const meaningful = words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
  if (meaningful.length === 0) return 1;
  const vagueCount = meaningful.filter(w => VAGUE_WORDS.has(w)).length;
  return vagueCount / meaningful.length;
}

// ── NEW: Specificity check ────────────────────────────────────────────────────
// Reviews that mention actual product features are more likely genuine
const SPECIFIC_TERMS = [
  "battery","camera","display","screen","performance","heating","heat",
  "charging","speaker","fingerprint","processor","ram","storage","update",
  "signal","network","5g","4g","wifi","bluetooth","gaming","lag","smooth",
  "build","design","plastic","glass","weight","grip","software","ui","os",
  "photo","video","selfie","night","zoom","portrait","processor","chip",
  "delivery","box","seal","damaged","packaging","return","refund","service",
  "month","week","day","year","hours","hour","minutes",
];

function hasSpecificTerms(text) {
  const lower = text.toLowerCase();
  return SPECIFIC_TERMS.filter(t => lower.includes(t));
}

const SPAM_PHRASES = [
  /\b(\w+)( \1){2,}/i,
  /!{4,}/,
  /[A-Z]{6,}/,
  /\b(buy now|click here|order now|limited offer|act fast)\b/i,
  /thanks\s+(flipkart|amazon)\s+for/i,  // "THANKS FLIPKART FOR DELIVERY"
];

function matchedSpamPhrases(text) {
  return SPAM_PHRASES.filter(p => p.test(text));
}

// ── Sentiment vs rating mismatch ─────────────────────────────────────────────
const NEG_WORDS = ["worst","terrible","horrible","awful","waste","garbage",
  "useless","broken","disgusting","pathetic","scam","bad","poor","worst",
  "disappoint","issue","problem","defect","fake","return","refund","broken"];
const POS_WORDS = ["amazing","best","love","fantastic","excellent","perfect",
  "wonderful","incredible","outstanding","superb","flawless","great"];

function sentimentMismatch(text, rating) {
  const lower = text.toLowerCase();
  const negCount = NEG_WORDS.filter(w => lower.includes(w)).length;
  const posCount = POS_WORDS.filter(w => lower.includes(w)).length;
  // 5★ review but clearly negative language
  if (rating >= 4 && negCount >= 2 && posCount === 0) return true;
  // 1★ review but purely positive language
  if (rating <= 2 && posCount >= 2 && negCount === 0) return true;
  return false;
}

// ─── Explanation Builder ─────────────────────────────────────────────────────

function buildExplanation(reasons, confidence) {
  if (reasons.length === 0)
    return "This review appears genuine — it mentions specific product details and has a natural tone.";

  const parts = [];
  if (reasons.includes("duplicate"))       parts.push("it is an exact copy of another review");
  if (reasons.includes("too_short"))       parts.push("it is too short to be informative");
  if (reasons.includes("repetitive"))      parts.push("it repeats words in an unnatural pattern");
  if (reasons.includes("too_vague"))       parts.push("it contains only generic praise with no specific details");
  if (reasons.includes("spam_pattern"))    parts.push("it matches known spam/bot patterns");
  if (reasons.includes("rating_mismatch")) parts.push("the text sentiment contradicts the star rating");
  if (reasons.includes("no_specifics"))    parts.push("it mentions no actual product features or experience");

  const joined =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];

  const certainty = confidence >= 75 ? "very likely" : confidence >= 50 ? "likely" : "possibly";
  return `This review is ${certainty} fake because ${joined}.`;
}

// ─── Core Detection ──────────────────────────────────────────────────────────

function detectFake(review, allTexts) {
  const text  = review.text || "";
  const wordCount = countWords(text);
  let confidence = 0;
  const reasons = [];

  // 1. Duplicate (+55)
  const dupes = allTexts.filter(t => t.toLowerCase() === text.toLowerCase());
  if (dupes.length > 1) { confidence += 55; reasons.push("duplicate"); }

  // 2. Too short
  if (wordCount <= 2)       { confidence += 50; reasons.push("too_short"); }
  else if (wordCount <= 5)  { confidence += 30; reasons.push("too_short"); }
  else if (wordCount <= 8)  { confidence += 15; reasons.push("too_short"); }

  // 3. Spam patterns
  if (matchedSpamPhrases(text).length > 0) { confidence += 25; reasons.push("spam_pattern"); }

  // 4. Repetitive words
  if (hasRepetitiveWords(text)) { confidence += 25; reasons.push("repetitive"); }

  // 5. Vagueness — NEW & IMPORTANT
  //    Short reviews that are ALL generic praise = classic fake signal
  const vague = vaguenesScore(text);
  if (wordCount <= 15 && vague >= 0.85) { confidence += 35; reasons.push("too_vague"); }
  else if (wordCount <= 25 && vague >= 0.90) { confidence += 25; reasons.push("too_vague"); }

  // 6. No specific product terms — for medium-length reviews only
  //    (short reviews already caught by too_short/too_vague)
  const specificTerms = hasSpecificTerms(text);
  if (wordCount >= 8 && wordCount <= 30 && specificTerms.length === 0) {
    confidence += 20;
    reasons.push("no_specifics");
  }

  // 7. Rating vs sentiment mismatch
  if (sentimentMismatch(text, review.rating)) { confidence += 20; reasons.push("rating_mismatch"); }

  // 8. BONUS: Genuine signals — reduce confidence
  //    If review has specific terms AND decent length, it's less likely fake
  if (specificTerms.length >= 2 && wordCount >= 15) confidence = Math.max(0, confidence - 20);
  if (specificTerms.length >= 3 && wordCount >= 20) confidence = Math.max(0, confidence - 15);

  confidence = Math.min(confidence, 97);

  console.log(`[DEBUG] "${text.slice(0, 50)}" | conf:${confidence} | reasons:${JSON.stringify(reasons)}`);

  const isFake = confidence >= 45;
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
  const repeatedWordsSet = new Set();
  for (const r of rawReviews) getRepeatedWords(r.text).forEach(w => repeatedWordsSet.add(w));

  const suspiciousPatterns = [];

  const dupTexts = rawReviews.map(r => r.text.toLowerCase())
    .filter((t, i, arr) => arr.indexOf(t) !== i);
  if (dupTexts.length > 0)
    suspiciousPatterns.push(`${dupTexts.length} duplicate review(s) detected`);

  const tooShort = analyzed.filter(r => r.reasons.includes("too_short")).length;
  if (tooShort > 0) suspiciousPatterns.push(`${tooShort} review(s) are suspiciously short`);

  const vague = analyzed.filter(r => r.reasons.includes("too_vague")).length;
  if (vague > 0) suspiciousPatterns.push(`${vague} review(s) contain only generic vague praise`);

  const noSpec = analyzed.filter(r => r.reasons.includes("no_specifics")).length;
  if (noSpec > 0) suspiciousPatterns.push(`${noSpec} review(s) mention no actual product details`);

  const spam = analyzed.filter(r => r.reasons.includes("spam_pattern")).length;
  if (spam > 0) suspiciousPatterns.push(`${spam} review(s) match known spam patterns`);

  const mismatch = analyzed.filter(r => r.reasons.includes("rating_mismatch")).length;
  if (mismatch > 0) suspiciousPatterns.push(`${mismatch} review(s) have rating/sentiment mismatch`);

  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rawReviews) ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;

  const fakeByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of analyzed) if (r.isFake) fakeByRating[r.rating] = (fakeByRating[r.rating] || 0) + 1;

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