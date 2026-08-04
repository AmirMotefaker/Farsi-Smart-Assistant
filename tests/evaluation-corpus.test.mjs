import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const corpusPath = path.join(
  repositoryRoot,
  'evaluation',
  'corpus.v1.json'
);

const requiredCategories = [
  'keyboard-layout',
  'unicode-normalization',
  'spacing',
  'transliteration',
  'ambiguity',
  'no-change'
];

async function readCorpus() {
  return JSON.parse(await fs.readFile(corpusPath, 'utf8'));
}

test('evaluation corpus has the required schema and categories', async () => {
  const corpus = await readCorpus();

  assert.equal(corpus.schemaVersion, 1);
  assert.equal(corpus.language, 'fa');
  assert.deepEqual(
    [...corpus.categories].sort(),
    [...requiredCategories].sort()
  );
});

test('evaluation corpus case ids are unique and fields are valid', async () => {
  const corpus = await readCorpus();
  const ids = new Set();

  for (const testCase of corpus.cases) {
    assert.equal(typeof testCase.id, 'string');
    assert.ok(testCase.id.length > 0);
    assert.equal(ids.has(testCase.id), false);
    ids.add(testCase.id);

    assert.ok(requiredCategories.includes(testCase.category));
    assert.equal(typeof testCase.input, 'string');
    assert.equal(typeof testCase.expected, 'string');
    assert.ok(
      ['required', 'manual-review'].includes(testCase.enforcement)
    );
  }
});

test('every required category has at least one representative case', async () => {
  const corpus = await readCorpus();
  const represented = new Set(
    corpus.cases.map((testCase) => testCase.category)
  );

  for (const category of requiredCategories) {
    assert.equal(represented.has(category), true);
  }
});

test('release-blocking cases include deterministic no-change coverage', async () => {
  const corpus = await readCorpus();
  const requiredCases = corpus.cases.filter(
    (testCase) => testCase.enforcement === 'required'
  );

  assert.ok(requiredCases.length >= 5);
  assert.ok(
    requiredCases.some(
      (testCase) =>
        testCase.category === 'no-change' &&
        testCase.input === testCase.expected
    )
  );
});
