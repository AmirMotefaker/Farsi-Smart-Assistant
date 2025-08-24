// =================================================================================
// 1. STATE MANAGEMENT & SETUP
// =================================================================================

let activeInput = null; // Keeps track of the currently focused input field.
let suggestionElements = { icon: null, tooltip: null }; // Holds the UI elements.
let debounceTimer = null; // Timer for real-time checks.
let customDictionary = {}; // Holds the user's personal dictionary.

// Load the custom dictionary from storage when the script starts.
chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        customDictionary = data.customDictionary;
    }
});

// =================================================================================
// 2. CORE LOGIC
// =================================================================================

/**
 * Checks the text in the active input for potential corrections.
 */
function checkForCorrection() {
    if (!activeInput) return;

    const text = activeInput.isContentEditable ? activeInput.textContent : activeInput.value;
    // We check the entire text to handle multi-word phrases from the dictionary.
    const correctedText = smart_farsi_converter(text, customDictionary);

    if (correctedText && correctedText.toLowerCase() !== text.toLowerCase()) {
        showSuggestion(correctedText, text);
    } else {
        hideSuggestion();
    }
}

// =================================================================================
// 3. UI MANAGEMENT (CREATING & DISPLAYING SUGGESTIONS)
// =================================================================================

/**
 * Creates and displays the suggestion icon next to the active input field.
 * @param {string} correctedText - The corrected version of the text.
 * @param {string} originalText - The original text that was corrected.
 */
function showSuggestion(correctedText, originalText) {
    hideSuggestion(); // Remove any previous suggestions first.

    // Create and position the icon
    const icon = document.createElement('div');
    icon.className = 'farsi-sugg-icon';
    document.body.appendChild(icon);
    
    const inputRect = activeInput.getBoundingClientRect();
    icon.style.top = `${window.scrollY + inputRect.top + (inputRect.height / 2) - 11}px`;
    icon.style.left = `${window.scrollX + inputRect.right + 5}px`;

    // When the icon is clicked, show the tooltip.
    icon.onclick = (e) => {
        e.stopPropagation();
        showTooltip(correctedText, originalText);
    };
    
    suggestionElements.icon = icon;
}

/**
 * Creates and displays the tooltip with the correction suggestion.
 * @param {string} correctedText - The corrected version of the text.
 * @param {string} originalText - The original text that was corrected.
 */
function showTooltip(correctedText, originalText) {
    // Create the tooltip container
    const tooltip = document.createElement('div');
    tooltip.className = 'farsi-sugg-tooltip';
    
    // Create the suggestion button
    const button = document.createElement('button');
    button.innerHTML = `جایگزین با: <strong>${correctedText}</strong>`;
    
    button.onclick = () => {
        if (activeInput) {
            // Replace the text in the input field
            if (activeInput.isContentEditable) {
                activeInput.textContent = correctedText;
            } else {
                activeInput.value = correctedText;
            }
            
            // Dispatch an event to let the website know the input has changed
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            activeInput.focus();

            // Try to submit the form (most reliable way to trigger a search)
            const form = activeInput.closest('form');
            if (form) {
                form.submit();
            }
        }
        hideSuggestion();
    };

    tooltip.appendChild(button);
    document.body.appendChild(tooltip);

    // Position the tooltip relative to the icon
    const iconRect = suggestionElements.icon.getBoundingClientRect();
    tooltip.style.top = `${window.scrollY + iconRect.bottom + 5}px`;
    tooltip.style.left = `${window.scrollX + iconRect.right - tooltip.offsetWidth}px`;
    
    suggestionElements.tooltip = tooltip;
}

/**
 * Removes the suggestion icon and tooltip from the page.
 */
function hideSuggestion() {
    if (suggestionElements.icon) suggestionElements.icon.remove();
    if (suggestionElements.tooltip) suggestionElements.tooltip.remove();
    suggestionElements = { icon: null, tooltip: null };
}

// =================================================================================
// 4. EVENT LISTENERS
// =================================================================================

/**
 * Handles the user typing in a text field, with a debounce delay.
 */
function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForCorrection, 600);
}

// Listen for focus on any text field on the page.
document.addEventListener('focusin', (e) => {
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        activeInput = e.target;
        activeInput.addEventListener('input', handleInput);
    }
});

// Stop listening when the user leaves the text field.
document.addEventListener('focusout', (e) => {
    if (e.target === activeInput) {
        if (activeInput) activeInput.removeEventListener('input', handleInput);
        activeInput = null;
    }
});

// If the user clicks anywhere else, hide the suggestions.
document.addEventListener('click', (e) => {
    if (e.target !== suggestionElements.icon) {
        hideSuggestion();
    }
});