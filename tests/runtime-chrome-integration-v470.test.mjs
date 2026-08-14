import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const root =
  path.resolve(
    testDirectory,
    '..'
  );

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js',
  'lexical_priors.js',
  'finglish_source_model.js',
  'smart_auto_intent.js',
  'inline_checker.js'
];

const sources = [];

for (const file of runtimeFiles) {
  sources.push(
    await fs.readFile(
      path.join(root, file),
      'utf8'
    )
  );
}

const documentStub = {
  documentElement: {
    lang: 'en',
    dir: 'ltr'
  },
  body: {},
  activeElement: null,
  addEventListener() {},
  execCommand() {
    return false;
  }
};

const context =
  vm.createContext({
    console,
    chrome: {
      storage: {
        sync: {
          get(_key, callback) {
            callback({
              assistantEnabled: true,
              smartAutoEnabled: true,
              disabledHosts: []
            });
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    },
    document: documentStub,
    window: {
      addEventListener() {},
      innerWidth: 1200,
      innerHeight: 800
    },
    navigator: {
      language: 'en-US'
    },
    setTimeout,
    clearTimeout
  });

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__runtimeChrome = {
  computeEditingSuggestion,
  armSmartAutoPostCommitProtection,
  isSmartAutoPostCommitSuggestion
};`,
  context
);

const runtime =
  context.__runtimeChrome;

test('v4.7 runtime bridge chooses generalized Finglish before generic physical layout for bgrdim', () => {
  const text =
    'ما دوباره تلاش میکنیم bgrdim ';

  const suggestion =
    runtime.computeEditingSuggestion(
      text,
      text.length,
      text.length,
      {},
      {
        fieldLanguage: 'en',
        pageLanguage: 'en',
        direction: '',
        browserLanguage: 'en-US',
        keyboardEvidence: {
          latinKeys: 5,
          persianKeys: 0,
          physicalAlphaKeys: 5
        }
      }
    );

  assert.ok(suggestion);

  assert.equal(
    suggestion.originalText,
    'bgrdim'
  );

  assert.equal(
    suggestion.correctedText,
    'بگردیم'
  );

  assert.equal(
    suggestion.intentAnalysis
      ?.autoEligible,
    true
  );

  assert.equal(
    suggestion.intentAnalysis
      ?.kind,
    'finglish'
  );
});

test('v4.7 runtime bridge creates a qazvin correction even when the generic converter would leave the Persian token unchanged', () => {
  const text =
    'ضشظرهد ';

  const suggestion =
    runtime.computeEditingSuggestion(
      text,
      text.length,
      text.length,
      {},
      {
        fieldLanguage: '',
        pageLanguage: 'en',
        direction: 'ltr',
        browserLanguage: 'en-US',
        keyboardEvidence: {
          latinKeys: 0,
          persianKeys: 6,
          physicalAlphaKeys: 6
        }
      }
    );

  assert.ok(suggestion);

  assert.equal(
    suggestion.originalText,
    'ضشظرهد'
  );

  assert.equal(
    suggestion.correctedText,
    'qazvin'
  );

  assert.equal(
    suggestion.intentAnalysis
      ?.autoEligible,
    true
  );
});

test('v4.7 runtime bridge preserves baran as suggestion-only under strong Persian context', () => {
  const text =
    'در متن فارسی baran ';

  const suggestion =
    runtime.computeEditingSuggestion(
      text,
      text.length,
      text.length,
      {},
      {
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl',
        browserLanguage: 'fa-IR',
        keyboardEvidence: {
          latinKeys: 5,
          persianKeys: 10,
          physicalAlphaKeys: 15
        }
      }
    );

  assert.ok(suggestion);

  assert.equal(
    suggestion.correctedText,
    'باران'
  );

  assert.equal(
    suggestion.intentAnalysis
      ?.autoEligible,
    false
  );
});

test('v4.7 weak English-page context may abstain from baran but can never Auto-convert it', () => {
  const text =
    'من baran ';

  const suggestion =
    runtime.computeEditingSuggestion(
      text,
      text.length,
      text.length,
      {},
      {
        fieldLanguage: '',
        pageLanguage: 'en',
        direction: 'ltr',
        browserLanguage: 'en-US',
        keyboardEvidence: {
          latinKeys: 5,
          persianKeys: 2,
          physicalAlphaKeys: 7
        }
      }
    );

  assert.equal(
    suggestion?.intentAnalysis
      ?.autoEligible ?? false,
    false
  );
});

test('v4.7 controlled-host recovery keeps recent boundary intent after delimiter trimming', () => {
  const inline =
    sources[sources.length - 1];

  assert.match(
    inline,
    /isSmartAutoRecentBoundaryAtTokenEnd/u
  );

  assert.match(
    inline,
    /age <= 1400/u
  );

  assert.match(
    inline,
    /event\.isTrusted === true/u
  );
});

test('v4.7 native insertText precedes prototype-setter fallback and passive viewport changes preserve live Undo', () => {
  const inline =
    sources[sources.length - 1];

  const replaceMatch =
    inline.match(
      /function replaceStandardRange[\s\S]*?function stabilizeSmartAutoControlledValue/u
    );

  assert.ok(replaceMatch);

  const body =
    replaceMatch[0];

  assert.ok(
    body.indexOf('tryNativeInsertText') <
    body.indexOf('if (nativeSetter)')
  );

  assert.match(
    inline,
    /hideSuggestionForPassiveViewportChange/u
  );

  assert.match(
    inline,
    /suggestionElements\.mode === 'undo'/u
  );
});

test('v4.7 post-Auto token immunity blocks immediate qazvin ping-pong without blocking unrelated tokens', () => {
  const input = {
    value: 'qazvin ',
    isContentEditable: false
  };

  const applied = {
    fieldText: 'ضشظرهد ',
    start: 0,
    end: 6,
    originalText: 'ضشظرهد',
    correctedText: 'qazvin',
    mode: 'token'
  };

  runtime.armSmartAutoPostCommitProtection(
    input,
    applied
  );

  assert.equal(
    runtime.isSmartAutoPostCommitSuggestion(
      input,
      {
        fieldText: 'qazvin ',
        start: 0,
        end: 6,
        originalText: 'qazvin',
        correctedText: 'ضشظرهد',
        mode: 'token'
      }
    ),
    true
  );

  assert.equal(
    runtime.isSmartAutoPostCommitSuggestion(
      input,
      {
        fieldText: 'qazvin next',
        start: 7,
        end: 11,
        originalText: 'next',
        correctedText: 'دثطف',
        mode: 'token'
      }
    ),
    false
  );
});
