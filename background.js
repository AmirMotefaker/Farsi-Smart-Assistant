try {
  importScripts('logic.js');
} catch (e) { console.error(e); }

let customDictionary = {};

async function loadCustomDictionary() {
  try {
    const data = await chrome.storage.sync.get('customDictionary');
    customDictionary = data.customDictionary || {};
    console.log("Custom dictionary loaded.");
  } catch (e) { console.error("Error loading custom dictionary:", e); }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.customDictionary) {
    loadCustomDictionary();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  loadCustomDictionary();
  chrome.contextMenus.create({
    id: "smartFarsiAction",
    title: "جستجوی هوشمند برای '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "smartFarsiAction" && info.selectionText) {
    const correctedText = smart_farsi_converter(info.selectionText, customDictionary);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
    chrome.tabs.create({ url: searchUrl });
  }
});

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

loadCustomDictionary();