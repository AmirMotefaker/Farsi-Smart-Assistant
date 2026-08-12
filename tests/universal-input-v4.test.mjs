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