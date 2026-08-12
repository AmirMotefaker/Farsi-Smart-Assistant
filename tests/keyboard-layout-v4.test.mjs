import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadConverter } from '../evaluation/load-converter.mjs';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const source = await fs.readFile(
  path.join(repositoryRoot, 'keyboard_layout.js'),
  'utf8'
);

const context = vm.createContext({ console });

vm.runInContext(`${source}
;globalThis.__engine = {
  convertEnglishKeysToPersian,
  convertPersianKeysToEnglish,
  analyzeKeyboardLayoutToken,
  analyzeKeyboardLayout,
  correctKeyboardLayoutText
};`, context);

const engine = context.__engine;

test('English keyboard layout maps to Persian keys deterministically', () => {
  assert.equal(engine.convertEnglishKeysToPersian('sghl'), 'سلام');
  assert.equal(engine.convertEnglishKeysToPersian('sghl nkdh'), 'سلام دنیا');
});

test('Persian keyboard layout maps back to English keys deterministically', () => {
  assert.equal(engine.convertPersianKeysToEnglish('فثسف'), 'test');
  assert.equal(engine.convertPersianKeysToEnglish('لخخلمث'), 'google');
  assert.equal(engine.convertPersianKeysToEnglish('اثممخ'), 'hello');
});

test('high-confidence English-keyboard Persian mistakes are corrected', () => {
  assert.equal(engine.correctKeyboardLayoutText('sghl'), 'سلام');
  assert.equal(engine.correctKeyboardLayoutText('sghl nkdh'), 'سلام دنیا');
});

test('high-confidence Persian-keyboard English mistakes are corrected', () => {
  assert.equal(engine.correctKeyboardLayoutText('فثسف'), 'test');
  assert.equal(engine.correctKeyboardLayoutText('لخخلمث'), 'google');
  assert.equal(engine.correctKeyboardLayoutText('اثممخ'), 'hello');
});

test('valid Persian and valid English remain unchanged', () => {
  for (const value of [
    'سلام دنیا',
    'خوبی',
    'google chrome',
    'test',
    'PDF',
    'npm',
    'SQL'
  ]) {
    assert.equal(engine.correctKeyboardLayoutText(value), value, value);
  }
});

test('mixed text can correct only the wrong-layout token', () => {
  assert.equal(engine.correctKeyboardLayoutText('hello sghl'), 'hello سلام');
  assert.equal(engine.correctKeyboardLayoutText('سلام فثسف'), 'سلام test');
});

test('analysis exposes direction, confidence and correction details', () => {
  const forward = engine.analyzeKeyboardLayout('sghl');

  assert.equal(forward.changed, true);
  assert.equal(forward.corrected, 'سلام');
  assert.equal(
    forward.corrections[0].direction,
    'english-keys-to-persian'
  );
  assert.ok(forward.confidence >= 0.9);

  const reverse = engine.analyzeKeyboardLayout('فثسف');

  assert.equal(reverse.changed, true);
  assert.equal(reverse.corrected, 'test');
  assert.equal(
    reverse.corrections[0].direction,
    'persian-keys-to-english'
  );
  assert.ok(reverse.confidence >= 0.9);
});

test('smart converter prioritizes layout correction before transliteration', async () => {
  const convert = await loadConverter();

  assert.equal(convert('sghl'), 'سلام');
  assert.equal(convert('فثسف'), 'test');
  assert.equal(convert('لخخلمث'), 'google');
  assert.equal(convert('salam'), 'سلام');
  assert.equal(convert('سلام'), 'سلام');
});