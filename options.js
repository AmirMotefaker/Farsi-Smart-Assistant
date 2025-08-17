// options.js
const customDictText = document.getElementById('customDictionary');
const saveButton = document.getElementById('saveOptionsButton');
const confirmation = document.getElementById('confirmation');

// بارگذاری دیکشنری ذخیره شده
chrome.storage.sync.get('customDictionary', (data) => {
    if (data.customDictionary) {
        let text = "";
        for (const key in data.customDictionary) {
            text += `${key} = ${data.customDictionary[key]}\n`;
        }
        customDictText.value = text;
    }
});

// ذخیره تغییرات
saveButton.addEventListener('click', () => {
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
        confirmation.style.opacity = 1;
        setTimeout(() => { confirmation.style.opacity = 0; }, 2000);
    });
});