import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const root =
  path.resolve(
    testDirectory,
    '..'
  );

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'normalization_intent.js',
  'lexical_priors.js',
  'finglish_source_model.js',
  'transliteration_intent.js',
  'spell_correction.js',
  'universal_correction.js',
  'logic.js',
  'smart_auto_intent.js'
];

const sources = [];

for (const file of runtimeFiles) {
  sources.push(
    await fs.readFile(
      path.join(
        root,
        file
      ),
      'utf8'
    )
  );
}

const context =
  vm.createContext({
    console
  });

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__v490 = {
  smart_farsi_converter,
  analyzeFsaSmartAutoIntent,
  analyzeFsaSpellingIntent,
  analyzeFsaUniversalCorrection,
  analyzeFsaFinglishIntent,
  isFsaKnownEnglishLexeme,
  isFsaKnownPersianLexeme
};`,
  context
);

const engine =
  context.__v490;

const enContext =
  Object.freeze({
    beforeText:
      'This is an English typing test ',
    afterText:
      ' in the browser',
    fieldLanguage: 'en',
    pageLanguage: 'en',
    direction: 'ltr',
    browserLanguage: 'en-US'
  });

const faContext =
  Object.freeze({
    beforeText:
      'این یک آزمایش تایپ فارسی است ',
    afterText:
      ' و ادامه متن فارسی است',
    fieldLanguage: 'fa',
    pageLanguage: 'fa',
    direction: 'rtl',
    browserLanguage: 'fa-IR'
  });

test(
  'v4.9 English single-edit spelling fixes representative real typos',
  () => {
    const cases = [
      ['tehcnology', 'technology'],
      ['recieve', 'receive'],
      ['adress', 'address'],
      ['pyhton', 'python'],
      ['javscript', 'javascript'],
      ['databse', 'database']
    ];

    for (
      const [source, expected]
      of cases
    ) {
      assert.equal(
        engine.smart_farsi_converter(
          source,
          {},
          enContext
        ),
        expected,
        source
      );
    }
  }
);

test(
  'v4.9 Persian single-edit spelling fixes representative real typos',
  () => {
    const cases = [
      ['دانشکاه', 'دانشگاه'],
      ['برنانه', 'برنامه'],
      ['اینترننت', 'اینترنت'],
      ['مرورگرر', 'مرورگر'],
      ['موسقی', 'موسیقی']
    ];

    for (
      const [source, expected]
      of cases
    ) {
      assert.equal(
        engine.smart_farsi_converter(
          source,
          {},
          faContext
        ),
        expected,
        source
      );
    }
  }
);

test(
  'v4.9 repeated-character insertion typos prefer deletion of the repeated neighbor',
  () => {
    const analysis =
      engine.analyzeFsaSpellingIntent(
        'اینترننت',
        faContext
      );

    assert.equal(
      analysis.corrected,
      'اینترنت'
    );

    assert.equal(
      analysis.bestCandidate
        ?.operation,
      'delete-extra'
    );

    assert.equal(
      analysis.bestCandidate
        ?.metadata
        ?.repeatedNeighbor,
      true
    );
  }
);

test(
  'v4.9 curated Finglish priors remain lexical and beam-backed',
  () => {
    const cases = [
      ['salaam', 'سلام'],
      ['khoobi', 'خوبی'],
      ['barname', 'برنامه'],
      ['kharid', 'خرید'],
      ['khanevade', 'خانواده']
    ];

    const failures = [];

    for (
      const [source, expected]
      of cases
    ) {
      const analysis =
        engine.analyzeFsaUniversalCorrection(
          source,
          faContext
        );

      const evidence =
        analysis.evidence || [];

      if (
        analysis.corrected !== expected ||
        !evidence.includes(
          'trusted-word-map-finglish-prior'
        ) ||
        !evidence.includes(
          'trusted-prior-is-generated-beam-candidate'
        )
      ) {
        failures.push({
          source,
          expected,
          actual:
            analysis.corrected,
          kind:
            analysis.kind,
          evidence
        });
      }
    }

    assert.deepEqual(
      failures,
      []
    );
  }
);

test(
  'v4.9 trusted legacy Finglish beats same-script spelling without context',
  () => {
    const analysis =
      engine.analyzeFsaUniversalCorrection(
        'salam',
        null
      );

    assert.equal(
      analysis.corrected,
      'سلام'
    );

    assert.equal(
      analysis.kind,
      'finglish'
    );

    assert.ok(
      analysis.evidence.includes(
        'trusted-word-map-finglish-prior'
      )
    );

    assert.ok(
      analysis.evidence.includes(
        'trusted-prior-standalone-hypothesis'
      )
    );

    assert.equal(
      engine.smart_farsi_converter(
        'salam',
        {},
        null
      ),
      'سلام'
    );
  }
);

test(
  'v4.9 valid bilingual lexical sources are protected before destructive hypotheses',
  () => {
    for (
      const word
      of [
        'flyby',
        'offhand',
        'server',
        'google',
        'technology'
      ]
    ) {
      assert.equal(
        engine.smart_farsi_converter(
          word,
          {},
          enContext
        ),
        word,
        word
      );
    }

    for (
      const word
      of [
        'مآخذ',
        'بقوه',
        'لوثشدن',
        'خانه',
        'برنامه',
        'دانشگاه'
      ]
    ) {
      assert.equal(
        engine.smart_farsi_converter(
          word,
          {},
          faContext
        ),
        word,
        word
      );
    }
  }
);

test(
  'v4.9 lexical Finglish reranking fixes high-value user words',
  () => {
    const cases = [
      ['salaam', 'سلام'],
      ['chetori', 'چطوری'],
      ['khoobi', 'خوبی'],
      ['daneshgah', 'دانشگاه'],
      ['barname', 'برنامه'],
      ['kharid', 'خرید'],
      ['khanevade', 'خانواده']
    ];

    const failures = [];

    for (
      const [source, expected]
      of cases
    ) {
      const actual =
        engine.smart_farsi_converter(
          source,
          {},
          faContext
        );

      if (actual !== expected) {
        failures.push({
          source,
          expected,
          actual
        });
      }
    }

    assert.deepEqual(
      failures,
      []
    );
  }
);

test(
  'v4.9 lexical arbitration prevents Finglish from preempting a known Persian layout target',
  () => {
    assert.equal(
      engine.smart_farsi_converter(
        'ofvkhli',
        {},
        faContext
      ),
      'خبرنامه'
    );

    const analysis =
      engine.analyzeFsaUniversalCorrection(
        'ofvkhli',
        faContext
      );

    assert.equal(
      analysis.changed,
      true
    );

    assert.equal(
      analysis.kind,
      'layout'
    );

    assert.equal(
      analysis.corrected,
      'خبرنامه'
    );
  }
);

test(
  'v4.9 existing high-confidence bidirectional layout behavior survives',
  () => {
    assert.equal(
      engine.smart_farsi_converter(
        'sghl',
        {},
        faContext
      ),
      'سلام'
    );

    assert.equal(
      engine.smart_farsi_converter(
        'هقشد',
        {},
        enContext
      ),
      'iran'
    );
  }
);

test(
  'v4.9 spelling is suggestion-only in Smart Auto M1',
  () => {
    const english =
      engine.analyzeFsaSmartAutoIntent(
        'tehcnology',
        enContext
      );

    assert.equal(
      english.changed,
      true
    );

    assert.equal(
      english.corrected,
      'technology'
    );

    assert.equal(
      english.kind,
      'spelling'
    );

    assert.equal(
      english.autoEligible,
      false
    );

    const persian =
      engine.analyzeFsaSmartAutoIntent(
        'دانشکاه',
        faContext
      );

    assert.equal(
      persian.changed,
      true
    );

    assert.equal(
      persian.corrected,
      'دانشگاه'
    );

    assert.equal(
      persian.kind,
      'spelling'
    );

    assert.equal(
      persian.autoEligible,
      false
    );
  }
);

test(
  'v4.9 valid words do not surface Smart Auto correction suggestions',
  () => {
    for (
      const [word, intentContext]
      of [
        ['flyby', enContext],
        ['offhand', enContext],
        ['مآخذ', faContext],
        ['بقوه', faContext]
      ]
    ) {
      const analysis =
        engine.analyzeFsaSmartAutoIntent(
          word,
          intentContext
        );

      assert.equal(
        analysis.changed,
        false,
        word
      );
    }
  }
);

test(
  'v4.9 deterministic Persian Unicode normalization remains first-class',
  () => {
    assert.equal(
      engine.smart_farsi_converter(
        'علي',
        {},
        faContext
      ),
      'علی'
    );

    assert.equal(
      engine.smart_farsi_converter(
        'كاربر',
        {},
        faContext
      ),
      'کاربر'
    );
  }
);
