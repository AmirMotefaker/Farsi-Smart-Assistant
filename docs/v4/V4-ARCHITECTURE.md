# Farsi Smart Assistant v4 — Architecture

## Layers

### 1. Keyboard Layout Engine

File: `keyboard_layout.js`

Responsibilities:

- physical-key mapping in both directions,
- deterministic conversion,
- confidence analysis,
- conservative token-level correction,
- no DOM access.

Core APIs:

- `convertEnglishKeysToPersian(text)`
- `convertPersianKeysToEnglish(text)`
- `analyzeKeyboardLayoutToken(token)`
- `analyzeKeyboardLayout(text)`
- `correctKeyboardLayoutText(text)`

This layer must remain dependency-free and deterministic.

### 2. Product Converter

File: `logic.js`

Priority:

1. custom dictionary,
2. keyboard-layout engine,
3. legacy transliteration dictionary,
4. unchanged input.

The layout engine intentionally runs before the legacy WORD_MAP so cases such as Persian-layout `لخخلمث` resolve to English `google`, rather than being interpreted as a Persian transliteration request.

### 3. Universal Web Input Adapter

File: `inline_checker.js`

Responsibilities:

- identify supported editable DOM targets,
- debounce input,
- ask converter for a correction,
- display suggestion UI,
- replace text using a native value setter where available,
- dispatch an `input` event,
- preserve host-page control,
- never submit forms.

M0 supported targets:

- `input[type=text]`
- `input[type=search]`
- `textarea`
- `contenteditable`

Excluded by design:

- password,
- email,
- URL,
- numeric and structured fields.

### 4. Browser Injection

File: `manifest.json`

Content scripts load in this order:

1. `keyboard_layout.js`
2. `logic.js`
3. `inline_checker.js`

M0 enables:

- `<all_urls>`
- `all_frames`
- `match_about_blank`
- `match_origin_as_fallback`

This broadens coverage for matching web frames and editor-related iframe documents.

## Security model

- No `innerHTML` for corrected/user-controlled text.
- No eval/Function.
- No remote correction dependency.
- No password processing.
- No automatic form submit.
- User replacement action stays explicit in M0.

## Detection strategy

### English keys, Persian intended

High confidence in M0 when:

- token contains at least three Latin letters, and
- token is not a known valid English word, and
- either:
  - it contains strong Persian-layout punctuation keys, or
  - it contains no Latin vowels.

Example:

`sghl` → `سلام`

### Persian keys, English intended

M0 converts only when reversing the Persian key sequence produces a known high-confidence English word.

Examples:

- `فثسف` → `test`
- `لخخلمث` → `google`
- `اثممخ` → `hello`

This is intentionally conservative. M1 expands confidence using language evidence rather than blindly converting every Persian token.

## Why token-level correction

Whole-field heuristics fail mixed text.

Examples that v4 must support:

- `hello sghl` → `hello سلام`
- `سلام فثسف` → `سلام test`

Therefore the engine analyzes each non-whitespace token and changes only high-confidence mistakes.

## Testing architecture

### Unit tests

`tests/keyboard-layout-v4.test.mjs`

Covers:

- raw mapping,
- high-confidence correction,
- reverse correction,
- no-change behavior,
- mixed text,
- analysis metadata,
- integration with `smart_farsi_converter`.

### Universal input regression

`tests/universal-input-v4.test.mjs`

Covers:

- no host form submission,
- sensitive-field exclusions,
- native setter path,
- frame-coverage manifest flags.

### Product gate

Existing:

- syntax checks,
- security tests,
- evaluation corpus,
- product smoke tests.

Keyboard-layout cases become release-blocking in corpus version 0.2.0.

## Release strategy

M0 is developed in a feature branch and PR.

Do not merge/release v4.0.0 solely from unit tests.

Required sequence:

Issue → branch → implementation → deterministic gates → PR → GitHub CI → online browser matrix → merge → post-merge gates → exact-SHA tag → GitHub Release.