document.addEventListener('DOMContentLoaded', function() {
    const i18n = globalThis.FSA_UI_I18N;

    if (!i18n) {
        throw new Error('FSA_UI_I18N is required before site_management.js');
    }

    const disabledHostsText = document.getElementById('disabledHosts');
    const saveSitesButton = document.getElementById('saveSitesButton');
    const confirmation = document.getElementById('confirmation');
    let uiLanguage = 'fa';

    function t(key, variables = {}) {
        return i18n.t(key, uiLanguage, variables);
    }

    function applyLanguage(value) {
        uiLanguage = i18n.applyDocument(value, document);
    }

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
        ['disabledHosts', 'uiTheme', 'uiLanguage'],
        (data) => {
            disabledHostsText.value = Array.isArray(data.disabledHosts)
                ? data.disabledHosts.join('\n')
                : '';

            const theme = data.uiTheme === 'dark'
                ? 'dark'
                : 'light';

            document.documentElement.dataset.theme = theme;
            applyLanguage(data.uiLanguage);
        }
    );

    if (chrome.storage.onChanged?.addListener) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync' || !changes.uiLanguage) return;
            applyLanguage(changes.uiLanguage.newValue);
        });
    }

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
                        ? t('options.saveFailed', { message: runtimeError.message })
                        : t('sites.saved')
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
