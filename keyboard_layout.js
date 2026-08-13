const KEYBOARD_LAYOUT_ENGINE_VERSION = '4.7.0-universal-intent';

const ENGLISH_TO_PERSIAN_KEY_MAP = Object.freeze({
    q: 'ض', w: 'ص', e: 'ث', r: 'ق', t: 'ف', y: 'غ', u: 'ع', i: 'ه', o: 'خ', p: 'ح',
    '[': 'ج', ']': 'چ', '\\': 'پ',
    a: 'ش', s: 'س', d: 'ی', f: 'ب', g: 'ل', h: 'ا', j: 'ت', k: 'ن', l: 'م', ';': 'ک', "'": 'گ',
    z: 'ظ', x: 'ط', c: 'ز', v: 'ر', b: 'ذ', n: 'د', m: 'پ', ',': 'و',
    Q: 'ض', W: 'ص', E: 'ث', R: 'ق', T: 'ف', Y: 'غ', U: 'ع', I: 'ه', O: 'خ', P: 'ح',
    A: 'ش', S: 'س', D: 'ی', F: 'ب', G: 'ل', H: 'ا', J: 'ت', K: 'ن', L: 'م',
    Z: 'ظ', X: 'ط', C: 'ژ', V: 'ر', B: 'ذ', N: 'د', M: 'پ'
});

const PERSIAN_TO_ENGLISH_KEY_MAP = Object.freeze({
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
    'ج': '[', 'چ': ']', 'پ': 'm',
    'ش': 'a', 'س': 's', 'ی': 'd', 'ي': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'آ': 'h',
    'ت': 'j', 'ن': 'k', 'م': 'l', 'ک': ';', 'ك': ';', 'گ': "'", 'ظ': 'z', 'ط': 'x',
    'ز': 'c', 'ژ': 'C', 'ر': 'v', 'ذ': 'b', 'د': 'n', 'و': ','
});

const HIGH_CONFIDENCE_ENGLISH_WORDS = new Set([
    'a', 'an', 'and', 'api', 'app', 'are', 'artificial', 'as', 'at', 'actions', 'be', 'browser', 'by',
    'case', 'chrome', 'class', 'client', 'cloud', 'code', 'css', 'data', 'database', 'docker', 'do',
    'edge', 'else', 'english', 'false', 'for', 'from', 'function', 'git', 'github', 'google', 'hello',
    'html', 'http', 'https', 'if', 'in', 'intelligence', 'is', 'it', 'java', 'javascript', 'json', 'jwt',
    'learning', 'linux', 'machine', 'mac', 'macos', 'model', 'node', 'not', 'npm', 'null', 'of', 'on',
    'open', 'or', 'pdf', 'persian', 'prompt', 'python', 'react', 'return', 'safari', 'search', 'sdk',
    'server', 'source', 'sql', 'ssh', 'studio', 'system', 'test', 'text', 'the', 'then', 'to', 'true',
    'typescript', 'undefined', 'url', 'visual', 'vue', 'web', 'while', 'windows', 'with', 'world'
]);

const HIGH_CONFIDENCE_PERSIAN_WORDS = new Set([
    'سلام', 'دنیا', 'ایران', 'علی', 'تهران', 'هوش', 'مصنوعی', 'برنامه', 'نویسی',
    'حال', 'شما', 'چطور', 'است', 'این', 'یک', 'متن', 'فارسی', 'خوب', 'خوبی',
    'خانه', 'مدرسه', 'دانشگاه', 'کشور', 'مردم', 'دوست', 'عشق', 'زندگی', 'کار',
    'زمان', 'زبان', 'اینترنت', 'سایت', 'جستجو', 'خبر', 'ورزش', 'دانشجو',
    'خودمونی', 'قاشق', 'مشهد', 'کتاب', 'ماشین', 'خانواده', 'غذا', 'آب', 'هوا',
    'زمین', 'آسمان', 'باران', 'برف', 'بهار', 'تابستان', 'پاییز', 'زمستان',
    'صبح', 'ظهر', 'عصر', 'شب', 'دفتر', 'شرکت', 'پروژه', 'مشتری', 'محصول',
    'فروش', 'خرید', 'قیمت', 'پول', 'بانک', 'کارت', 'شماره', 'موبایل', 'تلفن',
    'ایمیل', 'پیام', 'عکس', 'فیلم', 'موسیقی', 'بازی', 'فوتبال', 'شیراز',
    'اصفهان', 'تبریز', 'کرج', 'اهواز', 'قم', 'رشت', 'یزد', 'کرمان', 'قزوین',
    'اردبیل', 'سنندج', 'بوشهر', 'بازار', 'برادر', 'مادر', 'پدر', 'خواهر',
    'دختر', 'پسر', 'بچه', 'امروز', 'فردا', 'روز', 'هفته', 'ماه', 'سال',
    'انگلیسی', 'کیبورد', 'مرورگر', 'گوگل'
]);

const HIGH_CONFIDENCE_PERSIAN_PHRASES = new Set([
    'صبح بخیر'
]);

const LATIN_LETTER_RE = /[A-Za-z]/u;
const PERSIAN_LETTER_RE = /[\u0600-\u06FF]/u;
const LATIN_WORD_RE = /[A-Za-z]+/gu;
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const STRONG_LAYOUT_KEYS = new Set([';', '[', ']', "'", '\\']);

const COMMON_ENGLISH_BIGRAMS = new Set([
    'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es',
    'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng',
    'se', 'ha', 'as', 'ou', 'io', 'le', 've', 'co', 'me', 'de', 'hi', 'ri',
    'ro', 'ic', 'ne', 'ea', 'ra', 'ce', 'li', 'ch', 'll', 'be', 'ma', 'si',
    'om', 'ur', 'ir', 'qu', 'ue', 'ry', 'op', 'pe', 'na', 'ai', 'mi', 'cr',
    'os', 'so', 'ft', 'ap', 'pl', 'pp', 'lo', 'ld', 'wo', 'rl', 'rd', 'el',
    'ho', 'oo', 'og', 'gl', 'rv', 'va', 'da', 'ab', 'ba'
]);

const RARE_ENGLISH_BIGRAMS = new Set([
    'hk', 'vh', 'fv', 'vk', 'lh', 'nv', 'kj', 'jv', 'cf', 'sd', 'hg', 'dk',
    'vs', 'hd', 'dv', 'kh', 'hl', 'ln', 'ph'
]);

function buildCharacterBigrams(values) {
    const result = new Set();

    for (const raw of values) {
        const value = String(raw ?? '').trim().toLowerCase();

        for (let index = 0; index < value.length - 1; index += 1) {
            result.add(value.slice(index, index + 2));
        }
    }

    return result;
}

const COMMON_PERSIAN_BIGRAMS =
    buildCharacterBigrams(HIGH_CONFIDENCE_PERSIAN_WORDS);

function mapKeyboardCharacters(text, map) {
    return Array.from(text, (char) => map[char] ?? char).join('');
}

function convertEnglishKeysToPersian(text) {
    return mapKeyboardCharacters(String(text ?? ''), ENGLISH_TO_PERSIAN_KEY_MAP);
}

function convertPersianKeysToEnglish(text) {
    return mapKeyboardCharacters(String(text ?? ''), PERSIAN_TO_ENGLISH_KEY_MAP);
}

function isHighConfidenceEnglishPhrase(text) {
    const words = String(text ?? '').toLowerCase().match(LATIN_WORD_RE) ?? [];
    return words.length > 0 && words.every((word) => HIGH_CONFIDENCE_ENGLISH_WORDS.has(word));
}

function isHighConfidencePersianCandidate(text) {
    return HIGH_CONFIDENCE_PERSIAN_WORDS.has(String(text ?? '').trim());
}

function countLatinLettersAndVowels(text) {
    let letters = 0;
    let vowels = 0;

    for (const char of String(text ?? '').toLowerCase()) {
        if (char >= 'a' && char <= 'z') {
            letters += 1;
            if (VOWELS.has(char)) vowels += 1;
        }
    }

    return { letters, vowels };
}

function getCharacterBigrams(text) {
    const value = String(text ?? '');
    const result = [];

    for (let index = 0; index < value.length - 1; index += 1) {
        result.push(value.slice(index, index + 2));
    }

    return result;
}

function scoreEnglishWordShape(text) {
    const value = String(text ?? '').trim().toLowerCase();
    const evidence = [];

    if (!/^[a-z]+$/u.test(value) || value.length < 3) {
        return { score: 0, evidence };
    }

    const { letters, vowels } = countLatinLettersAndVowels(value);
    const vowelRatio = letters > 0 ? vowels / letters : 0;
    const bigrams = getCharacterBigrams(value);
    const commonCount = bigrams
        .filter((item) => COMMON_ENGLISH_BIGRAMS.has(item))
        .length;
    const rareCount = bigrams
        .filter((item) => RARE_ENGLISH_BIGRAMS.has(item))
        .length;
    const commonRatio = bigrams.length > 0
        ? commonCount / bigrams.length
        : 0;

    let score = 0.25;
    evidence.push('english-shape-minimum-length');

    if (vowels >= 1) {
        score += 0.20;
        evidence.push('english-shape-has-vowel');
    }

    if (vowelRatio >= 0.20 && vowelRatio <= 0.65) {
        score += 0.15;
        evidence.push('english-shape-vowel-ratio');
    }

    if (commonCount >= 2) {
        score += 0.20;
        evidence.push('english-shape-common-bigrams');
    }

    if (
        value.length === 3 &&
        commonCount >= 1
    ) {
        score += 0.25;
        evidence.push(
            'english-shape-tiny-common-bigram'
        );
    }

    if (commonRatio >= 0.60) {
        score += 0.20;
        evidence.push('english-shape-bigram-density');
    } else if (
        value.length === 3 &&
        commonRatio >= 0.50
    ) {
        score += 0.15;
        evidence.push(
            'english-shape-tiny-bigram-density'
        );
    }

    if (rareCount > 0) {
        score -= Math.min(0.60, rareCount * 0.25);
        evidence.push('english-shape-rare-cluster-penalty');
    }

    return {
        score: Math.max(0, Math.min(0.95, score)),
        evidence
    };
}

function scorePersianWordShape(text) {
    const value = String(text ?? '').trim();
    const evidence = [];

    if (
        !/^[\u0600-\u06FF]+$/u.test(value) ||
        value.length < 3
    ) {
        return { score: 0, evidence };
    }

    if (isHighConfidencePersianCandidate(value)) {
        return {
            score: 0.99,
            evidence: ['known-valid-persian']
        };
    }

    const bigrams = getCharacterBigrams(value);
    const commonCount = bigrams
        .filter((item) => COMMON_PERSIAN_BIGRAMS.has(item))
        .length;
    const ratio = bigrams.length > 0
        ? commonCount / bigrams.length
        : 0;

    if (ratio >= 0.65) {
        evidence.push('strong-persian-bigram-density');
        return { score: 0.95, evidence };
    }

    if (ratio >= 0.45) {
        evidence.push('moderate-persian-bigram-density');
        return { score: 0.65, evidence };
    }

    if (ratio >= 0.25) {
        evidence.push('weak-persian-bigram-density');
        return { score: 0.35, evidence };
    }

    return { score: 0, evidence };
}

function countMappableEnglishLayoutKeys(text) {
    return Array.from(String(text ?? ''))
        .filter((char) =>
            Object.hasOwn(ENGLISH_TO_PERSIAN_KEY_MAP, char)
        )
        .length;
}

function getStatisticalLayoutPreference(
    source,
    sourceLanguage,
    corrected,
    targetLanguage,
    direction
) {
    if (
        typeof compareFsaLanguageCandidates !== 'function'
    ) {
        return null;
    }

    return compareFsaLanguageCandidates(
        source,
        sourceLanguage,
        corrected,
        targetLanguage,
        direction,
        'suggest'
    );
}

function scoreEnglishKeysToPersian(value) {
    const corrected = convertEnglishKeysToPersian(value);
    const { letters, vowels } = countLatinLettersAndVowels(value);
    const hasStrongLayoutKey = Array.from(value)
        .some((char) => STRONG_LAYOUT_KEYS.has(char));

    const evidence = [];
    let score = 0;

    const statistical = getStatisticalLayoutPreference(
        value,
        'en',
        corrected,
        'fa',
        'enToFa'
    );

    if (statistical?.preferred) {
        score = Math.max(
            score,
            Math.min(
                0.985,
                0.94 +
                Math.max(
                    0,
                    statistical.margin -
                    statistical.threshold
                ) * 0.02
            )
        );
        evidence.push('statistical-persian-language-shape');
        evidence.push('dictionary-independent-language-margin');
    }

    if (letters >= 3) {
        score += 0.20;
        evidence.push('minimum-length');
    }

    if (hasStrongLayoutKey) {
        score += 0.74;
        evidence.push('persian-layout-punctuation');
    }

    if (letters >= 3 && vowels === 0) {
        score += 0.72;
        evidence.push('latin-without-vowels');
    }

    if (isHighConfidencePersianCandidate(corrected)) {
        score += 0.78;
        evidence.push('known-persian-after-layout-conversion');
    }

    if (isHighConfidenceEnglishPhrase(value)) {
        const statisticalOverride =
            statistical?.preferred &&
            statistical.margin >=
                statistical.threshold + 1.5;

        score -= statisticalOverride ? 0.20 : 1;
        evidence.push('known-valid-english');

        if (statisticalOverride) {
            evidence.push(
                'statistical-override-of-dictionary-prior'
            );
        }
    }

    return {
        score: Math.max(0, Math.min(0.99, score)),
        corrected,
        evidence
    };
}

function scorePersianKeysToEnglish(value) {
    const corrected = convertPersianKeysToEnglish(value);
    const evidence = [];

    if (corrected === value) {
        return { score: 0, corrected, evidence };
    }

    const persianShape = scorePersianWordShape(value);
    const statistical = getStatisticalLayoutPreference(
        value,
        'fa',
        corrected,
        'en',
        'faToEn'
    );

    if (isHighConfidenceEnglishPhrase(corrected)) {
        evidence.push('known-english-after-layout-reversal');
        return { score: 0.99, corrected, evidence };
    }

    if (statistical?.preferred) {
        const knownPersianPenalty =
            persianShape.score >= 0.90
                ? 1.5
                : 0;

        if (
            statistical.margin >=
            statistical.threshold + knownPersianPenalty
        ) {
            evidence.push(
                'statistical-english-language-shape'
            );
            evidence.push(
                'dictionary-independent-language-margin'
            );

            if (knownPersianPenalty > 0) {
                evidence.push(
                    'statistical-override-of-dictionary-prior'
                );
            }

            return {
                score: Math.min(
                    0.985,
                    0.94 +
                    Math.max(
                        0,
                        statistical.margin -
                        statistical.threshold -
                        knownPersianPenalty
                    ) * 0.02
                ),
                corrected,
                evidence
            };
        }
    }

    if (persianShape.score >= 0.90) {
        evidence.push(...persianShape.evidence);
        evidence.push('valid-persian-source-protected');
        return { score: 0, corrected, evidence };
    }

    const englishShape = scoreEnglishWordShape(corrected);

    evidence.push(...englishShape.evidence);
    evidence.push(...persianShape.evidence);

    if (
        englishShape.score >= 0.90 &&
        persianShape.score < 0.45
    ) {
        evidence.push(
            'english-word-shape-after-layout-reversal'
        );
        evidence.push('low-persian-source-shape');

        return {
            score: 0.94,
            corrected,
            evidence
        };
    }

    if (
        corrected.length === 3 &&
        statistical &&
        englishShape.score >= 0.90 &&
        persianShape.score < 0.65 &&
        statistical.margin >=
            statistical.threshold - 0.35
    ) {
        evidence.push(
            'tiny-word-statistical-near-threshold'
        );
        evidence.push(
            'tiny-word-english-shape-confirmation'
        );

        return {
            score: 0.92,
            corrected,
            evidence
        };
    }

    return { score: 0, corrected, evidence };
}

function unchanged(value, reason, evidence = []) {
    return {
        changed: false,
        direction: 'none',
        confidence: 0,
        original: value,
        corrected: value,
        reason,
        evidence
    };
}

function analyzeKeyboardLayoutPhrase(text) {
    const value = String(text ?? '');

    if (!value.includes(' ')) return unchanged(value, 'not-a-phrase');
    if (!LATIN_LETTER_RE.test(value)) return unchanged(value, 'no-latin-phrase');
    if (PERSIAN_LETTER_RE.test(value)) return unchanged(value, 'mixed-script-phrase');
    if (isHighConfidenceEnglishPhrase(value)) {
        return unchanged(value, 'known-valid-english-phrase', ['known-valid-english']);
    }

    const corrected = convertEnglishKeysToPersian(value);

    if (HIGH_CONFIDENCE_PERSIAN_PHRASES.has(corrected.trim())) {
        return {
            changed: true,
            direction: 'english-keys-to-persian',
            confidence: 0.99,
            original: value,
            corrected,
            reason: 'known-persian-phrase-after-layout-conversion',
            evidence: ['known-persian-phrase-after-layout-conversion']
        };
    }

    return unchanged(value, 'no-known-phrase-match');
}

function analyzeKeyboardLayoutToken(token) {
    const value = String(token ?? '');
    const hasLatin = LATIN_LETTER_RE.test(value);
    const hasPersian = PERSIAN_LETTER_RE.test(value);

    if (!hasLatin && !hasPersian) return unchanged(value, 'no-letters');
    if (hasLatin && hasPersian) return unchanged(value, 'mixed-script');

    if (hasLatin) {
        const { letters } = countLatinLettersAndVowels(value);
        const physicalKeys =
            countMappableEnglishLayoutKeys(value);

        if (
            letters < 3 &&
            physicalKeys < 3
        ) {
            return unchanged(value, 'too-short');
        }

        const scoring = scoreEnglishKeysToPersian(value);

        if (scoring.score >= 0.90 && scoring.corrected !== value) {
            return {
                changed: true,
                direction: 'english-keys-to-persian',
                confidence: scoring.score,
                original: value,
                corrected: scoring.corrected,
                reason: 'confidence-score',
                evidence: scoring.evidence
            };
        }

        return unchanged(value, 'plausible-latin', scoring.evidence);
    }

    const scoring = scorePersianKeysToEnglish(value);

    if (scoring.score >= 0.90 && scoring.corrected !== value) {
        return {
            changed: true,
            direction: 'persian-keys-to-english',
            confidence: scoring.score,
            original: value,
            corrected: scoring.corrected,
            reason: 'confidence-score',
            evidence: scoring.evidence
        };
    }

    return unchanged(value, 'plausible-persian', scoring.evidence);
}

function correctKeyboardLayoutText(text, minimumConfidence = 0.9) {
    const value = String(text ?? '');
    const phrase = analyzeKeyboardLayoutPhrase(value);

    if (phrase.changed && phrase.confidence >= minimumConfidence) {
        return phrase.corrected;
    }

    const parts = value.split(/(\s+)/u);

    return parts.map((part) => {
        if (!part || /^\s+$/u.test(part)) return part;

        const analysis = analyzeKeyboardLayoutToken(part);

        return analysis.changed && analysis.confidence >= minimumConfidence
            ? analysis.corrected
            : part;
    }).join('');
}

function analyzeKeyboardLayout(text, minimumConfidence = 0.9) {
    const value = String(text ?? '');
    const phrase = analyzeKeyboardLayoutPhrase(value);

    if (phrase.changed && phrase.confidence >= minimumConfidence) {
        return {
            engineVersion: KEYBOARD_LAYOUT_ENGINE_VERSION,
            original: value,
            corrected: phrase.corrected,
            changed: true,
            corrections: [{ index: 0, scope: 'phrase', ...phrase }],
            confidence: phrase.confidence
        };
    }

    const parts = value.split(/(\s+)/u);
    const corrections = [];

    const corrected = parts.map((part, index) => {
        if (!part || /^\s+$/u.test(part)) return part;

        const analysis = analyzeKeyboardLayoutToken(part);

        if (analysis.changed && analysis.confidence >= minimumConfidence) {
            corrections.push({ index, scope: 'token', ...analysis });
            return analysis.corrected;
        }

        return part;
    }).join('');

    return {
        engineVersion: KEYBOARD_LAYOUT_ENGINE_VERSION,
        original: value,
        corrected,
        changed: corrected !== value,
        corrections,
        confidence: corrections.length > 0
            ? Math.min(...corrections.map((item) => item.confidence))
            : 0
    };
}