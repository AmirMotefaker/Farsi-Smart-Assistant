document.addEventListener('DOMContentLoaded', function() {
    const customDictText = document.getElementById('customDictionary');
    const saveDictionaryButton = document.getElementById('saveDictionaryButton');
    const confirmation = document.getElementById('confirmation');
    const smartAutoEnabled = document.getElementById('smartAutoEnabled');

    chrome.storage.sync.get(
        ['customDictionary', 'uiTheme', 'smartAutoEnabled'],
        (data) => {
            const dictionary = data.customDictionary || {};
            customDictText.value = Object
                .entries(dictionary)
                .map(([key, value]) => `${key} = ${value}`)
                .join('\n');

            const theme = data.uiTheme === 'dark'
                ? 'dark'
                : 'light';

            document.documentElement.dataset.theme = theme;

            smartAutoEnabled.checked =
                data.smartAutoEnabled !== false;
        }
    );

    smartAutoEnabled.addEventListener('change', () => {
        chrome.storage.sync.set(
            {
                smartAutoEnabled:
                    smartAutoEnabled.checked
            },
            () => {
                const runtimeError =
                    chrome.runtime.lastError;

                showConfirmation(
                    runtimeError
                        ? `ذخیره انجام نشد: ${runtimeError.message}`
                        : smartAutoEnabled.checked
                            ? 'Smart Auto فعال شد.'
                            : 'Smart Auto غیرفعال شد.'
                );
            }
        );
    });

    saveDictionaryButton.addEventListener('click', () => {
        const lines = customDictText.value.split('\n');
        const newDictionary = {};

        for (const line of lines) {
            const separator = line.indexOf('=');
            if (separator < 0) continue;

            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim();

            if (key && value) {
                newDictionary[key] = value;
            }
        }

        chrome.storage.sync.set(
            { customDictionary: newDictionary },
            () => {
                const runtimeError = chrome.runtime.lastError;

                showConfirmation(
                    runtimeError
                        ? `ذخیره انجام نشد: ${runtimeError.message}`
                        : 'دیکشنری ذخیره شد.'
                );
            }
        );
    });

    function showConfirmation(message) {
        confirmation.textContent = message;
        confirmation.style.opacity = 1;

        setTimeout(() => {
            confirmation.style.opacity = 0;
        }, 2200);
    }
});