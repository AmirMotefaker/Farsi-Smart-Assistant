import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');

const PERSIAN_TO_FINGLISH = Object.freeze({
  'ا':'a','آ':'aa','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'ch',
  'ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','ژ':'zh','س':'s',
  'ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f',
  'ق':'gh','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'i'
});

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function normalizeEnglish(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z]/gu,'');
}

function normalizePersian(value) {
  return String(value ?? '')
    .replace(/[ًٌٍَُِّْـ]/gu,'')
    .replaceAll('ي','ی')
    .replaceAll('ى','ی')
    .replaceAll('ك','ک')
    .replaceAll('\u200c','')
    .replace(/[^\u0621-\u06CC]/gu,'');
}

function parseCalibration(buffer, language, limit) {
  const normalize = language === 'en' ? normalizeEnglish : normalizePersian;
  const lines = buffer.toString('utf8').split(/\r?\n/u);
  const result = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const word = normalize(lines[i].trim().split('/')[0]);
    const bucket = fnv1a(word) % 20;

    if (
      word.length < 3 ||
      word.length > 12 ||
      bucket < 2 ||
      bucket > 3
    ) continue;

    if (language === 'en' && /^[a-z]+$/u.test(word)) result.add(word);

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(word) &&
      [...word].every(char => Object.hasOwn(PERSIAN_TO_FINGLISH,char))
    ) result.add(word);
  }

  return [...result]
    .sort((a,b) => {
      const ha = fnv1a(a);
      const hb = fnv1a(b);
      if (ha !== hb) return ha - hb;
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .slice(0,limit);
}

function romanize(word) {
  return [...word].map(char => PERSIAN_TO_FINGLISH[char] || '').join('');
}

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js'
];

const sources = [];
for (const file of runtimeFiles) {
  sources.push(await fs.readFile(path.join(root,file),'utf8'));
}

const context = vm.createContext({console});
vm.runInContext(
  `${sources.join('\n')}
;globalThis.__cal = {
  analyzeFsaFinglishIntent,
  generateFsaFinglishCandidates
};`,
  context
);

const engine = context.__cal;
const faContext = {
  beforeText: 'امروز ',
  afterText: ' در متن فارسی',
  fieldLanguage: 'fa',
  pageLanguage: 'fa',
  direction: 'rtl'
};

function features(input, expected = null) {
  const analysis = engine.analyzeFsaFinglishIntent(input,faContext);

  if (!analysis.changed) {
    return {
      changed:false,
      exact:false,
      contextDelta:0,
      rankGap:0,
      decisionMargin:-99,
      confidence:0,
      targetCoverage:0
    };
  }

  const candidates = engine.generateFsaFinglishCandidates(
    input,
    {beamLimit:384,limit:3}
  );
  const first = candidates[0] || null;
  const second = candidates[1] || null;
  const rankGap = first
    ? second ? first.rank - second.rank : Number.POSITIVE_INFINITY
    : 0;

  const prior = analysis.contextPrior || {fa:0,en:0};
  const contextDelta = (Number(prior.fa)||0) - (Number(prior.en)||0);

  return {
    changed:true,
    exact: expected === null ? true : analysis.corrected === expected,
    contextDelta,
    rankGap,
    decisionMargin:(Number(analysis.margin)||0) - (Number(analysis.threshold)||0),
    confidence:Number(analysis.confidence)||0,
    targetCoverage:Number(analysis.bestCandidate?.shape?.coverage)||0
  };
}

const faWords = parseCalibration(persianDictionary.dic,'fa',800);
const enWords = parseCalibration(englishDictionary.dic,'en',800);

const positives = [];
for (const expected of faWords) {
  const input = romanize(expected);
  if (input.length < 3 || input.length > 24) continue;
  const f = features(input,expected);
  if (f.changed && f.exact) positives.push(f);
}

const negatives = [];
for (const word of enWords) {
  const f = features(word,null);
  if (f.changed) negatives.push(f);
}

const grid = {
  contextDelta:[5.5,6,6.5],
  rankGap:[0,0.05,0.10,0.15,0.20,0.30,0.40],
  decisionMargin:[-0.20,-0.10,0,0.10,0.20,0.30,0.40],
  confidence:[0.82,0.84,0.86,0.88,0.90,0.92],
  targetCoverage:[0.75,0.80,0.85,0.90,0.95]
};

function eligible(f,p) {
  return (
    f.contextDelta >= p.contextDelta &&
    f.rankGap >= p.rankGap &&
    f.decisionMargin >= p.decisionMargin &&
    f.confidence >= p.confidence &&
    f.targetCoverage >= p.targetCoverage
  );
}

function ratio(a,b) {
  return b > 0 ? a/b : 0;
}

let best = null;
const falsePositiveCeiling = 0.01;

for (const contextDelta of grid.contextDelta)
for (const rankGap of grid.rankGap)
for (const decisionMargin of grid.decisionMargin)
for (const confidence of grid.confidence)
for (const targetCoverage of grid.targetCoverage) {
  const policy = {
    contextDelta,
    rankGap,
    decisionMargin,
    confidence,
    targetCoverage
  };

  const positiveHits = positives.filter(f => eligible(f,policy)).length;
  const negativeHits = negatives.filter(f => eligible(f,policy)).length;

  const recall = ratio(positiveHits,faWords.length);
  const falsePositiveRate = ratio(negativeHits,enWords.length);

  if (falsePositiveRate > falsePositiveCeiling) continue;

  const candidate = {
    ...policy,
    recall,
    falsePositiveRate,
    positiveHits,
    negativeHits
  };

  if (
    !best ||
    candidate.recall > best.recall + 1e-12 ||
    (
      Math.abs(candidate.recall-best.recall) <= 1e-12 &&
      candidate.falsePositiveRate < best.falsePositiveRate - 1e-12
    ) ||
    (
      Math.abs(candidate.recall-best.recall) <= 1e-12 &&
      Math.abs(candidate.falsePositiveRate-best.falsePositiveRate) <= 1e-12 &&
      candidate.confidence > best.confidence
    )
  ) {
    best = candidate;
  }
}

const result = {
  schemaVersion:1,
  split:'calibration buckets 2..3 only',
  calibration:{
    persianWords:faWords.length,
    englishWords:enWords.length,
    exactSelectablePersian:positives.length,
    englishChangedByFinglishEngine:negatives.length
  },
  target:{
    englishFalsePositiveCeiling:falsePositiveCeiling,
    finglishAutoRecallFloor:0.30
  },
  best,
  decision:
    best &&
    best.falsePositiveRate <= falsePositiveCeiling &&
    best.recall >= 0.30
      ? 'PASS'
      : 'FAIL'
};

process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
if (result.decision !== 'PASS') process.exitCode = 1;
