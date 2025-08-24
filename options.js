document.addEventListener('DOMContentLoaded', function() {
    const customDictText = document.getElementById('customDictionary');
    const saveDictionaryButton = document.getElementById('saveDictionaryButton');
    const confirmation = document.getElementById('confirmation');
    
    chrome.storage.sync.get(['customDictionary'], (data) => {
        if (data.customDictionary) {
            let text = "";
            for (const key in data.customDictionary) {
                text += `${key} = ${data.customDictionary[key]}\n`;
            }
            customDictText.value = text;
        }
    });

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

    function showConfirmation(message) {
        confirmation.textContent = message;
        confirmation.style.opacity = 1;
        setTimeout(() => { confirmation.style.opacity = 0; }, 2000);
    }
});