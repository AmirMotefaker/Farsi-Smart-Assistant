// background.js (نسخه نهایی و پایدار)

if (typeof importScripts === 'function') {
  try {
    importScripts('keyboard_layout.js', 'logic.js');
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