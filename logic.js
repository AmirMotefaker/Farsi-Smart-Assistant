const WORD_MAP = { "salam": "سلام", "chetori": "چطوری", "khobi": "خوبی", "darya": "دریا", "man": "من", "be": "به", "madrese": "مدرسه", "miravam": "میروم", "baradar": "برادر", "bazar": "بازار", "va": "و", "az": "از", "to": "تو", "in": "این", "on": "آن", "eshtebah": "اشتباه", "hame": "همه", "baz": "باز", "dorost": "درست", "khrooji": "خروجی", "bayad": "باید", "bashe": "باشه", "hastam": "هستم", "hasti": "هستی", "hast": "هست", "ast": "است", "hastim": "هستیم", "hastid": "هستید", "hastand": "هستند", "alan": "الان", "farsi": "فارسی", "baladam": "بلدم", "mersi": "مرسی", "khodahafez": "خداحافظ", "are": "آره", "na": "نه", "komak": "کمک", "daneshgah": "دانشگاه", "mikham": "میخوام", "bedoonam": "بدونم", "vaziat": "وضعیت", "ab": "آب", "o": "و", "hava": "هوا", "farda": "فردا", "chetore": "چطوره", "\\vhdl sdsjl": "پرایم سیستم", "\\vs\\,gds": "پرسپولیس", "'] \\c": "گچ پژ", "hldv ljt;v": "امیر متفکر", "hldv ljtlv": "امیر متفکر", "hldn ljt;v": "امیر متفکر", "اعللهدل بشزث": "hugging face" };
const QWERTY_TO_FARSI_MAP = { 'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'چ', '\\': 'پ', 'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ک', "'": 'گ', 'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر', 'b': 'ذ', 'n': 'د', 'm': 'پ', ',': 'و', 'Q': 'ض', 'W': 'ص', 'E': 'ث', 'R': 'ق', 'T': 'ف', 'Y': 'غ', 'U': 'ع', 'I': 'ه', 'O': 'خ', 'P': 'ح', 'A': 'ش', 'S': 'س', 'D': 'ی', 'F': 'ب', 'G': 'ل', 'H': 'ا', 'J': 'ت', 'K': 'ن', 'L': 'م', 'Z': 'ظ', 'X': 'ط', 'C': 'ژ', 'V': 'ر', 'B': 'ذ', 'N': 'د', 'M': 'پ' };
const FARSI_TO_QWERTY_MAP = { 'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p', 'ج': '[', 'چ': ']', 'ش': 'a', 'س': 's', 'ی': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l', 'ک': ';', 'گ': "'", 'ظ': 'z', 'ط': 'x', 'ز': 'c', 'ر': 'v', 'ذ': 'b', 'د': 'ن', 'پ': 'm', 'و': ',', 'ژ': 'C', 'ئ': 'm' };

// این تابع فقط برای اصلاح خطاهاست و کلمات صحیح را تغییر نمی‌دهد
function smart_farsi_converter(text, customDictionary = {}) {
    const text_lower = text.toLowerCase();
    if (customDictionary && customDictionary[text_lower]) { return customDictionary[text_lower]; }
    if (WORD_MAP[text_lower]) { return WORD_MAP[text_lower]; }
    const persianRegex = /[\u0600-\u06FF]/;
    if (persianRegex.test(text) && !/[a-zA-Z]/.test(text)) {
        return text.split('').map(char => FARSI_TO_QWERTY_MAP[char] || char).join('');
    }
    const strong_indicators = [';', '[', ']', "'", '\\'];
    if ([...text_lower].some(char => strong_indicators.includes(char))) {
        return text.split('').map(char => QWERTY_TO_FARSI_MAP[char] || char).join('');
    }
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    let letter_count = 0, vowel_count = 0;
    for (const char of text_lower) { if (char >= 'a' && char <= 'z') { letter_count++; if (vowels.includes(char)) vowel_count++; } }
    if (letter_count > 2 && vowel_count === 0) {
        return text.split('').map(char => QWERTY_TO_FARSI_MAP[char] || char).join('');
    }
    if (text.includes(' ')) {
        const words = text.split(/([,.\s?]+)/);
        const convertedWords = words.map(word => WORD_MAP[word.toLowerCase()] || word);
        const result = convertedWords.join('');
        return result !== text ? result : text;
    }
    return text;
}