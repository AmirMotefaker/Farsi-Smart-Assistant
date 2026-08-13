const FSA_NORMALIZATION_ENGINE_VERSION =
    '4.7.0-persian-normalization';

function normalizePersianUnicodeText(text) {
    return String(text ?? '')
        .normalize('NFC')
        .replaceAll('ي', 'ی')
        .replaceAll('ى', 'ی')
        .replaceAll('ك', 'ک')
        .replace(/\u0640/gu, '');
}

function normalizePersianMorphologySpacing(text) {
    return String(text ?? '').replace(
        /(^|[\s([{«])((?:ن)?می)\s+([\u0600-\u06FF]{2,})/gu,
        '$1$2\u200c$3'
    );
}

function normalizePersianTextGeneral(text) {
    const unicode =
        normalizePersianUnicodeText(text);

    return normalizePersianMorphologySpacing(
        unicode
    );
}

function analyzePersianNormalization(text) {
    const original = String(text ?? '');
    const corrected =
        normalizePersianTextGeneral(original);

    if (corrected === original) {
        return {
            changed: false,
            original,
            corrected,
            reason: 'already-normalized',
            evidence: []
        };
    }

    const evidence = [];

    if (
        normalizePersianUnicodeText(original) !==
        original
    ) {
        evidence.push(
            'persian-unicode-normalization'
        );
    }

    if (
        normalizePersianMorphologySpacing(
            normalizePersianUnicodeText(
                original
            )
        ) !==
        normalizePersianUnicodeText(
            original
        )
    ) {
        evidence.push(
            'persian-morphology-spacing'
        );
    }

    return {
        changed: true,
        original,
        corrected,
        reason: 'persian-normalization',
        evidence
    };
}
