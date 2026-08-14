import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const popupHtml = await readFile(path.join(root, 'popup.html'), 'utf8');
const popupCss = await readFile(path.join(root, 'popup.css'), 'utf8');
const popupJs = await readFile(path.join(root, 'popup.js'), 'utf8');
const optionsHtml = await readFile(path.join(root, 'options.html'), 'utf8');
const optionsJs = await readFile(path.join(root, 'options.js'), 'utf8');
const siteManagementHtml = await readFile(path.join(root, 'site_management.html'), 'utf8');
const siteManagementJs = await readFile(path.join(root, 'site_management.js'), 'utf8');
const inlineChecker = await readFile(path.join(root, 'inline_checker.js'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

test('M4 popup declares Persian RTL and required product surfaces', () => {
  assert.match(popupHtml, /<html lang="fa" dir="rtl">/u);

  for (const id of [
    'assistantToggle',
    'themeToggle',
    'currentSiteFavicon',
    'currentSiteHost',
    'siteToggle',
    'siteToggleText',
    'manageSitesLink',
    'settingsLink',
    'reportIssueLink',
    'inputText',
    'mainButton'
  ]) {
    assert.match(
      popupHtml,
      new RegExp(`id="${id}"`, 'u'),
      `popup missing ${id}`
    );
  }

  assert.match(
    popupHtml,
    /اصلاح هوشمند تایپ فارسی و انگلیسی در سراسر وب/u
  );
  assert.doesNotMatch(
    popupHtml,
    /id="siteToggleButton"/u,
    'legacy site text-button must not return'
  );
});

test('M4 popup visibly declares all six released desktop browsers', () => {
  for (const browser of [
    'Chrome',
    'Edge',
    'Brave',
    'Opera',
    'Vivaldi',
    'Firefox'
  ]) {
    assert.match(
      popupHtml,
      new RegExp(`data-browser="${browser}"`, 'u')
    );
  }
});

test('M4 theme is local CSS with explicit light and dark tokens', () => {
  assert.match(popupCss, /:root\s*\{/u);
  assert.match(popupCss, /:root\[data-theme="dark"\]/u);
  assert.match(popupCss, /prefers-reduced-motion/u);
  // Runtime assets/styles must remain local. External navigation links are allowed.
  assert.doesNotMatch(
    popupHtml,
    /\bsrc=["']https?:\/\//iu
  );
  assert.doesNotMatch(
    popupHtml,
    /<link[^>]+\bhref=["']https?:\/\//iu
  );
});

test('M4 popup keeps Safe-DOM rendering invariants', () => {
  for (const source of [popupJs, optionsJs, siteManagementJs]) {
    assert.doesNotMatch(source, /\binnerHTML\s*=/u);
    assert.doesNotMatch(source, /\bouterHTML\s*=/u);
    assert.doesNotMatch(source, /\binsertAdjacentHTML\s*\(/u);
    assert.doesNotMatch(source, /\bdocument\.write\s*\(/u);
    assert.doesNotMatch(source, /\beval\s*\(/u);
    assert.doesNotMatch(source, /\bnew\s+Function\s*\(/u);
  }

  assert.match(popupJs, /\.textContent\s*=/u);
  assert.match(popupJs, /replaceChildren/u);
});

test('M4 enable state is persistent and enforced by inline engine', () => {
  assert.match(popupJs, /assistantEnabled/u);
  assert.match(popupJs, /disabledHosts/u);
  assert.match(popupJs, /storageSet\(\{\s*assistantEnabled\s*\}\)/u);
  assert.match(popupJs, /storageSet\(\{\s*disabledHosts\s*\}\)/u);

  assert.match(inlineChecker, /function isAssistantAvailable\(\)/u);
  assert.match(inlineChecker, /function isAssistantHostDisabled\(/u);
  assert.match(inlineChecker, /chrome\.storage\.onChanged/u);
  assert.match(
    inlineChecker,
    /if\s*\(!isAssistantAvailable\(\)\)\s*\{\s*hideSuggestion\(\);\s*return;/u
  );
});

test('M4 site management exposes persistent disabled-site management', () => {
  assert.doesNotMatch(optionsHtml, /id="disabledHosts"/u);
  assert.match(siteManagementHtml, /id="disabledHosts"/u);
  assert.match(siteManagementHtml, /id="saveSitesButton"/u);
  assert.match(siteManagementJs, /disabledHosts/u);
  assert.match(siteManagementJs, /normalizeHostLine/u);
});

test('M4 metadata remains synchronized across release versions', () => {
  assert.equal(manifest.version, packageJson.version);
  assert.equal(
    manifest.description,
    'Universal smart typing correction for Persian and English across the web.'
  );
});
