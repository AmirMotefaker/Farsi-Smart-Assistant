import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

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
  analyzeKeyboardLayout,
  correctKeyboardLayoutText
};`, context);

const engine = context.__engine;

test('v4.6 maps Persian-keyboard iran intent deterministically', () => {
  assert.equal(engine.convertEnglishKeysToPersian('iran'), 'هقشد');
  assert.equal(engine.convertPersianKeysToEnglish('هقشد'), 'iran');
});

test('v4.6 auto-detects Persian-keyboard English intent for iran', () => {
  assert.equal(engine.correctKeyboardLayoutText('هقشد'), 'iran');

  const analysis = engine.analyzeKeyboardLayout('هقشد');

  assert.equal(analysis.changed, true);
  assert.equal(analysis.corrected, 'iran');
  assert.equal(
    analysis.corrections[0].direction,
    'persian-keys-to-english'
  );
  assert.ok(analysis.confidence >= 0.9);
  assert.ok(
    analysis.corrections[0].evidence.includes(
      'english-word-shape-after-layout-reversal'
    )
  );
});

test('v4.6 generalizes reverse intent beyond the iran example', () => {
  assert.equal(
    engine.convertPersianKeysToEnglish('ضعثقغ'),
    'query'
  );
  assert.equal(
    engine.correctKeyboardLayoutText('ضعثقغ'),
    'query'
  );
});

test('v4.6 corrects only the reverse-intent token in mixed text', () => {
  assert.equal(
    engine.correctKeyboardLayoutText('سلام هقشد'),
    'سلام iran'
  );
});

test('v4.6 preserves representative valid Persian words', () => {
  for (const value of [
    'خانه',
    'برنامه',
    'مدرسه',
    'قاشق',
    'مشهد',
    'ایران',
    'تهران',
    'راهنما',
    'امنیت',
    'تنظیمات',
    'مدیریت',
    'صفحه',
    'نتیجه',
    'نسخه'
  ]) {
    assert.equal(
      engine.correctKeyboardLayoutText(value),
      value,
      value
    );
  }
});
