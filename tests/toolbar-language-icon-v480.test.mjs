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
  "assets/brand/toolbar/fa-16.png": "5D680BCF1CE132A5CEACA4F5CDCBFE8A3D2AD79E98E27C04394C20D180B2EF29",
  "assets/brand/toolbar/fa-32.png": "18CBD1A520E513327FB089E6FA03553A08C8E1738DD2D30250EC7EE4AEBA9A62",
  "assets/brand/toolbar/en-16.png": "E94C9476D653453DF4FA43BC32101CDF33BADACD785E02D5A93CBEE58CAE1CA9",
  "assets/brand/toolbar/en-32.png": "B50FAB405D850B92ABB9158D130E7628FA62E76846803CD9B9F15AA988A5DA2D"
};

async function sha256(relativePath) {
  const bytes = await readFile(new URL(`../${relativePath}`, import.meta.url));
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

test("v4.8.0 toolbar uses subtle-halo bilingual action icons", async () => {
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
