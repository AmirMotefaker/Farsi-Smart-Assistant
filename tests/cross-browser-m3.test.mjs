import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  rm,
  stat
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const builder = path.join(
  repositoryRoot,
  'scripts',
  'build-browser-packages.mjs'
);

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function withBuild(callback) {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), 'fsa-m3-browser-build-')
  );

  try {
    execFileSync(
      process.execPath,
      [builder, '--out', tempRoot],
      {
        cwd: repositoryRoot,
        stdio: 'pipe'
      }
    );

    await callback(tempRoot);
  } finally {
    await rm(tempRoot, {
      recursive: true,
      force: true
    });
  }
}

test('M3 Chromium build preserves the canonical manifest exactly', async () => {
  await withBuild(async (root) => {
    const canonical = JSON.parse(
      await readFile(
        path.join(repositoryRoot, 'manifest.json'),
        'utf8'
      )
    );

    const chromium = JSON.parse(
      await readFile(
        path.join(root, 'chromium', 'manifest.json'),
        'utf8'
      )
    );

    assert.deepEqual(chromium, canonical);
    assert.equal(
      chromium.background.service_worker,
      'background.js'
    );
    assert.equal(
      Object.hasOwn(
        chromium,
        'browser_specific_settings'
      ),
      false
    );
  });
});

test('M3 Firefox build uses MV3 background scripts in dependency order', async () => {
  await withBuild(async (root) => {
    const firefox = JSON.parse(
      await readFile(
        path.join(root, 'firefox', 'manifest.json'),
        'utf8'
      )
    );

    assert.equal(firefox.manifest_version, 3);
    assert.deepEqual(
      firefox.background,
      {
        scripts: [
          'keyboard_layout.js',
          'logic.js',
          'background.js'
        ]
      }
    );

    assert.equal(
      Object.hasOwn(
        firefox.background,
        'service_worker'
      ),
      false
    );
  });
});

test('M3 Firefox build contains signing/privacy metadata', async () => {
  await withBuild(async (root) => {
    const firefox = JSON.parse(
      await readFile(
        path.join(root, 'firefox', 'manifest.json'),
        'utf8'
      )
    );

    assert.equal(
      firefox.browser_specific_settings.gecko.id,
      '@farsi-smart-assistant.amirmotefaker'
    );

    assert.equal(
      firefox.browser_specific_settings.gecko.strict_min_version,
      '140.0'
    );

    assert.deepEqual(
      firefox
        .browser_specific_settings
        .gecko
        .data_collection_permissions
        .required,
      ['searchTerms']
    );
  });
});

test('M3 Firefox build preserves universal content-script frame coverage', async () => {
  await withBuild(async (root) => {
    const firefox = JSON.parse(
      await readFile(
        path.join(root, 'firefox', 'manifest.json'),
        'utf8'
      )
    );

    const content = firefox.content_scripts[0];

    assert.deepEqual(content.matches, ['<all_urls>']);
    assert.equal(content.all_frames, true);
    assert.equal(content.match_about_blank, true);
    assert.equal(content.match_origin_as_fallback, true);
    assert.deepEqual(
      content.js,
      [
        'keyboard_layout.js',
        'logic.js',
        'inline_checker.js'
      ]
    );
  });
});

test('M3 generated packages contain runtime files and exclude dev-only content', async () => {
  await withBuild(async (root) => {
    for (const browser of ['chromium', 'firefox']) {
      const packageRoot = path.join(root, browser);

      for (const required of [
        'background.js',
        'inline_checker.js',
        'keyboard_layout.js',
        'logic.js',
        'popup.html',
        'popup.js',
        'options.html',
        'options.js',
        'fonts/Vazirmatn.woff2'
      ]) {
        assert.equal(
          await exists(
            path.join(packageRoot, required)
          ),
          true,
          `${browser} missing ${required}`
        );
      }

      for (const forbidden of [
        'tests',
        'evidence',
        'evaluation',
        'scripts',
        '.github',
        'package.json'
      ]) {
        assert.equal(
          await exists(
            path.join(packageRoot, forbidden)
          ),
          false,
          `${browser} unexpectedly packages ${forbidden}`
        );
      }
    }
  });
});

test('M3 shared background is safe in both worker and document contexts', async () => {
  const source = await readFile(
    path.join(repositoryRoot, 'background.js'),
    'utf8'
  );

  assert.match(
    source,
    /typeof importScripts === ['"]function['"]/u
  );

  assert.match(
    source,
    /function getSyncStorage\(keys\)/u
  );

  assert.match(
    source,
    /chrome\.storage\.sync\.get\(keys,\s*\(data\)\s*=>/u
  );

  assert.doesNotMatch(
    source,
    /await\s+chrome\.storage\.sync\.get/u
  );
});