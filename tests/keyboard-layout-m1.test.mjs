import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const source = await fs.readFile(path.join(repositoryRoot, 'keyboard_layout.js'), 'utf8');
const context = vm.createContext({ console });

vm.runInContext(`${source}
;globalThis.__engine = {
  convertPersianKeysToEnglish,
  analyzeKeyboardLayoutToken,
  analyzeKeyboardLayout,
  correctKeyboardLayoutText
};`, context);

const engine = context.__engine;

test('M1 recovers vowel-containing Persian-intent layout mistakes from curated Persian evidence', () => {
  assert.equal(engine.correctKeyboardLayoutText('ugd'), 'علی');
  assert.equal(engine.correctKeyboardLayoutText('jivhk'), 'تهران');
});

test('M1 database example matches the deterministic physical-key mapping', () => {
  assert.equal(
    engine.convertPersianKeysToEnglish('یشفشذشسث'),
    'database'
  );
});

test('M1 expands Persian-keyboard to English evidence', () => {
  assert.equal(engine.correctKeyboardLayoutText('سثقرثق'), 'server');
  assert.equal(engine.correctKeyboardLayoutText('یشفشذشسث'), 'database');
});

test('M1 uses exact short-phrase evidence when token evidence alone is insufficient', () => {
  assert.equal(engine.correctKeyboardLayoutText('wfp fodv'), 'صبح بخیر');

  const analysis = engine.analyzeKeyboardLayout('wfp fodv');
  assert.equal(analysis.changed, true);
  assert.equal(analysis.corrected, 'صبح بخیر');
  assert.equal(analysis.corrections[0].scope, 'phrase');
  assert.ok(
    analysis.corrections[0].evidence.includes(
      'known-persian-phrase-after-layout-conversion'
    )
  );
});

test('M1 preserves common valid English phrases and technical text', () => {
  for (const value of [
    'google chrome',
    'github actions',
    'visual studio code',
    'open source',
    'machine learning',
    'artificial intelligence',
    'javascript typescript',
    'react node npm',
    'API SQL JSON PDF'
  ]) {
    assert.equal(engine.correctKeyboardLayoutText(value), value, value);
  }
});

test('M1 preserves common valid Persian phrases', () => {
  for (const value of [
    'سلام دنیا',
    'حال شما چطور است',
    'این یک متن فارسی است',
    'هوش مصنوعی',
    'برنامه نویسی'
  ]) {
    assert.equal(engine.correctKeyboardLayoutText(value), value, value);
  }
});

test('M1 analysis exposes explainable confidence evidence', () => {
  const result = engine.analyzeKeyboardLayout('ugd');

  assert.equal(result.changed, true);
  assert.equal(result.corrected, 'علی');
  assert.ok(result.confidence >= 0.9);
  assert.ok(
    result.corrections[0].evidence.includes(
      'known-persian-after-layout-conversion'
    )
  );
});