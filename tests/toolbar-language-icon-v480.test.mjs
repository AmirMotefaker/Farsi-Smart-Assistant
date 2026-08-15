import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8")
);

const background = await readFile(
  new URL("../background.js", import.meta.url),
  "utf8"
);

const popupHtml = await readFile(
  new URL("../popup.html", import.meta.url),
  "utf8"
);

const popupCss = await readFile(
  new URL("../popup.css", import.meta.url),
  "utf8"
);

const expectedToolbarHashes = {
  "assets/brand/toolbar/fa-16.png": "E1B43F658440E45870960333305792922976506DDA987C0765E076927BD7B6BD",
  "assets/brand/toolbar/fa-32.png": "F8E9512C029A593B2D92D1602A71C51B46A37605F9CCFEAAA22062FD1A118F6D",
  "assets/brand/toolbar/en-16.png": "42E61F781B393800A7E2C8B18C55A4B6A0C7B79D7B0B1462B95AD67076FCFE1B",
  "assets/brand/toolbar/en-32.png": "423BEB8F6F92ADD48889E8E3314B48E8AF9F5F5051306FA6C97E5242D74A9771"
};

async function sha256(relativePath) {
  const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url));
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

test("v4.8.0 toolbar uses founder-approved Option C keyline icons", async () => {
  assert.deepEqual(
    manifest.action.default_icon,
    {
      "16": "assets/brand/toolbar/fa-16.png",
      "32": "assets/brand/toolbar/fa-32.png"
    }
  );

  assert.equal(manifest.icons["16"], "icon16.png");
  assert.equal(manifest.icons["32"], "icon32.png");
  assert.equal(manifest.icons["48"], "icon48.png");
  assert.equal(manifest.icons["128"], "icon128.png");

  for (const [relativePath, expectedHash] of Object.entries(expectedToolbarHashes)) {
    assert.equal(await sha256(relativePath), expectedHash);
  }
});

test("v4.8.0 toolbar follows persisted FA/EN UI language", () => {
  assert.ok(background.includes("FSA_TOOLBAR_ICON_PATHS"));
  assert.ok(background.includes("assets/brand/toolbar/fa-16.png"));
  assert.ok(background.includes("assets/brand/toolbar/fa-32.png"));
  assert.ok(background.includes("assets/brand/toolbar/en-16.png"));
  assert.ok(background.includes("assets/brand/toolbar/en-32.png"));
  assert.ok(background.includes("changes.uiLanguage"));
  assert.ok(background.includes("changes.uiLanguage.newValue"));
  assert.ok(background.includes("setToolbarIconForLocale"));
  assert.ok(background.includes("syncToolbarIconFromStorage"));
});

test("v4.8.0 popup header mark follows FA/EN locale", () => {
  assert.ok(popupHtml.includes(`id="brandMarkFa"`));
  assert.ok(popupHtml.includes(`id="brandMarkEn"`));
  assert.ok(popupHtml.includes(`class="brand-mark-en">E</span>`));
  assert.ok(popupCss.includes(`:root[data-locale="en"] .brand-mark-fa`));
  assert.ok(popupCss.includes(`:root[data-locale="en"] .brand-mark-en`));
  assert.ok(popupCss.includes(`font-family: "Vazirmatn", Arial, sans-serif;`));
});
