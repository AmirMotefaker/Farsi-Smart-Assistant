import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(
  await readFile(new URL('../manifest.json', import.meta.url), 'utf8')
);

const background = await readFile(
  new URL('../background.js', import.meta.url),
  'utf8'
);

const popup = await readFile(
  new URL('../popup.js', import.meta.url),
  'utf8'
);

test('v4.8.0 toolbar uses action-only white bilingual icon assets', () => {
  assert.deepEqual(
    manifest.action.default_icon,
    {
      '16': 'assets/brand/toolbar/fa-16.png',
      '32': 'assets/brand/toolbar/fa-32.png'
    }
  );

  assert.equal(manifest.icons['16'], 'icon16.png');
  assert.equal(manifest.icons['32'], 'icon32.png');
  assert.equal(manifest.icons['48'], 'icon48.png');
  assert.equal(manifest.icons['128'], 'icon128.png');
});

test('v4.8.0 toolbar follows persisted FA/EN UI language', () => {
  assert.ok(background.includes('FSA_TOOLBAR_ICON_PATHS'));
  assert.ok(background.includes('assets/brand/toolbar/fa-16.png'));
  assert.ok(background.includes('assets/brand/toolbar/fa-32.png'));
  assert.ok(background.includes('assets/brand/toolbar/en-16.png'));
  assert.ok(background.includes('assets/brand/toolbar/en-32.png'));
  assert.ok(background.includes('changes.uiLanguage'));
  assert.ok(background.includes('changes.uiLanguage.newValue'));
  assert.ok(background.includes('setToolbarIconForLocale'));
  assert.ok(background.includes('syncToolbarIconFromStorage'));
  assert.ok(background.includes('chrome.action || chrome.browserAction'));
  assert.ok(background.includes('actionApi.setIcon'));
  assert.ok(popup.includes('storageSet({ uiLanguage })'));
});
