import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');

function readArgument(name) {
  const index = process.argv.indexOf(name);

  if (index < 0) return null;

  const value = process.argv[index + 1];

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`);
  }

  return value;
}

const requestedOutput = readArgument('--out');
const outputRoot = path.resolve(
  requestedOutput || path.join(repositoryRoot, 'dist')
);

const chromiumDirectory = path.join(outputRoot, 'chromium');
const firefoxDirectory = path.join(outputRoot, 'firefox');

const excludedPrefixes = [
  '.github/',
  'dist/',
  'docs/',
  'evaluation/',
  'evidence/',
  'scripts/',
  'tests/'
];

const excludedFiles = new Set([
  '.gitattributes',
  '.gitignore',
  'inline_styles.css',
  'package.json',
  'package-lock.json'
]);

function shouldPackage(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');

  if (excludedFiles.has(normalized)) return false;

  return !excludedPrefixes.some(
    (prefix) => normalized.startsWith(prefix)
  );
}

function trackedRuntimeFiles() {
  const output = execFileSync(
    'git',
    ['ls-files', '-z'],
    {
      cwd: repositoryRoot,
      encoding: 'utf8'
    }
  );

  return output
    .split('\0')
    .filter(Boolean)
    .filter(shouldPackage)
    .sort();
}

async function copyRuntimeFiles(files, destination) {
  for (const relativePath of files) {
    const source = path.join(repositoryRoot, relativePath);
    const target = path.join(destination, relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

function buildFirefoxManifest(canonicalManifest) {
  const firefoxManifest = structuredClone(canonicalManifest);

  firefoxManifest.background = {
    scripts: [
      'language_profiles.js',
      'keyboard_layout.js',
  'context_intent.js',
      'logic.js',
      'background.js'
    ]
  };

  firefoxManifest.browser_specific_settings = {
    gecko: {
      id: '@farsi-smart-assistant.amirmotefaker',
      strict_min_version: '140.0',
      data_collection_permissions: {
        required: ['searchTerms']
      }
    }
  };

  return firefoxManifest;
}

await rm(outputRoot, {
  recursive: true,
  force: true
});

await mkdir(chromiumDirectory, { recursive: true });
await mkdir(firefoxDirectory, { recursive: true });

const manifestPath = path.join(repositoryRoot, 'manifest.json');
const canonicalManifest = JSON.parse(
  await readFile(manifestPath, 'utf8')
);

if (canonicalManifest.manifest_version !== 3) {
  throw new Error('Canonical manifest must remain Manifest V3.');
}

if (
  canonicalManifest.background?.service_worker !==
  'background.js'
) {
  throw new Error(
    'Canonical Chromium background service worker contract changed.'
  );
}

const files = trackedRuntimeFiles();

for (const requiredFile of [
  'background.js',
  'inline_checker.js',
  'language_profiles.js',
  'keyboard_layout.js',
  'logic.js',
  'manifest.json',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'site_management.html',
  'site_management.js',
  'assets/browser-logos/chrome.svg',
  'assets/browser-logos/edge.svg',
  'assets/browser-logos/brave.svg',
  'assets/browser-logos/opera.svg',
  'assets/browser-logos/vivaldi.svg',
  'assets/browser-logos/firefox.svg',
  'assets/browser-logos/github.svg',
  'icon16.png',
  'icon32.png',
  'icon48.png',
  'icon128.png',
  'fonts/Vazirmatn.woff2'
]) {
  if (!files.includes(requiredFile)) {
    throw new Error(
      `Required runtime file is not tracked/packageable: ${requiredFile}`
    );
  }
}

await copyRuntimeFiles(files, chromiumDirectory);
await copyRuntimeFiles(files, firefoxDirectory);

const firefoxManifest = buildFirefoxManifest(canonicalManifest);

await writeFile(
  path.join(
    firefoxDirectory,
    'manifest.json'
  ),
  `${JSON.stringify(firefoxManifest, null, 2)}\n`,
  'utf8'
);

const summary = {
  outputRoot,
  chromiumDirectory,
  firefoxDirectory,
  runtimeFileCount: files.length,
  version: canonicalManifest.version,
  chromiumBackground: canonicalManifest.background,
  firefoxBackground: firefoxManifest.background,
  firefoxGecko:
    firefoxManifest.browser_specific_settings.gecko
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);