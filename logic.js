// =================================================================================
// Dictionaries & Data Maps
// =================================================================================

const WORD_MAP = {
    // Finglish & Common Words
    "salam": "سلام", "chetori": "چطوری", "khobi": "خوبی", "darya": "دریا", "man": "من",
    "be": "به", "madrese": "مدرسه", "miravam": "میروم", "baradar": "برادر",
    "bazar": "بازار", "va": "و", "az": "از", "to": "تو", "in": "این", "on": "آن",
    "eshtebah": "اشتباه", "hame": "همه", "baz": "باز", "dorost": "درست",
    "khrooji": "خروجی", "bayad": "باید", "bashe": "باشه", "hastam": "هستم",
    "hasti": "هستی", "hast": "هست", "ast": "است", "hastim": "هستیم",
    "hastid": "هستید", "hastand": "هستند", "alan": "الان", "farsi": "فارسی",
    "baladam": "بلدم", "mersi": "مرسی", "khodahafez": "خداحافظ", "are": "آره", "na": "نه",
    "komak": "کمک", "daneshgah": "دانشگاه", "mikham": "میخوام", "bedoonam": "بدونم",
    "vaziat": "وضعیت", "ab": "آب", "o": "و", "hava": "هوا", "farda": "فردا", "chetore": "چطوره",
    
    // User-specific keyboard typo cases
    "\\vhdl sdsjl": "پرایم سیستم", "\\vs\\,gds": "پرسپولیس", "vs,gds": "پرسپولیس", "'] \\c": "گچ پژ",
    "hldv ljt;v": "امیر متفکر", "hldv ljtlv": "امیر متفکر", "hldn ljt;v": "امیر متفکر",
    "اعللهدل بشزث": "hugging face"
};

const QWERTY_TO_FARSI_MAP = {
    'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح',
    '[': 'ج', ']': 'چ', '\\': 'پ', 'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا',
    'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ک', "'": 'گ', 'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر',
    'b': 'ذ', 'n': 'د', 'm': 'پ', ',': 'و'
};
const FARSI_TO_QWERTY_MAP = {
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
    'ج': '[', 'چ': ']', 'ش': 'a', 'س': 's', 'ی': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k',
    'م': 'l', 'ک': ';', 'گ': "'", 'ظ': 'z', 'ط': 'x', 'ز': 'c', 'ر': 'v', 'ذ': 'b', 'د': 'n', 'پ': 'm', 'و': ','
};
const FINGLISH_CHAR_MAP = {
    'kh': 'خ', 'sh': 'ش', 'gh': 'غ', 'ch': 'چ', 'zh': 'ژ', 'oo': 'و', 'ee': 'ی', 'aa': 'آ',
    'a': 'ا', 'b': 'ب', 'p': 'پ', 't': 'ت', 's': 'س', 'j': 'ج', 'h': 'ه', 'd': 'د',
    'r': 'ر', 'z': 'ز', 'f': 'ف', 'q': 'ق', 'k': 'ک', 'g': 'گ', 'l': 'ل', 'm': 'م',
    'n': 'ن', 'v': 'و', 'w': 'و', 'y': 'ی', 'e': 'ه', 'i': 'ی', 'o': 'و', 'u': 'و'
};


// =================================================================================
// Helper Functions for Conversion Logic
// =================================================================================

function convertFromFarsiKeyboard(text) {
    const chars = text.split('');
    return chars.map(char => FARSI_TO_QWERTY_MAP[char] || char).join('');
}

function convertFromQwerty(text) {
    const chars = text.split('');
    return chars.map(char => QWERTY_TO_FARSI_MAP[char] || char).join('');
}

function convertFromFinglish(text) {
    let result = text;
    // Handle two-letter combinations first
    const multi_letter_patterns = /(kh|sh|gh|ch|zh|oo|ee|aa)/g;
    result = result.replace(multi_letter_patterns, match => FINGLISH_CHAR_MAP[match] || match);
    // Then handle single letters
    result = result.split('').map(char => FINGLISH_CHAR_MAP[char] || char).join('');
    return result;
}


// =================================================================================
// The Main "Smart Converter" Function
// =================================================================================
function smart_farsi_converter(text, customDictionary = {}) {
    const text_lower = text.toLowerCase();
    
    // Priority 1: Check dictionaries (Custom and Main) for exact matches
    if (customDictionary && customDictionary[text_lower]) return customDictionary[text_lower];
    if (WORD_MAP[text_lower]) return WORD_MAP[text_lower];

    // Priority 2: Process sentences word by word
    if (text.includes(' ')) {
        const words = text.split(/([,.\s?]+)/);
        const convertedWords = words.map(word => {
            const lowerWord = word.toLowerCase();
            if (!lowerWord) return word;
            
            // If the word is in a dictionary, use it
            if (customDictionary && customDictionary[lowerWord]) return customDictionary[lowerWord];
            if (WORD_MAP[lowerWord]) return WORD_MAP[lowerWord];
            
            // If it's not a known word, try to convert it
            return tryConversionHeuristics(word);
        });
        return convertedWords.join('');
    }

    // Priority 3: Process a single word
    return tryConversionHeuristics(text);
}


// =================================================================================
// The Conversion Heuristic Engine
// =================================================================================
function tryConversionHeuristics(word) {
    const word_lower = word.toLowerCase();
    const persianRegex = /[\u0600-\u06FF]/;
    const englishRegex = /[a-zA-Z]/;

    // A. Check for a purely Persian word that should be converted to QWERTY
    if (persianRegex.test(word) && !englishRegex.test(word)) {
        return convertFromFarsiKeyboard(word);
    }
    
    // B. Check for a word with strong keyboard indicators or zero vowels
    const strong_indicators = [';', '[', ']', "'", '\\', ','];
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    let letter_count = 0, vowel_count = 0;
    for (const char of word_lower) {
        if (char >= 'a' && char <= 'z') { letter_count++; if (vowels.includes(char)) vowel_count++; }
    }
    if ([...word_lower].some(char => strong_indicators.includes(char)) || (letter_count > 2 && vowel_count === 0)) {
        return convertFromQwerty(word);
    }

    // C. Fallback: Try a general Finglish conversion
    const finglishConversion = convertFromFinglish(word);
    if (finglishConversion !== word) {
        return finglishConversion;
    }

    // If no conversion applies, return the original word
    return word;
}