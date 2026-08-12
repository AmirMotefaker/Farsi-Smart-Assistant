import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');

const inlineSource = await fs.readFile(
  path.join(repositoryRoot, 'inline_checker.js'),
  'utf8'
);

const manifest = JSON.parse(
  await fs.readFile(
    path.join(repositoryRoot, 'manifest.json'),
    'utf8'
  )
);

test('universal input engine never submits the host page form', () => {
  assert.doesNotMatch(inlineSource, /\.submit\s*\(/u);
  assert.doesNotMatch(inlineSource, /closest\s*\(\s*['"]form['"]\s*\)/u);
});

test('universal input engine excludes password and structured fields', () => {
  assert.match(inlineSource, /type === 'text'/u);
  assert.match(inlineSource, /type === 'search'/u);
  assert.doesNotMatch(inlineSource, /type === 'password'/u);
});

test('universal input engine contains controlled-input native setter path', () => {
  assert.match(inlineSource, /HTMLInputElement\.prototype/u);
  assert.match(inlineSource, /HTMLTextAreaElement\.prototype/u);
  assert.match(inlineSource, /insertReplacementText/u);
});

test('content scripts cover matching frames and related iframe documents', () => {
  const contentScript = manifest.content_scripts[0];

  assert.equal(contentScript.matches.includes('<all_urls>'), true);
  assert.equal(contentScript.all_frames, true);
  assert.equal(contentScript.match_about_blank, true);
  assert.equal(contentScript.match_origin_as_fallback, true);
  assert.deepEqual(
    contentScript.js.slice(0, 3),
    ['keyboard_layout.js', 'logic.js', 'inline_checker.js']
  );
});
test('M2 contains range-local cursor and native undo paths', () => {
  assert.match(inlineSource, /findCurrentTokenRange/u);
  assert.match(inlineSource, /setSelectionRange/u);
  assert.match(inlineSource, /execCommand/u);
  assert.match(inlineSource, /['"]insertText['"]/u);
  assert.match(inlineSource, /isSuggestionCurrent/u);
});

test('M2 contenteditable path uses Range APIs rather than whole-field assignment', () => {
  assert.match(inlineSource, /createContentEditableRange/u);
  assert.match(inlineSource, /deleteContents/u);
  assert.match(inlineSource, /insertNode/u);
  assert.doesNotMatch(
    inlineSource,
    /element\.textContent\s*=\s*correctedText/u
  );
});
test('M2 recomputes suggestions when standard text selection changes', () => {
  assert.match(
    inlineSource,
    /addEventListener\(\s*['"]select['"]\s*,\s*handleSelectionIntent\s*\)/u
  );
  assert.match(inlineSource, /scheduleCorrectionCheck/u);
});

test('M2 recomputes contenteditable suggestions on selectionchange', () => {
  assert.match(
    inlineSource,
    /document\.addEventListener\(\s*['"]selectionchange['"]/u
  );
  assert.match(
    inlineSource,
    /activeInput\.isContentEditable/u
  );
});
