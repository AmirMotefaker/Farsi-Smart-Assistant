document.addEventListener('DOMContentLoaded', function() {
    // --- UI Elements ---
    const mainButton = document.getElementById('mainButton');
    const inputText = document.getElementById('inputText');
    const correctedTextBox = document.getElementById('correctedText');
    const knowledgePanel = document.getElementById('knowledgePanel');
    const settingsLink = document.getElementById('settingsLink');
    
    // --- Management Variables ---
    let debounceTimer;
    const DEBOUNCE_DELAY = 500;
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    // ==========================================================
    // Main function that handles the entire process
    // ==========================================================
    const handleQuery = async () => {
        const query = inputText.value.trim();
        correctedTextBox.style.display = 'none'; // Always hide at the start of a new query
        if (!query) {
            knowledgePanel.style.display = 'none';
            return;
        }

        knowledgePanel.style.display = 'block';
        knowledgePanel.innerHTML = '<p>در حال جستجو...</p>';

        try {
            let termForSearch = query;
            let summaryData = await getWikipediaData(query);

            // This is the crucial fix: ONLY if the original query fails, we try to correct it.
            if (!summaryData) {
                const correctedText = smart_farsi_converter(query);
                
                if (query.toLowerCase() !== correctedText.toLowerCase()) {
                    termForSearch = correctedText;
                    // Show the correction to the user
                    correctedTextBox.value = correctedText;
                    correctedTextBox.style.display = 'block';
                    // Search again with the corrected text
                    summaryData = await getWikipediaData(correctedText);
                }
            }
            
            renderResult(summaryData, termForSearch);

        } catch (error) {
            console.error("An error occurred in handleQuery:", error);
            renderResult(null, query);
        }
    };

    // --- Function to get data from cache or API ---
    const getWikipediaData = async (term) => {
        if (!term) return null;
        const cachedData = await getFromCache(term);
        if (cachedData) return cachedData;
        const apiData = await fetchWikipediaSummary(term);
        if (apiData) saveToCache(term, apiData);
        return apiData;
    };

    // --- Function to render the result in the panel ---
    const renderResult = (result, term) => {
        knowledgePanel.innerHTML = '';
        if (!result) {
            const title = document.createElement('div');
            title.textContent = `نتیجه‌ای برای «${term}» یافت نشد`;
            const googleButton = createGoogleSearchButton(term);
            knowledgePanel.appendChild(title);
            knowledgePanel.appendChild(googleButton);
            return;
        }
        const title = document.createElement('h4');
        title.textContent = result.title;
        knowledgePanel.appendChild(title);
        if (result.type === 'disambiguation') {
            const summary = document.createElement('div');
            summary.innerHTML = result.summary;
            knowledgePanel.appendChild(summary);
        } else {
            const summary = document.createElement('div');
            summary.id = 'knowledgeSummary';
            summary.innerHTML = result.summary;
            const googleButton = createGoogleSearchButton(result.searchTerm || term);
            knowledgePanel.appendChild(summary);
            knowledgePanel.appendChild(googleButton);
        }
    };
    
    // --- Function to create the Google search button ---
    const createGoogleSearchButton = (term) => {
        const button = document.createElement('button');
        button.className = 'secondary-button';
        button.textContent = 'اطلاعات بیشتر در گوگل';
        button.onclick = () => {
            if (term) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
                chrome.tabs.create({ url: searchUrl });
            }
        };
        return button;
    };

    // --- Event Listeners ---
    mainButton.addEventListener('click', handleQuery);
    inputText.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleQuery, DEBOUNCE_DELAY);
    });
    settingsLink.addEventListener('click', (event) => {
        event.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    // --- Cache and API Functions (Complete implementations) ---
    function saveToCache(key, value) { const cacheData = { data: value, timestamp: Date.now() }; chrome.storage.local.set({ [key.toLowerCase()]: cacheData }); }
    async function getFromCache(key) { const result = await chrome.storage.local.get(key.toLowerCase()); const cacheItem = result[key.toLowerCase()]; if (cacheItem && (Date.now() - cacheItem.timestamp < CACHE_DURATION)) { return cacheItem.data; } return null; }
    async function fetchWikipediaSummary(term, isRetry = false) { const lang = /[\u0600-\u06FF]/.test(term) ? 'fa' : 'en'; let searchTerm = term; if (isRetry) { searchTerm = (lang === 'fa') ? term + ' (باشگاه فوتبال)' : term + ' (football club)'; } const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`; try { const response = await fetch(url); if (!response.ok) return null; const data = await response.json(); if (data.type.includes('disambiguation')) { return { type: 'disambiguation', title: `"${data.title}" چند معنی دارد:`, summary: data.extract_html }; } const langlinks = data.langlinks || []; const otherLang = lang === 'fa' ? 'en' : 'fa'; const link = langlinks.find(l => l.lang === otherLang); const translation = link ? ` (${link.title})` : ''; return { type: 'summary', title: `${data.title}${translation}`, summary: data.extract_html, searchTerm: data.title }; } catch (error) { console.error("Wikipedia API Error:", error); return null; } }
});