const FSA_SMART_AUTO_ENGINE_VERSION =
    '4.7.0-smart-auto';

const FSA_SMART_AUTO_THRESHOLDS = Object.freeze({
    layout: 0.975,
    contextLayout: 0.94,
    contextDelta: 3,
    finglishContextDelta: 6,
    finglishRankGap: 0.15,
    finglishDecisionMargin: 0.00,
    finglishConfidence: 0.88,
    normalization: 0.995
});

function makeFsaSmartAutoUnchanged(
    original,
    reason = 'unchanged',
    evidence = []
) {
    return {
        changed: false,
        autoEligible: false,
        original,
        corrected: original,
        confidence: 0,
        kind: 'none',
        reason,
        evidence
    };
}

function getFsaSmartAutoContextPrior(
    context,
    sourceLanguage = ''
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
            delta: 0,
            dominant: '',
            evidence: []
        };
}

function getFsaSmartAutoTargetContextDelta(
    prior,
    targetLanguage,
    sourceLanguage
) {
    return (
        (Number(prior?.[targetLanguage]) || 0) -
        (Number(prior?.[sourceLanguage]) || 0)
    );
}

function getFsaSmartAutoLayoutLanguages(
    direction
) {
    if (
        direction ===
        'persian-keys-to-english'
    ) {
        return {
            sourceLanguage: 'fa',
            targetLanguage: 'en'
        };
    }

    if (
        direction ===
        'english-keys-to-persian'
    ) {
        return {
            sourceLanguage: 'en',
            targetLanguage: 'fa'
        };
    }

    return {
        sourceLanguage: '',
        targetLanguage: ''
    };
}

function analyzeFsaSmartAutoFinglish(
    value,
    context,
    expected
) {
    if (
        typeof analyzeFsaFinglishIntent !==
        'function'
    ) {
        return null;
    }

    const analysis =
        analyzeFsaFinglishIntent(
            value,
            context
        );

    if (
        !analysis.changed ||
        (
            expected !== null &&
            analysis.corrected !== expected
        )
    ) {
        return null;
    }

    const candidates =
        typeof generateFsaFinglishCandidates ===
            'function'
            ? generateFsaFinglishCandidates(
                value,
                {
                    beamLimit: 384,
                    limit: 3
                }
            )
            : [];

    const first = candidates[0] || null;
    const second = candidates[1] || null;
    const rankGap =
        first
            ? second
                ? first.rank - second.rank
                : Number.POSITIVE_INFINITY
            : 0;

    const prior =
        analysis.contextPrior ||
        getFsaSmartAutoContextPrior(
            context,
            'en'
        );

    const contextDelta =
        getFsaSmartAutoTargetContextDelta(
            prior,
            'fa',
            'en'
        );

    const sourceZ =
        Number(analysis.source?.z);

    const targetZ =
        Number(
            analysis.bestCandidate
                ?.shape
                ?.z
        );

    const decisionMargin =
        (
            Number(analysis.margin) || 0
        ) -
        (
            Number(analysis.threshold) || 0
        );

    const targetCoverage =
        Number(
            analysis.bestCandidate
                ?.shape
                ?.coverage
        ) || 0;

    const confidence =
        Number(analysis.confidence) || 0;

    const sourceIntent =
        typeof scoreFsaFinglishSourceIntent ===
            'function'
            ? scoreFsaFinglishSourceIntent(
                value
            )
            : {
                score:
                    Number.NEGATIVE_INFINITY,
                threshold:
                    Number.POSITIVE_INFINITY,
                preferred: false
            };

    const sourceIntentMargin =
        (Number(sourceIntent.score) || 0) -
        (Number(sourceIntent.threshold) || 0);

    const sourceShapeScore =
        typeof scoreEnglishWordShape === 'function'
            ? Number(
                scoreEnglishWordShape(value)
                    ?.score
            ) || 0
            : 0;

    const surroundingText =
        `${String(
            context?.beforeText ?? ''
        )}${String(
            context?.afterText ?? ''
        )}`;
    const surroundingScripts =
        typeof countFsaContextScripts === 'function'
            ? countFsaContextScripts(
                surroundingText
            )
            : {
                latin:
                    (
                        surroundingText.match(
                            /[A-Za-z]/gu
                        ) || []
                    ).length,
                persian:
                    (
                        surroundingText.match(
                            /[\u0600-\u06FF]/gu
                        ) || []
                    ).length
            };
    const strongPersianSurroundingContext =
        surroundingScripts.persian >= 6 &&
        surroundingScripts.persian >=
            surroundingScripts.latin + 4;
    // Keep the Google-context promotion dictionary-independent. The
    // generalized Finglish engine has already required a statistically
    // plausible Persian target and a positive source-to-target margin before
    // returning changed=true. Auto promotion tightens that evidence further
    // instead of consulting the small HIGH_CONFIDENCE_PERSIAN_WORDS set.
    const targetStatisticallyStrong =
        (
            targetCoverage >= 0.72 ||
            (
                Number.isFinite(targetZ) &&
                targetZ >= -0.20
            )
        ) &&
        decisionMargin >= 2.0;
    const realGooglePersianContextAuto =
        strongPersianSurroundingContext &&
        sourceIntentMargin >= 3 &&
        sourceShapeScore < 0.55 &&
        confidence >= 0.96 &&
        targetStatisticallyStrong;

    const autoEligible =
        sourceIntent.preferred === true &&
        (
            contextDelta >= 6 ||
            (
                prior?.dominant === 'fa' &&
                contextDelta >= 4.5 &&
                sourceIntentMargin >= 3 &&
                sourceShapeScore < 0.55
            ) ||
            realGooglePersianContextAuto
        );

    return {
        changed: true,
        autoEligible,
        original: value,
        corrected: analysis.corrected,
        confidence:
            Number(analysis.confidence) || 0,
        kind: 'finglish',
        reason: analysis.reason,
        evidence: [
            ...(analysis.evidence || []),
            autoEligible
                ? 'smart-auto-finglish-safe'
                : 'smart-auto-finglish-suggestion-only'
        ],
        rankGap,
        contextDelta,
        sourceZ,
        targetZ,
        decisionMargin,
        targetCoverage,
        sourceIntent,
        analysis
    };
}

function analyzeFsaPhysicalKeyboardEvidenceOverride(
    value,
    context
) {
    if (
        !context ||
        typeof convertPersianKeysToEnglish !==
            'function' ||
        typeof scorePersianWordShape !==
            'function' ||
        typeof scoreEnglishWordShape !==
            'function'
    ) {
        return null;
    }

    if (
        /\s/u.test(value) ||
        !/^[\u0600-\u06FF]+$/u.test(
            value
        )
    ) {
        return null;
    }

    const keyboard =
        context.keyboardEvidence;

    if (!keyboard || typeof keyboard !== 'object') {
        return null;
    }

    const requiredEvidence =
        Math.min(4, value.length);
    const persianKeys =
        Number(keyboard.persianKeys) || 0;
    const physicalAlphaKeys =
        Number(keyboard.physicalAlphaKeys) || 0;

    if (
        persianKeys < requiredEvidence ||
        physicalAlphaKeys < requiredEvidence
    ) {
        return null;
    }

    const surrounding =
        `${String(
            context.beforeText ?? ''
        )}${String(
            context.afterText ?? ''
        )}`;

    // Keep this override narrow: isolated physical-keyboard search token,
    // not ordinary Persian prose.
    if (/[A-Za-z\u0600-\u06FF]/u.test(surrounding)) {
        return null;
    }

    const corrected =
        String(
            convertPersianKeysToEnglish(
                value
            ) || ''
        ).toLowerCase();

    if (!/^[a-z]{4,16}$/u.test(corrected)) {
        return null;
    }

    const sourceShape =
        scorePersianWordShape(value);
    const targetShape =
        scoreEnglishWordShape(corrected);
    const sourceScore =
        Number(sourceShape?.score) || 0;
    const targetScore =
        Number(targetShape?.score) || 0;

    if (
        sourceScore > 0.40 ||
        targetScore < 0.60 ||
        targetScore - sourceScore < 0.20
    ) {
        return null;
    }

    // Shape plausibility alone was too permissive in the v6 holdout.
    // This fallback is reserved for ambiguous Latin targets that also have
    // a strong Persian transliteration witness already present in the
    // product's conservative high-confidence Persian safety prior.
    const transliterationWitness =
        typeof generateFsaFinglishCandidates ===
            'function' &&
        typeof isHighConfidencePersianCandidate ===
            'function'
            ? generateFsaFinglishCandidates(
                corrected
            )
                .slice(0, 6)
                .find(
                    (candidate) =>
                        Number(
                            candidate?.penalty
                        ) <= 1.10 &&
                        isHighConfidencePersianCandidate(
                            candidate?.text
                        )
                )
            : null;

    if (!transliterationWitness) {
        return null;
    }

    return {
        changed: true,
        autoEligible: true,
        original: value,
        corrected,
        confidence: 0.985,
        kind: 'physical-keyboard-evidence-layout',
        reason: 'physical-keyboard-evidence-override',
        evidence: [
            'isolated-persian-physical-alpha-token',
            'weak-persian-source-shape',
            'plausible-english-layout-target',
            'known-persian-transliteration-witness',
            'smart-auto-physical-keyboard-safe'
        ],
        sourceShape,
        targetShape,
        transliterationWitness:
            transliterationWitness.text
    };
}

function analyzeFsaSmartAutoIntent(
    input,
    context = null,
    customDictionary = {}
) {
    const value = String(input ?? '');

    if (!value) {
        return makeFsaSmartAutoUnchanged(
            value,
            'empty'
        );
    }

    const textLower =
        value.toLowerCase();

    const expected =
        typeof smart_farsi_converter ===
            'function'
            ? smart_farsi_converter(
                value,
                customDictionary,
                context
            )
            : value;

    const hasExplicitUserDictionary =
        customDictionary &&
        Object.hasOwn(
            customDictionary,
            textLower
        );

    if (!hasExplicitUserDictionary) {
        const physicalKeyboardOverride =
            analyzeFsaPhysicalKeyboardEvidenceOverride(
                value,
                context
            );

        if (physicalKeyboardOverride) {
            return physicalKeyboardOverride;
        }
    }

    if (
        !/\s/u.test(value) &&
        /^[a-z]+$/u.test(value) &&
        !(
            customDictionary &&
            Object.hasOwn(
                customDictionary,
                textLower
            )
        ) &&
        !(
            typeof isFsaKnownEnglishLexeme ===
                'function' &&
            isFsaKnownEnglishLexeme(
                value
            )
        )
    ) {
        const highConfidenceFinglish =
            analyzeFsaSmartAutoFinglish(
                value,
                context,
                null
            );

        const hasPersianSurroundingContext =
            /[\u0600-\u06FF]/u.test(
                `${String(
                    context?.beforeText ?? ''
                )}${String(
                    context?.afterText ?? ''
                )}`
            );

        if (
            highConfidenceFinglish
                ?.autoEligible === true ||
            (
                highConfidenceFinglish
                    ?.sourceIntent
                    ?.preferred === true &&
                hasPersianSurroundingContext
            )
        ) {
            return {
                ...highConfidenceFinglish,
                evidence: [
                    ...(
                        highConfidenceFinglish
                            .evidence || []
                    ),
                    highConfidenceFinglish
                        .autoEligible === true
                        ? 'source-intent-finglish-preempts-layout'
                        : 'source-intent-finglish-blocks-layout-auto-with-persian-context'
                ]
            };
        }
    }

    if (expected === value) {
        return makeFsaSmartAutoUnchanged(
            value
        );
    }

    if (
        /^[a-z]+$/u.test(value) &&
        typeof isFsaKnownEnglishLexeme === 'function' &&
        isFsaKnownEnglishLexeme(value)
    ) {
        return {
            changed: true,
            autoEligible: false,
            original: value,
            corrected: expected,
            confidence: 1,
            kind: 'english-lexical-safety-prior',
            reason: 'known-english-auto-protection',
            evidence: [
                'english-lexical-prior',
                'suggestion-only'
            ]
        };
    }

    if (
        customDictionary &&
        Object.hasOwn(
            customDictionary,
            textLower
        ) &&
        customDictionary[textLower] ===
            expected
    ) {
        return {
            changed: true,
            autoEligible: true,
            original: value,
            corrected: expected,
            confidence: 1,
            kind: 'custom-dictionary',
            reason: 'user-defined-correction',
            evidence: [
                'explicit-user-dictionary'
            ]
        };
    }

    if (
        typeof analyzePersianNormalization ===
            'function'
    ) {
        const normalization =
            analyzePersianNormalization(
                value
            );

        if (
            normalization.changed &&
            normalization.corrected ===
                expected
        ) {
            return {
                changed: true,
                autoEligible: true,
                original: value,
                corrected: expected,
                confidence:
                    FSA_SMART_AUTO_THRESHOLDS
                        .normalization,
                kind: 'normalization',
                reason:
                    normalization.reason,
                evidence: [
                    ...(normalization.evidence ||
                        []),
                    'deterministic-normalization'
                ],
                analysis: normalization
            };
        }
    }

    if (!/\s/u.test(value)) {
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

            if (
                contextual.changed &&
                contextual.corrected ===
                    expected
            ) {
                const {
                    sourceLanguage,
                    targetLanguage
                } =
                    getFsaSmartAutoLayoutLanguages(
                        contextual.direction
                    );

                const prior =
                    contextual.contextPrior ||
                    getFsaSmartAutoContextPrior(
                        context,
                        sourceLanguage
                    );

                const contextDelta =
                    sourceLanguage &&
                    targetLanguage
                        ? getFsaSmartAutoTargetContextDelta(
                            prior,
                            targetLanguage,
                            sourceLanguage
                        )
                        : 0;

                const confidence =
                    Number(
                        contextual.confidence
                    ) || 0;

                const contextApplied =
                    contextual.contextApplied ===
                    true;

                const sourceShapeScore =
                    sourceLanguage === 'en' &&
                    typeof scoreEnglishWordShape ===
                        'function'
                        ? Number(
                            scoreEnglishWordShape(value)
                                ?.score
                        ) || 0
                        : sourceLanguage === 'fa' &&
                            typeof scorePersianWordShape ===
                                'function'
                            ? Number(
                                scorePersianWordShape(value)
                                    ?.score
                            ) || 0
                            : 0;

                const sourceContextProtected =
                    prior?.dominant === sourceLanguage &&
                    (
                        (
                            sourceLanguage === 'en' &&
                            sourceShapeScore >= 0.55
                        ) ||
                        (
                            sourceLanguage === 'fa' &&
                            sourceShapeScore >= 0.65
                        )
                    );

                const statisticalAuto =
                    contextApplied &&
                    sourceLanguage &&
                    targetLanguage &&
                    typeof compareFsaLanguageCandidates ===
                        'function'
                        ? compareFsaLanguageCandidates(
                            value,
                            sourceLanguage,
                            contextual.corrected,
                            targetLanguage,
                            sourceLanguage === 'fa'
                                ? 'faToEn'
                                : 'enToFa',
                            'auto'
                        )
                        : null;

                const autoEligible =
                    sourceContextProtected
                        ? false
                        : contextApplied
                            ? (
                                confidence >=
                                    FSA_SMART_AUTO_THRESHOLDS
                                        .contextLayout &&
                                contextDelta >=
                                    FSA_SMART_AUTO_THRESHOLDS
                                        .contextDelta &&
                                statisticalAuto?.preferred === true
                            )
                            : confidence >=
                                FSA_SMART_AUTO_THRESHOLDS
                                    .layout;

                return {
                    changed: true,
                    autoEligible,
                    original: value,
                    corrected: expected,
                    confidence,
                    kind: contextApplied
                        ? 'context-layout'
                        : 'layout',
                    reason:
                        contextual.reason,
                    evidence: [
                        ...(contextual.evidence ||
                            []),
                        sourceContextProtected
                            ? 'smart-auto-source-context-protection'
                            : autoEligible
                                ? 'smart-auto-layout-safe'
                                : 'smart-auto-layout-suggestion-only'
                    ],
                    contextDelta,
                    analysis: contextual
                };
            }
        }

        if (
            typeof analyzeKeyboardLayoutToken ===
                'function'
        ) {
            const layout =
                analyzeKeyboardLayoutToken(
                    value
                );

            if (
                layout.changed &&
                layout.corrected === expected
            ) {
                const confidence =
                    Number(
                        layout.confidence
                    ) || 0;

                return {
                    changed: true,
                    autoEligible:
                        confidence >=
                        FSA_SMART_AUTO_THRESHOLDS
                            .layout,
                    original: value,
                    corrected: expected,
                    confidence,
                    kind: 'layout',
                    reason: layout.reason,
                    evidence: [
                        ...(layout.evidence || []),
                        confidence >=
                            FSA_SMART_AUTO_THRESHOLDS
                                .layout
                            ? 'smart-auto-layout-safe'
                            : 'smart-auto-layout-suggestion-only'
                    ],
                    analysis: layout
                };
            }
        }

        const finglish =
            analyzeFsaSmartAutoFinglish(
                value,
                context,
                expected
            );

        if (finglish) {
            return finglish;
        }
    }


    if (
        typeof analyzeFsaSpellingIntent ===
            'function'
    ) {
        const spelling =
            analyzeFsaSpellingIntent(
                value,
                context
            );

        if (
            spelling.changed &&
            spelling.corrected ===
                expected
        ) {
            return {
                changed: true,
                autoEligible: false,
                original: value,
                corrected: expected,
                confidence:
                    Number(
                        spelling.confidence
                    ) || 0,
                kind: 'spelling',
                reason:
                    spelling.reason,
                evidence: [
                    ...(spelling.evidence || []),
                    'smart-auto-spelling-suggestion-only'
                ],
                analysis: spelling
            };
        }
    }

    if (
        typeof WORD_MAP !== 'undefined' &&
        WORD_MAP &&
        WORD_MAP[textLower] === expected
    ) {
        return {
            changed: true,
            autoEligible: false,
            original: value,
            corrected: expected,
            confidence: 0.90,
            kind: 'legacy-prior',
            reason: 'legacy-word-map-prior',
            evidence: [
                'legacy-prior-suggestion-only'
            ]
        };
    }

    return {
        changed: true,
        autoEligible: false,
        original: value,
        corrected: expected,
        confidence: 0.75,
        kind: 'unclassified',
        reason: 'smart-converter-difference',
        evidence: [
            'unclassified-suggestion-only'
        ]
    };
}
