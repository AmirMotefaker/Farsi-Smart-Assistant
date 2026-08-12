import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const readme = await readFile(path.join(root, 'README.md'), 'utf8');
const privacy = await readFile(path.join(root, 'docs', 'PRIVACY.md'), 'utf8');
const distribution = await readFile(path.join(root, 'docs', 'DISTRIBUTION.md'), 'utf8');
const storeListing = await readFile(path.join(root, 'docs', 'STORE-LISTING.md'), 'utf8');
const workflow = await readFile(
  path.join(root, '.github', 'workflows', 'security-quality-gate.yml'),
  'utf8'
);


test('v4.5.0 metadata is synchronized', () => {
  assert.equal(manifest.version, '4.5.0');
  assert.equal(packageJson.version, '4.5.0');
});


test('store readiness removes the unused scripting permission', () => {
  assert.ok(Array.isArray(manifest.permissions));
  assert.equal(manifest.permissions.includes('scripting'), false);
});


test('release scripts are first-class package commands', () => {
  assert.equal(
    packageJson.scripts['build:release'],
    'node scripts/build-release-artifacts.mjs'
  );
  assert.equal(
    packageJson.scripts['verify:release'],
    'node scripts/verify-release-artifacts.mjs'
  );
  assert.match(packageJson.scripts['release:gate'], /build:release/u);
  assert.match(packageJson.scripts['release:gate'], /verify:release/u);
});


test('README points to current versioned release artifacts', () => {
  assert.match(readme, /Farsi-Smart-Assistant-v4\.5\.0-chromium\.zip/u);
  assert.match(readme, /Farsi-Smart-Assistant-v4\.5\.0-firefox\.zip/u);
  assert.match(readme, /SHA256SUMS\.txt/u);
});


test('distribution and privacy documentation cover release behavior', () => {
  assert.match(distribution, /npm run release:gate/u);
  assert.match(distribution, /SHA256/u);
  assert.match(privacy, /chrome\.storage\.sync/u);
  assert.match(privacy, /Wikipedia/u);
  assert.match(privacy, /Google/u);
  assert.match(storeListing, /Chrome Web Store/u);
  assert.match(storeListing, /Firefox/u);
});


test('CI builds, verifies and uploads release-candidate artifacts', () => {
  assert.match(workflow, /npm run build:release/u);
  assert.match(workflow, /npm run verify:release/u);
  assert.match(workflow, /actions\/upload-artifact@v4/u);
});
