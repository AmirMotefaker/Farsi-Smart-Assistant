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

function smart_farsi_converter(
    text,
    customDictionary = {},
    intentContext = null
) {
    const value = String(text ?? '');
    const textLower = value.toLowerCase();

    if (
        customDictionary &&
        customDictionary[textLower]
    ) {
        return customDictionary[textLower];
    }

    const normalized =
        typeof normalizePersianTextGeneral ===
            'function'
            ? normalizePersianTextGeneral(value)
            : value;

    if (normalized !== value) {
        return normalized;
    }

    const contextualLayoutCorrected =
        intentContext &&
        typeof correctKeyboardLayoutTextWithContext ===
            'function'
            ? correctKeyboardLayoutTextWithContext(
                normalized,
                intentContext
            )
            : normalized;

    if (
        contextualLayoutCorrected !==
        normalized
    ) {
        return contextualLayoutCorrected;
    }

    const layoutCorrected =
        typeof correctKeyboardLayoutText ===
            'function'
            ? correctKeyboardLayoutText(
                normalized
            )
            : normalized;

    if (layoutCorrected !== normalized) {
        return layoutCorrected;
    }

    const finglish =
        typeof analyzeFsaFinglishIntent ===
            'function'
            ? analyzeFsaFinglishIntent(
                normalized,
                intentContext
            )
            : null;

    if (finglish?.changed) {
        return finglish.corrected;
    }

    if (WORD_MAP[textLower]) {
        const protectEnglish =
            typeof shouldProtectFsaEnglishSource ===
                'function' &&
            shouldProtectFsaEnglishSource(
                normalized,
                intentContext
            );

        if (!protectEnglish) {
            return WORD_MAP[textLower];
        }
    }

    return normalized;
}