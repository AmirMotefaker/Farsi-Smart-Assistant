import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const manifest = JSON.parse(
  await readFile(path.join(root, 'manifest.json'), 'utf8')
);
const packageJson = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8')
);
const workflow = await readFile(
  path.join(root, '.github', 'workflows', 'security-quality-gate.yml'),
  'utf8'
);
const chromeDoc = await readFile(
  path.join(root, 'docs', 'store', 'v4.5.1', 'CHROME-WEB-STORE.md'),
  'utf8'
);
const firefoxDoc = await readFile(
  path.join(root, 'docs', 'store', 'v4.5.1', 'FIREFOX-AMO.md'),
  'utf8'
);
const privacyDoc = await readFile(
  path.join(root, 'docs', 'store', 'v4.5.1', 'PRIVACY-DISCLOSURES.md'),
  'utf8'
);
const assetsDoc = await readFile(
  path.join(root, 'docs', 'store', 'v4.5.1', 'ASSET-CHECKLIST.md'),
  'utf8'
);

test('v4.5.1 store candidate metadata is synchronized', () => {
  assert.equal(manifest.version, '4.5.1');
  assert.equal(packageJson.version, '4.5.1');
});

test('manifest declares the real store icon set', () => {
  assert.equal(manifest.icons['16'], 'icon16.png');
  assert.equal(manifest.icons['32'], 'icon32.png');
  assert.equal(manifest.icons['48'], 'icon48.png');
  assert.equal(manifest.icons['128'], 'icon128.png');
});

test('store audit is a first-class package command', () => {
  assert.equal(
    packageJson.scripts['audit:store'],
    'npm run build:release && node scripts/audit-store-submission.mjs'
  );
});

test('CI runs the store audit', () => {
  assert.match(workflow, /npm run audit:store/u);
});

test('Chrome submission guide records current required visual sizes', () => {
  assert.match(chromeDoc, /440x280/u);
  assert.match(chromeDoc, /1280x800/u);
  assert.match(chromeDoc, /Privacy practices/u);
});

test('Firefox guide records signing and stable MV3 add-on ID requirements', () => {
  assert.match(firefoxDoc, /Mozilla signing/u);
  assert.match(
    firefoxDoc,
    /@farsi-smart-assistant\.amirmotefaker/u
  );
});

test('privacy disclosure distinguishes local processing and third-party requests', () => {
  assert.match(privacyDoc, /local/u);
  assert.match(privacyDoc, /Google/u);
  assert.match(privacyDoc, /Wikipedia/u);
  assert.match(privacyDoc, /chrome\.storage\.sync/u);
});

test('asset checklist requires current product screenshots and excludes private content', () => {
  assert.match(assetsDoc, /1280x800/u);
  assert.match(assetsDoc, /private/i);
});
