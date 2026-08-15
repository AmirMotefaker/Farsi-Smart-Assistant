const FSA_FINGLISH_ENGINE_VERSION =
    '4.9.0-generalized-finglish-rerank-v3';

const FSA_FINGLISH_MULTI = Object.freeze({
    kh: [['خ', 0]],
    gh: [['غ', 0], ['ق', 0.12]],
    sh: [['ش', 0]],
    ch: [['چ', 0]],
    zh: [['ژ', 0]],
    ph: [['ف', 0.18]],
    aa: [['ا', 0], ['آ', 0.12]],
    ee: [['ی', 0]],
    oo: [['و', 0]],
    ou: [['و', 0.08]],
    ey: [['ی', 0.10]]
});

const FSA_FINGLISH_SINGLE = Object.freeze({
    a: [['ا', 0], ['', 0.04], ['آ', 0.70], ['ع', 0.90]],
    b: [['ب', 0]],
    c: [['ک', 0.28], ['س', 0.38]],
    d: [['د', 0]],
    e: [['', 0.04], ['ه', 0.12], ['ی', 0.65]],
    f: [['ف', 0]],
    g: [['گ', 0], ['ق', 0.90]],
    h: [['ه', 0], ['ح', 0.65]],
    i: [['ی', 0], ['', 0.22]],
    j: [['ج', 0]],
    k: [['ک', 0]],
    l: [['ل', 0]],
    m: [['م', 0]],
    n: [['ن', 0]],
    o: [['و', 0], ['', 0.20]],
    p: [['پ', 0]],
    q: [['ق', 0]],
    r: [['ر', 0]],
    s: [['س', 0], ['ص', 0.50], ['ث', 0.75]],
    t: [['ت', 0], ['ط', 0.45]],
    u: [['و', 0], ['', 0.20]],
    v: [['و', 0]],
    w: [['و', 0.10]],
    x: [['کس', 0.35]],
    y: [['ی', 0]],
    z: [
        ['ز', 0],
        ['ذ', 0.55],
        ['ض', 0.65],
        ['ظ', 0.70]
    ]
});

function normalizeFsaFinglishInput(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}

const FSA_FINGLISH_PERSIAN_TO_LATIN =
    Object.freeze({
        'ا': 'a',
        'آ': 'aa',
        'ب': 'b',
        'پ': 'p',
        'ت': 't',
        'ث': 's',
        'ج': 'j',
        'چ': 'ch',
        'ح': 'h',
        'خ': 'kh',
        'د': 'd',
        'ذ': 'z',
        'ر': 'r',
        'ز': 'z',
        'ژ': 'zh',
        'س': 's',
        'ش': 'sh',
        'ص': 's',
        'ض': 'z',
        'ط': 't',
        'ظ': 'z',
        'ع': 'a',
        'غ': 'gh',
        'ف': 'f',
        'ق': 'gh',
        'ک': 'k',
        'گ': 'g',
        'ل': 'l',
        'م': 'm',
        'ن': 'n',
        'و': 'v',
        'ه': 'h',
        'ی': 'i'
    });

function romanizeFsaPersianForRerank(
    value
) {
    return [...String(value ?? '')]
        .map(
            (char) =>
                FSA_FINGLISH_PERSIAN_TO_LATIN[
                    char
                ] ?? ''
        )
        .join('');
}

function normalizeFsaVariantLatinForRerank(
    value
) {
    return String(value ?? '')
        .toLowerCase()
        .replaceAll('q', 'gh')
        .replaceAll('w', 'v')
        .replaceAll('y', 'i')
        .replaceAll('o', 'v')
        .replaceAll('aa', 'a');
}

function getFsaFinglishEditSimilarity(
    left,
    right
) {
    const source =
        [...String(left ?? '')];

    const target =
        [...String(right ?? '')];

    const maxLength =
        Math.max(
            source.length,
            target.length,
            1
        );

    if (source.length === 0) {
        return target.length === 0
            ? 1
            : 0;
    }

    if (target.length === 0) {
        return 0;
    }

    let previous =
        Array.from(
            {
                length:
                    target.length + 1
            },
            (
                _,
                index
            ) => index
        );

    for (
        let sourceIndex = 1;
        sourceIndex <=
            source.length;
        sourceIndex += 1
    ) {
        const current =
            [sourceIndex];

        for (
            let targetIndex = 1;
            targetIndex <=
                target.length;
            targetIndex += 1
        ) {
            const cost =
                source[
                    sourceIndex - 1
                ] ===
                target[
                    targetIndex - 1
                ]
                    ? 0
                    : 1;

            current[targetIndex] =
                Math.min(
                    current[
                        targetIndex - 1
                    ] + 1,
                    previous[
                        targetIndex
                    ] + 1,
                    previous[
                        targetIndex - 1
                    ] + cost
                );
        }

        previous =
            current;
    }

    const distance =
        previous[
            target.length
        ];

    return Math.max(
        0,
        1 -
        (
            distance /
            maxLength
        )
    );
}

function getFsaFinglishRerankFeatures(
    source,
    candidate
) {
    const roundTrip =
        romanizeFsaPersianForRerank(
            candidate.text
        );

    const known =
        typeof isFsaKnownPersianLexeme ===
            'function' &&
        isFsaKnownPersianLexeme(
            candidate.text
        );

    const strictSimilarity =
        getFsaFinglishEditSimilarity(
            source,
            roundTrip
        );

    const variantSimilarity =
        getFsaFinglishEditSimilarity(
            normalizeFsaVariantLatinForRerank(
                source
            ),
            normalizeFsaVariantLatinForRerank(
                roundTrip
            )
        );

    const exactStrictBonus =
        strictSimilarity >=
            0.999999
            ? 1
            : 0;

    const adjustment =
        (
            known
                ? 4
                : 0
        ) +
        strictSimilarity * 2.5 +
        variantSimilarity * 2 +
        (
            (
                Number(
                    candidate.penalty
                ) || 0
            ) * 0.25
        ) +
        exactStrictBonus;

    return {
        roundTrip,
        known,
        strictSimilarity,
        variantSimilarity,
        exactStrictBonus,
        adjustment
    };
}

function getFsaFinglishTrustedWordMapCandidate(
    source,
    candidates
) {
    if (
        typeof WORD_MAP ===
            'undefined' ||
        !WORD_MAP ||
        typeof isFsaKnownPersianLexeme !==
            'function'
    ) {
        return null;
    }

    const key =
        String(source ?? '')
            .toLowerCase();

    if (
        !Object.hasOwn(
            WORD_MAP,
            key
        )
    ) {
        return null;
    }

    const mapped =
        String(
            WORD_MAP[key] ?? ''
        );

    if (
        !mapped ||
        !isFsaKnownPersianLexeme(
            mapped
        )
    ) {
        return null;
    }

    const candidate =
        candidates.find(
            (item) =>
                item?.text ===
                mapped
        );

    if (!candidate) {
        return null;
    }

    return {
        corrected: mapped,
        candidate
    };
}

const FSA_FINGLISH_LATIN_VOWELS =
    new Set(['a', 'e', 'i', 'o', 'u']);

function isFsaFinglishLatinConsonant(value) {
    return /^[a-z]$/u.test(value) &&
        !FSA_FINGLISH_LATIN_VOWELS.has(
            value
        );
}

function getFsaFinglishTransitionPenalty(
    value,
    index,
    length,
    replacement,
    basePenalty
) {
    let adjusted =
        Number(basePenalty) || 0;

    if (
        replacement !== '' ||
        length !== 1
    ) {
        return adjusted;
    }

    const vowel = value[index];

    if (
        !FSA_FINGLISH_LATIN_VOWELS.has(
            vowel
        )
    ) {
        return adjusted;
    }

    const previous =
        index > 0
            ? value[index - 1]
            : '';
    const next =
        index + 1 < value.length
            ? value[index + 1]
            : '';

    const betweenConsonants =
        isFsaFinglishLatinConsonant(
            previous
        ) &&
        isFsaFinglishLatinConsonant(
            next
        );

    const internal =
        previous.length > 0 &&
        next.length > 0;

    if (vowel === 'a') {
        adjusted +=
            betweenConsonants
                ? 0.90
                : internal
                    ? 0.55
                    : 0.30;
    } else if (
        vowel === 'i' ||
        vowel === 'e'
    ) {
        adjusted +=
            betweenConsonants
                ? 0.60
                : internal
                    ? 0.40
                    : 0.22;
    } else {
        adjusted +=
            betweenConsonants
                ? 0.52
                : internal
                    ? 0.34
                    : 0.20;
    }

    return adjusted;
}

function getFsaFinglishSegmentOptions(
    value,
    index
) {
    const pair = value.slice(index, index + 2);

    if (Object.hasOwn(FSA_FINGLISH_MULTI, pair)) {
        return {
            length: 2,
            options: FSA_FINGLISH_MULTI[pair]
        };
    }

    const char = value[index];

    if (Object.hasOwn(FSA_FINGLISH_SINGLE, char)) {
        return {
            length: 1,
            options: FSA_FINGLISH_SINGLE[char]
        };
    }

    return null;
}

function dedupeFsaFinglishBeams(
    beams,
    limit
) {
    const best = new Map();

    for (const beam of beams) {
        const key = `${beam.index}\u0000${beam.text}`;
        const previous = best.get(key);

        if (
            !previous ||
            beam.penalty < previous.penalty
        ) {
            best.set(key, beam);
        }
    }

    return [...best.values()]
        .sort((a, b) => {
            if (a.penalty !== b.penalty) {
                return a.penalty - b.penalty;
            }

            if (a.index !== b.index) {
                return b.index - a.index;
            }

            return a.text < b.text
                ? -1
                : a.text > b.text
                    ? 1
                    : 0;
        })
        .slice(0, limit);
}

function generateFsaFinglishCandidates(
    input,
    options = {}
) {
    const value =
        normalizeFsaFinglishInput(input);

    if (
        !/^[a-z]+$/u.test(value) ||
        value.length < 3 ||
        value.length > 24
    ) {
        return [];
    }

    const beamLimit =
        Math.max(
            32,
            Math.min(
                512,
                Number(options.beamLimit) || 256
            )
        );

    const resultLimit =
        Math.max(
            8,
            Math.min(
                256,
                Number(options.limit) || 96
            )
        );

    let beams = [{
        index: 0,
        text: '',
        penalty: 0
    }];

    for (
        let step = 0;
        step < value.length + 2;
        step += 1
    ) {
        if (
            beams.every(
                (beam) =>
                    beam.index >= value.length
            )
        ) {
            break;
        }

        const expanded = [];

        for (const beam of beams) {
            if (beam.index >= value.length) {
                expanded.push(beam);
                continue;
            }

            const segment =
                getFsaFinglishSegmentOptions(
                    value,
                    beam.index
                );

            if (!segment) continue;

            for (
                const [replacement, penalty]
                of segment.options
            ) {
                expanded.push({
                    index:
                        beam.index +
                        segment.length,
                    text:
                        beam.text +
                        replacement,
                    penalty:
                        beam.penalty +
                        getFsaFinglishTransitionPenalty(
                            value,
                            beam.index,
                            segment.length,
                            replacement,
                            penalty
                        )
                });
            }
        }

        beams = dedupeFsaFinglishBeams(
            expanded,
            beamLimit
        );

        if (beams.length === 0) {
            break;
        }
    }

    const complete = beams.filter(
        (beam) =>
            beam.index === value.length &&
            beam.text.length >= 2
    );

    const bestByText = new Map();

    for (const beam of complete) {
        const previous =
            bestByText.get(beam.text);

        if (
            !previous ||
            beam.penalty < previous.penalty
        ) {
            bestByText.set(
                beam.text,
                beam
            );
        }
    }

    return [...bestByText.values()]
        .map((beam) => {
            const shape =
                typeof scoreFsaLanguageShape ===
                    'function'
                    ? scoreFsaLanguageShape(
                        beam.text,
                        'fa'
                    )
                    : {
                        z: -99,
                        coverage: 0
                    };

            const fidelityWeight =
                value.length <= 5
                    ? 0.65
                    : value.length <= 8
                        ? 0.55
                        : 0.48;

            const baseRank =
                shape.z +
                (shape.coverage * 0.70) -
                (
                    beam.penalty *
                    fidelityWeight
                );

            const candidate = {
                text: beam.text,
                penalty: beam.penalty,
                shape,
                rank: baseRank
            };

            const rerank =
                getFsaFinglishRerankFeatures(
                    value,
                    candidate
                );

            return {
                ...candidate,
                baseRank,
                rerank,
                rank:
                    baseRank +
                    rerank.adjustment
            };
        })
        .sort((a, b) => {
            if (b.rank !== a.rank) {
                return b.rank - a.rank;
            }

            if (a.penalty !== b.penalty) {
                return a.penalty - b.penalty;
            }

            return a.text < b.text
                ? -1
                : a.text > b.text
                    ? 1
                    : 0;
        })
        .slice(0, resultLimit);
}

function getFsaFinglishContextPrior(
    context
) {
    return typeof getFsaContextLanguagePrior ===
        'function'
        ? getFsaContextLanguagePrior(
            context || {},
            'en'
        )
        : {
            en: 0,
            fa: 0,
            dominant: '',
            evidence: []
        };
}

function shouldProtectFsaEnglishSource(
    input,
    context = null
) {
    const value =
        normalizeFsaFinglishInput(input);
    const prior =
        getFsaFinglishContextPrior(context);
    const contextDelta =
        (Number(prior.fa) || 0) -
        (Number(prior.en) || 0);

    if (
        prior.dominant === 'en' &&
        contextDelta <= -1.25
    ) {
        return true;
    }

    if (
        typeof isFsaKnownEnglishLexeme ===
            'function' &&
        isFsaKnownEnglishLexeme(value) &&
        contextDelta < 4.5
    ) {
        return true;
    }

    if (
        typeof isHighConfidenceEnglishPhrase ===
            'function' &&
        isHighConfidenceEnglishPhrase(value) &&
        contextDelta < 3
    ) {
        return true;
    }

    return false;
}

function analyzeFsaFinglishIntent(
    input,
    context = null
) {
    const original = String(input ?? '');
    const value =
        normalizeFsaFinglishInput(original);

    const unchanged = (
        reason,
        evidence = []
    ) => ({
        changed: false,
        original,
        corrected: original,
        confidence: 0,
        reason,
        evidence
    });

    if (
        !/^[a-z]+$/u.test(value) ||
        value.length < 3 ||
        value.length > 24
    ) {
        return unchanged(
            'not-finglish-token'
        );
    }

    if (
        shouldProtectFsaEnglishSource(
            value,
            context
        )
    ) {
        return unchanged(
            'protected-english-source',
            ['english-source-protection']
        );
    }

    if (
        typeof scoreFsaLanguageShape !==
            'function'
    ) {
        return unchanged(
            'language-model-unavailable'
        );
    }

    const source =
        scoreFsaLanguageShape(
            value,
            'en'
        );
    const candidates =
        generateFsaFinglishCandidates(
            value
        );

    if (candidates.length === 0) {
        return unchanged(
            'no-transliteration-candidates'
        );
    }

    const trustedPrior =
        getFsaFinglishTrustedWordMapCandidate(
            value,
            candidates
        );

    const best =
        trustedPrior?.candidate ||
        candidates[0];

    const prior =
        getFsaFinglishContextPrior(
            context
        );
    const contextDelta =
        (Number(prior.fa) || 0) -
        (Number(prior.en) || 0);

    let threshold =
        value.length <= 4
            ? 1.15
            : value.length <= 7
                ? 0.55
                : 0.30;

    if (contextDelta > 0) {
        threshold -= Math.min(
            1,
            contextDelta * 0.18
        );
    } else if (contextDelta < 0) {
        threshold += Math.min(
            1.5,
            Math.abs(contextDelta) * 0.25
        );
    }

    const margin =
        best.shape.z - source.z;
    const targetPlausible =
        best.shape.coverage >= 0.72 ||
        best.shape.z >= -0.20;

    if (
        !trustedPrior &&
        (
            !targetPlausible ||
            margin < threshold
        )
    ) {
        return {
            ...unchanged(
                'insufficient-finglish-margin',
                [
                    'statistical-source-protection',
                    ...prior.evidence
                ]
            ),
            source,
            bestCandidate: best,
            margin,
            threshold,
            contextPrior: prior
        };
    }

    const confidence =
        trustedPrior
            ? Math.max(
                0.94,
                Math.min(
                    0.985,
                    0.90 +
                    Math.max(
                        0,
                        contextDelta
                    ) * 0.01
                )
            )
            : Math.min(
                0.97,
                0.82 +
                Math.max(
                    0,
                    margin - threshold
                ) * 0.035 +
                Math.max(
                    0,
                    contextDelta
                ) * 0.01
            );

    return {
        changed: true,
        original,
        corrected: best.text,
        confidence,
        reason:
            trustedPrior
                ? 'trusted-beam-backed-finglish-prior'
                : 'generalized-finglish',
        evidence: [
            'beam-transliteration',
            'persian-statistical-language-shape',
            'dictionary-independent-finglish',
            'generalized-lexical-roundtrip-rerank',
            ...(
                trustedPrior
                    ? [
                        'trusted-word-map-finglish-prior',
                        'trusted-prior-is-generated-beam-candidate'
                    ]
                    : []
            ),
            ...prior.evidence
        ],
        source,
        bestCandidate: best,
        margin,
        threshold,
        contextPrior: prior
    };
}

function correctFsaFinglishText(
    input,
    context = null
) {
    const analysis =
        analyzeFsaFinglishIntent(
            input,
            context
        );

    return analysis.changed
        ? analysis.corrected
        : String(input ?? '');
}
