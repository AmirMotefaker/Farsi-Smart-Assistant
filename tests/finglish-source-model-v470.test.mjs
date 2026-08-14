import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const directory =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const root =
  path.resolve(directory,'..');

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js',
  'finglish_source_model.js',
  'smart_auto_intent.js'
];

const sources = [];

for (const file of runtimeFiles) {
  sources.push(
    await fs.readFile(
      path.join(root,file),
      'utf8'
    )
  );
}

const context =
  vm.createContext({console});

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__sourceIntent = {
  scoreFsaFinglishSourceIntent,
  analyzeFsaSmartAutoIntent
};`,
  context
);

const engine =
  context.__sourceIntent;

const persianContext = {
  beforeText:'امروز ',
  afterText:' شدید می‌بارد',
  fieldLanguage:'fa',
  pageLanguage:'fa',
  direction:'rtl'
};

test('v4.7 source-intent model keeps low-source-confidence Finglish as suggestion while preserving correction',() => {
  const source =
    engine.scoreFsaFinglishSourceIntent(
      'baran'
    );

  assert.equal(
    source.preferred,
    false
  );

  const auto =
    engine.analyzeFsaSmartAutoIntent(
      'baran',
      persianContext
    );

  assert.equal(
    auto.corrected,
    'باران'
  );

  assert.equal(
    auto.changed,
    true
  );

  assert.equal(
    auto.kind,
    'finglish'
  );

  assert.equal(
    auto.autoEligible,
    false
  );

  assert.equal(
    auto.sourceIntent?.preferred,
    false
  );
});

test('v4.7 source-intent model treats ordinary English shape conservatively',() => {
  const source =
    engine.scoreFsaFinglishSourceIntent(
      'server'
    );

  assert.equal(
    source.preferred,
    false
  );
});

test('v4.7 generated source model contains numeric weights rather than word list',async() => {
  const source =
    await fs.readFile(
      path.join(
        root,
        'finglish_source_model.js'
      ),
      'utf8'
    );

  assert.match(
    source,
    /FSA_FINGLISH_SOURCE_WEIGHTS/u
  );

  for (const literal of [
    '"baran"',
    '"server"',
    '"sandwich"'
  ]) {
    assert.equal(
      source.includes(literal),
      false
    );
  }
});
