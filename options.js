document.addEventListener('DOMContentLoaded', function() {
    const customDictText = document.getElementById('customDictionary');
    const disabledHostsText = document.getElementById('disabledHosts');
    const saveDictionaryButton = document.getElementById('saveDictionaryButton');
    const saveSitesButton = document.getElementById('saveSitesButton');
    const confirmation = document.getElementById('confirmation');

    function normalizeHostLine(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//u, '')
            .split('/')[0]
            .split(':')[0]
            .replace(/^\.+|\.+$/g, '');
    }

    chrome.storage.sync.get(
        ['customDictionary', 'disabledHosts', 'uiTheme'],
        (data) => {
            const dictionary = data.customDictionary || {};
            customDictText.value = Object
                .entries(dictionary)
                .map(([key, value]) => `${key} = ${value}`)
                .join('\n');

            disabledHostsText.value = Array.isArray(data.disabledHosts)
                ? data.disabledHosts.join('\n')
                : '';

            const theme = data.uiTheme === 'dark'
                ? 'dark'
                : 'light';

            document.documentElement.dataset.theme = theme;
        }
    );

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

    saveSitesButton.addEventListener('click', () => {
        const hosts = Array.from(
            new Set(
                disabledHostsText.value
                    .split('\n')
                    .map(normalizeHostLine)
                    .filter(Boolean)
            )
        ).sort();

        disabledHostsText.value = hosts.join('\n');

        chrome.storage.sync.set(
            { disabledHosts: hosts },
            () => {
                const runtimeError = chrome.runtime.lastError;

                showConfirmation(
                    runtimeError
                        ? `ذخیره انجام نشد: ${runtimeError.message}`
                        : 'فهرست سایت‌های مستثنا ذخیره شد.'
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