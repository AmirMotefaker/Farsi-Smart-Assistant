import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory =
  path.dirname(fileURLToPath(import.meta.url));
const root =
  path.resolve(testDirectory, '..');

const files = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js'
];

const sources = [];

for (const file of files) {
  sources.push(
    await fs.readFile(
      path.join(root, file),
      'utf8'
    )
  );
}

const context = vm.createContext({ console });

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__phaseC = {
  generateFsaFinglishCandidates,
  analyzeFsaFinglishIntent,
  correctFsaFinglishText,
  normalizePersianUnicodeText,
  normalizePersianTextGeneral,
  smart_farsi_converter
};`,
  context
);

const engine = context.__phaseC;

function candidateTexts(value) {
  return engine
    .generateFsaFinglishCandidates(
      value,
      {
        beamLimit: 384,
        limit: 192
      }
    )
    .map((item) => item.text);
}



test(
  'v4.9 flexible segmentation preserves both digraph and single-character boundary paths',
  () => {
    const candidates =
      engine
        .generateFsaFinglishCandidates(
          'sha',
          {
            beamLimit: 256,
            limit: 96
          }
        )
        .map(
          (item) =>
            item.text
        );

    assert.equal(
      candidates.includes('شا'),
      true
    );

    assert.equal(
      candidates.includes('سها'),
      true
    );
  }
);

test('v4.7 generalized beam generates باران without a word-map lookup', () => {
  assert.equal(
    candidateTexts('baran').includes('باران'),
    true
  );
});

test('v4.7 generalized beam generates خانه from khane', () => {
  assert.equal(
    candidateTexts('khane').includes('خانه'),
    true
  );
});

test('v4.7 generalized beam generates ماشین from mashin', () => {
  assert.equal(
    candidateTexts('mashin').includes('ماشین'),
    true
  );
});

test('v4.7 generalized beam generates زندگی from zendegi', () => {
  assert.equal(
    candidateTexts('zendegi').includes('زندگی'),
    true
  );
});

test('v4.7 Persian context selects generalized Finglish without WORD_MAP', () => {
  const analysis =
    engine.analyzeFsaFinglishIntent(
      'baran',
      {
        beforeText: 'امروز ',
        afterText: ' شدید می‌بارد',
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl'
      }
    );

  assert.equal(analysis.changed, true);
  assert.equal(analysis.corrected, 'باران');
});

test('v4.7 strong English sources stay protected', () => {
  for (const word of [
    'google',
    'server',
    'machine',
    'browser'
  ]) {
    assert.equal(
      engine.correctFsaFinglishText(
        word,
        {
          beforeText: 'open ',
          afterText: ' now',
          fieldLanguage: 'en'
        }
      ),
      word
    );
  }
});

test('v4.7 Unicode normalization converts Arabic Yeh and Kaf forms', () => {
  assert.equal(
    engine.normalizePersianUnicodeText(
      'علي و كيف'
    ),
    'علی و کیف'
  );
});

test('v4.7 generalized Persian spacing inserts ZWNJ for می prefix', () => {
  assert.equal(
    engine.normalizePersianTextGeneral(
      'می روم'
    ),
    'می‌روم'
  );
  assert.equal(
    engine.normalizePersianTextGeneral(
      'نمی دانم'
    ),
    'نمی‌دانم'
  );
});

test('v4.7 smart converter applies normalization before legacy dictionary fallback', () => {
  assert.equal(
    engine.smart_farsi_converter(
      'علي'
    ),
    'علی'
  );
});

test('v4.7 generalized module does not embed acceptance words as an exact dictionary', async () => {
  const source = await fs.readFile(
    path.join(
      root,
      'transliteration_intent.js'
    ),
    'utf8'
  );

  for (const literal of [
    'baran',
    'khane',
    'mashin',
    'zendegi'
  ]) {
    assert.equal(
      source.includes(`"${literal}"`),
      false
    );
    assert.equal(
      source.includes(`'${literal}'`),
      false
    );
  }
});
