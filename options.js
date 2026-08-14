document.addEventListener('DOMContentLoaded', function() {
    const i18n = globalThis.FSA_UI_I18N;

    if (!i18n) {
        throw new Error('FSA_UI_I18N is required before options.js');
    }

    const customDictText = document.getElementById('customDictionary');
    const saveDictionaryButton = document.getElementById('saveDictionaryButton');
    const confirmation = document.getElementById('confirmation');
    const smartAutoEnabled = document.getElementById('smartAutoEnabled');
    let uiLanguage = 'fa';

    function t(key, variables = {}) {
        return i18n.t(key, uiLanguage, variables);
    }

    function applyLanguage(value) {
        uiLanguage = i18n.applyDocument(value, document);
    }

    chrome.storage.sync.get(
        ['customDictionary', 'uiTheme', 'smartAutoEnabled', 'uiLanguage'],
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
            applyLanguage(data.uiLanguage);

            smartAutoEnabled.checked =
                data.smartAutoEnabled !== false;
        }
    );

    if (chrome.storage.onChanged?.addListener) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync' || !changes.uiLanguage) return;
            applyLanguage(changes.uiLanguage.newValue);
        });
    }

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
                        ? t('options.saveFailed', { message: runtimeError.message })
                        : smartAutoEnabled.checked
                            ? t('options.smartAutoEnabled')
                            : t('options.smartAutoDisabled')
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
                        ? t('options.saveFailed', { message: runtimeError.message })
                        : t('options.dictionarySaved')
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
