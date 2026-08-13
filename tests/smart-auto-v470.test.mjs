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

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js',
  'lexical_priors.js',
  'finglish_source_model.js',
  'smart_auto_intent.js'
];

const sources = [];

for (const file of runtimeFiles) {
  sources.push(
    await fs.readFile(
      path.join(root, file),
      'utf8'
    )
  );
}

const inlineSource =
  await fs.readFile(
    path.join(root, 'inline_checker.js'),
    'utf8'
  );

const optionsHtml =
  await fs.readFile(
    path.join(root, 'options.html'),
    'utf8'
  );

const optionsJs =
  await fs.readFile(
    path.join(root, 'options.js'),
    'utf8'
  );

const context = vm.createContext({
  console
});

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__smartAuto = {
  analyzeFsaSmartAutoIntent
};`,
  context
);

const engine =
  context.__smartAuto;

test('v4.7 Smart Auto accepts high-confidence reverse layout iran', () => {
  const analysis =
    engine.analyzeFsaSmartAutoIntent(
      'هقشد'
    );

  assert.equal(
    analysis.corrected,
    'iran'
  );
  assert.equal(
    analysis.autoEligible,
    true
  );
});

test('v4.7 Smart Auto accepts high-confidence forward layout', () => {
  const analysis =
    engine.analyzeFsaSmartAutoIntent(
      'sghl'
    );

  assert.equal(
    analysis.corrected,
    'سلام'
  );
  assert.equal(
    analysis.autoEligible,
    true
  );
});

test('v4.7 Smart Auto keeps valid Persian and English untouched', () => {
  for (const word of [
    'خانه',
    'برنامه',
    'server',
    'google'
  ]) {
    const analysis =
      engine.analyzeFsaSmartAutoIntent(
        word
      );

    assert.equal(
      analysis.changed,
      false,
      word
    );
  }
});

test('v4.7 Smart Auto treats deterministic Unicode normalization as safe', () => {
  const analysis =
    engine.analyzeFsaSmartAutoIntent(
      'علي'
    );

  assert.equal(
    analysis.corrected,
    'علی'
  );
  assert.equal(
    analysis.kind,
    'normalization'
  );
  assert.equal(
    analysis.autoEligible,
    true
  );
});

test('v4.7 generalized Finglish correction can remain suggestion-only when source intent is below the Auto threshold', () => {
  const analysis =
    engine.analyzeFsaSmartAutoIntent(
      'baran',
      {
        beforeText: 'امروز ',
        afterText: ' شدید می‌بارد',
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl'
      }
    );

  assert.equal(
    analysis.corrected,
    'باران'
  );

  assert.equal(
    analysis.kind,
    'finglish'
  );

  assert.equal(
    analysis.changed,
    true
  );

  assert.equal(
    analysis.autoEligible,
    false
  );
});

test('v4.7 Smart Auto does not auto-convert valid English in English context', () => {
  const analysis =
    engine.analyzeFsaSmartAutoIntent(
      'server',
      {
        beforeText: 'open ',
        afterText: ' now',
        fieldLanguage: 'en',
        pageLanguage: 'en',
        direction: 'ltr'
      }
    );

  assert.equal(
    analysis.changed,
    false
  );
});

test('v4.7 inline Smart Auto has mutation guard, suppression and Undo surface', () => {
  assert.match(
    inlineSource,
    /smartAutoEnabled/u
  );
  assert.match(
    inlineSource,
    /smartAutoMutationInProgress/u
  );
  assert.match(
    inlineSource,
    /smartAutoSuppressUntil/u
  );
  assert.match(
    inlineSource,
    /applySmartAutoSuggestion/u
  );
  assert.match(
    inlineSource,
    /surfaceMode\s*===\s*['"]undo['"]/u
  );
  assert.match(
    inlineSource,
    /برگردان:/u
  );
});

test('v4.7 Smart Auto never introduces host form submission', () => {
  assert.doesNotMatch(
    inlineSource,
    /\.submit\s*\(/u
  );
  assert.doesNotMatch(
    inlineSource,
    /requestSubmit\s*\(/u
  );
});

test('v4.7 settings expose Smart Auto as an explicit local preference', () => {
  assert.match(
    optionsHtml,
    /id="smartAutoEnabled"/u
  );
  assert.match(
    optionsJs,
    /smartAutoEnabled/u
  );
  assert.match(
    optionsJs,
    /chrome\.storage\.sync\.set/u
  );
});


test('v4.7 calibrated source-intent Finglish can preempt a false physical-layout interpretation', () => {
  const result =
    engine.analyzeFsaSmartAutoIntent(
      'bgrdim',
      {
        beforeText: 'ما ',
        afterText: ' دوباره تلاش می‌کنیم',
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl'
      }
    );

  assert.equal(
    result.corrected,
    'بگردیم'
  );

  assert.equal(
    result.kind,
    'finglish'
  );

  assert.equal(
    result.autoEligible,
    true
  );

  assert.equal(
    result.sourceIntent?.preferred,
    true
  );
});
