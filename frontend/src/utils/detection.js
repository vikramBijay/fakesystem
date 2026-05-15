const POS_WORDS = ['amazing','best','love','fantastic','excellent','perfect','wonderful','incredible','outstanding','superb','flawless','great'];
const NEG_WORDS = ['worst','terrible','horrible','awful','waste','garbage','useless','broken','never','disgusting','pathetic','scam'];
const SPAM_PATTERNS = [/\b(\w+)( \1){2,}/i, /!{3,}/, /[A-Z]{5,}/, /\b(buy now|click here|order now|limited offer|act fast)\b/i, /10\/10|5\/5|100%/];

function countWords(t) { return t.trim().split(/\s+/).filter(Boolean).length; }
function getWordCounts(t) {
  const words = t.toLowerCase().split(/\s+/).filter(Boolean), counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return { words, counts };
}
function hasRepetitiveWords(t) {
  const { words, counts } = getWordCounts(t);
  const max = Math.max(...Object.values(counts));
  return max >= 3 || (words.length > 0 && max / words.length > 0.4);
}
function getRepeatedWords(t) {
  const { counts } = getWordCounts(t);
  return Object.entries(counts).filter(([, c]) => c >= 2).map(([w]) => w);
}
function buildExplanation(reasons, confidence) {
  if (!reasons.length) return 'This review appears genuine — it shows natural language patterns and a balanced tone.';
  const map = {
    'Duplicate content': 'it is an exact copy of another review',
    'Too short': 'it is unusually short and lacks detail',
    'Repetitive words': 'it contains words repeated in an unnatural pattern',
    'Extreme positive': 'it uses excessive positive language with very few words',
    'Extreme negative': 'it uses extreme negative language with very few words',
    'Spam pattern': 'it matches known spam patterns',
  };
  const parts = reasons.map(r => map[r] || r).filter(Boolean);
  const joined = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  const certainty = confidence >= 80 ? 'very likely' : confidence >= 60 ? 'likely' : 'possibly';
  return `This review is ${certainty} fake because ${joined}.`;
}

export function detectFake(review, allTexts) {
  const text = review.text;
  let confidence = 10;
  const reasons = [];
  if (allTexts.filter(t => t.toLowerCase() === text.toLowerCase()).length > 1) { confidence += 45; reasons.push('Duplicate content'); }
  if (countWords(text) < 5) { confidence += 30; reasons.push('Too short'); }
  if (hasRepetitiveWords(text)) { confidence += 25; reasons.push('Repetitive words'); }
  if (review.rating === 5 && POS_WORDS.filter(w => text.toLowerCase().includes(w)).length >= 3 && countWords(text) < 15) { confidence += 20; reasons.push('Extreme positive'); }
  if (review.rating === 1 && NEG_WORDS.filter(w => text.toLowerCase().includes(w)).length >= 2 && countWords(text) < 10) { confidence += 15; reasons.push('Extreme negative'); }
  if (SPAM_PATTERNS.some(p => p.test(text))) { confidence += 15; reasons.push('Spam pattern'); }
  confidence = Math.min(confidence, 97);
  const isFake = confidence >= 40;
  return { text: review.text, rating: review.rating, isFake, confidence, reasons, explanation: buildExplanation(isFake ? reasons : [], confidence) };
}

export function buildInsights(raw, analyzed) {
  const rw = new Set();
  raw.forEach(r => getRepeatedWords(r.text).forEach(w => rw.add(w)));
  const sp = [];
  const dups = raw.map(r => r.text.toLowerCase()).filter((t, i, a) => a.indexOf(t) !== i);
  if (dups.length) sp.push(`${dups.length} duplicate review(s) detected`);
  const ts = analyzed.filter(r => r.reasons.includes('Too short')).length;
  if (ts) sp.push(`${ts} review(s) are suspiciously short`);
  const rep = analyzed.filter(r => r.reasons.includes('Repetitive words')).length;
  if (rep) sp.push(`${rep} review(s) have repetitive word patterns`);
  const spam = analyzed.filter(r => r.reasons.includes('Spam pattern')).length;
  if (spam) sp.push(`${spam} review(s) match known spam patterns`);
  const rd = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  raw.forEach(r => rd[r.rating] = (rd[r.rating] || 0) + 1);
  const fbr = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  analyzed.forEach(r => { if (r.isFake) fbr[r.rating] = (fbr[r.rating] || 0) + 1; });
  return { repeatedWords: [...rw].slice(0, 20), suspiciousPatterns: sp, ratingDistribution: rd, fakeByRating: fbr };
}

export function analyzeLocally(raw) {
  const allTexts = raw.map(r => r.text);
  const reviews = raw.map(r => detectFake(r, allTexts));
  const fakeCount = reviews.filter(r => r.isFake).length;
  const fakePercentage = Math.round((fakeCount / reviews.length) * 100);
  return { reviews, fakePercentage, insights: buildInsights(raw, reviews) };
}

export const DEMO_REVIEWS = [
  { text: 'Amazing product, highly recommend!', rating: 5 },
  { text: 'Worst product, stopped working in 2 days', rating: 1 },
  { text: 'Good good good good best best best', rating: 5 },
  { text: 'Nice', rating: 5 },
  { text: 'Not worth the money', rating: 2 },
  { text: 'Amazing product, highly recommend!', rating: 5 },
  { text: 'Absolutely love this! Best purchase ever made in my life, 10/10 would buy again!', rating: 5 },
  { text: 'Works as described, solid quality for the price point.', rating: 4 },
  { text: 'ok', rating: 3 },
  { text: 'Super super super great great great amazing amazing!', rating: 5 },
  { text: 'I purchased this for my home office and it has exceeded all expectations. Build quality is excellent.', rating: 4 },
  { text: 'Broke after one week. Complete waste of money. Never buying again!', rating: 1 },
];
