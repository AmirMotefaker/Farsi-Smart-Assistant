// =================================================================================
// Farsi Smart Assistant v4 - Universal Web Input Engine (M0)
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

    // Deliberately exclude password/email/url/number and other sensitive or
    // structured fields from automatic correction.
    return type === 'text' || type === 'search';
}

function getEditableText(element) {
    return element.isContentEditable ? element.textContent : element.value;
}

function setEditableText(element, correctedText) {
    if (element.isContentEditable) {
        element.textContent = correctedText;
    } else {
        let nativeSetter = null;
        const tagName = String(element.tagName || '').toUpperCase();

        if (tagName === 'TEXTAREA' && typeof HTMLTextAreaElement !== 'undefined') {
            nativeSetter = Object
                .getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
                ?.set || null;
        } else if (tagName === 'INPUT' && typeof HTMLInputElement !== 'undefined') {
            nativeSetter = Object
                .getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
                ?.set || null;
        }

        if (nativeSetter) {
            nativeSetter.call(element, correctedText);
        } else {
            element.value = correctedText;
        }
    }

    const inputEvent = typeof InputEvent === 'function'
        ? new InputEvent('input', {
            bubbles: true,
            inputType: 'insertReplacementText',
            data: correctedText
        })
        : new Event('input', { bubbles: true });

    element.dispatchEvent(inputEvent);
    element.focus();
}

function checkForCorrection(inputElement) {
    if (!isSupportedEditable(inputElement)) return;

    const text = getEditableText(inputElement);
    const correctedText = smart_farsi_converter(text, customDictionary);

    if (correctedText && correctedText !== text) {
        showSuggestion(correctedText, text, inputElement);
    } else {
        hideSuggestion();
    }
}

function showSuggestion(correctedText, originalText, inputElement) {
    hideSuggestion();

    const icon = document.createElement('div');
    icon.className = 'farsi-sugg-icon';
    icon.setAttribute?.('role', 'button');
    icon.setAttribute?.('aria-label', 'Farsi Smart correction available');
    document.body.appendChild(icon);

    const inputRect = inputElement.getBoundingClientRect();
    icon.style.top = `${window.scrollY + inputRect.top + (inputRect.height / 2) - 11}px`;
    icon.style.left = `${window.scrollX + inputRect.right + 5}px`;

    icon.onclick = (event) => {
        event.stopPropagation();
        showTooltip(correctedText, originalText, inputElement);
    };

    suggestionElements.icon = icon;
}

function showTooltip(correctedText, originalText, inputElement) {
    const tooltip = document.createElement('div');
    tooltip.className = 'farsi-sugg-tooltip';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'جایگزین با: ';

    const strong = document.createElement('strong');
    strong.textContent = correctedText;
    button.appendChild(strong);

    button.onclick = () => {
        if (inputElement) {
            setEditableText(inputElement, correctedText);
        }

        hideSuggestion();
    };

    tooltip.appendChild(button);
    document.body.appendChild(tooltip);

    const iconRect = suggestionElements.icon?.getBoundingClientRect();

    if (iconRect) {
        tooltip.style.top = `${window.scrollY + iconRect.bottom + 5}px`;
        tooltip.style.left = `${window.scrollX + iconRect.right - (tooltip.offsetWidth || 0)}px`;
    }

    suggestionElements.tooltip = tooltip;
}

function hideSuggestion() {
    if (suggestionElements.icon) suggestionElements.icon.remove();
    if (suggestionElements.tooltip) suggestionElements.tooltip.remove();

    suggestionElements = { icon: null, tooltip: null };
}

function handleInput(event) {
    const inputElement = event.currentTarget || event.target;

    if (!isSupportedEditable(inputElement)) return;

    const previousTimer = inputTimers.get(inputElement);

    if (previousTimer) {
        clearTimeout(previousTimer);
    }

    const timer = setTimeout(() => {
        inputTimers.delete(inputElement);
        checkForCorrection(inputElement);
    }, 450);

    inputTimers.set(inputElement, timer);
}

document.addEventListener('focusin', (event) => {
    const inputElement = event.target;

    if (!isSupportedEditable(inputElement)) return;

    activeInput = inputElement;

    if (!trackedInputs.has(inputElement)) {
        inputElement.addEventListener('input', handleInput);
        trackedInputs.add(inputElement);
    }
});

document.addEventListener('focusout', (event) => {
    if (event.target === activeInput) {
        activeInput = null;
    }
});

document.addEventListener('click', (event) => {
    const clickedIcon = event.target === suggestionElements.icon;
    const clickedTooltip = suggestionElements.tooltip?.contains?.(event.target) || false;

    if (!clickedIcon && !clickedTooltip) {
        hideSuggestion();
    }
});