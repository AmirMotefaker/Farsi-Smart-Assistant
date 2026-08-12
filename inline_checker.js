// =================================================================================
// Farsi Smart Assistant v4 - Universal Web Input Engine (M2 Editing Quality)
// =================================================================================

let activeInput = null;
let suggestionElements = { icon: null, tooltip: null };
let customDictionary = {};
const trackedInputs = new WeakSet();
const inputTimers = new WeakMap();

chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        customDictionary = data.customDictionary;
    }
});

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

function replaceStandardRange(element, suggestion) {
    const text = getEditableText(element);
    const newText = replaceTextRange(
        text,
        suggestion.start,
        suggestion.end,
        suggestion.correctedText
    );
    const caret = suggestion.start + suggestion.correctedText.length;

    if (
        tryNativeInsertText(
            element,
            suggestion.start,
            suggestion.end,
            suggestion.correctedText
        )
    ) {
        if (typeof element.setSelectionRange === 'function') {
            element.setSelectionRange(caret, caret);
        }

        return true;
    }

    let nativeSetter = null;
    const tagName = String(element.tagName || '').toUpperCase();

    if (
        tagName === 'TEXTAREA' &&
        typeof HTMLTextAreaElement !== 'undefined'
    ) {
        nativeSetter = Object
            .getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value'
            )?.set || null;
    } else if (
        tagName === 'INPUT' &&
        typeof HTMLInputElement !== 'undefined'
    ) {
        nativeSetter = Object
            .getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value'
            )?.set || null;
    }

    if (nativeSetter) {
        nativeSetter.call(element, newText);
    } else {
        element.value = newText;
    }

    dispatchReplacementInput(element, suggestion.correctedText);

    if (typeof element.focus === 'function') {
        element.focus();
    }

    if (typeof element.setSelectionRange === 'function') {
        element.setSelectionRange(caret, caret);
    }

    return true;
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

function getSuggestionIconViewportPosition(
    inputElement,
    iconSize = 22,
    gap = 5,
    margin = 4
) {
    const inputRect = inputElement.getBoundingClientRect();
    const viewport = getViewportSize();
    const maxLeft = Math.max(margin, viewport.width - iconSize - margin);
    const maxTop = Math.max(margin, viewport.height - iconSize - margin);

    const preferredRight = inputRect.right + gap;
    const preferredLeft = inputRect.left - iconSize - gap;

    let left = preferredRight;

    if (preferredRight + iconSize > viewport.width - margin) {
        left = preferredLeft >= margin
            ? preferredLeft
            : inputRect.right - iconSize;
    }

    const top =
        inputRect.top +
        (inputRect.height / 2) -
        (iconSize / 2);

    return {
        left: clampViewportCoordinate(left, margin, maxLeft),
        top: clampViewportCoordinate(top, margin, maxTop)
    };
}

function getOverlayHost() {
    return document.documentElement || document.body;
}

function showSuggestion(
    correctedText,
    originalText,
    inputElement,
    suggestion = null
) {
    hideSuggestion();

    const icon = document.createElement('div');
    icon.className = 'farsi-sugg-icon';
    icon.setAttribute?.('role', 'button');
    icon.setAttribute?.(
        'aria-label',
        'Farsi Smart correction available'
    );

    const overlayHost = getOverlayHost();

    if (!overlayHost) return;

    overlayHost.appendChild(icon);

    const iconPosition =
        getSuggestionIconViewportPosition(inputElement);

    icon.style.top = `${iconPosition.top}px`;
    icon.style.left = `${iconPosition.left}px`;

    icon.onclick = (event) => {
        event.stopPropagation();
        showTooltip(
            correctedText,
            originalText,
            inputElement,
            suggestion
        );
    };

    suggestionElements.icon = icon;
}

function showTooltip(
    correctedText,
    originalText,
    inputElement,
    suggestion = null
) {
    const tooltip = document.createElement('div');
    tooltip.className = 'farsi-sugg-tooltip';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'جایگزین با: ';

    const strong = document.createElement('strong');
    strong.textContent = correctedText;
    button.appendChild(strong);

    const capturedSuggestion = suggestion || {
        fieldText: getEditableText(inputElement),
        start: 0,
        end: getEditableText(inputElement).length,
        originalText,
        correctedText,
        mode: 'legacy-test'
    };

    button.onclick = () => {
        if (inputElement) {
            applyEditingSuggestion(
                inputElement,
                capturedSuggestion
            );
        }

        hideSuggestion();
    };

    tooltip.appendChild(button);

    const overlayHost = getOverlayHost();

    if (!overlayHost) return;

    overlayHost.appendChild(tooltip);

    const iconRect =
        suggestionElements.icon?.getBoundingClientRect();

    if (iconRect) {
        const viewport = getViewportSize();
        const margin = 4;
        const gap = 5;
        const width = tooltip.offsetWidth || 150;
        const height = tooltip.offsetHeight || 40;
        const maxLeft = Math.max(
            margin,
            viewport.width - width - margin
        );
        const maxTop = Math.max(
            margin,
            viewport.height - height - margin
        );

        const left = clampViewportCoordinate(
            iconRect.right - width,
            margin,
            maxLeft
        );

        const below = iconRect.bottom + gap;
        const above = iconRect.top - height - gap;
        const top =
            below + height <= viewport.height - margin
                ? below
                : above;

        tooltip.style.top =
            `${clampViewportCoordinate(top, margin, maxTop)}px`;
        tooltip.style.left = `${left}px`;
    }

    suggestionElements.tooltip = tooltip;
}

function hideSuggestion() {
    if (suggestionElements.icon) {
        suggestionElements.icon.remove();
    }

    if (suggestionElements.tooltip) {
        suggestionElements.tooltip.remove();
    }

    suggestionElements = {
        icon: null,
        tooltip: null
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

document.addEventListener('focusin', (event) => {
    const inputElement = event.target;

    if (!isSupportedEditable(inputElement)) return;

    activeInput = inputElement;

    if (!trackedInputs.has(inputElement)) {
        inputElement.addEventListener('input', handleInput);

        if (!inputElement.isContentEditable) {
            inputElement.addEventListener('select', handleSelectionIntent);
        }

        trackedInputs.add(inputElement);
    }
});

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
    const clickedIcon =
        event.target === suggestionElements.icon;
    const clickedTooltip =
        suggestionElements.tooltip?.contains?.(event.target) || false;

    if (!clickedIcon && !clickedTooltip) {
        hideSuggestion();
    }
});

if (typeof window.addEventListener === 'function') {
    window.addEventListener('resize', hideSuggestion);
    window.addEventListener('scroll', hideSuggestion, true);
}