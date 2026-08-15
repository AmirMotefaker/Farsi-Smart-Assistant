// background.js (نسخه نهایی و پایدار)

if (typeof importScripts === 'function') {
  try {
    importScripts('language_profiles.js', 'keyboard_layout.js', 'context_intent.js', 'transliteration_intent.js', 'normalization_intent.js', 'logic.js');
  } catch (e) {
    console.error(e);
  }
}

let customDictionary = {};

// تابع کمکی برای بارگذاری دیکشنری شخصی از حافظه
function getSyncStorage(keys) {
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

async function loadCustomDictionary() {
  try {
    const data = await getSyncStorage('customDictionary');
    customDictionary = data.customDictionary || {};
    console.log("Custom dictionary loaded in background.");
  } catch (e) {
    console.error("Error loading custom dictionary:", e);
  }
}

// گوش دادن به تغییرات حافظه برای همگام‌سازی دیکشنری
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.customDictionary) {
    loadCustomDictionary();
  }
});

// --- منوی راست‌کلیک ---
chrome.runtime.onInstalled.addListener(() => {
  loadCustomDictionary(); // بارگذاری اولیه هنگام نصب
  chrome.contextMenus.create({
    id: "smartFarsiAction",
    title: "جستجوی هوشمند برای '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "smartFarsiAction" && info.selectionText) {
    const correctedText = smart_farsi_converter(info.selectionText, customDictionary);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
    chrome.tabs.create({ url: searchUrl });
  }
});

// --- اصلاح خودکار جستجو در نوار آدرس ---
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  const url = new URL(details.url);

  if (url.hostname.includes("google.") && url.pathname.includes("search")) {
    const query = url.searchParams.get('q');

    if (query) {
      const correctedText = smart_farsi_converter(query, customDictionary);

      if (query !== correctedText) {
        const newUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
        chrome.tabs.update(details.tabId, { url: newUrl });
      }
    }
  }
});

// بارگذاری اولیه دیکشنری هنگام شروع به کار اسکریپت
loadCustomDictionary();
// FSA v4.8.0 bilingual toolbar icon sync
const FSA_TOOLBAR_ICON_PATHS = Object.freeze({
  fa: Object.freeze({
    16: 'assets/brand/toolbar/fa-16.png',
    32: 'assets/brand/toolbar/fa-32.png'
  }),
  en: Object.freeze({
    16: 'assets/brand/toolbar/en-16.png',
    32: 'assets/brand/toolbar/en-32.png'
  })
});

function normalizeToolbarLocale(value) {
  return String(value || '').toLowerCase() === 'en' ? 'en' : 'fa';
}

function getToolbarActionApi() {
  return chrome.action || chrome.browserAction || null;
}

function setToolbarIconForLocale(locale) {
  const actionApi = getToolbarActionApi();

  if (!actionApi || typeof actionApi.setIcon !== 'function') {
    return Promise.resolve();
  }

  const resolvedLocale = normalizeToolbarLocale(locale);

  return new Promise((resolve, reject) => {
    actionApi.setIcon(
      { path: FSA_TOOLBAR_ICON_PATHS[resolvedLocale] },
      () => {
        const runtimeError = chrome.runtime.lastError;

        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve();
      }
    );
  });
}

async function syncToolbarIconFromStorage() {
  try {
    const data = await getSyncStorage('uiLanguage');
    await setToolbarIconForLocale(data.uiLanguage);
  } catch (error) {
    console.error('Toolbar icon sync error:', error);
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync' || !changes.uiLanguage) {
    return;
  }

  void setToolbarIconForLocale(changes.uiLanguage.newValue)
    .catch((error) => {
      console.error('Toolbar language icon update error:', error);
    });
});

if (chrome.runtime.onStartup && typeof chrome.runtime.onStartup.addListener === 'function') {
  chrome.runtime.onStartup.addListener(() => {
    void syncToolbarIconFromStorage();
  });
}

void syncToolbarIconFromStorage();
