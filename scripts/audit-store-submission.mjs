import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const releaseRoot = path.join(root, 'release');

function fail(message) {
  throw new Error(message);
}

function readPngDimensions(buffer, fileName) {
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
  ) {
    fail(`${fileName} is not a valid PNG.`);
  }

  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    fail(`${fileName} has no IHDR chunk at the expected position.`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const manifest = JSON.parse(
  await readFile(path.join(root, 'manifest.json'), 'utf8')
);
const packageJson = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8')
);

if (manifest.version !== packageJson.version) {
  fail('manifest.json and package.json versions must match.');
}

if (manifest.version !== '4.5.1') {
  fail(`Store compatibility candidate must be v4.5.1; got ${manifest.version}.`);
}

const version = manifest.version;

if (manifest.manifest_version !== 3) {
  fail('Chrome Web Store package must remain Manifest V3.');
}

if (
  typeof manifest.description !== 'string' ||
  manifest.description.length < 1 ||
  manifest.description.length > 132
) {
  fail('manifest.description must be 1..132 characters.');
}

if (!Array.isArray(manifest.permissions)) {
  fail('manifest.permissions must be an array.');
}

if (manifest.permissions.includes('scripting')) {
  fail('Unused scripting permission must remain removed.');
}

for (const permission of ['storage', 'contextMenus', 'tabs', 'webNavigation']) {
  if (!manifest.permissions.includes(permission)) {
    fail(`Expected product permission missing: ${permission}`);
  }
}

const requiredIcons = new Map([
  ['16', 'icon16.png'],
  ['32', 'icon32.png'],
  ['48', 'icon48.png'],
  ['128', 'icon128.png']
]);

const icons = {};

for (const [size, fileName] of requiredIcons) {
  if (manifest.icons?.[size] !== fileName) {
    fail(`manifest.icons[${size}] must be ${fileName}.`);
  }

  const buffer = await readFile(path.join(root, fileName));
  const dimensions = readPngDimensions(buffer, fileName);
  const numericSize = Number(size);

  if (
    dimensions.width !== numericSize ||
    dimensions.height !== numericSize
  ) {
    fail(
      `${fileName} must be ${size}x${size}; ` +
      `got ${dimensions.width}x${dimensions.height}.`
    );
  }

  icons[size] = dimensions;
}

const chromiumFileName =
  `Farsi-Smart-Assistant-v${version}-chromium.zip`;
const firefoxFileName =
  `Farsi-Smart-Assistant-v${version}-firefox.zip`;

const chromiumZip = path.join(releaseRoot, chromiumFileName);
const firefoxZip = path.join(releaseRoot, firefoxFileName);

const chromiumStat = await stat(chromiumZip);
const firefoxStat = await stat(firefoxZip);

const chromeMaxBytes = 2 * 1024 * 1024 * 1024;
const amoMaxBytes = 200 * 1024 * 1024;

if (chromiumStat.size > chromeMaxBytes) {
  fail('Chromium package exceeds Chrome Web Store 2 GB package limit.');
}

if (firefoxStat.size > amoMaxBytes) {
  fail('Firefox package exceeds AMO 200 MB package limit.');
}

const chromiumManifest = JSON.parse(
  await readFile(
    path.join(root, 'dist', 'chromium', 'manifest.json'),
    'utf8'
  )
);
const firefoxManifest = JSON.parse(
  await readFile(
    path.join(root, 'dist', 'firefox', 'manifest.json'),
    'utf8'
  )
);

if (chromiumManifest.version !== version) {
  fail('Built Chromium manifest version mismatch.');
}

if (firefoxManifest.version !== version) {
  fail('Built Firefox manifest version mismatch.');
}

for (const [size, fileName] of requiredIcons) {
  if (chromiumManifest.icons?.[size] !== fileName) {
    fail(`Built Chromium manifest lost ${size}px icon declaration.`);
  }

  if (firefoxManifest.icons?.[size] !== fileName) {
    fail(`Built Firefox manifest lost ${size}px icon declaration.`);
  }
}

const gecko = firefoxManifest.browser_specific_settings?.gecko;

if (gecko?.id !== '@farsi-smart-assistant.amirmotefaker') {
  fail(`Unexpected Firefox add-on ID: ${gecko?.id}`);
}

const declaredData = gecko.data_collection_permissions?.required || [];

if (!declaredData.includes('searchTerms')) {
  fail('Firefox package must preserve searchTerms disclosure metadata.');
}

const requiredDocs = [
  'docs/store/v4.5.1/CHROME-WEB-STORE.md',
  'docs/store/v4.5.1/FIREFOX-AMO.md',
  'docs/store/v4.5.1/PRIVACY-DISCLOSURES.md',
  'docs/store/v4.5.1/ASSET-CHECKLIST.md',
  'docs/store/v4.5.1/SUBMISSION-STATUS.md'
];

for (const relative of requiredDocs) {
  await stat(path.join(root, relative));
}

const result = {
  decision: 'PASS',
  version,
  manifestVersion: manifest.manifest_version,
  manifestDescriptionLength: manifest.description.length,
  icons,
  chromiumPackage: {
    fileName: chromiumFileName,
    bytes: chromiumStat.size,
    limitBytes: chromeMaxBytes
  },
  firefoxPackage: {
    fileName: firefoxFileName,
    bytes: firefoxStat.size,
    limitBytes: amoMaxBytes,
    addonId: gecko.id,
    declaredDataCollection: declaredData
  }
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
