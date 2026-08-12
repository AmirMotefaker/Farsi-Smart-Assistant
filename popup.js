document.addEventListener('DOMContentLoaded', function() {
    const mainButton = document.getElementById('mainButton');
    const inputText = document.getElementById('inputText');
    const correctedTextBox = document.getElementById('correctedTextBox');
    const knowledgePanel = document.getElementById('knowledgePanel');
    const settingsLink = document.getElementById('settingsLink');
    const manageSitesLink = document.getElementById('manageSitesLink');
    const reportIssueLink = document.getElementById('reportIssueLink');
    const versionDisplay = document.getElementById('version-display');
    const resultContainer = document.getElementById('resultContainer');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const confirmButton = document.getElementById('confirmButton');
    const rejectButton = document.getElementById('rejectButton');
    const saveManualCorrectionButton = document.getElementById('saveManualCorrectionButton');
    const saveConfirmation = document.getElementById('saveConfirmation');
    const themeToggle = document.getElementById('themeToggle');
    const assistantToggle = document.getElementById('assistantToggle');
    const assistantStatusText = document.getElementById('assistantStatusText');
    const currentSiteHost = document.getElementById('currentSiteHost');
    const siteToggleButton = document.getElementById('siteToggleButton');

    let debounceTimer;
    const DEBOUNCE_DELAY = 500;
    let customDictionary = {};
    let currentTermForSearch = '';
    let assistantEnabled = true;
    let disabledHosts = [];
    let activeHost = '';
    let uiTheme = 'light';

    function storageGet(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(keys, (data) => {
                const runtimeError = chrome.runtime.lastError;

                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }

                resolve(data || {});
            });
        });
    }

    function storageSet(values) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(values, () => {
                const runtimeError = chrome.runtime.lastError;

                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }

                resolve();
            });
        });
    }

    function queryCurrentTab() {
        return new Promise((resolve) => {
            if (!chrome.tabs || typeof chrome.tabs.query !== 'function') {
                resolve(null);
                return;
            }

            chrome.tabs.query(
                { active: true, currentWindow: true },
                (tabs) => resolve(Array.isArray(tabs) ? tabs[0] || null : null)
            );
        });
    }

    function normalizeHostname(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, '');
    }

    function hostnameFromUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:'
                ? normalizeHostname(parsed.hostname)
                : '';
        } catch (_error) {
            return '';
        }
    }

    function isHostDisabled(hostname) {
        const host = normalizeHostname(hostname);

        if (!host) return false;

        return disabledHosts.some((entry) => {
            const blocked = normalizeHostname(entry);
            return blocked && (
                host === blocked ||
                host.endsWith(`.${blocked}`)
            );
        });
    }

    function resolveInitialTheme(value) {
        if (value === 'dark' || value === 'light') return value;

        return window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function applyTheme(theme) {
        uiTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = uiTheme;
        themeToggle.setAttribute(
            'aria-label',
            uiTheme === 'dark'
                ? 'فعال کردن حالت روشن'
                : 'فعال کردن حالت تاریک'
        );
    }

    function renderAssistantState() {
        assistantToggle.checked = assistantEnabled;

        if (!assistantEnabled) {
            assistantStatusText.textContent = 'غیرفعال در همه سایت‌ها';
            assistantStatusText.style.color = 'var(--muted)';
        } else if (activeHost && isHostDisabled(activeHost)) {
            assistantStatusText.textContent = 'فعال؛ سایت فعلی مستثنا شده است';
            assistantStatusText.style.color = 'var(--muted)';
        } else {
            assistantStatusText.textContent = 'فعال در سراسر وب';
            assistantStatusText.style.color = 'var(--success)';
        }

        if (!activeHost) {
            currentSiteHost.textContent = 'صفحه مرورگر / داخلی';
            siteToggleButton.textContent = 'در دسترس نیست';
            siteToggleButton.disabled = true;
            return;
        }

        currentSiteHost.textContent = activeHost;
        siteToggleButton.disabled = false;
        siteToggleButton.textContent = isHostDisabled(activeHost)
            ? 'فعال در این سایت'
            : 'غیرفعال در این سایت';
    }

    async function init() {
        const version = chrome.runtime.getManifest().version;
        versionDisplay.textContent = `v${version}`;

        try {
            const data = await storageGet([
                'customDictionary',
                'assistantEnabled',
                'disabledHosts',
                'uiTheme'
            ]);

            customDictionary = data.customDictionary || {};
            assistantEnabled = data.assistantEnabled !== false;
            disabledHosts = Array.isArray(data.disabledHosts)
                ? data.disabledHosts.map(normalizeHostname).filter(Boolean)
                : [];
            applyTheme(resolveInitialTheme(data.uiTheme));

            const activeTab = await queryCurrentTab();
            activeHost = hostnameFromUrl(activeTab?.url || '');
            renderAssistantState();
        } catch (error) {
            console.error('Popup initialization error:', error);
            applyTheme(resolveInitialTheme(null));
            renderAssistantState();
        }

        mainButton.addEventListener('click', () => searchGoogle(currentTermForSearch));

        inputText.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handleRealtimeUpdate, DEBOUNCE_DELAY);
        });

        settingsLink.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        manageSitesLink.addEventListener('click', () => {
            const url = chrome.runtime.getURL('site_management.html');
            chrome.tabs.create({ url });
        });

        reportIssueLink.addEventListener('click', () => {
            const url = 'https://github.com/AmirMotefaker/Farsi-Smart-Assistant/issues/new';
            chrome.tabs.create({ url });
        });

        themeToggle.addEventListener('click', async () => {
            const nextTheme = uiTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);

            try {
                await storageSet({ uiTheme: nextTheme });
            } catch (error) {
                console.error('Theme save error:', error);
            }
        });

        assistantToggle.addEventListener('change', async () => {
            const previous = assistantEnabled;
            assistantEnabled = assistantToggle.checked;
            renderAssistantState();

            try {
                await storageSet({ assistantEnabled });
            } catch (error) {
                assistantEnabled = previous;
                renderAssistantState();
                console.error('Assistant state save error:', error);
            }
        });

        siteToggleButton.addEventListener('click', async () => {
            if (!activeHost) return;

            const previous = [...disabledHosts];

            if (isHostDisabled(activeHost)) {
                disabledHosts = disabledHosts.filter((entry) => {
                    const blocked = normalizeHostname(entry);
                    return !(
                        activeHost === blocked ||
                        activeHost.endsWith(`.${blocked}`)
                    );
                });
            } else {
                disabledHosts = Array.from(
                    new Set([...disabledHosts, activeHost])
                ).sort();
            }

            renderAssistantState();

            try {
                await storageSet({ disabledHosts });
            } catch (error) {
                disabledHosts = previous;
                renderAssistantState();
                console.error('Site state save error:', error);
            }
        });

        confirmButton.addEventListener('click', saveCurrentCorrection);
        rejectButton.addEventListener('click', enableManualCorrection);
        saveManualCorrectionButton.addEventListener('click', saveCurrentCorrection);
    }

    init();

    async function saveCurrentCorrection() {
        const originalText = inputText.value.trim().toLowerCase();
        const correctedText = correctedTextBox.value.trim();

        if (!originalText || !correctedText) return;

        customDictionary[originalText] = correctedText;

        try {
            await storageSet({ customDictionary });
            showConfirmation('اصلاح شما در دیکشنری ذخیره شد.');
            feedbackContainer.style.display = 'none';
            saveManualCorrectionButton.style.display = 'none';
            correctedTextBox.readOnly = true;
        } catch (error) {
            console.error('Dictionary save error:', error);
            showConfirmation('ذخیره اصلاح انجام نشد.');
        }
    }

    function enableManualCorrection() {
        correctedTextBox.readOnly = false;
        correctedTextBox.focus();
        feedbackContainer.style.display = 'none';
        saveManualCorrectionButton.style.display = 'block';
    }

    function showConfirmation(message) {
        saveConfirmation.textContent = message;
        saveConfirmation.style.opacity = 1;
        setTimeout(() => {
            saveConfirmation.style.opacity = 0;
        }, 2500);
    }

    const handleRealtimeUpdate = async () => {
        const query = inputText.value.trim();

        resultContainer.style.display = 'none';
        correctedTextBox.readOnly = true;
        feedbackContainer.style.display = 'none';
        saveManualCorrectionButton.style.display = 'none';

        if (!query) {
            currentTermForSearch = '';
            knowledgePanel.style.display = 'none';
            return;
        }

        knowledgePanel.style.display = 'block';
        const loadingMessage = document.createElement('p');
        loadingMessage.textContent = 'در حال پردازش…';
        knowledgePanel.replaceChildren(loadingMessage);

        try {
            const correctedText = smart_farsi_converter(query, customDictionary);
            currentTermForSearch = correctedText;

            if (query.toLowerCase() !== correctedText.toLowerCase()) {
                correctedTextBox.value = correctedText;
                resultContainer.style.display = 'block';
                feedbackContainer.style.display = 'flex';
            }

            const summaryData = await getWikipediaData(correctedText);
            renderResult(summaryData, correctedText);
        } catch (error) {
            console.error('Realtime update error:', error);
            renderResult(null, query);
        }
    };

    const getWikipediaData = async (term) => {
        if (!term) return null;
        const cachedData = await getFromCache(term);
        if (cachedData) return cachedData;
        const apiData = await fetchWikipediaSummary(term);
        if (apiData) saveToCache(term, apiData);
        return apiData;
    };

    const renderResult = (result, term) => {
        knowledgePanel.replaceChildren();

        if (!result) {
            const noResultMessage = document.createElement('p');
            noResultMessage.textContent = `نتیجه‌ای برای «${term}» یافت نشد.`;
            knowledgePanel.replaceChildren(noResultMessage);
            return;
        }

        const title = document.createElement('h4');
        title.textContent = result.title;
        knowledgePanel.appendChild(title);

        const summary = document.createElement('div');
        summary.id = 'knowledgeSummary';
        summary.textContent = result.summary;
        knowledgePanel.appendChild(summary);
    };

    const searchGoogle = (term) => {
        if (!term) return;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
        chrome.tabs.create({ url: searchUrl });
    };

    function saveToCache(key, value) {
        const cacheData = {
            data: value,
            timestamp: Date.now()
        };
        chrome.storage.local.set({
            [key.toLowerCase()]: cacheData
        });
    }

    async function getFromCache(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get(key.toLowerCase(), (result) => {
                const cacheItem = result[key.toLowerCase()];

                if (
                    cacheItem &&
                    Date.now() - (cacheItem.timestamp || 0) <
                    24 * 60 * 60 * 1000
                ) {
                    resolve(cacheItem.data);
                    return;
                }

                resolve(null);
            });
        });
    }

    async function fetchWikipediaSummary(term) {
        const lang = /[\u0600-\u06FF]/.test(term) ? 'fa' : 'en';
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();

            if (data.type.includes('disambiguation')) {
                return {
                    type: 'disambiguation',
                    title: `"${data.title}" چند معنی دارد:`,
                    summary: data.extract
                };
            }

            const langlinks = data.langlinks || [];
            const otherLang = lang === 'fa' ? 'en' : 'fa';
            const link = langlinks.find((item) => item.lang === otherLang);
            const translation = link ? ` (${link.title})` : '';

            return {
                type: 'summary',
                title: `${data.title}${translation}`,
                summary: data.extract,
                searchTerm: data.title
            };
        } catch (error) {
            console.error('Wikipedia API error:', error);
            return null;
        }
    }
});