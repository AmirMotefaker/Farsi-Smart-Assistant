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
  "assets/brand/toolbar/fa-16.png": "4F9027870A401CE806BD8AE352037F232BBF9D08DEEB78C440B582AF5384B4AA",
  "assets/brand/toolbar/fa-32.png": "4AF722D3E3A8DA413EA203BFC2C5A7D9ACA1C203B75A3C30B77E3EB97EAA3B50",
  "assets/brand/toolbar/en-16.png": "D32E27D3ED0E7ACA020B28F3B84922BC16A04A92B7764D186B485F62279F8A1B",
  "assets/brand/toolbar/en-32.png": "47580D00AA7E20C698E0020C412E45445894A3C7AE5587ED4EB4C82F3DDFE26D"
};

async function sha256(relativePath) {
  const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url));
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

test("v4.8.0 toolbar uses founder-approved pure-white glyph icons", async () => {
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
