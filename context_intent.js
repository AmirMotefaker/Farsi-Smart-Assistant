const FSA_CONTEXT_ENGINE_VERSION = '4.7.0-context-intelligence';

const FSA_CONTEXT_LATIN_RE = /[A-Za-z]/gu;
const FSA_CONTEXT_PERSIAN_RE = /[\u0600-\u06FF]/gu;

function countFsaContextScripts(text) {
    const value = String(text ?? '');
    const latin = (value.match(FSA_CONTEXT_LATIN_RE) || []).length;
    const persian = (value.match(FSA_CONTEXT_PERSIAN_RE) || []).length;

    return {
        latin,
        persian,
        total: latin + persian
    };
}

function normalizeFsaLanguageHint(value) {
    const raw = String(value ?? '')
        .trim()
        .toLowerCase();

    if (!raw) return '';

    if (
        raw === 'fa' ||
        raw === 'fa-ir' ||
        raw.startsWith('fa-') ||
        raw === 'persian'
    ) {
        return 'fa';
    }

    if (
        raw === 'en' ||
        raw === 'en-us' ||
        raw === 'en-gb' ||
        raw.startsWith('en-') ||
        raw === 'english'
    ) {
        return 'en';
    }

    return '';
}

function getFsaTokenScript(text) {
    const counts = countFsaContextScripts(text);

    if (counts.latin > 0 && counts.persian === 0) {
        return 'en';
    }

    if (counts.persian > 0 && counts.latin === 0) {
        return 'fa';
    }

    return '';
}

function makeFsaContextScore() {
    return {
        en: 0,
        fa: 0,
        evidence: []
    };
}

function addFsaContextScore(
    score,
    language,
    amount,
    evidence
) {
    if (language !== 'en' && language !== 'fa') {
        return;
    }

    score[language] += amount;

    if (evidence) {
        score.evidence.push(evidence);
    }
}

function scoreFsaSurroundingText(score, context) {
    const before = String(context?.beforeText ?? '');
    const after = String(context?.afterText ?? '');
    const surrounding = `${before} ${after}`;
    const counts = countFsaContextScripts(surrounding);

    if (counts.latin >= 3) {
        addFsaContextScore(
            score,
            'en',
            Math.min(4, 0.35 * counts.latin),
            'surrounding-latin-context'
        );
    }

    if (counts.persian >= 3) {
        addFsaContextScore(
            score,
            'fa',
            Math.min(4, 0.35 * counts.persian),
            'surrounding-persian-context'
        );
    }

    if (
        counts.latin >= 6 &&
        counts.persian === 0
    ) {
        addFsaContextScore(
            score,
            'en',
            1.5,
            'strong-monolingual-english-context'
        );
    }

    if (
        counts.persian >= 6 &&
        counts.latin === 0
    ) {
        addFsaContextScore(
            score,
            'fa',
            1.5,
            'strong-monolingual-persian-context'
        );
    }
}

function scoreFsaLanguageHints(score, context) {
    const hints = [
        [
            normalizeFsaLanguageHint(
                context?.fieldLanguage
            ),
            0.9,
            'field-language-hint'
        ],
        [
            normalizeFsaLanguageHint(
                context?.pageLanguage
            ),
            0.45,
            'page-language-hint'
        ],
        [
            normalizeFsaLanguageHint(
                context?.browserLanguage
            ),
            0.2,
            'browser-language-hint'
        ]
    ];

    for (const [language, amount, evidence] of hints) {
        if (!language) continue;

        addFsaContextScore(
            score,
            language,
            amount,
            `${evidence}:${language}`
        );
    }

    const direction = String(
        context?.direction ?? ''
    ).toLowerCase();

    if (direction === 'rtl') {
        addFsaContextScore(
            score,
            'fa',
            0.15,
            'rtl-field-prior'
        );
    } else if (direction === 'ltr') {
        addFsaContextScore(
            score,
            'en',
            0.15,
            'ltr-field-prior'
        );
    }
}

function scoreFsaKeyboardEvidence(
    score,
    context,
    sourceLanguage
) {
    const keyboard = context?.keyboardEvidence;

    if (!keyboard || typeof keyboard !== 'object') {
        return;
    }

    const latin = Number(keyboard.latinKeys) || 0;
    const persian = Number(keyboard.persianKeys) || 0;
    const total = latin + persian;

    if (total < 2) return;

    const observedLanguage =
        latin > persian
            ? 'en'
            : persian > latin
                ? 'fa'
                : '';

    if (!observedLanguage) return;

    addFsaContextScore(
        score,
        observedLanguage,
        0.25,
        `observed-key-script:${observedLanguage}`
    );

    const opposite =
        sourceLanguage === 'en' ? 'fa' : 'en';

    if (
        observedLanguage === sourceLanguage &&
        score[opposite] >= score[sourceLanguage] + 2
    ) {
        addFsaContextScore(
            score,
            opposite,
            0.55,
            'keyboard-script-context-mismatch'
        );
    }
}

function getFsaContextLanguagePrior(
    context,
    sourceLanguage = ''
) {
    const score = makeFsaContextScore();

    scoreFsaSurroundingText(score, context);
    scoreFsaLanguageHints(score, context);
    scoreFsaKeyboardEvidence(
        score,
        context,
        sourceLanguage
    );

    const delta = score.en - score.fa;
    const dominant =
        Math.abs(delta) < 0.75
            ? ''
            : delta > 0
                ? 'en'
                : 'fa';

    return {
        en: score.en,
        fa: score.fa,
        delta,
        dominant,
        evidence: score.evidence
    };
}

function getFsaContextCandidate(
    token,
    sourceLanguage
) {
    if (sourceLanguage === 'fa') {
        return {
            candidate: convertPersianKeysToEnglish(
                token
            ),
            targetLanguage: 'en',
            direction: 'faToEn'
        };
    }

    if (sourceLanguage === 'en') {
        return {
            candidate: convertEnglishKeysToPersian(
                token
            ),
            targetLanguage: 'fa',
            direction: 'enToFa'
        };
    }

    return null;
}

function isFsaContextCandidatePlausible(
    statistical,
    contextPrior,
    sourceLanguage,
    targetLanguage
) {
    if (!statistical) return false;

    const targetScore =
        Number(contextPrior[targetLanguage]) || 0;
    const sourceScore =
        Number(contextPrior[sourceLanguage]) || 0;
    const contextDelta = targetScore - sourceScore;

    if (contextDelta < 2.25) {
        return false;
    }

    const target = statistical.target;

    if (!target || target.normalized.length < 2) {
        return false;
    }

    if (
        target.coverage < 0.60 &&
        target.z < -1.50
    ) {
        return false;
    }

    // Context may relax the statistical threshold, but never without
    // a plausible target-language shape. This prevents page language
    // alone from becoming a blind conversion switch.
    const relaxation = Math.min(
        2.75,
        0.45 * contextDelta
    );

    return (
        statistical.margin >=
            statistical.threshold - relaxation ||
        (
            contextDelta >= 4.5 &&
            target.coverage >= 0.80 &&
            target.z >= -1.25
        )
    );
}

function analyzeKeyboardLayoutTokenWithContext(
    token,
    context = {}
) {
    const value = String(token ?? '');
    const base =
        typeof analyzeKeyboardLayoutToken ===
            'function'
            ? analyzeKeyboardLayoutToken(value)
            : {
                changed: false,
                original: value,
                corrected: value,
                confidence: 0,
                reason: 'layout-engine-unavailable',
                evidence: []
            };

    if (base.changed) {
        return {
            ...base,
            contextApplied: false,
            contextEvidence: []
        };
    }

    const sourceLanguage =
        getFsaTokenScript(value);

    if (!sourceLanguage) {
        return {
            ...base,
            contextApplied: false,
            contextEvidence: []
        };
    }

    const prior = getFsaContextLanguagePrior(
        context,
        sourceLanguage
    );

    if (prior.dominant === sourceLanguage) {
        return {
            ...base,
            contextApplied: false,
            contextEvidence: [
                ...prior.evidence,
                'context-source-language-protection'
            ]
        };
    }

    const candidateInfo =
        getFsaContextCandidate(
            value,
            sourceLanguage
        );

    if (
        !candidateInfo ||
        candidateInfo.candidate === value
    ) {
        return {
            ...base,
            contextApplied: false,
            contextEvidence: prior.evidence
        };
    }

    const statistical =
        typeof compareFsaLanguageCandidates ===
            'function'
            ? compareFsaLanguageCandidates(
                value,
                sourceLanguage,
                candidateInfo.candidate,
                candidateInfo.targetLanguage,
                candidateInfo.direction,
                'suggest'
            )
            : null;

    if (
        prior.dominant ===
            candidateInfo.targetLanguage &&
        isFsaContextCandidatePlausible(
            statistical,
            prior,
            sourceLanguage,
            candidateInfo.targetLanguage
        )
    ) {
        const targetScore =
            prior[
                candidateInfo.targetLanguage
            ];
        const sourceScore =
            prior[sourceLanguage];
        const contextDelta =
            targetScore - sourceScore;

        return {
            changed: true,
            direction:
                sourceLanguage === 'fa'
                    ? 'persian-keys-to-english'
                    : 'english-keys-to-persian',
            confidence: Math.min(
                0.975,
                0.90 +
                    Math.max(
                        0,
                        contextDelta - 2.25
                    ) * 0.015
            ),
            original: value,
            corrected: candidateInfo.candidate,
            reason: 'context-intent',
            evidence: [
                ...(base.evidence || []),
                'context-language-override',
                'statistical-target-plausibility'
            ],
            contextApplied: true,
            contextEvidence: prior.evidence,
            contextPrior: prior,
            statistical
        };
    }

    return {
        ...base,
        contextApplied: false,
        contextEvidence: prior.evidence,
        contextPrior: prior,
        statistical
    };
}

function correctKeyboardLayoutTextWithContext(
    text,
    context = {}
) {
    const value = String(text ?? '');

    if (/\s/u.test(value)) {
        return typeof correctKeyboardLayoutText ===
            'function'
            ? correctKeyboardLayoutText(value)
            : value;
    }

    const analysis =
        analyzeKeyboardLayoutTokenWithContext(
            value,
            context
        );

    return analysis.changed
        ? analysis.corrected
        : value;
}
