// inline_checker.js (Final Version with Form Submission)

let activeInput = null;
let suggestionIcon = null;
let suggestionTooltip = null;
let debounceTimer;
let customDictionary = {};

// Load the user's custom dictionary when the script starts
chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        customDictionary = data.customDictionary;
    }
});

// Listen for when a user focuses on any text box
document.addEventListener('focusin', (e) => {
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        activeInput = e.target;
        activeInput.addEventListener('input', handleInput);
    }
});

// Stop listening when the user clicks away
document.addEventListener('focusout', (e) => {
    if (e.target === activeInput) {
        if (activeInput) activeInput.removeEventListener('input', handleInput);
        activeInput = null;
    }
});

// When the user types, wait a moment before checking for corrections
function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForCorrection, 600);
}

// Check if the typed text needs correction
function checkForCorrection() {
    if (!activeInput) return;
    const text = activeInput.isContentEditable ? activeInput.textContent : activeInput.value;
    const correctedText = smart_farsi_converter(text, customDictionary);
    if (correctedText && correctedText.toLowerCase() !== text.toLowerCase()) {
        showSuggestion(correctedText, text);
    } else {
        hideSuggestion();
    }
}

// Show the suggestion icon next to the text box
function showSuggestion(correctedText, originalText) {
    hideSuggestion();
    suggestionIcon = document.createElement('div');
    suggestionIcon.className = 'farsi-sugg-icon';
    document.body.appendChild(suggestionIcon);
    const inputRect = activeInput.getBoundingClientRect();
    suggestionIcon.style.top = `${window.scrollY + inputRect.top + (inputRect.height / 2) - 11}px`;
    suggestionIcon.style.left = `${window.scrollX + inputRect.right + 5}px`;
    suggestionIcon.onclick = (e) => {
        e.stopPropagation();
        showTooltip(correctedText, originalText);
    };
}

// Show the suggestion tooltip when the icon is clicked
function showTooltip(correctedText, originalText) {
    hideSuggestion();
    suggestionTooltip = document.createElement('div');
    suggestionTooltip.className = 'farsi-sugg-tooltip';
    const suggestionButton = document.createElement('button');
    suggestionButton.innerHTML = `جایگزین و جستجو با: <strong>${correctedText}</strong>`;
    
    // --- THIS IS THE CRITICAL FIX ---
    // This new onclick logic correctly replaces the text AND triggers a search.
    suggestionButton.onclick = () => {
        if (activeInput) {
            // Step 1: Replace text
            if (activeInput.isContentEditable) {
                activeInput.textContent = correctedText;
            } else {
                activeInput.value = correctedText;
            }
            
            // Step 2: Inform the website of the change
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            activeInput.focus();

            // Step 3: Try to submit the form directly (most reliable method)
            const form = activeInput.closest('form');
            if (form) {
                form.submit();
            } else {
                // Fallback: Simulate "Enter" keypress if no form is found
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                    bubbles: true, cancelable: true
                });
                activeInput.dispatchEvent(enterEvent);
            }
        }
        hideSuggestion();
    };

    suggestionTooltip.appendChild(suggestionButton);
    document.body.appendChild(suggestionTooltip);
    const iconRect = suggestionIcon.getBoundingClientRect();
    suggestionTooltip.style.top = `${window.scrollY + iconRect.bottom + 5}px`;
    suggestionTooltip.style.left = `${window.scrollX + iconRect.right - suggestionTooltip.offsetWidth}px`;
}

// Hide all suggestions
function hideSuggestion() {
    if (suggestionIcon) suggestionIcon.remove();
    if (suggestionTooltip) suggestionTooltip.remove();
    suggestionIcon = null;
    suggestionTooltip = null;
}

// Hide suggestions if the user clicks anywhere else on the page
document.addEventListener('click', (e) => {
    if (e.target !== suggestionIcon) {
        hideSuggestion();
    }
});