import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

const profileSource = await fs.readFile(
  path.join(root, 'language_profiles.js'),
  'utf8'
);
const keyboardSource = await fs.readFile(
  path.join(root, 'keyboard_layout.js'),
  'utf8'
);
const contextSource = await fs.readFile(
  path.join(root, 'context_intent.js'),
  'utf8'
);
const logicSource = await fs.readFile(
  path.join(root, 'logic.js'),
  'utf8'
);
const inlineSource = await fs.readFile(
  path.join(root, 'inline_checker.js'),
  'utf8'
);

const context = vm.createContext({ console });

vm.runInContext(
  `${profileSource}
${keyboardSource}
${contextSource}
${logicSource}
;globalThis.__contextV47 = {
  getFsaContextLanguagePrior,
  analyzeKeyboardLayoutTokenWithContext,
  correctKeyboardLayoutTextWithContext,
  smart_farsi_converter
};`,
  context
);

const engine = context.__contextV47;

test('v4.7 isolated ambiguous Persian token stays unchanged', () => {
  assert.equal(
    engine.correctKeyboardLayoutTextWithContext(
      'سعد',
      {}
    ),
    'سعد'
  );
});

test('v4.7 Persian context protects an ambiguous Persian token', () => {
  assert.equal(
    engine.correctKeyboardLayoutTextWithContext(
      'سعد',
      {
        beforeText: 'نام ',
        afterText: ' بسیار معروف است',
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl'
      }
    ),
    'سعد'
  );
});

test('v4.7 strong English sentence context can resolve سعد to sun', () => {
  assert.equal(
    engine.correctKeyboardLayoutTextWithContext(
      'سعد',
      {
        beforeText: 'bright ',
        afterText: ' today in the sky',
        fieldLanguage: 'en',
        pageLanguage: 'en',
        direction: 'ltr',
        browserLanguage: 'en-US',
        keyboardEvidence: {
          latinKeys: 0,
          persianKeys: 3,
          physicalAlphaKeys: 3
        }
      }
    ),
    'sun'
  );
});

test('v4.7 weak page language alone cannot blindly flip سعد', () => {
  assert.equal(
    engine.correctKeyboardLayoutTextWithContext(
      'سعد',
      {
        pageLanguage: 'en'
      }
    ),
    'سعد'
  );
});

test('v4.7 existing high-confidence reverse intent still wins without context', () => {
  assert.equal(
    engine.smart_farsi_converter(
      'هقشد',
      {},
      null
    ),
    'iran'
  );
});

test('v4.7 context prior reports strong surrounding language evidence', () => {
  const prior =
    engine.getFsaContextLanguagePrior(
      {
        beforeText: 'please search ',
        afterText: ' in browser',
        fieldLanguage: 'en'
      },
      'fa'
    );

  assert.equal(prior.dominant, 'en');
  assert.ok(prior.en > prior.fa + 2);
  assert.ok(
    prior.evidence.includes(
      'surrounding-latin-context'
    )
  );
});

test('v4.7 inline checker passes field context into the converter', () => {
  assert.match(
    inlineSource,
    /buildElementIntentContext/u
  );
  assert.match(
    inlineSource,
    /smart_farsi_converter\([\s\S]*intentContext/u
  );
  assert.match(
    inlineSource,
    /keyboardEvidence/u
  );
  assert.match(
    inlineSource,
    /addEventListener\('keydown', handleIntentKeydown\)/u
  );
});

test('v4.7 context engine never contains auto-submit behavior', () => {
  assert.doesNotMatch(
    contextSource,
    /\.submit\s*\(/u
  );
  assert.doesNotMatch(
    contextSource,
    /requestSubmit\s*\(/u
  );
});
