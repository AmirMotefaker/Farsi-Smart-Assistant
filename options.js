document.addEventListener('DOMContentLoaded', function() {
    const customDictText = document.getElementById('customDictionary');
    const saveDictionaryButton = document.getElementById('saveDictionaryButton');
    const confirmation = document.getElementById('confirmation');
    
    // عناصر جدید برای API Key
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');

    // بارگذاری اطلاعات ذخیره شده
    chrome.storage.sync.get(['customDictionary', 'openai_api_key'], (data) => {
        // بارگذاری دیکشنری شخصی
        if (data.customDictionary) {
            let text = "";
            for (const key in data.customDictionary) {
                text += `${key} = ${data.customDictionary[key]}\n`;
            }
            customDictText.value = text;
        }
        // بارگذاری کلید API
        if (data.openai_api_key) {
            apiKeyInput.value = data.openai_api_key;
        }
    });

    // ذخیره دیکشنری شخصی
    saveDictionaryButton.addEventListener('click', () => {
        const lines = customDictText.value.split('\n');
        const newDict = {};
        for (const line of lines) {
            if (line.includes('=')) {
                const [key, value] = line.split('=').map(item => item.trim());
                if (key && value) {
                    newDict[key] = value;
                }
            }
        }
        chrome.storage.sync.set({ customDictionary: newDict }, () => {
            showConfirmation("دیکشنری ذخیره شد!");
        });
    });

    // ذخیره کلید API
    saveApiKeyButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey && apiKey.startsWith('sk-')) {
            chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
                showConfirmation("کلید API ذخیره شد!");
            });
        } else {
            alert("کلید API وارد شده معتبر به نظر نمی‌رسد. باید با 'sk-' شروع شود.");
        }
    });

    function showConfirmation(message) {
        confirmation.textContent = message;
        confirmation.style.opacity = 1;
        setTimeout(() => { confirmation.style.opacity = 0; }, 2000);
    }
});