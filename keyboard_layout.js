const KEYBOARD_LAYOUT_ENGINE_VERSION = '4.1.0-m1';

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
    'حال', 'شما', 'چطور', 'است', 'این', 'یک', 'متن', 'فارسی'
]);

const HIGH_CONFIDENCE_PERSIAN_PHRASES = new Set([
    'صبح بخیر'
]);

const LATIN_LETTER_RE = /[A-Za-z]/u;
const PERSIAN_LETTER_RE = /[\u0600-\u06FF]/u;
const LATIN_WORD_RE = /[A-Za-z]+/gu;
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const STRONG_LAYOUT_KEYS = new Set([';', '[', ']', "'", '\\']);

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

function scoreEnglishKeysToPersian(value) {
    const corrected = convertEnglishKeysToPersian(value);
    const { letters, vowels } = countLatinLettersAndVowels(value);
    const hasStrongLayoutKey = Array.from(value)
        .some((char) => STRONG_LAYOUT_KEYS.has(char));

    const evidence = [];
    let score = 0;

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
        score -= 1;
        evidence.push('known-valid-english');
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
    let score = 0;

    if (corrected !== value && isHighConfidenceEnglishPhrase(corrected)) {
        score = 0.99;
        evidence.push('known-english-after-layout-reversal');
    }

    return { score, corrected, evidence };
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
        if (letters < 3) return unchanged(value, 'too-short');

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