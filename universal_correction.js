const FSA_UNIVERSAL_CORRECTION_ENGINE_VERSION =
    '4.9.0-unified-arbitration-v1.3';

function makeFsaUniversalUnchanged(
    value,
    reason = 'unchanged',
    evidence = [],
    protectedSource = false
) {
    return {
        changed: false,
        protected: protectedSource,
        original: value,
        corrected: value,
        confidence: 0,
        kind: 'none',
        reason,
        evidence,
        hypotheses: []
    };
}

function getFsaUniversalSourceLanguage(
    value
) {
    if (/^[A-Za-z]+$/u.test(value)) {
        return 'en';
    }

    if (
        /^[\u0621-\u06CC\u200c]+$/u.test(
            value
        )
    ) {
        return 'fa';
    }

    return '';
}

function getFsaUniversalContextPrior(
    context,
    sourceLanguage
) {
    return typeof getFsaContextLanguagePrior ===
        'function'
        ? getFsaContextLanguagePrior(
            context || {},
            sourceLanguage
        )
        : {
            en: 0,
            fa: 0,
            dominant: '',
            evidence: []
        };
}

function getFsaUniversalTargetDelta(
    prior,
    targetLanguage,
    sourceLanguage
) {
    return (
        (Number(
            prior?.[targetLanguage]
        ) || 0) -
        (Number(
            prior?.[sourceLanguage]
        ) || 0)
    );
}

function isFsaUniversalKnownLexeme(
    value,
    language
) {
    if (language === 'en') {
        return (
            typeof isFsaKnownEnglishLexeme ===
                'function' &&
            isFsaKnownEnglishLexeme(value)
        );
    }

    if (language === 'fa') {
        return (
            typeof isFsaKnownPersianLexeme ===
                'function' &&
            isFsaKnownPersianLexeme(value)
        );
    }

    return false;
}

function getFsaUniversalLexicalProtection(
    value,
    sourceLanguage,
    context
) {
    if (
        !sourceLanguage ||
        !isFsaUniversalKnownLexeme(
            value,
            sourceLanguage
        )
    ) {
        return {
            protected: false,
            evidence: []
        };
    }

    const prior =
        getFsaUniversalContextPrior(
            context,
            sourceLanguage
        );

    const opposite =
        sourceLanguage === 'en'
            ? 'fa'
            : 'en';

    const oppositeDelta =
        (Number(prior[opposite]) || 0) -
        (Number(prior[sourceLanguage]) || 0);

    const strongOppositeContext =
        prior.dominant === opposite &&
        oppositeDelta >= 3.5;

    if (strongOppositeContext) {
        return {
            protected: false,
            evidence: [
                'known-source-overridden-by-strong-opposite-context',
                ...(prior.evidence || [])
            ]
        };
    }

    return {
        protected: true,
        evidence: [
            `${sourceLanguage}-known-source-protected`,
            ...(prior.evidence || [])
        ]
    };
}

function getFsaUniversalLayoutTargetLanguage(
    direction
) {
    if (
        direction ===
        'english-keys-to-persian'
    ) {
        return 'fa';
    }

    if (
        direction ===
        'persian-keys-to-english'
    ) {
        return 'en';
    }

    return '';
}

function getFsaUniversalLayoutHypothesis(
    value,
    sourceLanguage,
    context,
    prior
) {
    if (
        /\s/u.test(value) ||
        (
            sourceLanguage !== 'en' &&
            sourceLanguage !== 'fa'
        )
    ) {
        return null;
    }

    let analysis = null;

    if (
        context &&
        typeof analyzeKeyboardLayoutTokenWithContext ===
            'function'
    ) {
        const contextual =
            analyzeKeyboardLayoutTokenWithContext(
                value,
                context
            );

        if (contextual?.changed) {
            analysis = contextual;
        }
    }

    if (
        !analysis &&
        typeof analyzeKeyboardLayoutToken ===
            'function'
    ) {
        const base =
            analyzeKeyboardLayoutToken(
                value
            );

        if (base?.changed) {
            analysis = base;
        }
    }

    if (!analysis) {
        return null;
    }

    const targetLanguage =
        getFsaUniversalLayoutTargetLanguage(
            analysis.direction
        );

    if (!targetLanguage) {
        return null;
    }

    const targetKnown =
        isFsaUniversalKnownLexeme(
            analysis.corrected,
            targetLanguage
        );

    const contextDelta =
        getFsaUniversalTargetDelta(
            prior,
            targetLanguage,
            sourceLanguage
        );

    const evidence =
        analysis.evidence || [];

    let score =
        4.00 +
        (
            Number(
                analysis.confidence
            ) || 0
        ) * 2.20 +
        (
            targetKnown
                ? 4.25
                : 0
        ) +
        Math.max(
            -2.5,
            Math.min(
                2.5,
                contextDelta * 0.48
            )
        );

    if (
        evidence.includes(
            'persian-layout-punctuation'
        )
    ) {
        score += 1.20;
    }

    if (
        evidence.includes(
            'latin-without-vowels'
        )
    ) {
        score += 0.85;
    }

    if (
        evidence.includes(
            'known-persian-after-layout-conversion'
        ) ||
        evidence.includes(
            'known-english-after-layout-reversal'
        )
    ) {
        score += 0.75;
    }

    return {
        kind: 'layout',
        corrected:
            analysis.corrected,
        confidence:
            Number(
                analysis.confidence
            ) || 0,
        score,
        targetLanguage,
        targetKnown,
        contextDelta,
        analysis,
        evidence: [
            ...(analysis.evidence || []),
            targetKnown
                ? 'layout-target-lexically-known'
                : 'layout-target-not-in-lexical-prior'
        ]
    };
}

function getFsaUniversalTrustedFinglishPrior(
    value
) {
    if (
        typeof WORD_MAP === 'undefined' ||
        !WORD_MAP ||
        typeof generateFsaFinglishCandidates !==
            'function'
    ) {
        return null;
    }

    const source =
        String(value ?? '')
            .toLowerCase();

    if (
        !Object.hasOwn(
            WORD_MAP,
            source
        )
    ) {
        return null;
    }

    const mapped =
        String(
            WORD_MAP[source] ?? ''
        );

    if (
        !mapped ||
        !isFsaUniversalKnownLexeme(
            mapped,
            'fa'
        )
    ) {
        return null;
    }

    const candidate =
        generateFsaFinglishCandidates(
            source,
            {
                limit: 96
            }
        )
            .find(
                (item) =>
                    item?.text === mapped
            );

    if (!candidate) {
        return null;
    }

    return {
        corrected: mapped,
        candidate
    };
}

function getFsaUniversalFinglishHypothesis(
    value,
    sourceLanguage,
    context,
    prior
) {
    if (
        sourceLanguage !== 'en'
    ) {
        return null;
    }

    const trustedPrior =
        getFsaUniversalTrustedFinglishPrior(
            value
        );

    const analysis =
        typeof analyzeFsaFinglishIntent ===
            'function'
            ? analyzeFsaFinglishIntent(
                value,
                context
            )
            : null;

    if (
        !analysis?.changed &&
        !trustedPrior
    ) {
        return null;
    }

    const corrected =
        trustedPrior?.corrected ||
        analysis.corrected;

    const targetKnown =
        isFsaUniversalKnownLexeme(
            corrected,
            'fa'
        );

    const contextDelta =
        getFsaUniversalTargetDelta(
            prior,
            'fa',
            'en'
        );

    const sourceIntent =
        typeof scoreFsaFinglishSourceIntent ===
            'function'
            ? scoreFsaFinglishSourceIntent(
                value
            )
            : null;

    const sourceIntentMargin =
        sourceIntent
            ? (
                Number(sourceIntent.score) || 0
            ) -
            (
                Number(
                    sourceIntent.threshold
                ) || 0
            )
            : 0;

    const decisionMargin =
        analysis?.changed
            ? (
                (
                    Number(analysis.margin) || 0
                ) -
                (
                    Number(
                        analysis.threshold
                    ) || 0
                )
            )
            : 0;

    const confidence =
        analysis?.changed
            ? (
                Number(
                    analysis.confidence
                ) || 0
            )
            : 0.94;

    let score =
        3.70 +
        confidence * 2.10 +
        (
            targetKnown
                ? 4.50
                : 0
        ) +
        Math.max(
            -2.5,
            Math.min(
                2.5,
                contextDelta * 0.52
            )
        ) +
        Math.max(
            -0.5,
            Math.min(
                1.25,
                decisionMargin * 0.10
            )
        );

    if (
        sourceIntent?.preferred === true
    ) {
        score +=
            0.75 +
            Math.min(
                0.75,
                Math.max(
                    0,
                    sourceIntentMargin * 0.10
                )
            );
    }

    if (trustedPrior) {
        score +=
            analysis?.changed
                ? 1.75
                : 3.25;
    }

    return {
        kind: 'finglish',
        corrected,
        confidence,
        score,
        targetLanguage: 'fa',
        targetKnown,
        contextDelta,
        sourceIntent,
        sourceIntentMargin,
        analysis,
        evidence: [
            ...(analysis?.evidence || []),
            targetKnown
                ? 'finglish-target-lexically-known'
                : 'finglish-target-not-in-lexical-prior',
            ...(trustedPrior
                ? [
                    'trusted-word-map-finglish-prior',
                    'trusted-prior-is-generated-beam-candidate',
                    ...(
                        !context ||
                        !analysis?.changed
                            ? [
                                'trusted-prior-standalone-hypothesis'
                            ]
                            : []
                    )
                ]
                : [])
        ]
    };
}

function getFsaUniversalSpellingHypothesis(
    value,
    sourceLanguage,
    context,
    prior
) {
    if (
        typeof analyzeFsaSpellingIntent !==
            'function'
    ) {
        return null;
    }

    const analysis =
        analyzeFsaSpellingIntent(
            value,
            context
        );

    if (!analysis?.changed) {
        return null;
    }

    const opposite =
        sourceLanguage === 'en'
            ? 'fa'
            : 'en';

    const sourceSupport =
        (Number(
            prior?.[sourceLanguage]
        ) || 0) -
        (Number(
            prior?.[opposite]
        ) || 0);

    let score =
        5.20 +
        (
            Number(
                analysis.confidence
            ) || 0
        ) * 2.50 +
        Math.max(
            -2,
            Math.min(
                2,
                sourceSupport * 0.45
            )
        );

    if (
        prior?.dominant ===
        sourceLanguage
    ) {
        score += 1.50;
    }

    if (
        analysis.candidates?.length === 1
    ) {
        score += 0.50;
    }

    return {
        kind: 'spelling',
        corrected:
            analysis.corrected,
        confidence:
            Number(
                analysis.confidence
            ) || 0,
        score,
        targetLanguage:
            sourceLanguage,
        targetKnown: true,
        contextDelta:
            sourceSupport,
        analysis,
        evidence: [
            ...(analysis.evidence || []),
            'same-script-spelling-hypothesis'
        ]
    };
}

function tuneFsaUniversalCompetition(
    hypotheses,
    value,
    sourceLanguage,
    prior
) {
    const layout =
        hypotheses.find(
            (item) =>
                item.kind === 'layout'
        );

    const finglish =
        hypotheses.find(
            (item) =>
                item.kind === 'finglish'
        );

    const spelling =
        hypotheses.find(
            (item) =>
                item.kind === 'spelling'
        );

    if (layout && finglish) {
        if (
            layout.targetKnown &&
            !finglish.targetKnown
        ) {
            layout.score += 4.00;
            layout.evidence.push(
                'lexical-layout-wins-over-unknown-finglish'
            );
        } else if (
            finglish.targetKnown &&
            !layout.targetKnown
        ) {
            finglish.score += 4.00;
            finglish.evidence.push(
                'lexical-finglish-wins-over-unknown-layout'
            );
        } else if (
            layout.targetKnown &&
            finglish.targetKnown
        ) {
            const strongFinglish =
                finglish.sourceIntent
                    ?.preferred === true &&
                finglish.sourceIntentMargin >=
                    1.25 &&
                (
                    Number(prior?.fa) || 0
                ) >=
                (
                    Number(prior?.en) || 0
                ) + 1.5;

            if (strongFinglish) {
                finglish.score += 1.50;
                finglish.evidence.push(
                    'known-target-finglish-context-tiebreak'
                );
            } else {
                layout.score += 1.25;
                layout.evidence.push(
                    'known-target-layout-conservative-tiebreak'
                );
            }
        }
    }

    if (spelling && layout) {
        if (
            prior?.dominant ===
            sourceLanguage
        ) {
            spelling.score += 1.25;
            spelling.evidence.push(
                'same-language-context-prefers-spelling'
            );
        }

        if (
            layout.targetKnown &&
            prior?.dominant ===
                layout.targetLanguage
        ) {
            layout.score += 1.50;
            layout.evidence.push(
                'opposite-language-context-prefers-layout'
            );
        }
    }

    if (spelling && finglish) {
        if (
            prior?.dominant === 'en'
        ) {
            spelling.score += 1.25;
        }

        if (
            prior?.dominant === 'fa' &&
            finglish.targetKnown
        ) {
            finglish.score += 1.25;
        }
    }

    if (
        sourceLanguage === 'en' &&
        /[^a-z]/u.test(
            String(value).toLowerCase()
        )
    ) {
        if (layout) {
            layout.score += 1.00;
        }
    }
}

function analyzeFsaUniversalCorrection(
    input,
    context = null
) {
    const original =
        String(input ?? '');

    if (
        !original ||
        /\s/u.test(original)
    ) {
        return makeFsaUniversalUnchanged(
            original,
            'not-single-token'
        );
    }

    const sourceLanguage =
        getFsaUniversalSourceLanguage(
            original
        );

    if (!sourceLanguage) {
        return makeFsaUniversalUnchanged(
            original,
            'unsupported-or-mixed-script'
        );
    }

    const normalized =
        sourceLanguage === 'en'
            ? (
                typeof normalizeFsaEnglishLexeme ===
                    'function'
                    ? normalizeFsaEnglishLexeme(
                        original
                    )
                    : original.toLowerCase()
            )
            : (
                typeof normalizeFsaPersianLexeme ===
                    'function'
                    ? normalizeFsaPersianLexeme(
                        original
                    )
                    : original
            );

    const protection =
        getFsaUniversalLexicalProtection(
            normalized,
            sourceLanguage,
            context
        );

    if (protection.protected) {
        return makeFsaUniversalUnchanged(
            original,
            'known-valid-source',
            protection.evidence,
            true
        );
    }

    const prior =
        getFsaUniversalContextPrior(
            context,
            sourceLanguage
        );

    const hypotheses =
        [
            getFsaUniversalLayoutHypothesis(
                normalized,
                sourceLanguage,
                context,
                prior
            ),
            getFsaUniversalFinglishHypothesis(
                normalized,
                sourceLanguage,
                context,
                prior
            ),
            getFsaUniversalSpellingHypothesis(
                normalized,
                sourceLanguage,
                context,
                prior
            )
        ]
        .filter(Boolean);

    if (hypotheses.length === 0) {
        return makeFsaUniversalUnchanged(
            original,
            'no-universal-hypothesis',
            protection.evidence
        );
    }

    tuneFsaUniversalCompetition(
        hypotheses,
        normalized,
        sourceLanguage,
        prior
    );

    hypotheses.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        if (
            b.confidence !==
            a.confidence
        ) {
            return (
                b.confidence -
                a.confidence
            );
        }

        return a.kind < b.kind
            ? -1
            : a.kind > b.kind
                ? 1
                : 0;
    });

    const best =
        hypotheses[0];

    const second =
        hypotheses[1] || null;

    const margin =
        second
            ? best.score - second.score
            : Number.POSITIVE_INFINITY;

    if (
        best.score < 6.25
    ) {
        return makeFsaUniversalUnchanged(
            original,
            'universal-score-below-threshold',
            [
                ...protection.evidence,
                `best-kind:${best.kind}`
            ]
        );
    }

    return {
        changed:
            best.corrected !==
            normalized,
        protected: false,
        original,
        corrected:
            best.corrected,
        confidence:
            Math.min(
                0.995,
                Math.max(
                    0,
                    0.72 +
                    Math.min(
                        0.20,
                        best.score * 0.012
                    ) +
                    (
                        Number.isFinite(
                            margin
                        )
                            ? Math.min(
                                0.075,
                                Math.max(
                                    0,
                                    margin * 0.025
                                )
                            )
                            : 0.075
                    )
                )
            ),
        kind:
            best.kind,
        reason:
            'unified-correction-arbitration',
        evidence: [
            ...(best.evidence || []),
            `universal-winner:${best.kind}`
        ],
        sourceLanguage,
        contextPrior: prior,
        score: best.score,
        margin,
        winningHypothesis:
            best,
        hypotheses
    };
}
