import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const profiles = await fs.readFile(
  path.join(root, 'language_profiles.js'),
  'utf8'
);
const keyboard = await fs.readFile(
  path.join(root, 'keyboard_layout.js'),
  'utf8'
);

const context = vm.createContext({ console });

vm.runInContext(
  `${profiles}
${keyboard}
;globalThis.__v47 = {
  correctKeyboardLayoutText,
  analyzeKeyboardLayoutToken,
  scoreFsaLanguageShape,
  FSA_LANGUAGE_MODEL
};`,
  context
);

const engine = context.__v47;

test('v4.7 golden English-keyboard example is not blocked by literal word lists', () => {
  assert.equal(
    engine.correctKeyboardLayoutText('\\sv'),
    'پسر'
  );
});

test('v4.7 golden Persian-keyboard example resolves to boy', () => {
  assert.equal(
    engine.correctKeyboardLayoutText('ذخغ'),
    'boy'
  );
});

test('v4.7 short reverse-layout words are not categorically rejected by length', () => {
  assert.equal(
    engine.correctKeyboardLayoutText('زشف'),
    'cat'
  );
  assert.equal(
    engine.correctKeyboardLayoutText('یخل'),
    'dog'
  );
});

test('v4.7 runtime model is statistical rather than an exact-word runtime dictionary', () => {
  assert.equal(
    engine.FSA_LANGUAGE_MODEL
      .provenance
      .exactWordLookupRequired,
    false
  );
  assert.equal(
    engine.FSA_LANGUAGE_MODEL
      .provenance
      .runtimeModel,
    'character 2-gram + 3-gram statistical profiles'
  );
});

test('v4.7 language profile can score unseen-shaped text without word lookup', () => {
  const english = engine.scoreFsaLanguageShape(
    'openai',
    'en'
  );
  const persian = engine.scoreFsaLanguageShape(
    'خحثدشه',
    'fa'
  );

  assert.equal(
    Number.isFinite(english.z),
    true
  );
  assert.equal(
    Number.isFinite(persian.z),
    true
  );
});

test('v4.7 preserves explicit high-confidence valid language priors as safety signals', () => {
  assert.equal(
    engine.correctKeyboardLayoutText('سلام'),
    'سلام'
  );
  assert.equal(
    engine.correctKeyboardLayoutText('google'),
    'google'
  );
});
