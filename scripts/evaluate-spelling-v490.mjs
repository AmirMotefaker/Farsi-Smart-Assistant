import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const directory =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const root =
  path.resolve(
    directory,
    '..'
  );

const outputIndex =
  process.argv.indexOf(
    '--output'
  );

const outputPath =
  outputIndex >= 0
    ? process.argv[
        outputIndex + 1
      ]
    : '';

const sampleIndex =
  process.argv.indexOf(
    '--samples'
  );

const samples =
  Math.max(
    100,
    Math.min(
      5000,
      Number(
        sampleIndex >= 0
          ? process.argv[
              sampleIndex + 1
            ]
          : 1000
      ) || 1000
    )
  );

const MODEL_SALT =
  'v4.9.0-spelling-m1';

function fnv1a(value) {
  let hash =
    0x811c9dc5;

  for (const char of value) {
    hash ^=
      char.codePointAt(0);

    hash =
      Math.imul(
        hash,
        0x01000193
      );
  }

  return hash >>> 0;
}

function normalizeEnglish(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/gu, '');
}

function normalizePersian(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replaceAll('ي', 'ی')
    .replaceAll('ى', 'ی')
    .replaceAll('ك', 'ک')
    .replaceAll('\u200c', '')
    .replace(/[^\u0621-\u06CC]/gu, '');
}

function parseWords(
  dictionary,
  language
) {
  const normalize =
    language === 'en'
      ? normalizeEnglish
      : normalizePersian;

  const set =
    new Set();

  const lines =
    dictionary.dic
      .toString('utf8')
      .split(/\r?\n/u);

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const word =
      normalize(
        lines[index]
          .trim()
          .split('/')[0]
      );

    if (
      word.length < 4 ||
      word.length > 12
    ) {
      continue;
    }

    if (
      language === 'en' &&
      /^[a-z]+$/u.test(word)
    ) {
      set.add(word);
    }

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(
        word
      )
    ) {
      set.add(word);
    }
  }

  return set;
}

function deterministicWords(
  set,
  language,
  limit
) {
  return [...set]
    .sort((a, b) => {
      const first =
        fnv1a(
          `${MODEL_SALT}:${language}:${a}`
        );

      const second =
        fnv1a(
          `${MODEL_SALT}:${language}:${b}`
        );

      if (first !== second) {
        return first - second;
      }

      return a < b
        ? -1
        : a > b
          ? 1
          : 0;
    })
    .slice(
      0,
      Math.min(
        limit,
        set.size
      )
    );
}

function mutationAlphabet(
  language
) {
  return language === 'en'
    ? 'abcdefghijklmnopqrstuvwxyz'
    : 'آابتپثجچحخدذرزژسشصضطظعغفقکگلمنوهی';
}

function mutateWord(
  word,
  dictionary,
  language,
  salt
) {
  const alphabet =
    mutationAlphabet(language);

  const seed =
    fnv1a(
      `${MODEL_SALT}:${language}:${salt}:${word}`
    );

  const operations =
    [
      'transpose',
      'delete',
      'substitute',
      'insert'
    ];

  for (
    let attempt = 0;
    attempt < 64;
    attempt += 1
  ) {
    const operation =
      operations[
        (
          seed +
          attempt
        ) %
        operations.length
      ];

    let candidate =
      word;

    if (
      operation === 'transpose' &&
      word.length >= 4
    ) {
      const index =
        (
          seed +
          attempt * 7
        ) %
        (word.length - 1);

      const chars =
        [...word];

      if (
        chars[index] ===
        chars[index + 1]
      ) {
        continue;
      }

      [
        chars[index],
        chars[index + 1]
      ] = [
        chars[index + 1],
        chars[index]
      ];

      candidate =
        chars.join('');
    } else if (
      operation === 'delete' &&
      word.length >= 5
    ) {
      const index =
        (
          seed +
          attempt * 11
        ) %
        word.length;

      candidate =
        word.slice(0, index) +
        word.slice(index + 1);
    } else if (
      operation === 'substitute'
    ) {
      const index =
        (
          seed +
          attempt * 13
        ) %
        word.length;

      let replacement =
        alphabet[
          (
            seed +
            attempt * 17
          ) %
          alphabet.length
        ];

      if (
        replacement === word[index]
      ) {
        replacement =
          alphabet[
            (
              alphabet.indexOf(
                replacement
              ) +
              1
            ) %
            alphabet.length
          ];
      }

      candidate =
        word.slice(0, index) +
        replacement +
        word.slice(index + 1);
    } else if (
      operation === 'insert'
    ) {
      const index =
        (
          seed +
          attempt * 19
        ) %
        (word.length + 1);

      const inserted =
        alphabet[
          (
            seed +
            attempt * 23
          ) %
          alphabet.length
        ];

      candidate =
        word.slice(0, index) +
        inserted +
        word.slice(index);
    } else {
      continue;
    }

    if (
      candidate !== word &&
      candidate.length >= 3 &&
      !dictionary.has(candidate)
    ) {
      return {
        source: candidate,
        expected: word,
        operation
      };
    }
  }

  return null;
}

const runtimeFiles = [
  'language_profiles.js',
  'context_intent.js',
  'lexical_priors.js',
  'spell_correction.js'
];

const runtimeSources = [];

for (const file of runtimeFiles) {
  runtimeSources.push(
    await fs.readFile(
      path.join(root, file),
      'utf8'
    )
  );
}

const context =
  vm.createContext({
    console
  });

vm.runInContext(
  `${runtimeSources.join('\n')}
;globalThis.__fsaSpellEval = {
  analyzeFsaSpellingIntent,
  generateFsaSpellCandidates,
  isFsaKnownEnglishLexeme,
  isFsaKnownPersianLexeme
};`,
  context
);

const engine =
  context.__fsaSpellEval;

const englishSet =
  parseWords(
    englishDictionary,
    'en'
  );

const persianSet =
  parseWords(
    persianDictionary,
    'fa'
  );

const englishWords =
  deterministicWords(
    englishSet,
    'en',
    samples * 4
  );

const persianWords =
  deterministicWords(
    persianSet,
    'fa',
    samples * 4
  );

const contexts = {
  en: Object.freeze({
    beforeText:
      'This is an English typing test ',
    afterText:
      ' in the browser',
    fieldLanguage: 'en',
    pageLanguage: 'en',
    direction: 'ltr'
  }),
  fa: Object.freeze({
    beforeText:
      'این یک آزمایش تایپ فارسی است ',
    afterText:
      ' و ادامه متن فارسی است',
    fieldLanguage: 'fa',
    pageLanguage: 'fa',
    direction: 'rtl'
  })
};

function evaluateLanguage(
  language,
  words,
  dictionary
) {
  const failures = [];
  let total = 0;
  let exactPass = 0;
  let candidatePass = 0;
  let skipped = 0;

  for (const target of words) {
    if (total >= samples) {
      break;
    }

    const mutation =
      mutateWord(
        target,
        dictionary,
        language,
        total
      );

    if (!mutation) {
      skipped += 1;
      continue;
    }

    const analysis =
      engine.analyzeFsaSpellingIntent(
        mutation.source,
        contexts[language]
      );

    const actual =
      language === 'en'
        ? normalizeEnglish(
            analysis.corrected
          )
        : normalizePersian(
            analysis.corrected
          );

    const expected =
      language === 'en'
        ? normalizeEnglish(
            mutation.expected
          )
        : normalizePersian(
            mutation.expected
          );

    const normalizedCandidates =
      (
        analysis.candidates ||
        []
      )
        .map(
          (candidate) =>
            language === 'en'
              ? normalizeEnglish(
                  candidate.text
                )
              : normalizePersian(
                  candidate.text
                )
        );

    const candidateFound =
      normalizedCandidates
        .includes(expected);

    const exactOk =
      analysis.changed === true &&
      actual === expected;

    total += 1;

    if (candidateFound) {
      candidatePass += 1;
    }

    if (exactOk) {
      exactPass += 1;
    } else if (
      failures.length < 50
    ) {
      failures.push({
        ...mutation,
        actual:
          analysis.corrected,
        candidateFound,
        reason:
          analysis.reason,
        confidence:
          analysis.confidence,
        candidateCount:
          analysis.candidates
            ?.length || 0,
        topCandidates:
          (
            analysis.candidates ||
            []
          )
            .slice(0, 5)
            .map(
              (candidate) => ({
                text:
                  candidate.text,
                operation:
                  candidate.operation,
                score:
                  candidate.score
              })
            )
      });
    }
  }

  return {
    total,
    exactPass,
    exactFail:
      total - exactPass,
    exactRate:
      total > 0
        ? exactPass / total
        : 0,
    candidatePass,
    candidateFail:
      total - candidatePass,
    candidateRecall:
      total > 0
        ? candidatePass / total
        : 0,
    skipped,
    failures
  };
}


function evaluateProtection(
  language,
  words
) {
  const failures = [];
  let total = 0;
  let pass = 0;

  for (
    const word
    of words.slice(
      samples,
      samples * 3
    )
  ) {
    if (total >= samples) {
      break;
    }

    const analysis =
      engine.analyzeFsaSpellingIntent(
        word,
        contexts[language]
      );

    const ok =
      analysis.changed === false;

    total += 1;

    if (ok) {
      pass += 1;
    } else if (
      failures.length < 25
    ) {
      failures.push({
        source: word,
        actual:
          analysis.corrected,
        reason:
          analysis.reason
      });
    }
  }

  return {
    total,
    pass,
    fail:
      total - pass,
    rate:
      total > 0
        ? pass / total
        : 0,
    failures
  };
}

const englishTypo =
  evaluateLanguage(
    'en',
    englishWords,
    englishSet
  );

const persianTypo =
  evaluateLanguage(
    'fa',
    persianWords,
    persianSet
  );

const englishProtection =
  evaluateProtection(
    'en',
    englishWords
  );

const persianProtection =
  evaluateProtection(
    'fa',
    persianWords
  );

const fixedCases = [
  {
    language: 'en',
    source: 'tehcnology',
    expected: 'technology'
  },
  {
    language: 'en',
    source: 'recieve',
    expected: 'receive'
  },
  {
    language: 'en',
    source: 'adress',
    expected: 'address'
  },
  {
    language: 'en',
    source: 'pyhton',
    expected: 'python'
  },
  {
    language: 'en',
    source: 'javscript',
    expected: 'javascript'
  },
  {
    language: 'en',
    source: 'databse',
    expected: 'database'
  },
  {
    language: 'fa',
    source: 'دانشکاه',
    expected: 'دانشگاه'
  },
  {
    language: 'fa',
    source: 'برنانه',
    expected: 'برنامه'
  },
  {
    language: 'fa',
    source: 'اینترننت',
    expected: 'اینترنت'
  },
  {
    language: 'fa',
    source: 'مرورگرر',
    expected: 'مرورگر'
  },
  {
    language: 'fa',
    source: 'موسقی',
    expected: 'موسیقی'
  }
];

const fixedResults =
  fixedCases.map(
    (item) => {
      const analysis =
        engine
          .analyzeFsaSpellingIntent(
            item.source,
            contexts[
              item.language
            ]
          );

      return {
        ...item,
        actual:
          analysis.corrected,
        pass:
          (
            item.language === 'en'
              ? normalizeEnglish(
                  analysis.corrected
                )
              : normalizePersian(
                  analysis.corrected
                )
          ) ===
          (
            item.language === 'en'
              ? normalizeEnglish(
                  item.expected
                )
              : normalizePersian(
                  item.expected
                )
          ),
        reason:
          analysis.reason,
        confidence:
          analysis.confidence
      };
    }
  );

const fixedPass =
  fixedResults.filter(
    (item) => item.pass
  ).length;

const fixedRate =
  fixedResults.length > 0
    ? fixedPass /
      fixedResults.length
    : 0;

const gates = {
  englishCandidateRecall: {
    rate:
      englishTypo.candidateRecall,
    threshold: 0.99,
    pass:
      englishTypo.candidateRecall >= 0.99
  },
  persianCandidateRecall: {
    rate:
      persianTypo.candidateRecall,
    threshold: 0.99,
    pass:
      persianTypo.candidateRecall >= 0.99
  },
  englishExactTop1: {
    rate:
      englishTypo.exactRate,
    threshold: 0.70,
    pass:
      englishTypo.exactRate >= 0.70
  },
  persianExactTop1: {
    rate:
      persianTypo.exactRate,
    threshold: 0.70,
    pass:
      persianTypo.exactRate >= 0.70
  },
  englishProtection: {
    rate:
      englishProtection.rate,
    threshold: 1,
    pass:
      englishProtection.rate === 1
  },
  persianProtection: {
    rate:
      persianProtection.rate,
    threshold: 1,
    pass:
      persianProtection.rate === 1
  },
  fixedCases: {
    rate:
      fixedRate,
    threshold: 0.90,
    pass:
      fixedRate >= 0.90
  }
};

const finalTargets = {
  englishTypoExact:
    englishTypo.exactRate >= 0.97,
  persianTypoExact:
    persianTypo.exactRate >= 0.97,
  englishProtection:
    englishProtection.rate >= 0.9995,
  persianProtection:
    persianProtection.rate >= 0.9995
};

const decision =
  Object.values(gates)
    .every(
      (gate) => gate.pass
    )
    ? 'M1_PASS'
    : 'M1_FAIL';

const report = {
  schemaVersion: 1,
  benchmark:
    'FSA v4.9.0 single-edit bilingual spelling foundation',
  samplesPerLanguage:
    samples,
  dictionaryPopulation: {
    english:
      englishSet.size,
    persian:
      persianSet.size
  },
  metrics: {
    englishTypo,
    persianTypo,
    englishProtection,
    persianProtection,
    fixedCases: {
      total:
        fixedResults.length,
      pass:
        fixedPass,
      fail:
        fixedResults.length -
        fixedPass,
      rate:
        fixedRate,
      results:
        fixedResults
    }
  },
  gates,
  finalTargets,
  decision,
  note:
    'M1_PASS proves candidate-generation and initial ranking foundations only; it is not the final v4.9.0 Store-unblock gate.'
};

const serialized =
  `${JSON.stringify(
    report,
    null,
    2
  )}\n`;

if (outputPath) {
  await fs.mkdir(
    path.dirname(
      path.resolve(
        outputPath
      )
    ),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    path.resolve(
      outputPath
    ),
    serialized,
    'utf8'
  );
}

process.stdout.write(
  serialized
);

if (decision !== 'M1_PASS') {
  process.exitCode = 2;
}
