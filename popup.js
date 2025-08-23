document.addEventListener('DOMContentLoaded', function() {
    // --- UI Elements ---
    const mainButton = document.getElementById('mainButton');
    const inputText = document.getElementById('inputText');
    const correctedTextBox = document.getElementById('correctedTextBox');
    const knowledgePanel = document.getElementById('knowledgePanel');
    const settingsLink = document.getElementById('settingsLink');
    const versionDisplay = document.getElementById('version-display');
    const saveCorrectionButton = document.getElementById('saveCorrectionButton');
    const saveConfirmation = document.getElementById('saveConfirmation');
    
    // --- Management Variables ---
    let debounceTimer;
    const DEBOUNCE_DELAY = 500;
    let customDictionary = {};
    let currentTermForSearch = '';

    // --- Main Initializer ---
    async function init() {
        const version = chrome.runtime.getManifest().version;
        if (versionDisplay) versionDisplay.textContent = `v${version}`;
        try {
            const data = await chrome.storage.sync.get('customDictionary');
            if (data.customDictionary) customDictionary = data.customDictionary;
        } catch (e) { console.error("Error loading custom dictionary:", e); }

        mainButton.addEventListener('click', () => searchGoogle(currentTermForSearch));
        inputText.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handleRealtimeUpdate, DEBOUNCE_DELAY);
        });
        settingsLink.addEventListener('click', (event) => {
            event.preventDefault();
            chrome.runtime.openOptionsPage();
        });
        
        // --- User Learning Logic ---
        correctedTextBox.addEventListener('input', () => {
            saveCorrectionButton.style.display = 'block';
            saveCorrectionButton.textContent = 'ذخیره اصلاح در دیکشنری';
            saveCorrectionButton.style.backgroundColor = '#28a745';
        });

        saveCorrectionButton.addEventListener('click', () => {
            const originalText = inputText.value.trim().toLowerCase();
            const correctedText = correctedTextBox.value.trim();
            if (originalText && correctedText) {
                customDictionary[originalText] = correctedText;
                chrome.storage.sync.set({ customDictionary: customDictionary }, () => {
                    saveCorrectionButton.textContent = 'ذخیره شد!';
                    saveCorrectionButton.style.backgroundColor = '#6c757d';
                    saveConfirmation.textContent = "اصلاح شما ذخیره شد!";
                    saveConfirmation.style.opacity = 1;
                    setTimeout(() => {
                        saveCorrectionButton.style.display = 'none';
                        saveConfirmation.style.opacity = 0;
                    }, 2000);
                });
            }
        });
    }

    // --- Main Real-time Handler (CORRECTED LOGIC) ---
    const handleRealtimeUpdate = async () => {
        const query = inputText.value.trim();
        correctedTextBox.style.display = 'none';
        saveCorrectionButton.style.display = 'none';
        if (!query) {
            knowledgePanel.style.display = 'none';
            return;
        }
        knowledgePanel.style.display = 'block';
        knowledgePanel.innerHTML = '<p>در حال پردازش...</p>';
        try {
            let termForSearch = query;
            // STEP 1: Check Wikipedia with the original query first.
            let summaryData = await getWikipediaData(query);

            // STEP 2: Only if the original query fails, then try to correct it.
            if (!summaryData) {
                const correctedText = smart_farsi_converter(query, customDictionary);
                
                if (query.toLowerCase() !== correctedText.toLowerCase()) {
                    termForSearch = correctedText;
                    correctedTextBox.value = correctedText;
                    correctedTextBox.style.display = 'block';
                    summaryData = await getWikipediaData(correctedText);
                }
            }
            
            currentTermForSearch = termForSearch;
            renderResult(summaryData, termForSearch);

        } catch (error) {
            console.error("An error occurred in handleRealtimeUpdate:", error);
            renderResult(null, query);
        }
    };
    
    // --- All other helper functions remain the same ---
    const getWikipediaData = async (term) => { if (!term) return null; const cachedData = await getFromCache(term); if (cachedData) return cachedData; const apiData = await fetchWikipediaSummary(term); if (apiData) saveToCache(term, apiData); return apiData; };
    const renderResult = (result, term) => { knowledgePanel.innerHTML = ''; if (!result) { knowledgePanel.innerHTML = `<p>نتیجه‌ای برای «${term}» یافت نشد.</p>`; return; } const title = document.createElement('h4'); title.textContent = result.title; knowledgePanel.appendChild(title); if (result.type === 'disambiguation') { const summary = document.createElement('div'); summary.innerHTML = result.summary; knowledgePanel.appendChild(summary); } else { const summary = document.createElement('div'); summary.id = 'knowledgeSummary'; summary.innerHTML = result.summary; knowledgePanel.appendChild(summary); } };
    const searchGoogle = (term) => { if (term) { const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`; chrome.tabs.create({ url: searchUrl }); } };
    function saveToCache(key, value) { const cacheData = { data: value, timestamp: Date.now() }; chrome.storage.local.set({ [key.toLowerCase()]: cacheData }); }
    async function getFromCache(key) { const result = await chrome.storage.local.get(key.toLowerCase()); const cacheItem = result[key.toLowerCase()]; if (cacheItem && (Date.now() - (cacheItem.timestamp || 0) < (24*60*60*1000))) { return cacheItem.data; } return null; }
    async function fetchWikipediaSummary(term) { const lang = /[\u0600-\u06FF]/.test(term) ? 'fa' : 'en'; const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`; try { const response = await fetch(url); if (!response.ok) return null; const data = await response.json(); if (data.type.includes('disambiguation')) { return { type: 'disambiguation', title: `"${data.title}" چند معنی دارد:`, summary: data.extract_html }; } const langlinks = data.langlinks || []; const otherLang = lang === 'fa' ? 'en' : 'fa'; const link = langlinks.find(l => l.lang === otherLang); const translation = link ? ` (${link.title})` : ''; return { type: 'summary', title: `${data.title}${translation}`, summary: data.extract_html, searchTerm: data.title }; } catch (error) { console.error("Wikipedia API Error:", error); return null; } }
    
    init();
});