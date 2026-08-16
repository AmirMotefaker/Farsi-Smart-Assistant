import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const popup = await readFile(path.join(root, 'popup.js'), 'utf8');
const popupHtml = await readFile(path.join(root, 'popup.html'), 'utf8');

test('popup does not assign untrusted content through unsafe HTML APIs', () => {
  assert.equal(/\binnerHTML\s*=/.test(popup), false);
  assert.equal(/\binsertAdjacentHTML\s*\(/.test(popup), false);
  assert.equal(/\bouterHTML\s*=/.test(popup), false);
});

test('Store-safe popup performs no remote correction/search request', () => {
  assert.doesNotMatch(popup, /\bfetch\s*\(/u);
  assert.doesNotMatch(popup, /wikipedia\.org/iu);
  assert.doesNotMatch(popup, /google\.com\/search/iu);
  assert.doesNotMatch(popup, /searchGoogle/u);
  assert.doesNotMatch(popupHtml, /knowledgePanel|mainButton|searchGoogle/u);
});

test('popup still renders correction values through form/value and textContent paths', () => {
  assert.match(popup, /correctedTextBox\.value\s*=\s*correctedText/u);
  assert.match(popup, /saveConfirmation\.textContent\s*=\s*message/u);
  assert.match(popup, /currentSiteHost\.textContent/u);
});
