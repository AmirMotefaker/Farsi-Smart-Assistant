import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const readText = (name) => readFile(path.join(root, name), 'utf8');
const readBinary = (name) => readFile(path.join(root, name));

const [
  popupHtml,
  popupCss,
  popupJs,
  i18nSource,
  manifestText,
  buildBrowser,
  brandMark,
  icon16,
  icon32,
  icon48,
  icon128
] = await Promise.all([
  readText('popup.html'),
  readText('popup.css'),
  readText('popup.js'),
  readText('ui_i18n.js'),
  readText('manifest.json'),
  readText('scripts/build-browser-packages.mjs'),
  readBinary('assets/brand/fsa-mark.png'),
  readBinary('icon16.png'),
  readBinary('icon32.png'),
  readBinary('icon48.png'),
  readBinary('icon128.png')
]);

const manifest = JSON.parse(manifestText);

function pngDimensions(buffer) {
  assert.equal(
    buffer.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'expected PNG signature'
  );

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

test('v4.8.0 polish keeps one canonical ف mark for popup, site reuse and extension icons', () => {
  assert.match(
    popupHtml,
    /src="assets\/brand\/fsa-mark\.png"/u
  );
  assert.deepEqual(brandMark, icon128);

  for (const [buffer, expected] of [
    [icon16, 16],
    [icon32, 32],
    [icon48, 48],
    [icon128, 128]
  ]) {
    assert.deepEqual(
      pngDimensions(buffer),
      { width: expected, height: expected }
    );
  }

  assert.equal(manifest.icons['16'], 'icon16.png');
  assert.equal(manifest.icons['32'], 'icon32.png');
  assert.equal(manifest.icons['48'], 'icon48.png');
  assert.equal(manifest.icons['128'], 'icon128.png');
  assert.deepEqual(
    manifest.action.default_icon,
    {
      '16': 'icon16.png',
      '32': 'icon32.png'
    }
  );
  assert.match(buildBrowser, /'assets\/brand\/fsa-mark\.png'/u);
});

test('v4.8.0 polish makes the header compact without boxing the theme icon', () => {
  assert.match(popupHtml, /class="brand-tagline"/u);
  assert.match(popupCss, /\.version-badge\s*\{[\s\S]*font-size:\s*8px/u);
  assert.match(popupCss, /\.brand-tagline\s*\{[\s\S]*white-space:\s*nowrap/u);
  assert.match(popupCss, /\.icon-button\s*\{[\s\S]*border:\s*0/u);
  assert.match(popupCss, /\.icon-button\s*\{[\s\S]*background:\s*transparent/u);
  assert.match(popupCss, /:root\[data-locale="en"\] \.brand-tagline/u);
});

test('v4.8.0 polish shows current-site favicon and a real bilingual site toggle', () => {
  assert.match(popupHtml, /id="currentSiteFavicon"/u);
  assert.match(popupHtml, /id="currentSiteHost"/u);
  assert.match(popupHtml, /id="siteToggle"/u);
  assert.match(popupHtml, /id="siteToggleText"/u);
  assert.doesNotMatch(popupHtml, /id="siteToggleButton"/u);

  assert.match(popupJs, /activeTab\?\.favIconUrl/u);
  assert.match(popupJs, /function normalizeFaviconUrl/u);
  assert.match(popupJs, /function renderSiteFavicon/u);
  assert.match(popupJs, /currentSiteFavicon\.onerror = showFallback/u);
  assert.match(popupJs, /siteToggle\.checked = siteEnabled/u);
  assert.match(popupJs, /siteToggle\.addEventListener\('change'/u);
  assert.match(popupJs, /storageSet\(\{ disabledHosts \}\)/u);

  assert.match(i18nSource, /'popup\.siteActive': 'فعال در این سایت'/u);
  assert.match(i18nSource, /'popup\.siteDisabled': 'غیرفعال در این سایت'/u);
  assert.match(i18nSource, /'popup\.siteActive': 'Active on this site'/u);
  assert.match(i18nSource, /'popup\.siteDisabled': 'Disabled on this site'/u);
});

test('v4.8.0 polish enlarges the footer in both locales through shared CSS', () => {
  assert.match(
    popupCss,
    /\.popup-footer\s*\{[\s\S]*font-size:\s*10px/u
  );
  assert.match(
    popupCss,
    /\.footer-github img\s*\{[\s\S]*width:\s*18px/u
  );
});

test('v4.8.0 polish requires no new permission for favicons or site state', () => {
  assert.deepEqual(
    manifest.permissions,
    ['storage', 'contextMenus', 'tabs', 'webNavigation']
  );
});
test('v4.8.0 current-site favicon is clean, larger, and source-targeted', () => {
  assert.match(
    popupCss,
    /\.site-icon\s*\{[\s\S]*background:\s*transparent/u
  );
  assert.match(
    popupCss,
    /\.site-icon\s*\{[\s\S]*border-radius:\s*0/u
  );
  assert.match(
    popupCss,
    /\.site-favicon\s*\{[\s\S]*width:\s*30px/u
  );
  assert.match(
    popupCss,
    /\.site-favicon\s*\{[\s\S]*height:\s*30px/u
  );
  assert.match(
    popupCss,
    /\.site-favicon-fallback\[hidden\]\s*\{[\s\S]*display:\s*none\s*!important/u
  );
  assert.match(
    popupCss,
    /\.site-favicon:not\(\[hidden\]\) \+ \.site-favicon-fallback\s*\{[\s\S]*display:\s*none\s*!important/u
  );
  assert.match(
    popupJs,
    /currentSiteFavicon\.onload = \(\) =>/
  );
  assert.match(
    popupJs,
    /currentSiteFallback\.hidden = true/
  );
  assert.doesNotMatch(
    popupJs,
    /installFsaCurrentSiteFaviconPolish/u
  );
});
