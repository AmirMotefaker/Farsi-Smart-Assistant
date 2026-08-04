import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const popupPath = path.join(repositoryRoot, "popup.js");

async function readPopupSource() {
  return fs.readFile(popupPath, "utf8");
}

test("popup does not assign untrusted or static content through innerHTML", async () => {
  const source = await readPopupSource();

  assert.equal(/\binnerHTML\s*=/.test(source), false);
  assert.equal(/\binsertAdjacentHTML\s*\(/.test(source), false);
  assert.equal(/\bouterHTML\s*=/.test(source), false);
});

test("Wikipedia response uses plain text instead of extract_html", async () => {
  const source = await readPopupSource();

  assert.equal(/\bdata\.extract_html\b/.test(source), false);
  assert.equal((source.match(/\bdata\.extract\b/g) ?? []).length, 2);
  assert.match(source, /summary\.textContent\s*=\s*result\.summary/);
});

test("user-controlled search term is rendered through textContent", async () => {
  const source = await readPopupSource();

  assert.match(source, /noResultMessage\.textContent\s*=/);
  assert.match(source, /knowledgePanel\.replaceChildren\(noResultMessage\)/);
  assert.doesNotMatch(
    source,
    /knowledgePanel\.(?:innerHTML|outerHTML)\s*=.*\$\{term\}/
  );
});

test("popup loading and clearing behavior uses safe DOM APIs", async () => {
  const source = await readPopupSource();

  assert.match(source, /loadingMessage\.textContent\s*=/);
  assert.match(source, /knowledgePanel\.replaceChildren\(loadingMessage\)/);
  assert.match(source, /knowledgePanel\.replaceChildren\(\)/);
});
