// =================================================================================
// Farsi Smart Assistant v4 - Universal Web Input Engine (M2 Editing Quality)
// =================================================================================

let activeInput = null;
let suggestionElements = { host: null, action: null };
let customDictionary = {};
let assistantEnabled = true;
let disabledHosts = [];
const trackedInputs = new WeakSet();
const inputTimers = new WeakMap();

chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        customDictionary = data.customDictionary;
    }
});

chrome.storage.sync.get(
    ['assistantEnabled', 'disabledHosts'],
    (data) => {
        assistantEnabled = data.assistantEnabled !== false;
        disabledHosts = Array.isArray(data.disabledHosts)
            ? data.disabledHosts
            : [];
    }
);

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

function computeEditingSuggestion(
    text,
    selectionStart,
    selectionEnd,
    dictionary = customDictionary
) {
    const value = String(text ?? '');
    const start = clampOffset(selectionStart, value.length);
    const end = Math.max(start, clampOffset(selectionEnd, value.length));
    const explicitSelection = end > start;

    const primaryRange = explicitSelection
        ? { start, end }
        : findCurrentTokenRange(value, start);

    if (primaryRange.end > primaryRange.start) {
        const originalText = value.slice(primaryRange.start, primaryRange.end);
        const correctedText = smart_farsi_converter(originalText, dictionary);

        if (correctedText && correctedText !== originalText) {
            return {
                fieldText: value,
                start: primaryRange.start,
                end: primaryRange.end,
                originalText,
                correctedText,
                mode: explicitSelection ? 'selection' : 'token'
            };
        }
    }

    if (!explicitSelection) {
        const phraseRange = findTrailingTwoTokenRange(value, start);

        if (phraseRange) {
            const originalText = value.slice(phraseRange.start, phraseRange.end);
            const correctedText = smart_farsi_converter(originalText, dictionary);

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

    // Controlled inputs (Google, React-style controls, etc.) are most
    // reliable when the native prototype setter updates the DOM value
    // and a bubbling input event informs the page framework.
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

    // Keep the browser-native insert path as a fallback for environments
    // where the prototype value setter is unavailable or rejected.
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

function checkForCorrection(inputElement) {
    if (!isAssistantAvailable()) {
        hideSuggestion();
        return;
    }

    if (!isSupportedEditable(inputElement)) return;

    const text = getEditableText(inputElement);
    const selection = getEditableSelection(inputElement, text);
    const suggestion = computeEditingSuggestion(
        text,
        selection.start,
        selection.end,
        customDictionary
    );

    if (suggestion) {
        showSuggestion(
            suggestion.correctedText,
            suggestion.originalText,
            inputElement,
            suggestion
        );
    } else {
        hideSuggestion();
    }
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
    action.style.direction = 'rtl';
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
    suggestion = null
) {
    hideSuggestion();

    const surface = createSuggestionSurface();

    if (!surface) return;

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'farsi-smart-suggestion-action';
    action.setAttribute?.(
        'aria-label',
        `جایگزین با ${correctedText}`
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
    prefix.textContent = 'اصلاح:';
    prefix.style.all = 'initial';
    prefix.style.color = '#4a4a4a';
    prefix.style.fontFamily =
        'Arial, Tahoma, sans-serif';
    prefix.style.fontSize = '13px';
    prefix.style.fontWeight = '500';
    prefix.style.direction = 'rtl';

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
        action
    };
}

function hideSuggestion() {
    if (suggestionElements.host) {
        suggestionElements.host.remove();
    }

    suggestionElements = {
        host: null,
        action: null
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
    const inputElement = event.currentTarget || event.target;
    scheduleCorrectionCheck(inputElement, 450);
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

if (typeof window.addEventListener === 'function') {
    window.addEventListener('resize', hideSuggestion);
    window.addEventListener('scroll', hideSuggestion, true);
}