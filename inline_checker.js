let activeInput = null;
let suggestionIcon = null;
let suggestionTooltip = null;
let debounceTimer;

// پیدا کردن تمام کادرهای متنی در صفحه
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        activeInput = e.target;
        activeInput.addEventListener('input', handleInput);
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target === activeInput) {
        activeInput.removeEventListener('input', handleInput);
        activeInput = null;
    }
});

function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForCorrection, 500);
}

async function checkForCorrection() {
    if (!activeInput) return;
    const text = activeInput.value;
    const lastWord = text.split(/[\s,.]+/).pop();
    if (!lastWord) {
        hideSuggestion();
        return;
    }

    // از مغز اصلی (logic.js) برای تبدیل استفاده می‌کنیم
    const correctedWord = smart_farsi_converter(lastWord);

    if (correctedWord && correctedWord.toLowerCase() !== lastWord.toLowerCase()) {
        showSuggestion(correctedWord, lastWord);
    } else {
        hideSuggestion();
    }
}

function showSuggestion(correctedWord, originalWord) {
    hideSuggestion(); // حذف پیشنهاد قبلی

    // ساخت آیکون شناور
    suggestionIcon = document.createElement('div');
    suggestionIcon.className = 'farsi-sugg-icon';
    document.body.appendChild(suggestionIcon);

    const inputRect = activeInput.getBoundingClientRect();
    suggestionIcon.style.top = `${window.scrollY + inputRect.top}px`;
    suggestionIcon.style.left = `${window.scrollX + inputRect.left - 25}px`; // نمایش در سمت چپ کادر

    suggestionIcon.onclick = () => {
        showTooltip(correctedWord, originalWord);
    };
}

function showTooltip(correctedWord, originalWord) {
    // ساخت پاپ‌آپ شناور
    suggestionTooltip = document.createElement('div');
    suggestionTooltip.className = 'farsi-sugg-tooltip';
    
    const suggestionButton = document.createElement('button');
    suggestionButton.innerHTML = `جایگزین با: <strong>${correctedWord}</strong>`;
    suggestionButton.onclick = () => {
        const fullText = activeInput.value;
        const newText = fullText.substring(0, fullText.lastIndexOf(originalWord)) + correctedText;
        activeInput.value = newText;
        hideSuggestion();
    };

    suggestionTooltip.appendChild(suggestionButton);
    document.body.appendChild(suggestionTooltip);

    // موقعیت‌دهی پاپ‌آپ شناور
    const iconRect = suggestionIcon.getBoundingClientRect();
    suggestionTooltip.style.top = `${window.scrollY + iconRect.bottom + 5}px`;
    suggestionTooltip.style.left = `${window.scrollX + iconRect.left}px`;
}

function hideSuggestion() {
    if (suggestionIcon) {
        suggestionIcon.remove();
        suggestionIcon = null;
    }
    if (suggestionTooltip) {
        suggestionTooltip.remove();
        suggestionTooltip = null;
    }
}

// اگر کاربر جای دیگری کلیک کرد، پیشنهاد را مخفی کن
document.addEventListener('click', (e) => {
    if (e.target !== suggestionIcon) {
        hideSuggestion();
    }
});