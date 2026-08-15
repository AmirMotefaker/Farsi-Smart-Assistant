const FSA_SPELL_ENGINE_VERSION =
    '4.9.0-single-edit-spelling-v1.1';

const FSA_SPELL_CACHE_LIMIT =
    512;

const FSA_SPELL_CACHE =
    Object.freeze({
        en: new Map(),
        fa: new Map()
    });

const FSA_ENGLISH_KEYBOARD_NEIGHBORS =
    Object.freeze({
        q: 'wa',
        w: 'qesa',
        e: 'wrsd',
        r: 'etdf',
        t: 'ryfg',
        y: 'tugh',
        u: 'yihj',
        i: 'uojk',
        o: 'ipkl',
        p: 'ol',
        a: 'qwsz',
        s: 'awedxz',
        d: 'serfcx',
        f: 'drtgvc',
        g: 'ftyhbv',
        h: 'gyujnb',
        j: 'huikmn',
        k: 'jiolm',
        l: 'kop',
        z: 'asx',
        x: 'zsdc',
        c: 'xdfv',
        v: 'cfgb',
        b: 'vghn',
        n: 'bhjm',
        m: 'njk'
    });

function getFsaSpellLanguage(value) {
    const text =
        String(value ?? '');

    if (/^[A-Za-z]+$/u.test(text)) {
        return 'en';
    }

    if (
        /^[\u0621-\u06CC\u200c]+$/u.test(
            text
        )
    ) {
        return 'fa';
    }

    return '';
}

function normalizeFsaSpellToken(
    value,
    language
) {
    if (
        language === 'en' &&
        typeof normalizeFsaEnglishLexeme ===
            'function'
    ) {
        return normalizeFsaEnglishLexeme(
            value
        );
    }

    if (
        language === 'fa' &&
        typeof normalizeFsaPersianLexeme ===
            'function'
    ) {
        return normalizeFsaPersianLexeme(
            value
        );
    }

    return String(value ?? '');
}

function isFsaKnownSpellLexeme(
    value,
    language
) {
    if (language === 'en') {
        return (
            typeof isFsaKnownEnglishLexeme ===
                'function' &&
            isFsaKnownEnglishLexeme(
                value
            )
        );
    }

    if (language === 'fa') {
        return (
            typeof isFsaKnownPersianLexeme ===
                'function' &&
            isFsaKnownPersianLexeme(
                value
            )
        );
    }

    return false;
}

function getFsaSpellAlphabet(language) {
    if (
        language === 'en' &&
        typeof FSA_ENGLISH_LEXICAL_ALPHABET !==
            'undefined'
    ) {
        return FSA_ENGLISH_LEXICAL_ALPHABET;
    }

    if (
        language === 'fa' &&
        typeof FSA_PERSIAN_LEXICAL_ALPHABET !==
            'undefined'
    ) {
        return FSA_PERSIAN_LEXICAL_ALPHABET;
    }

    return language === 'en'
        ? 'abcdefghijklmnopqrstuvwxyz'
        : 'آابتپثجچحخدذرزژسشصضطظعغفقکگلمنوهی';
}

function getFsaSpellShapeScore(
    candidate,
    language
) {
    if (
        language === 'en' &&
        typeof scoreEnglishWordShape ===
            'function'
    ) {
        return Number(
            scoreEnglishWordShape(candidate)
                ?.score
        ) || 0;
    }

    if (
        language === 'fa' &&
        typeof scorePersianWordShape ===
            'function'
    ) {
        return Number(
            scorePersianWordShape(candidate)
                ?.score
        ) || 0;
    }

    return 0;
}

function isFsaEnglishKeyboardNeighbor(
    from,
    to
) {
    const neighbors =
        FSA_ENGLISH_KEYBOARD_NEIGHBORS[
            String(from || '').toLowerCase()
        ] || '';

    return neighbors.includes(
        String(to || '').toLowerCase()
    );
}

function getFsaSpellOperationScore(
    operation,
    metadata
) {
    if (operation === 'transpose') {
        return 1.30;
    }

    if (operation === 'insert-missing') {
        return 1.15;
    }

    if (operation === 'substitute') {
        return metadata?.keyboardNeighbor
            ? 1.14
            : 1.05;
    }

    if (operation === 'delete-extra') {
        return metadata?.repeatedNeighbor
            ? 1.48
            : 1.00;
    }

    return 0.90;
}

function getFsaSpellCandidateScore(
    source,
    candidate,
    language,
    operation,
    metadata
) {
    const operationScore =
        getFsaSpellOperationScore(
            operation,
            metadata
        );

    const shapeScore =
        getFsaSpellShapeScore(
            candidate,
            language
        );

    let edgeAffinity = 0;

    if (
        source[0] &&
        source[0] === candidate[0]
    ) {
        edgeAffinity += 0.035;
    }

    if (
        source[source.length - 1] &&
        source[source.length - 1] ===
            candidate[
                candidate.length - 1
            ]
    ) {
        edgeAffinity += 0.035;
    }

    return (
        operationScore +
        Math.min(
            0.30,
            Math.max(0, shapeScore) *
                0.30
        ) +
        edgeAffinity
    );
}

function addFsaSpellCandidate(
    target,
    source,
    candidate,
    language,
    operation,
    metadata = {}
) {
    const normalized =
        normalizeFsaSpellToken(
            candidate,
            language
        );

    if (
        !normalized ||
        normalized === source ||
        normalized.length < 2 ||
        normalized.length > 32 ||
        !isFsaKnownSpellLexeme(
            normalized,
            language
        )
    ) {
        return;
    }

    const score =
        getFsaSpellCandidateScore(
            source,
            normalized,
            language,
            operation,
            metadata
        );

    const previous =
        target.get(normalized);

    if (
        !previous ||
        score > previous.score
    ) {
        target.set(
            normalized,
            {
                text: normalized,
                language,
                operation,
                score,
                metadata
            }
        );
    }
}

function cacheFsaSpellCandidates(
    language,
    source,
    candidates
) {
    const cache =
        FSA_SPELL_CACHE[language];

    if (!cache) return;

    if (
        cache.size >=
        FSA_SPELL_CACHE_LIMIT
    ) {
        const oldest =
            cache.keys().next().value;

        if (oldest !== undefined) {
            cache.delete(oldest);
        }
    }

    cache.set(
        source,
        candidates
    );
}

function generateFsaSpellCandidates(
    input,
    options = {}
) {
    const language =
        options.language ||
        getFsaSpellLanguage(input);

    if (!language) {
        return [];
    }

    const source =
        normalizeFsaSpellToken(
            input,
            language
        );

    if (
        source.length < 3 ||
        source.length > 24
    ) {
        return [];
    }

    const cache =
        FSA_SPELL_CACHE[language];

    if (
        cache &&
        cache.has(source)
    ) {
        return cache.get(source);
    }

    if (
        isFsaKnownSpellLexeme(
            source,
            language
        )
    ) {
        cacheFsaSpellCandidates(
            language,
            source,
            []
        );
        return [];
    }

    const candidates =
        new Map();

    for (
        let index = 0;
        index < source.length;
        index += 1
    ) {
        addFsaSpellCandidate(
            candidates,
            source,
            source.slice(0, index) +
                source.slice(index + 1),
            language,
            'delete-extra',
            {
                index,
                removed: source[index],
                repeatedNeighbor:
                    (
                        index > 0 &&
                        source[index] ===
                            source[index - 1]
                    ) ||
                    (
                        index + 1 <
                            source.length &&
                        source[index] ===
                            source[index + 1]
                    )
            }
        );
    }

    for (
        let index = 0;
        index < source.length - 1;
        index += 1
    ) {
        if (
            source[index] ===
            source[index + 1]
        ) {
            continue;
        }

        const chars =
            [...source];

        [
            chars[index],
            chars[index + 1]
        ] = [
            chars[index + 1],
            chars[index]
        ];

        addFsaSpellCandidate(
            candidates,
            source,
            chars.join(''),
            language,
            'transpose',
            {
                index
            }
        );
    }

    const alphabet =
        getFsaSpellAlphabet(
            language
        );

    for (
        let index = 0;
        index < source.length;
        index += 1
    ) {
        const original =
            source[index];

        for (const replacement of alphabet) {
            if (
                replacement === original
            ) {
                continue;
            }

            addFsaSpellCandidate(
                candidates,
                source,
                source.slice(0, index) +
                    replacement +
                    source.slice(index + 1),
                language,
                'substitute',
                {
                    index,
                    from: original,
                    to: replacement,
                    keyboardNeighbor:
                        language === 'en' &&
                        isFsaEnglishKeyboardNeighbor(
                            original,
                            replacement
                        )
                }
            );
        }
    }

    for (
        let index = 0;
        index <= source.length;
        index += 1
    ) {
        for (const inserted of alphabet) {
            addFsaSpellCandidate(
                candidates,
                source,
                source.slice(0, index) +
                    inserted +
                    source.slice(index),
                language,
                'insert-missing',
                {
                    index,
                    inserted
                }
            );
        }
    }

    const result =
        [...candidates.values()]
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                if (
                    a.operation !==
                    b.operation
                ) {
                    return a.operation <
                        b.operation
                        ? -1
                        : 1;
                }

                return a.text < b.text
                    ? -1
                    : a.text > b.text
                        ? 1
                        : 0;
            })
            .slice(
                0,
                Math.max(
                    1,
                    Math.min(
                        32,
                        Number(
                            options.limit
                        ) || 16
                    )
                )
            );

    cacheFsaSpellCandidates(
        language,
        source,
        result
    );

    return result;
}

function getFsaSpellContextPrior(
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

function analyzeFsaSpellingIntent(
    input,
    context = null
) {
    const original =
        String(input ?? '');

    const language =
        getFsaSpellLanguage(
            original
        );

    const unchanged = (
        reason,
        evidence = []
    ) => ({
        changed: false,
        autoEligible: false,
        original,
        corrected: original,
        confidence: 0,
        kind: 'none',
        reason,
        evidence,
        candidates: []
    });

    if (!language) {
        return unchanged(
            'not-single-script-spell-token'
        );
    }

    const source =
        normalizeFsaSpellToken(
            original,
            language
        );

    if (
        source.length < 3 ||
        source.length > 24
    ) {
        return unchanged(
            'spell-token-length-out-of-range'
        );
    }

    if (
        isFsaKnownSpellLexeme(
            source,
            language
        )
    ) {
        return unchanged(
            'known-valid-lexeme',
            [
                `${language}-lexical-source-protection`
            ]
        );
    }

    const prior =
        getFsaSpellContextPrior(
            context,
            language
        );

    const opposite =
        language === 'en'
            ? 'fa'
            : 'en';

    const oppositeDelta =
        (Number(prior[opposite]) || 0) -
        (Number(prior[language]) || 0);

    if (
        prior.dominant === opposite &&
        oppositeDelta >= 3.0
    ) {
        return unchanged(
            'opposite-language-context',
            [
                ...(prior.evidence || []),
                'spell-context-protection'
            ]
        );
    }

    const candidates =
        generateFsaSpellCandidates(
            source,
            {
                language,
                limit: 16
            }
        );

    if (candidates.length === 0) {
        return unchanged(
            'no-one-edit-lexical-candidate'
        );
    }

    const best =
        candidates[0];

    const second =
        candidates[1] || null;

    const margin =
        second
            ? best.score - second.score
            : Number.POSITIVE_INFINITY;

    const languageSupport =
        (Number(prior[language]) || 0) -
        (Number(prior[opposite]) || 0);

    const confidence =
        Math.min(
            0.985,
            0.90 +
            Math.max(
                0,
                Math.min(0.055, margin * 0.08)
            ) +
            Math.max(
                0,
                Math.min(
                    0.03,
                    languageSupport * 0.006
                )
            ) +
            (
                candidates.length === 1
                    ? 0.025
                    : 0
            )
        );

    return {
        changed: true,
        autoEligible: false,
        original,
        corrected: best.text,
        confidence,
        kind:
            language === 'en'
                ? 'english-spelling'
                : 'persian-spelling',
        language,
        reason: 'one-edit-lexical-candidate',
        evidence: [
            'collision-checked-lexical-membership',
            `spell-operation:${best.operation}`,
            ...(prior.evidence || []),
            'spelling-suggestion-only'
        ],
        bestCandidate: best,
        candidates,
        margin,
        contextPrior: prior
    };
}
