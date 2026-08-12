const KEYBOARD_LAYOUT_ENGINE_VERSION = '4.0.0-m0';

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
    'a', 'an', 'and', 'api', 'app', 'are', 'as', 'at', 'be', 'browser', 'by', 'case', 'chrome', 'class',
    'code', 'css', 'data', 'do', 'edge', 'else', 'english', 'false', 'for', 'from', 'function', 'git', 'github',
    'google', 'hello', 'html', 'http', 'https', 'if', 'in', 'is', 'it', 'java', 'javascript', 'json', 'jwt',
    'linux', 'mac', 'macos', 'node', 'not', 'npm', 'null', 'of', 'on', 'or', 'pdf', 'persian', 'python',
    'react', 'return', 'safari', 'search', 'sdk', 'sql', 'ssh', 'system', 'test', 'text', 'the', 'then',
    'to', 'true', 'typescript', 'undefined', 'url', 'vue', 'web', 'while', 'windows', 'with', 'world'
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

function analyzeKeyboardLayoutToken(token) {
    const value = String(token ?? '');
    const hasLatin = LATIN_LETTER_RE.test(value);
    const hasPersian = PERSIAN_LETTER_RE.test(value);

    if (!hasLatin && !hasPersian) {
        return {
            changed: false,
            direction: 'none',
            confidence: 0,
            original: value,
            corrected: value,
            reason: 'no-letters'
        };
    }

    if (hasLatin && hasPersian) {
        return {
            changed: false,
            direction: 'none',
            confidence: 0,
            original: value,
            corrected: value,
            reason: 'mixed-script'
        };
    }

    if (hasLatin) {
        if (isHighConfidenceEnglishPhrase(value)) {
            return {
                changed: false,
                direction: 'none',
                confidence: 0,
                original: value,
                corrected: value,
                reason: 'known-english'
            };
        }

        const { letters, vowels } = countLatinLettersAndVowels(value);

        if (letters < 3) {
            return {
                changed: false,
                direction: 'none',
                confidence: 0,
                original: value,
                corrected: value,
                reason: 'too-short'
            };
        }

        const hasStrongLayoutKey = Array.from(value)
            .some((char) => STRONG_LAYOUT_KEYS.has(char));

        if (hasStrongLayoutKey || vowels === 0) {
            const corrected = convertEnglishKeysToPersian(value);

            if (corrected !== value) {
                return {
                    changed: true,
                    direction: 'english-keys-to-persian',
                    confidence: hasStrongLayoutKey ? 0.99 : 0.96,
                    original: value,
                    corrected,
                    reason: hasStrongLayoutKey
                        ? 'persian-layout-punctuation'
                        : 'latin-without-vowels'
                };
            }
        }

        return {
            changed: false,
            direction: 'none',
            confidence: 0,
            original: value,
            corrected: value,
            reason: 'plausible-latin'
        };
    }

    const corrected = convertPersianKeysToEnglish(value);

    if (corrected !== value && isHighConfidenceEnglishPhrase(corrected)) {
        return {
            changed: true,
            direction: 'persian-keys-to-english',
            confidence: 0.99,
            original: value,
            corrected,
            reason: 'known-english-after-layout-reversal'
        };
    }

    return {
        changed: false,
        direction: 'none',
        confidence: 0,
        original: value,
        corrected: value,
        reason: 'plausible-persian'
    };
}

function correctKeyboardLayoutText(text, minimumConfidence = 0.9) {
    const value = String(text ?? '');
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
    const parts = value.split(/(\s+)/u);
    const corrections = [];

    const corrected = parts.map((part, index) => {
        if (!part || /^\s+$/u.test(part)) return part;

        const analysis = analyzeKeyboardLayoutToken(part);

        if (analysis.changed && analysis.confidence >= minimumConfidence) {
            corrections.push({ index, ...analysis });
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