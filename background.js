// background.js — v4.9.1 Store-safe toolbar synchronization

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
