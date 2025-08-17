try {
  // فراخوانی منطق اصلی تبدیل
  importScripts('logic.js');
} catch (e) {
  console.error(e);
}

// ایجاد آیتم در منوی راست‌کلیک هنگام نصب یا به‌روزرسانی افزونه
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "smartFarsiAction",
    // با استفاده از %s متن انتخاب شده در عنوان منو نمایش داده می‌شود
    title: "جستجوی هوشمند برای '%s'", 
    contexts: ["selection"]
  });
});

// مدیریت رویداد کلیک روی آیتم منو
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "smartFarsiAction" && info.selectionText) {
    
    // خواندن دیکشنری شخصی کاربر از حافظه
    chrome.storage.sync.get('customDictionary', (data) => {
      const customDict = data.customDictionary || {};
      
      // تبدیل متن انتخاب شده با استفاده از تابع هوشمند
      const correctedText = smart_farsi_converter(info.selectionText, customDict);
      
      // --- منطق جدید ---
      // ساخت URL جستجوی گوگل با متن اصلاح‌شده
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(correctedText)}`;
      
      // باز کردن یک تب جدید با آدرس جستجو
      chrome.tabs.create({ url: searchUrl });
    });
  }
});