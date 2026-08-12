const WORD_MAP = {
    "vca": "ورزش", "aivhk": "شهران", "daneshjoo": "دانشجو", "hdvhk": "ایران",
    "jol lvt": "تخم مرغ", "khodamoni": "خودمونی", "khodemoni": "خودمونی",
    "ofv": "خبر", "ofvHkghdk": "خبرآنلاین", "لخخلمث": "گوگل", "rhar": "قاشق",

    "salam": "سلام", "chetori": "چطوری", "khobi": "خوبی", "darya": "دریا", "man": "من",
    "be": "به", "madrese": "مدرسه", "miravam": "میروم", "baradar": "برادر", "bazar": "بازار",
    "va": "و", "az": "از", "to": "تو", "in": "این", "on": "آن", "eshtebah": "اشتباه",
    "hame": "همه", "baz": "باز", "dorost": "درست", "khrooji": "خروجی", "bayad": "باید",
    "bashe": "باشه", "hastam": "هستم", "hasti": "هستی", "hast": "هست", "ast": "است",
    "hastim": "هستیم", "hastid": "هستید", "hastand": "هستند", "alan": "الان", "farsi": "فارسی",
    "baladam": "بلدم", "mersi": "مرسی", "khodahafez": "خداحافظ", "are": "آره", "na": "نه",
    "komak": "کمک", "daneshgah": "دانشگاه", "mikham": "میخوام", "bedoonam": "بدونم",
    "vaziat": "وضعیت", "ab": "آب", "o": "و", "hava": "هوا", "farda": "فردا", "chetore": "چطوره",

    "\\vhdl sdsjl": "پرایم سیستم", "\\vs\\,gds": "پرسپولیس", "vs,gds": "پرسپولیس",
    "'] \\c": "گچ پژ", "hldv ljt;v": "امیر متفکر", "hldv ljtlv": "امیر متفکر",
    "hldn ljt;v": "امیر متفکر", "اعللهدل بشزث": "hugging face"
};

function smart_farsi_converter(text, customDictionary = {}) {
    const value = String(text ?? '');
    const textLower = value.toLowerCase();

    if (customDictionary && customDictionary[textLower]) {
        return customDictionary[textLower];
    }

    const layoutCorrected = typeof correctKeyboardLayoutText === 'function'
        ? correctKeyboardLayoutText(value)
        : value;

    if (layoutCorrected !== value) {
        return layoutCorrected;
    }

    if (WORD_MAP[textLower]) {
        return WORD_MAP[textLower];
    }

    return value;
}