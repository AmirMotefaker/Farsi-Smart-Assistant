import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadConverter } from '../evaluation/load-converter.mjs';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');

test('extension manifest and core product entry files are present', async () => {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(repositoryRoot, 'manifest.json'),
      'utf8'
    )
  );

  assert.equal(manifest.manifest_version, 3);
  assert.equal(typeof manifest.name, 'string');
  assert.ok(manifest.name.length > 0);
  assert.equal(typeof manifest.version, 'string');

  for (const fileName of [
    'background.js',
    'content_script.js',
    'inline_checker.js',
    'keyboard_layout.js',
    'logic.js',
    'options.js',
    'popup.js'
  ]) {
    const file = await fs.stat(path.join(repositoryRoot, fileName));
    assert.equal(file.isFile(), true);
  }
});

test('core Persian converter loads and returns a string', async () => {
  const convert = await loadConverter();
  const output = convert('سلام');

  assert.equal(typeof output, 'string');
});

test('all release-blocking corpus cases pass through the real converter', async () => {
  const corpus = JSON.parse(
    await fs.readFile(
      path.join(repositoryRoot, 'evaluation', 'corpus.v1.json'),
      'utf8'
    )
  );

  const convert = await loadConverter();
  const requiredCases = corpus.cases.filter(
    (testCase) => testCase.enforcement === 'required'
  );

  for (const testCase of requiredCases) {
    assert.equal(
      convert(testCase.input),
      testCase.expected,
      testCase.id
    );
  }
});
