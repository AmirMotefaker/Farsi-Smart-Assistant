document.addEventListener('DOMContentLoaded', function() {
    const disabledHostsText = document.getElementById('disabledHosts');
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
        ['disabledHosts', 'uiTheme'],
        (data) => {
            disabledHostsText.value = Array.isArray(data.disabledHosts)
                ? data.disabledHosts.join('\n')
                : '';

            const theme = data.uiTheme === 'dark'
                ? 'dark'
                : 'light';

            document.documentElement.dataset.theme = theme;
        }
    );

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