import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const read = (name) => readFile(path.join(root, name), 'utf8');

const [
  i18nSource,
  popupHtml,
  popupCss,
  popupJs,
  optionsHtml,
  optionsJs,
  sitesHtml,
  sitesJs,
  inlineChecker,
  smartAutoIntent,
  manifestText,
  packageText,
  buildBrowser
] = await Promise.all([
  read('ui_i18n.js'),
  read('popup.html'),
  read('popup.css'),
  read('popup.js'),
  read('options.html'),
  read('options.js'),
  read('site_management.html'),
  read('site_management.js'),
  read('inline_checker.js'),
  read('smart_auto_intent.js'),
  read('manifest.json'),
  read('package.json'),
  read('scripts/build-browser-packages.mjs')
]);

const manifest = JSON.parse(manifestText);
const packageJson = JSON.parse(packageText);

function loadI18n() {
  const context = { globalThis: {} };
  vm.runInNewContext(i18nSource, context, {
    filename: 'ui_i18n.js'
  });
  return context.globalThis.FSA_UI_I18N;
}

test('v4.8.0 ships one matched FA/EN catalog with Persian default', () => {
  const i18n = loadI18n();
  assert.ok(i18n);
  assert.equal(i18n.normalizeLocale(undefined), 'fa');
  assert.equal(i18n.normalizeLocale('fa'), 'fa');
  assert.equal(i18n.normalizeLocale('en'), 'en');
  assert.equal(i18n.t('popup.settings', 'fa'), 'تنظیمات');
  assert.equal(i18n.t('popup.settings', 'en'), 'Settings');
  assert.equal(i18n.t('inline.undoPrefix', 'fa'), 'برگردان:');
  assert.equal(i18n.t('inline.undoPrefix', 'en'), 'Undo:');

  const faKeys = Object.keys(i18n.catalog.fa).sort();
  const enKeys = Object.keys(i18n.catalog.en).sort();
  assert.deepEqual(enKeys, faKeys);
});

test('v4.8.0 popup exposes persistent FA/EN control beside theme and safe localization', () => {
  assert.match(popupHtml, /id="languageSwitch"/u);
  assert.match(popupHtml, /id="languageFa"/u);
  assert.match(popupHtml, /id="languageEn"/u);
  assert.ok(
    popupHtml.indexOf('ui_i18n.js') < popupHtml.indexOf('popup.js'),
    'ui_i18n.js must load before popup.js'
  );
  assert.match(popupJs, /let uiLanguage = 'fa'/u);
  assert.match(popupJs, /storageSet\(\{ uiLanguage \}\)/u);
  assert.match(popupJs, /setUiLanguage\('fa'\)/u);
  assert.match(popupJs, /setUiLanguage\('en'\)/u);
  assert.match(
    popupHtml,
    /data-i18n-aria-label="popup\.assistantToggleLabel"/u
  );
  assert.match(
    popupHtml,
    /data-i18n-aria-label="popup\.browserSupportLabel"/u
  );
  assert.match(
    popupHtml,
    /data-i18n-aria-label="popup\.love"/u
  );
  assert.match(popupJs, /themeToggle\.setAttribute\('title', themeAction\)/u);
  assert.match(i18nSource, /element\.textContent =/u);
  assert.doesNotMatch(i18nSource, /\binnerHTML\s*=/u);
});

test('v4.8.0 switches document direction from locale and uses logical popup layout', () => {
  assert.match(i18nSource, /resolvedLocale === 'fa' \? 'rtl' : 'ltr'/u);
  assert.match(popupCss, /direction:\s*inherit/u);
  assert.match(popupCss, /\.header-controls/u);
  assert.match(popupCss, /\.language-switch/u);
  assert.match(popupCss, /padding-inline-end:\s*62px/u);
  assert.match(popupCss, /inset-inline-end:\s*8px/u);
});

test('v4.8.0 Settings and Site Management follow the shared preference', () => {
  for (const html of [optionsHtml, sitesHtml]) {
    assert.ok(
      html.indexOf('ui_i18n.js') >= 0,
      'management page missing ui_i18n.js'
    );
    assert.match(html, /data-i18n=/u);
  }

  assert.match(optionsJs, /'uiLanguage'/u);
  assert.match(optionsJs, /changes\.uiLanguage/u);
  assert.match(sitesJs, /'uiLanguage'/u);
  assert.match(sitesJs, /changes\.uiLanguage/u);
});

test('v4.8.0 inline Correction and Undo localize without coupling Smart Auto decisions to UI locale', () => {
  assert.match(inlineChecker, /let uiLanguage = 'fa'/u);
  assert.match(inlineChecker, /inline\.undoPrefix/u);
  assert.match(inlineChecker, /inline\.correctionPrefix/u);
  assert.match(inlineChecker, /refreshSuggestionLanguage/u);
  assert.doesNotMatch(smartAutoIntent, /uiLanguage/u);

  const contentScripts = manifest.content_scripts[0].js;
  assert.ok(contentScripts.includes('ui_i18n.js'));
  assert.ok(
    contentScripts.indexOf('ui_i18n.js') <
    contentScripts.indexOf('inline_checker.js')
  );
});

test('release metadata and packaging include the i18n runtime', () => {
  assert.equal(
    manifest.version,
    packageJson.version
  );
  assert.match(
    packageJson.version,
    /^\d+\.\d+\.\d+$/u
  );
  assert.match(
    packageJson.scripts.check,
    /node --check ui_i18n\.js/u
  );
  assert.match(
    buildBrowser,
    /'ui_i18n\.js'/u
  );
});
