# v4 M2 — Editing Quality

## Objective

M2 changes the browser input engine from whole-field replacement to range-local editing.

The M1 confidence engine remains the source of correction decisions. M2 changes **where and how** the accepted correction is applied.

## Selection model

For standard inputs and textareas:

1. read `selectionStart` / `selectionEnd`,
2. if the selection is non-collapsed, evaluate only the selected text,
3. otherwise find the current token around the caret,
4. if that token is unchanged, try an exact trailing two-token phrase so M1 phrase evidence remains available.

For contenteditable:

1. convert the DOM Selection/Range into linear text offsets,
2. use the same token/selection planning model,
3. map the resulting linear offsets back to DOM Range boundaries.

## Replacement model

Preferred path:

- focus the target,
- restore the target range,
- use the browser-native `execCommand('insertText')` path when available.

This path is retained because current Chromium editing surfaces generally integrate it with native edit history/Undo.

Fallback path for input/textarea:

- compute the new field value from `before + replacement + after`,
- use the native value setter when available,
- dispatch an `InputEvent` with `inputType = insertReplacementText`,
- restore the caret immediately after the replacement.

Fallback path for contenteditable:

- `Range.deleteContents()`,
- insert a text node for only the replacement,
- collapse the selection immediately after the inserted node,
- dispatch the replacement input event.

M2 never assigns the entire contenteditable value through `element.textContent = correctedText`.

## Stale suggestion safety

Every suggestion captures:

- full field text,
- replacement start/end,
- original range text,
- replacement text,
- mode (`token`, `selection`, or `phrase`).

Before applying, M2 verifies both the full field snapshot and the original range. If the field changed after suggestion creation, the suggestion is rejected.

## Required examples

- `hello sghl world` → `hello سلام world`
- `before ugd after` → `before علی after`
- selected `فثسف` inside surrounding text → selected range becomes `test`
- `wfp fodv` at phrase end → `صبح بخیر`
- caret immediately follows the accepted replacement
- stale suggestions never overwrite newer content

## Browser release gate

Automated tests prove deterministic range planning and safety invariants.

The M2 browser matrix remains required for:

- native Undo,
- cursor placement,
- standard input,
- textarea,
- contenteditable,
- controlled framework-like input behavior,
- dynamic fields,
- stale-suggestion behavior,
- sensitive field exclusion,
- representative real sites.