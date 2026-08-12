# Farsi Smart Assistant v4 — Product Spec

## Product thesis

The primary problem is not spelling.

The primary problem is **keyboard-language mismatch**:

> The user knows what they want to type and presses the correct physical keys, but the operating system is on the wrong keyboard layout.

Examples:

| User intent | Active layout | Typed text | Correct result |
|---|---|---|---|
| سلام | English | `sghl` | سلام |
| سلام دنیا | English | `sghl nkdh` | سلام دنیا |
| test | Persian | `فثسف` | test |
| google | Persian | `لخخلمث` | google |
| hello | Persian | `اثممخ` | hello |

Finglish transliteration (`salam` → `سلام`) remains useful, but it is a secondary feature.

## Product promise

**When Farsi Smart Assistant is active, it should recognize high-confidence Persian/English keyboard-layout mistakes in normal editable web fields and let the user recover their intended text without deleting and retyping it.**

## Experience principles

1. Local-first correction.
2. Fast enough to feel immediate.
3. High precision before aggressive automation.
4. Never inspect or modify password fields.
5. Never submit a host form merely because a correction was applied.
6. Preserve valid Persian and valid English.
7. Preserve user control: suggestion first; automatic correction can be enabled only after confidence and Undo UX are mature.
8. No remote keystroke logging.

## v4 correction priority

1. User custom dictionary.
2. Wrong keyboard layout.
3. Finglish/transliteration.
4. Other Persian writing quality tracks later.

## M0 required behavior

- English-keyboard → Persian deterministic mapping.
- Persian-keyboard → English deterministic mapping.
- Conservative confidence analysis.
- Per-token correction in mixed text.
- input[type=text].
- input[type=search].
- textarea.
- contenteditable.
- dynamically focused SPA fields.
- matching iframe documents.
- React-style controlled input setter path.
- input event dispatch after replacement.
- no automatic form submit.
- high z-index suggestion UI.

## Safety exclusions

M0 deliberately does not alter:

- password fields,
- email fields,
- URL fields,
- numeric fields,
- browser privileged UI,
- text with low-confidence intent.

## Success metrics

Release-blocking:

- Required keyboard-layout exact-match rate = 100%.
- Required no-change false-positive rate = 0%.
- Deterministic test suite = PASS.
- GitHub CI = PASS.

Before v4.0.0 release:

- Google Search textbox = PASS.
- ChatGPT composer = PASS.
- Gmail compose body/subject = PASS where extension APIs permit.
- GitHub text input/textarea = PASS.
- At least one React-controlled input = PASS.
- At least one contenteditable editor = PASS.
- iframe test case = PASS.

## Roadmap

### M0 — deterministic engine and universal web-input foundation

Current milestone.

### M1 — confidence engine

- Larger English/Persian language evidence.
- Better handling of words with vowels.
- Phrase-level intent.
- false-positive corpus expansion.

### M2 — editing quality

- Cursor and selection preservation.
- Undo chip.
- replace current token/selection instead of entire field.
- framework-specific edge cases.

### M3 — browser matrix

- Chrome.
- Edge.
- Brave.
- Opera/Vivaldi.
- Firefox-compatible build.

### Phase 2 — desktop

A browser extension cannot own every text surface in an operating system.

A future desktop companion is required for:

- native desktop apps,
- editor/IDE input outside browser pages,
- broader OS-level text surfaces.

That desktop track is separate from the browser extension security model.