try {
  importScripts('logic.js');
} catch (e) {
  console.error(e);
}

// --- Context Menu Logic ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "smartFarsiAction",
    title: "جستجوی هوشمند برای '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "smartFarsiAction" && info.selectionText) {
    const correctedText = smart_farsi_converter(info.selectionText);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
    chrome.tabs.create({ url: searchUrl });
  }
});

// --- NEW: Automatic Search Correction Logic ---
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // این کد تنها برای صفحاتی که در حال بارگذاری هستند اجرا می‌شود
  if (details.frameId !== 0) {
    return;
  }
  const url = new URL(details.url);

  // فقط روی جستجوهای گوگل اجرا شود
  if (url.hostname.includes("google.") && url.pathname.includes("search")) {
    const query = url.searchParams.get('q');

    if (query) {
      const correctedText = smart_farsi_converter(query);

      // اگر اصلاحی انجام شده بود، به آدرس جدید هدایت کن
      if (query !== correctedText) {
        const newUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
        chrome.tabs.update(details.tabId, { url: newUrl });
      }
    }
  }
});