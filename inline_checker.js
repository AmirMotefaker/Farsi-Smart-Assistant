// =================================================================================
// Farsi Smart Assistant v4 - Universal Web Input Engine (M2 Editing Quality)
// =================================================================================

let activeInput = null;
let suggestionElements = {
    host: null,
    action: null,
    prefix: null,
    correctedText: '',
    mode: '',
    inputElement: null
};
let customDictionary = {};
let assistantEnabled = true;
let smartAutoEnabled = true;
let disabledHosts = [];
let uiLanguage = 'fa';
const trackedInputs = new WeakSet();
const inputTimers = new WeakMap();
const intentKeyHistory = new WeakMap();
const smartAutoInputState = new WeakMap();
const smartAutoSuppressUntil = new WeakMap();
const smartAutoUndoUntil = new WeakMap();
const smartAutoMutationInProgress = new WeakSet();
const smartAutoControlledCommitState = new WeakMap();
const smartAutoPostCommitState = new WeakMap();
const SMART_AUTO_UNDO_VISIBLE_MS = 5000;
const SMART_AUTO_POST_COMMIT_MS = 5000;
const SMART_AUTO_CONTROLLED_STABILIZE_DELAYS =
    Object.freeze([0, 40, 120, 280]);

chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        customDictionary = data.customDictionary;
    }
});

chrome.storage.sync.get(
    ['assistantEnabled', 'disabledHosts', 'smartAutoEnabled', 'uiLanguage'],
    (data) => {
        assistantEnabled = data.assistantEnabled !== false;
        disabledHosts = Array.isArray(data.disabledHosts)
            ? data.disabledHosts
            : [];
        smartAutoEnabled =
            data.smartAutoEnabled !== false;
        uiLanguage = normalizeUiLanguage(
            data.uiLanguage
        );
    }
);

function normalizeUiLanguage(value) {
    if (
        globalThis.FSA_UI_I18N &&
        typeof globalThis.FSA_UI_I18N.normalizeLocale === 'function'
    ) {
        return globalThis.FSA_UI_I18N.normalizeLocale(value);
    }

    return String(value || '').toLowerCase() === 'en'
        ? 'en'
        : 'fa';
}

function inlineUiText(key, variables = {}) {
    if (
        globalThis.FSA_UI_I18N &&
        typeof globalThis.FSA_UI_I18N.t === 'function'
    ) {
        return globalThis.FSA_UI_I18N.t(
            key,
            uiLanguage,
            variables
        );
    }

    const fallback = {
        'inline.undoPrefix': 'برگردان:',
        'inline.correctionPrefix': 'اصلاح:',
        'inline.replaceWith': 'جایگزین با {text}'
    };

    return String(fallback[key] || key).replace(
        /\{text\}/g,
        String(variables.text || '')
    );
}

function refreshSuggestionLanguage() {
    const action = suggestionElements.action;
    const prefix = suggestionElements.prefix;

    if (!action) return;

    const direction = uiLanguage === 'en' ? 'ltr' : 'rtl';
    action.style.direction = direction;
    action.setAttribute?.(
        'aria-label',
        inlineUiText(
            'inline.replaceWith',
            { text: suggestionElements.correctedText }
        )
    );

    if (prefix) {
        prefix.textContent = inlineUiText(
            suggestionElements.mode === 'undo'
                ? 'inline.undoPrefix'
                : 'inline.correctionPrefix'
        );
        prefix.style.direction = direction;
    }
}

function normalizeAssistantHost(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^\.+|\.+$/g, '');
}

function getCurrentAssistantHost() {
    if (
        typeof location === 'undefined' ||
        !location ||
        !location.hostname
    ) {
        return '';
    }

    return normalizeAssistantHost(location.hostname);
}

function isAssistantHostDisabled(
    hostname = getCurrentAssistantHost()
) {
    const host = normalizeAssistantHost(hostname);

    if (!host) return false;

    return disabledHosts.some((entry) => {
        const blocked = normalizeAssistantHost(entry);

        return blocked && (
            host === blocked ||
            host.endsWith(`.${blocked}`)
        );
    });
}

function isAssistantAvailable() {
    return assistantEnabled && !isAssistantHostDisabled();
}

if (chrome.storage.onChanged?.addListener) {
    chrome.storage.onChanged.addListener(
        (changes, areaName) => {
            if (areaName !== 'sync') return;

            if (changes.customDictionary) {
                customDictionary =
                    changes.customDictionary.newValue || {};
            }

            if (changes.assistantEnabled) {
                assistantEnabled =
                    changes.assistantEnabled.newValue !== false;
            }

            if (changes.disabledHosts) {
                disabledHosts = Array.isArray(
                    changes.disabledHosts.newValue
                )
                    ? changes.disabledHosts.newValue
                    : [];
            }

            if (changes.smartAutoEnabled) {
                smartAutoEnabled =
                    changes.smartAutoEnabled.newValue !== false;
            }

            if (changes.uiLanguage) {
                uiLanguage = normalizeUiLanguage(
                    changes.uiLanguage.newValue
                );
                refreshSuggestionLanguage();
            }

            if (!isAssistantAvailable()) {
                hideSuggestion();
            }
        }
    );
}

function isSupportedEditable(element) {
    if (!element) return false;
    if (element.isContentEditable) return true;

    const tagName = String(element.tagName || '').toUpperCase();

    if (tagName === 'TEXTAREA') return true;
    if (tagName !== 'INPUT') return false;

    const type = String(element.type || 'text').toLowerCase();

    return type === 'text' || type === 'search';
}

function getEditableText(element) {
    return element.isContentEditable ? element.textContent : element.value;
}

function clampOffset(value, length) {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : length;
    return Math.max(0, Math.min(length, numeric));
}

function findCurrentTokenRange(text, caretOffset) {
    const value = String(text ?? '');
    const length = value.length;

    if (length === 0) {
        return { start: 0, end: 0 };
    }

    let caret = clampOffset(caretOffset, length);
    let probe = caret;

    if (probe === length || (probe > 0 && /\s/u.test(value[probe]))) {
        probe -= 1;
    }

    while (probe >= 0 && /\s/u.test(value[probe])) {
        probe -= 1;
    }

    if (probe < 0) {
        return { start: caret, end: caret };
    }

    let start = probe;
    let end = probe + 1;

    while (start > 0 && !/\s/u.test(value[start - 1])) {
        start -= 1;
    }

    while (end < length && !/\s/u.test(value[end])) {
        end += 1;
    }

    return { start, end };
}

function findTrailingTwoTokenRange(text, caretOffset) {
    const value = String(text ?? '');
    const caret = clampOffset(caretOffset, value.length);
    const prefix = value.slice(0, caret);
    const match = prefix.match(/(\S+\s+\S+)\s*$/u);

    if (!match) return null;

    const phrase = match[1];
    const start = prefix.lastIndexOf(phrase);

    if (start < 0) return null;

    return {
        start,
        end: start + phrase.length
    };
}

function replaceTextRange(text, start, end, replacement) {
    const value = String(text ?? '');
    const safeStart = clampOffset(start, value.length);
    const safeEnd = Math.max(safeStart, clampOffset(end, value.length));

    return value.slice(0, safeStart) +
        String(replacement ?? '') +
        value.slice(safeEnd);
}


function classifyIntentKeyScript(value) {
    const key = String(value ?? '');

    if (/^[A-Za-z]$/u.test(key)) {
        return 'en';
    }

    if (/^[\u0600-\u06FF]$/u.test(key)) {
        return 'fa';
    }

    return '';
}

function handleIntentKeydown(event) {
    const inputElement =
        event.currentTarget || event.target;

    if (!isSupportedEditable(inputElement)) {
        return;
    }

    const script =
        classifyIntentKeyScript(event.key);
    const physicalAlpha =
        /^Key[A-Z]$/u.test(
            String(event.code || '')
        );

    if (!script && !physicalAlpha) {
        return;
    }

    const now = Date.now();
    const existing =
        intentKeyHistory.get(inputElement) || [];
    const next = [
        ...existing,
        {
            at: now,
            script,
            physicalAlpha
        }
    ]
        .filter(
            (item) =>
                now - item.at <= 5000
        )
        .slice(-24);

    intentKeyHistory.set(
        inputElement,
        next
    );
}

function summarizeIntentKeyboardEvidence(
    inputElement
) {
    const now = Date.now();
    const history =
        intentKeyHistory.get(inputElement) || [];
    let latinKeys = 0;
    let persianKeys = 0;
    let physicalAlphaKeys = 0;

    for (const item of history) {
        if (now - item.at > 5000) {
            continue;
        }

        if (item.script === 'en') {
            latinKeys += 1;
        } else if (item.script === 'fa') {
            persianKeys += 1;
        }

        if (item.physicalAlpha) {
            physicalAlphaKeys += 1;
        }
    }

    return {
        latinKeys,
        persianKeys,
        physicalAlphaKeys
    };
}

function closestIntentLanguage(
    inputElement
) {
    const own = String(
        inputElement?.lang || ''
    ).trim();

    if (own) return own;

    const ancestor =
        inputElement?.closest?.('[lang]');

    return String(
        ancestor?.getAttribute?.('lang') ||
        ''
    ).trim();
}

function closestIntentDirection(
    inputElement
) {
    const own = String(
        inputElement?.dir || ''
    ).trim();

    if (own) return own;

    const ancestor =
        inputElement?.closest?.('[dir]');

    return String(
        ancestor?.getAttribute?.('dir') ||
        ''
    ).trim();
}

function buildElementIntentContext(
    inputElement
) {
    return {
        fieldLanguage:
            closestIntentLanguage(
                inputElement
            ),
        pageLanguage: String(
            document.documentElement?.lang ||
            ''
        ),
        direction:
            closestIntentDirection(
                inputElement
            ) ||
            String(
                document.documentElement?.dir ||
                ''
            ),
        browserLanguage:
            typeof navigator !== 'undefined'
                ? String(
                    navigator.language || ''
                )
                : '',
        keyboardEvidence:
            summarizeIntentKeyboardEvidence(
                inputElement
            )
    };
}

function enrichIntentContext(
    baseContext,
    fieldText,
    start,
    end
) {
    return {
        ...(baseContext || {}),
        fieldText,
        beforeText: String(
            fieldText ?? ''
        ).slice(0, start),
        afterText: String(
            fieldText ?? ''
        ).slice(end)
    };
}


function computeEditingSuggestion(
    text,
    selectionStart,
    selectionEnd,
    dictionary = customDictionary,
    intentContext = null
) {
    const value = String(text ?? '');
    const start = clampOffset(selectionStart, value.length);
    const end = Math.max(start, clampOffset(selectionEnd, value.length));
    const explicitSelection = end > start;

    const primaryRange = explicitSelection
        ? { start, end }
        : findCurrentTokenRange(value, start);

    if (primaryRange.end > primaryRange.start) {
        const originalText = value.slice(
            primaryRange.start,
            primaryRange.end
        );
        const tokenIntentContext =
            enrichIntentContext(
                intentContext,
                value,
                primaryRange.start,
                primaryRange.end
            );
        const intentAnalysis =
            !explicitSelection &&
            smartAutoEnabled &&
            typeof analyzeFsaSmartAutoIntent ===
                'function'
                ? analyzeFsaSmartAutoIntent(
                    originalText,
                    tokenIntentContext,
                    dictionary
                )
                : null;
        const correctedText =
            intentAnalysis?.changed &&
            intentAnalysis.corrected &&
            intentAnalysis.corrected !==
                originalText
                ? intentAnalysis.corrected
                : smart_farsi_converter(
                    originalText,
                    dictionary,
                    tokenIntentContext
                );

        if (correctedText && correctedText !== originalText) {
            return {
                fieldText: value,
                start: primaryRange.start,
                end: primaryRange.end,
                originalText,
                correctedText,
                intentAnalysis,
                mode: explicitSelection ? 'selection' : 'token'
            };
        }
    }

    if (!explicitSelection) {
        const phraseRange = findTrailingTwoTokenRange(value, start);

        if (phraseRange) {
            const originalText = value.slice(
                phraseRange.start,
                phraseRange.end
            );
            const correctedText = smart_farsi_converter(
                originalText,
                dictionary,
                enrichIntentContext(
                    intentContext,
                    value,
                    phraseRange.start,
                    phraseRange.end
                )
            );

            if (correctedText && correctedText !== originalText) {
                return {
                    fieldText: value,
                    start: phraseRange.start,
                    end: phraseRange.end,
                    originalText,
                    correctedText,
                    mode: 'phrase'
                };
            }
        }
    }

    return null;
}

function isSuggestionCurrent(element, suggestion) {
    if (!element || !suggestion) return false;

    const currentText = getEditableText(element);

    if (currentText !== suggestion.fieldText) return false;

    return currentText.slice(suggestion.start, suggestion.end) ===
        suggestion.originalText;
}

function getStandardSelection(element, text) {
    const length = text.length;
    const start = clampOffset(element.selectionStart, length);
    const end = Math.max(start, clampOffset(element.selectionEnd, length));

    return { start, end };
}

function getContentEditableSelection(element, text) {
    const fallback = { start: text.length, end: text.length };

    if (
        typeof window.getSelection !== 'function' ||
        typeof document.createRange !== 'function'
    ) {
        return fallback;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount < 1) {
        return fallback;
    }

    const range = selection.getRangeAt(0);
    const startInside = range.startContainer === element ||
        element.contains?.(range.startContainer);
    const endInside = range.endContainer === element ||
        element.contains?.(range.endContainer);

    if (!startInside || !endInside) {
        return fallback;
    }

    try {
        const startRange = document.createRange();
        startRange.selectNodeContents(element);
        startRange.setEnd(range.startContainer, range.startOffset);

        const endRange = document.createRange();
        endRange.selectNodeContents(element);
        endRange.setEnd(range.endContainer, range.endOffset);

        const start = clampOffset(startRange.toString().length, text.length);
        const end = Math.max(
            start,
            clampOffset(endRange.toString().length, text.length)
        );

        return { start, end };
    } catch (_error) {
        return fallback;
    }
}

function getEditableSelection(element, text = getEditableText(element)) {
    return element.isContentEditable
        ? getContentEditableSelection(element, text)
        : getStandardSelection(element, text);
}

function resolveContentEditablePosition(element, linearOffset) {
    const textLength = getEditableText(element).length;
    const target = clampOffset(linearOffset, textLength);

    if (
        typeof document.createTreeWalker !== 'function' ||
        typeof NodeFilter === 'undefined'
    ) {
        return { node: element, offset: 0 };
    }

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT
    );

    let traversed = 0;
    let lastNode = null;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.nodeValue?.length ?? 0;
        lastNode = node;

        if (target <= traversed + length) {
            return {
                node,
                offset: target - traversed
            };
        }

        traversed += length;
    }

    if (lastNode) {
        return {
            node: lastNode,
            offset: lastNode.nodeValue?.length ?? 0
        };
    }

    return {
        node: element,
        offset: 0
    };
}

function createContentEditableRange(element, start, end) {
    if (typeof document.createRange !== 'function') return null;

    const range = document.createRange();
    const startPosition = resolveContentEditablePosition(element, start);
    const endPosition = resolveContentEditablePosition(element, end);

    try {
        range.setStart(startPosition.node, startPosition.offset);
        range.setEnd(endPosition.node, endPosition.offset);
        return range;
    } catch (_error) {
        return null;
    }
}

function createReplacementInputEvent(correctedText) {
    return typeof InputEvent === 'function'
        ? new InputEvent('input', {
            bubbles: true,
            inputType: 'insertReplacementText',
            data: correctedText
        })
        : new Event('input', { bubbles: true });
}

function dispatchReplacementInput(element, correctedText) {
    element.dispatchEvent(createReplacementInputEvent(correctedText));
}

function tryNativeInsertText(element, start, end, correctedText) {
    if (
        typeof document.execCommand !== 'function' ||
        typeof element.focus !== 'function'
    ) {
        return false;
    }

    element.focus();

    if (!element.isContentEditable) {
        if (typeof element.setSelectionRange !== 'function') {
            return false;
        }

        element.setSelectionRange(start, end);
    } else {
        const range = createContentEditableRange(element, start, end);

        if (!range || typeof window.getSelection !== 'function') {
            return false;
        }

        const selection = window.getSelection();

        if (!selection) return false;

        selection.removeAllRanges();
        selection.addRange(range);
    }

    try {
        return document.execCommand(
            'insertText',
            false,
            correctedText
        ) === true;
    } catch (_error) {
        return false;
    }
}

function findValueSetterInPrototypeChain(prototype) {
    let current = prototype;

    while (current) {
        const descriptor = Object.getOwnPropertyDescriptor(
            current,
            'value'
        );

        if (typeof descriptor?.set === 'function') {
            return descriptor.set;
        }

        current = Object.getPrototypeOf(current);
    }

    return null;
}

function getStandardValueSetter(element) {
    const tagName = String(element.tagName || '').toUpperCase();
    let prototype = null;

    if (
        tagName === 'TEXTAREA' &&
        typeof HTMLTextAreaElement !== 'undefined'
    ) {
        prototype = HTMLTextAreaElement.prototype;
    } else if (
        tagName === 'INPUT' &&
        typeof HTMLInputElement !== 'undefined'
    ) {
        prototype = HTMLInputElement.prototype;
    }

    return prototype
        ? findValueSetterInPrototypeChain(prototype)
        : null;
}

function finalizeStandardReplacement(
    element,
    expectedText,
    caret
) {
    if (getEditableText(element) !== expectedText) {
        return false;
    }

    if (typeof element.focus === 'function') {
        element.focus();
    }

    if (typeof element.setSelectionRange === 'function') {
        element.setSelectionRange(caret, caret);
    }

    return getEditableText(element) === expectedText;
}

function replaceStandardRange(element, suggestion) {
    const text = getEditableText(element);
    const newText = replaceTextRange(
        text,
        suggestion.start,
        suggestion.end,
        suggestion.correctedText
    );
    const caret = suggestion.start + suggestion.correctedText.length;
    const nativeSetter = getStandardValueSetter(element);

    // Prefer a browser-native editing transaction first. On controlled
    // inputs this gives the host the same edit semantics as real typing
    // and participates in the browser undo stack.
    if (
        tryNativeInsertText(
            element,
            suggestion.start,
            suggestion.end,
            suggestion.correctedText
        ) &&
        finalizeStandardReplacement(
            element,
            newText,
            caret
        )
    ) {
        return true;
    }

    // Native prototype setter + bubbling input remains the controlled-input
    // compatibility path when insertText is unavailable or rejected.
    if (nativeSetter) {
        nativeSetter.call(element, newText);
        dispatchReplacementInput(
            element,
            suggestion.correctedText
        );

        if (
            finalizeStandardReplacement(
                element,
                newText,
                caret
            )
        ) {
            return true;
        }
    }

    // Final compatibility fallback: some test harnesses, browser-like
    // environments, and custom wrappers expose a writable value property
    // without exposing the native HTMLInputElement/HTMLTextAreaElement
    // constructor or execCommand path.
    try {
        element.value = newText;
        dispatchReplacementInput(
            element,
            suggestion.correctedText
        );
    } catch (_error) {
        return false;
    }

    return finalizeStandardReplacement(
        element,
        newText,
        caret
    );
}

function stabilizeSmartAutoControlledValue(
    inputElement,
    state
) {
    if (
        !inputElement ||
        !state ||
        inputElement.isContentEditable
    ) {
        return false;
    }

    const currentText =
        getEditableText(inputElement);

    if (currentText === state.expectedText) {
        return true;
    }

    // Never overwrite a real user edit or a new page value. Recovery is
    // allowed only when a controlled host reverted exactly to the original
    // pre-correction field value.
    if (currentText !== state.originalText) {
        return false;
    }

    const nativeSetter =
        getStandardValueSetter(inputElement);

    if (!nativeSetter) {
        return false;
    }

    smartAutoMutationInProgress.add(
        inputElement
    );

    try {
        nativeSetter.call(
            inputElement,
            state.expectedText
        );

        dispatchReplacementInput(
            inputElement,
            state.correctedText
        );

        return finalizeStandardReplacement(
            inputElement,
            state.expectedText,
            state.caret
        );
    } finally {
        smartAutoMutationInProgress.delete(
            inputElement
        );
    }
}

function scheduleSmartAutoControlledStabilization(
    inputElement,
    textBefore,
    suggestion
) {
    if (
        !inputElement ||
        inputElement.isContentEditable
    ) {
        return;
    }

    const expectedText =
        replaceTextRange(
            textBefore,
            suggestion.start,
            suggestion.end,
            suggestion.correctedText
        );

    const state = {
        token: {},
        originalText: textBefore,
        expectedText,
        correctedText:
            suggestion.correctedText,
        caret:
            suggestion.start +
            suggestion.correctedText.length
    };

    smartAutoControlledCommitState.set(
        inputElement,
        state
    );

    for (
        const delay of
        SMART_AUTO_CONTROLLED_STABILIZE_DELAYS
    ) {
        setTimeout(() => {
            const live =
                smartAutoControlledCommitState.get(
                    inputElement
                );

            if (
                !live ||
                live.token !== state.token
            ) {
                return;
            }

            const currentText =
                getEditableText(inputElement);

            if (currentText === state.expectedText) {
                if (
                    delay ===
                    SMART_AUTO_CONTROLLED_STABILIZE_DELAYS[
                        SMART_AUTO_CONTROLLED_STABILIZE_DELAYS.length - 1
                    ]
                ) {
                    smartAutoControlledCommitState.delete(
                        inputElement
                    );
                }

                return;
            }

            const recovered =
                stabilizeSmartAutoControlledValue(
                    inputElement,
                    state
                );

            if (!recovered) {
                smartAutoControlledCommitState.delete(
                    inputElement
                );
            }
        }, delay);
    }
}

function makeSmartAutoEffectiveSuggestion(
    suggestion,
    analysis
) {
    if (
        !suggestion ||
        !analysis?.changed ||
        !analysis.corrected ||
        analysis.corrected ===
            suggestion.originalText
    ) {
        return suggestion;
    }

    if (
        analysis.corrected ===
        suggestion.correctedText
    ) {
        return suggestion;
    }

    return {
        ...suggestion,
        correctedText:
            analysis.corrected,
        mode:
            suggestion.mode
    };
}

function replaceContentEditableRange(element, suggestion) {
    if (
        tryNativeInsertText(
            element,
            suggestion.start,
            suggestion.end,
            suggestion.correctedText
        )
    ) {
        return true;
    }

    const range = createContentEditableRange(
        element,
        suggestion.start,
        suggestion.end
    );

    if (
        !range ||
        typeof document.createTextNode !== 'function' ||
        typeof window.getSelection !== 'function'
    ) {
        return false;
    }

    const replacementNode = document.createTextNode(
        suggestion.correctedText
    );

    range.deleteContents();
    range.insertNode(replacementNode);
    range.setStartAfter(replacementNode);
    range.collapse(true);

    const selection = window.getSelection();

    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    dispatchReplacementInput(element, suggestion.correctedText);

    if (typeof element.focus === 'function') {
        element.focus();
    }

    return true;
}

function applyEditingSuggestion(element, suggestion) {
    if (!isSuggestionCurrent(element, suggestion)) {
        return false;
    }

    return element.isContentEditable
        ? replaceContentEditableRange(element, suggestion)
        : replaceStandardRange(element, suggestion);
}

function armSmartAutoPostCommitProtection(
    inputElement,
    suggestion
) {
    if (!inputElement || !suggestion) {
        return;
    }

    const state = {
        token: {},
        start: suggestion.start,
        end:
            suggestion.start +
            suggestion.correctedText.length,
        originalText:
            suggestion.originalText,
        correctedText:
            suggestion.correctedText,
        until:
            Date.now() +
            SMART_AUTO_POST_COMMIT_MS
    };

    smartAutoPostCommitState.set(
        inputElement,
        state
    );

    setTimeout(() => {
        const live =
            smartAutoPostCommitState.get(
                inputElement
            );

        if (
            live?.token === state.token &&
            Date.now() >= state.until
        ) {
            smartAutoPostCommitState.delete(
                inputElement
            );
        }
    }, SMART_AUTO_POST_COMMIT_MS);
}

function isSmartAutoPostCommitSuggestion(
    inputElement,
    suggestion
) {
    const state =
        smartAutoPostCommitState.get(
            inputElement
        );

    if (!state || Date.now() >= state.until) {
        if (state) {
            smartAutoPostCommitState.delete(
                inputElement
            );
        }

        return false;
    }

    if (!suggestion) {
        return false;
    }

    const currentText =
        getEditableText(inputElement);

    return (
        suggestion.start === state.start &&
        suggestion.end === state.end &&
        suggestion.originalText ===
            state.correctedText &&
        currentText.slice(
            state.start,
            state.end
        ) === state.correctedText
    );
}

function isSmartAutoSuppressed(
    inputElement
) {
    return (
        Number(
            smartAutoSuppressUntil.get(
                inputElement
            )
        ) || 0
    ) > Date.now();
}
function isSmartAutoUndoSurfaceActive(
    inputElement
) {
    return (
        Boolean(suggestionElements.host) &&
        suggestionElements.mode === 'undo' &&
        suggestionElements.inputElement ===
            inputElement &&
        (
            Number(
                smartAutoUndoUntil.get(
                    inputElement
                )
            ) || 0
        ) > Date.now()
    );
}

function clearSmartAutoUndoSurface(
    inputElement
) {
    if (!inputElement) return;

    smartAutoUndoUntil.delete(
        inputElement
    );

    if (
        suggestionElements.mode === 'undo' &&
        suggestionElements.inputElement ===
            inputElement
    ) {
        hideSuggestion();
    }
}

function armSmartAutoUndoSurface(
    inputElement
) {
    const until =
        Date.now() +
        SMART_AUTO_UNDO_VISIBLE_MS;

    smartAutoUndoUntil.set(
        inputElement,
        until
    );

    setTimeout(() => {
        if (
            (
                Number(
                    smartAutoUndoUntil.get(
                        inputElement
                    )
                ) || 0
            ) !== until
        ) {
            return;
        }

        if (
            suggestionElements.mode === 'undo' &&
            suggestionElements.inputElement ===
                inputElement
        ) {
            hideSuggestion();
        } else {
            smartAutoUndoUntil.delete(
                inputElement
            );
        }
    }, SMART_AUTO_UNDO_VISIBLE_MS);
}

function getSmartAutoIntentContext(
    inputElement,
    text,
    suggestion
) {
    return enrichIntentContext(
        buildElementIntentContext(
            inputElement
        ),
        text,
        suggestion.start,
        suggestion.end
    );
}

function isSmartAutoBoundary(
    text,
    selection,
    suggestion
) {
    if (
        !selection ||
        selection.start !== selection.end ||
        selection.start <= suggestion.end
    ) {
        return false;
    }

    const between =
        String(text ?? '').slice(
            suggestion.end,
            selection.start
        );

    return (
        between.length > 0 &&
        /^[\s.,!?،؛:…()[\]{}«»]+$/u
            .test(between)
    );
}

function isSmartAutoRecentBoundaryAtTokenEnd(
    inputElement,
    selection,
    suggestion
) {
    if (
        !selection ||
        selection.start !== selection.end ||
        selection.start !== suggestion.end
    ) {
        return false;
    }

    const state =
        smartAutoInputState.get(
            inputElement
        );

    if (!state) return false;

    const age =
        Date.now() - state.at;

    return (
        age >= 0 &&
        age <= 1400 &&
        /^[\s.,!?،؛:…]$/u.test(
            String(state.data ?? '')
        )
    );
}

function isSmartAutoIdleAtTokenEnd(
    inputElement,
    selection,
    suggestion
) {
    if (
        !selection ||
        selection.start !== selection.end ||
        selection.start !== suggestion.end
    ) {
        return false;
    }

    const state =
        smartAutoInputState.get(
            inputElement
        );

    if (!state) return false;

    return Date.now() - state.at >= 600;
}

function adjustSmartAutoOffset(
    offset,
    suggestion
) {
    const value = Number(offset);

    if (!Number.isFinite(value)) {
        return null;
    }

    if (value <= suggestion.start) {
        return value;
    }

    if (value >= suggestion.end) {
        return (
            value +
            suggestion.correctedText.length -
            suggestion.originalText.length
        );
    }

    return (
        suggestion.start +
        suggestion.correctedText.length
    );
}

function restoreSmartAutoSelection(
    inputElement,
    selectionBefore,
    suggestion
) {
    if (!selectionBefore) {
        return;
    }

    const start =
        adjustSmartAutoOffset(
            selectionBefore.start,
            suggestion
        );
    const end =
        adjustSmartAutoOffset(
            selectionBefore.end,
            suggestion
        );

    if (
        start === null ||
        end === null
    ) {
        return;
    }

    if (!inputElement.isContentEditable) {
        if (
            typeof inputElement.setSelectionRange ===
                'function'
        ) {
            inputElement.setSelectionRange(
                start,
                Math.max(start, end)
            );
        }

        return;
    }

    if (
        typeof window.getSelection !==
            'function'
    ) {
        return;
    }

    const range =
        createContentEditableRange(
            inputElement,
            start,
            Math.max(start, end)
        );

    if (!range) return;

    const selection =
        window.getSelection();

    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
}

function makeSmartAutoUndoSuggestion(
    inputElement,
    suggestion
) {
    const currentText =
        getEditableText(inputElement);

    return {
        fieldText: currentText,
        start: suggestion.start,
        end:
            suggestion.start +
            suggestion.correctedText.length,
        originalText:
            suggestion.correctedText,
        correctedText:
            suggestion.originalText,
        mode: 'undo'
    };
}

function applySmartAutoSuggestion(
    inputElement,
    suggestion
) {
    const textBefore =
        getEditableText(inputElement);
    const selectionBefore =
        getEditableSelection(
            inputElement,
            textBefore
        );

    smartAutoMutationInProgress.add(
        inputElement
    );

    let applied = false;

    try {
        applied =
            applyEditingSuggestion(
                inputElement,
                suggestion
            );
    } finally {
        smartAutoMutationInProgress.delete(
            inputElement
        );
    }

    if (!applied) {
        return false;
    }

    restoreSmartAutoSelection(
        inputElement,
        selectionBefore,
        suggestion
    );

    armSmartAutoPostCommitProtection(
        inputElement,
        suggestion
    );

    const undoSuggestion =
        makeSmartAutoUndoSuggestion(
            inputElement,
            suggestion
        );

    showSuggestion(
        suggestion.originalText,
        suggestion.correctedText,
        inputElement,
        undoSuggestion,
        'undo'
    );

    armSmartAutoUndoSurface(
        inputElement
    );

    scheduleSmartAutoControlledStabilization(
        inputElement,
        textBefore,
        suggestion
    );

    return true;
}

function trySmartAutoCorrection(
    inputElement,
    text,
    selection,
    suggestion
) {
    if (
        !smartAutoEnabled ||
        isSmartAutoSuppressed(
            inputElement
        ) ||
        suggestion.mode === 'selection' ||
        typeof analyzeFsaSmartAutoIntent !==
            'function'
    ) {
        return {
            applied: false,
            suggestion
        };
    }

    const intentContext =
        getSmartAutoIntentContext(
            inputElement,
            text,
            suggestion
        );

    const analysis =
        suggestion.intentAnalysis ||
        analyzeFsaSmartAutoIntent(
            suggestion.originalText,
            intentContext,
            customDictionary
        );

    const effectiveSuggestion =
        makeSmartAutoEffectiveSuggestion(
            suggestion,
            analysis
        );

    if (
        !analysis.changed ||
        !analysis.autoEligible
    ) {
        return {
            applied: false,
            suggestion:
                effectiveSuggestion
        };
    }

    const ready =
        isSmartAutoBoundary(
            text,
            selection,
            effectiveSuggestion
        ) ||
        isSmartAutoRecentBoundaryAtTokenEnd(
            inputElement,
            selection,
            effectiveSuggestion
        ) ||
        isSmartAutoIdleAtTokenEnd(
            inputElement,
            selection,
            effectiveSuggestion
        );

    if (!ready) {
        return {
            applied: false,
            suggestion:
                effectiveSuggestion
        };
    }

    return {
        applied:
            applySmartAutoSuggestion(
                inputElement,
                effectiveSuggestion
            ),
        suggestion:
            effectiveSuggestion
    };
}

function checkForCorrection(inputElement) {
    if (!isAssistantAvailable()) {
        hideSuggestion();
        return;
    }

    if (!isSupportedEditable(inputElement)) {
        return;
    }

    const text =
        getEditableText(inputElement);
    const selection =
        getEditableSelection(
            inputElement,
            text
        );
    const suggestion =
        computeEditingSuggestion(
            text,
            selection.start,
            selection.end,
            customDictionary,
            buildElementIntentContext(
                inputElement
            )
        );

    if (!suggestion) {
        if (
            isSmartAutoUndoSurfaceActive(
                inputElement
            )
        ) {
            return;
        }

        hideSuggestion();
        return;
    }

    if (
        isSmartAutoPostCommitSuggestion(
            inputElement,
            suggestion
        )
    ) {
        // The exact token just produced by Auto correction must not be
        // immediately reconsidered in the opposite direction. Preserve the
        // Undo surface while this token-local protection is active.
        if (
            isSmartAutoUndoSurfaceActive(
                inputElement
            )
        ) {
            return;
        }

        hideSuggestion();
        return;
    }

    const smartAutoResult =
        trySmartAutoCorrection(
            inputElement,
            text,
            selection,
            suggestion
        );

    if (smartAutoResult.applied) {
        return;
    }

    const visibleSuggestion =
        smartAutoResult.suggestion ||
        suggestion;

    showSuggestion(
        visibleSuggestion.correctedText,
        visibleSuggestion.originalText,
        inputElement,
        visibleSuggestion
    );
}

function clampViewportCoordinate(value, minimum, maximum) {
    if (maximum < minimum) return minimum;
    return Math.max(minimum, Math.min(maximum, value));
}

function getViewportSize() {
    const visualViewport = window.visualViewport;

    return {
        width:
            visualViewport?.width ||
            document.documentElement?.clientWidth ||
            window.innerWidth ||
            0,
        height:
            visualViewport?.height ||
            document.documentElement?.clientHeight ||
            window.innerHeight ||
            0
    };
}

function styleOverlayHost(host) {
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.width = '100vw';
    host.style.height = '100vh';
    host.style.pointerEvents = 'none';
    host.style.zIndex = '2147483647';
    host.style.contain = 'layout style';
    host.style.isolation = 'isolate';
}

function styleSuggestionAction(action) {
    action.style.all = 'initial';
    action.style.position = 'fixed';
    action.style.display = 'inline-flex';
    action.style.alignItems = 'center';
    action.style.gap = '7px';
    action.style.boxSizing = 'border-box';
    action.style.maxWidth = 'min(280px, calc(100vw - 8px))';
    action.style.minHeight = '36px';
    action.style.padding = '7px 11px';
    action.style.border = '1px solid #0b57d0';
    action.style.borderRadius = '999px';
    action.style.background = '#ffffff';
    action.style.color = '#0b57d0';
    action.style.boxShadow =
        '0 4px 16px rgba(0, 0, 0, 0.18)';
    action.style.fontFamily =
        'Arial, Tahoma, sans-serif';
    action.style.fontSize = '14px';
    action.style.fontWeight = '600';
    action.style.lineHeight = '20px';
    action.style.direction =
        uiLanguage === 'en' ? 'ltr' : 'rtl';
    action.style.whiteSpace = 'nowrap';
    action.style.overflow = 'hidden';
    action.style.textOverflow = 'ellipsis';
    action.style.cursor = 'pointer';
    action.style.pointerEvents = 'auto';
    action.style.userSelect = 'none';
    action.style.zIndex = '2147483647';
}

function createSuggestionSurface() {
    const documentRoot =
        document.documentElement || document.body;

    if (!documentRoot) return null;

    const host = document.createElement('div');
    host.className = 'farsi-smart-assistant-overlay-host';
    host.setAttribute?.(
        'data-farsi-smart-assistant-overlay',
        'true'
    );

    styleOverlayHost(host);
    documentRoot.appendChild(host);

    let root = host;

    if (typeof host.attachShadow === 'function') {
        try {
            root = host.attachShadow({ mode: 'closed' });
        } catch (_error) {
            root = host;
        }
    }

    return { host, root };
}

function getSuggestionActionViewportPosition(
    inputElement,
    action,
    gap = 6,
    margin = 4
) {
    const inputRect = inputElement.getBoundingClientRect();
    const viewport = getViewportSize();
    const width =
        Number(action.offsetWidth) > 0
            ? Number(action.offsetWidth)
            : 190;
    const height =
        Number(action.offsetHeight) > 0
            ? Number(action.offsetHeight)
            : 36;

    const maxLeft = Math.max(
        margin,
        viewport.width - width - margin
    );
    const maxTop = Math.max(
        margin,
        viewport.height - height - margin
    );

    const inputLeft = Number.isFinite(inputRect.left)
        ? inputRect.left
        : 0;
    const inputRight = Number.isFinite(inputRect.right)
        ? inputRect.right
        : inputLeft;

    const preferredLeft = inputRight - width;
    const below = inputRect.bottom + gap;
    const above = inputRect.top - height - gap;

    const top =
        below + height <= viewport.height - margin
            ? below
            : above;

    return {
        left: clampViewportCoordinate(
            preferredLeft,
            margin,
            maxLeft
        ),
        top: clampViewportCoordinate(
            top,
            margin,
            maxTop
        )
    };
}

function showSuggestion(
    correctedText,
    originalText,
    inputElement,
    suggestion = null,
    surfaceMode = 'suggestion'
) {
    hideSuggestion();

    const surface = createSuggestionSurface();

    if (!surface) return;

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'farsi-smart-suggestion-action';
    action.setAttribute?.(
        'aria-label',
        inlineUiText(
            'inline.replaceWith',
            { text: correctedText }
        )
    );

    styleSuggestionAction(action);

    const marker = document.createElement('span');
    marker.textContent = '✓';
    marker.style.all = 'initial';
    marker.style.display = 'inline-grid';
    marker.style.placeItems = 'center';
    marker.style.flex = '0 0 auto';
    marker.style.width = '20px';
    marker.style.height = '20px';
    marker.style.borderRadius = '50%';
    marker.style.background = '#0b57d0';
    marker.style.color = '#ffffff';
    marker.style.fontFamily =
        'Arial, Tahoma, sans-serif';
    marker.style.fontSize = '13px';
    marker.style.fontWeight = '700';
    marker.style.lineHeight = '20px';

    const prefix = document.createElement('span');
    prefix.textContent = inlineUiText(
        surfaceMode === 'undo'
            ? 'inline.undoPrefix'
            : 'inline.correctionPrefix'
    );
    prefix.style.all = 'initial';
    prefix.style.color = '#4a4a4a';
    prefix.style.fontFamily =
        'Arial, Tahoma, sans-serif';
    prefix.style.fontSize = '13px';
    prefix.style.fontWeight = '500';
    prefix.style.direction =
        uiLanguage === 'en' ? 'ltr' : 'rtl';

    const correctionText = document.createElement('strong');
    correctionText.textContent = correctedText;
    correctionText.style.all = 'initial';
    correctionText.style.color = '#0b57d0';
    correctionText.style.fontFamily =
        'Arial, Tahoma, sans-serif';
    correctionText.style.fontSize = '14px';
    correctionText.style.fontWeight = '700';
    correctionText.style.direction = 'auto';

    action.appendChild(marker);
    action.appendChild(prefix);
    action.appendChild(correctionText);
    surface.root.appendChild(action);

    const capturedSuggestion = suggestion || {
        fieldText: getEditableText(inputElement),
        start: 0,
        end: getEditableText(inputElement).length,
        originalText,
        correctedText,
        mode: 'legacy-test'
    };

    action.onmousedown = (event) => {
        event.preventDefault?.();
    };

    action.onpointerdown = (event) => {
        event.preventDefault?.();
    };

    action.onclick = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();

        if (
            surfaceMode === 'undo' &&
            inputElement
        ) {
            smartAutoSuppressUntil.set(
                inputElement,
                Date.now() + 5000
            );
        }

        const applied = inputElement
            ? applyEditingSuggestion(
                inputElement,
                capturedSuggestion
            )
            : false;

        hideSuggestion();

        if (!applied && inputElement) {
            // Recompute from the live field instead of silently losing
            // the action when a dynamic/controlled input rejects it.
            scheduleCorrectionCheck(inputElement, 0);
        }
    };

    const position =
        getSuggestionActionViewportPosition(
            inputElement,
            action
        );

    action.style.top = `${position.top}px`;
    action.style.left = `${position.left}px`;

    suggestionElements = {
        host: surface.host,
        action,
        prefix,
        correctedText,
        mode: surfaceMode,
        inputElement
    };
}

function hideSuggestion() {
    const undoInputElement =
        suggestionElements.mode === 'undo'
            ? suggestionElements.inputElement
            : null;

    if (suggestionElements.host) {
        suggestionElements.host.remove();
    }

    if (undoInputElement) {
        smartAutoUndoUntil.delete(
            undoInputElement
        );
    }

    suggestionElements = {
        host: null,
        action: null,
        prefix: null,
        correctedText: '',
        mode: '',
        inputElement: null
    };
}

function scheduleCorrectionCheck(inputElement, delay = 450) {
    if (!isSupportedEditable(inputElement)) return;

    const previousTimer = inputTimers.get(inputElement);

    if (previousTimer) {
        clearTimeout(previousTimer);
    }

    const timer = setTimeout(() => {
        inputTimers.delete(inputElement);
        checkForCorrection(inputElement);
    }, delay);

    inputTimers.set(inputElement, timer);
}

function handleInput(event) {
    const inputElement =
        event.currentTarget || event.target;

    if (
        smartAutoMutationInProgress.has(
            inputElement
        )
    ) {
        return;
    }

    const trustedUserInput =
        event.isTrusted === true;

    if (trustedUserInput) {
        smartAutoControlledCommitState.delete(
            inputElement
        );

        clearSmartAutoUndoSurface(
            inputElement
        );
    }

    const data =
        String(event.data ?? '');

    smartAutoInputState.set(
        inputElement,
        {
            at: Date.now(),
            data,
            inputType:
                String(
                    event.inputType || ''
                )
        }
    );

    const boundaryInput =
        /^[\s.,!?،؛:…]$/u.test(
            data
        );

    const delay =
        smartAutoEnabled
            ? boundaryInput
                ? 120
                : 650
            : 450;

    scheduleCorrectionCheck(
        inputElement,
        delay
    );
}

function handleSelectionIntent(event) {
    const inputElement = event.currentTarget || event.target;
    scheduleCorrectionCheck(inputElement, 80);
}

function trackEditable(inputElement) {
    if (!isSupportedEditable(inputElement)) {
        return false;
    }

    activeInput = inputElement;

    if (!trackedInputs.has(inputElement)) {
        inputElement.addEventListener('input', handleInput);
        inputElement.addEventListener('keydown', handleIntentKeydown);

        if (!inputElement.isContentEditable) {
            inputElement.addEventListener(
                'select',
                handleSelectionIntent
            );
        }

        trackedInputs.add(inputElement);
    }

    return true;
}

document.addEventListener('focusin', (event) => {
    trackEditable(event.target);
});

// document_idle can run after a page has already focused its primary
// editable (Google Search is a real example). A document-level fallback
// catches the first edit even when that earlier focusin was missed.
document.addEventListener(
    'input',
    (event) => {
        const inputElement = event.target;

        if (!isSupportedEditable(inputElement)) return;
        if (trackedInputs.has(inputElement)) return;

        trackEditable(inputElement);
        scheduleCorrectionCheck(inputElement, 450);
    },
    true
);

// Bootstrap an editable that was already focused before this content
// script initialized. This closes the document_idle/autofocus gap.
trackEditable(document.activeElement);

document.addEventListener('selectionchange', () => {
    if (!activeInput || !activeInput.isContentEditable) return;

    if (
        document.activeElement &&
        document.activeElement !== activeInput
    ) {
        return;
    }

    scheduleCorrectionCheck(activeInput, 80);
});

document.addEventListener('focusout', (event) => {
    if (event.target === activeInput) {
        activeInput = null;
    }
});

document.addEventListener('click', (event) => {
    const path =
        typeof event.composedPath === 'function'
            ? event.composedPath()
            : [];

    const clickedSuggestion =
        suggestionElements.host &&
        (
            event.target === suggestionElements.host ||
            path.includes(suggestionElements.host)
        );

    if (!clickedSuggestion) {
        hideSuggestion();
    }
});

function hideSuggestionForPassiveViewportChange() {
    if (
        suggestionElements.mode === 'undo' &&
        isSmartAutoUndoSurfaceActive(
            suggestionElements.inputElement
        )
    ) {
        return;
    }

    hideSuggestion();
}

if (typeof window.addEventListener === 'function') {
    window.addEventListener(
        'resize',
        hideSuggestionForPassiveViewportChange
    );
    window.addEventListener(
        'scroll',
        hideSuggestionForPassiveViewportChange,
        true
    );
}
