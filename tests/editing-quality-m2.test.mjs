import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const source = await fs.readFile(
  path.join(repositoryRoot, 'inline_checker.js'),
  'utf8'
);

function smartConverter(value) {
  const map = new Map([
    ['sghl', 'سلام'],
    ['ugd', 'علی'],
    ['فثسف', 'test'],
    ['هقشد', 'iran'],
    ['wfp fodv', 'صبح بخیر']
  ]);

  return map.get(value) ?? value;
}

const context = vm.createContext({
  chrome: {
    storage: {
      sync: {
        get(_key, callback) {
          callback({ customDictionary: {} });
        }
      }
    }
  },
  document: {
    addEventListener() {}
  },
  window: {},
  console,
  setTimeout,
  clearTimeout,
  smart_farsi_converter: smartConverter
});

vm.runInContext(`${source}
;globalThis.__m2 = {
  findCurrentTokenRange,
  findTrailingTwoTokenRange,
  replaceTextRange,
  computeEditingSuggestion
};`, context);

const m2 = context.__m2;

test('M2 corrects only the current token in surrounding text', () => {
  const value = 'hello sghl world';
  const caret = value.indexOf('sghl') + 'sghl'.length;

  const suggestion = m2.computeEditingSuggestion(
    value,
    caret,
    caret,
    {}
  );

  assert.equal(suggestion.mode, 'token');
  assert.equal(suggestion.originalText, 'sghl');
  assert.equal(suggestion.correctedText, 'سلام');

  assert.equal(
    m2.replaceTextRange(
      value,
      suggestion.start,
      suggestion.end,
      suggestion.correctedText
    ),
    'hello سلام world'
  );
});

test('M2 preserves surrounding text for a vowel-containing M1 token', () => {
  const value = 'before ugd after';
  const caret = value.indexOf('ugd') + 3;

  const suggestion = m2.computeEditingSuggestion(
    value,
    caret,
    caret,
    {}
  );

  assert.equal(suggestion.originalText, 'ugd');
  assert.equal(suggestion.correctedText, 'علی');

  assert.equal(
    m2.replaceTextRange(
      value,
      suggestion.start,
      suggestion.end,
      suggestion.correctedText
    ),
    'before علی after'
  );
});

test('M2 explicit selection replaces only the selection', () => {
  const value = 'before فثسف after';
  const start = value.indexOf('فثسف');
  const end = start + 'فثسف'.length;

  const suggestion = m2.computeEditingSuggestion(
    value,
    start,
    end,
    {}
  );

  assert.equal(suggestion.mode, 'selection');
  assert.equal(suggestion.correctedText, 'test');

  assert.equal(
    m2.replaceTextRange(
      value,
      suggestion.start,
      suggestion.end,
      suggestion.correctedText
    ),
    'before test after'
  );
});

test('M2 keeps short-phrase context when current token is insufficient', () => {
  const value = 'wfp fodv';
  const caret = value.length;

  const suggestion = m2.computeEditingSuggestion(
    value,
    caret,
    caret,
    {}
  );

  assert.equal(suggestion.mode, 'phrase');
  assert.equal(suggestion.originalText, 'wfp fodv');
  assert.equal(suggestion.correctedText, 'صبح بخیر');
});

test('M2 returns no suggestion for unchanged current token', () => {
  assert.equal(
    m2.computeEditingSuggestion(
      'hello world',
      11,
      11,
      {}
    ),
    null
  );
});

test('M2 range replacement never alters text outside the range', () => {
  assert.equal(
    m2.replaceTextRange(
      'AAA sghl BBB',
      4,
      8,
      'سلام'
    ),
    'AAA سلام BBB'
  );
});

test('M2 exposes Persian-keyboard English correction as the same token suggestion', () => {
  const value = 'search هقشد';
  const caret = value.length;

  const suggestion = m2.computeEditingSuggestion(
    value,
    caret,
    caret,
    {}
  );

  assert.equal(suggestion.mode, 'token');
  assert.equal(suggestion.originalText, 'هقشد');
  assert.equal(suggestion.correctedText, 'iran');

  assert.equal(
    m2.replaceTextRange(
      value,
      suggestion.start,
      suggestion.end,
      suggestion.correctedText
    ),
    'search iran'
  );
});
