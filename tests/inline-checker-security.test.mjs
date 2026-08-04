import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../inline_checker.js", import.meta.url),
  "utf8",
);

test("inline checker contains no HTML injection sink", () => {
  const forbiddenPatterns = [
    /\.innerHTML\s*=/u,
    /\.outerHTML\s*=/u,
    /insertAdjacentHTML\s*\(/u,
    /document\.write\s*\(/u,
    /\beval\s*\(/u,
    /new\s+Function\s*\(/u,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `Forbidden sink detected: ${pattern}`,
    );
  }
});

test("corrected text is rendered through textContent", () => {
  assert.match(
    source,
    /\.textContent\s*=\s*correctedText\b/u,
    "correctedText must be assigned through textContent.",
  );
});

test("corrected text is never interpolated into an HTML sink", () => {
  assert.doesNotMatch(
    source,
    /(?:innerHTML|outerHTML|insertAdjacentHTML)[\s\S]{0,250}\$\{\s*correctedText\s*\}/u,
    "correctedText must not be interpolated into HTML.",
  );
});

test("the replacement click handler remains present", () => {
  assert.match(
    source,
    /button\.onclick\s*=\s*\(\)\s*=>/u,
    "Expected the suggestion replacement click handler to remain present.",
  );
});

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.className = "";
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = "";
    this.value = "";
    this.isContentEditable = false;
    this.onclick = null;
    this.focused = false;
    this.dispatchedEvents = [];
    this.closestResult = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);

    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }

    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  contains(child) {
    return this.children.includes(child);
  }

  getBoundingClientRect() {
    return {
      top: 10,
      right: 110,
      bottom: 30,
      height: 20,
    };
  }

  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
    return true;
  }

  focus() {
    this.focused = true;
  }

  closest(selector) {
    return selector === "form" ? this.closestResult : null;
  }
}

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
  }

  stopPropagation() {}
}

function buildInlineCheckerHarness({ contentEditable }) {
  const body = new FakeElement("body");
  const registeredDocumentListeners = new Map();

  const document = {
    body,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    addEventListener(type, listener) {
      registeredDocumentListeners.set(type, listener);
    },
  };

  const form = {
    submitCount: 0,
    submit() {
      this.submitCount += 1;
    },
  };

  const input = new FakeElement(contentEditable ? "div" : "input");
  input.isContentEditable = contentEditable;
  input.value = "teh";
  input.textContent = "teh";
  input.closestResult = form;

  const icon = new FakeElement("div");
  body.appendChild(icon);

  const context = vm.createContext({
    chrome: {
      storage: {
        sync: {
          get(_key, callback) {
            callback({ customDictionary: {} });
          },
        },
      },
    },
    console: {
      log() {},
      error() {},
    },
    document,
    window: {
      scrollX: 0,
      scrollY: 0,
    },
    Event: FakeEvent,
    setTimeout,
    clearTimeout,
    __activeInput: input,
    __icon: icon,
  });

  vm.runInContext(source, context, {
    filename: "inline_checker.js",
  });

  vm.runInContext(
    "activeInput = __activeInput; suggestionElements.icon = __icon;",
    context,
  );

  return {
    body,
    context,
    form,
    input,
  };
}

function openSuggestionAndClick(harness, correctedText) {
  harness.context.__correctedText = correctedText;
  harness.context.__originalText = "teh";

  vm.runInContext(
    "showTooltip(__correctedText, __originalText);",
    harness.context,
  );

  const tooltip = harness.body.children.find(
    (element) => element.className === "farsi-sugg-tooltip",
  );

  assert.ok(tooltip, "Expected the correction tooltip to be appended.");

  const button = tooltip.children[0];

  assert.ok(button, "Expected the correction button to exist.");
  assert.equal(button.textContent, "جایگزین با: ");
  assert.equal(button.children[0]?.textContent, correctedText);
  assert.equal(typeof button.onclick, "function");

  button.onclick();
}

test("clicking a suggestion replaces a standard input and dispatches input", () => {
  const harness = buildInlineCheckerHarness({
    contentEditable: false,
  });

  openSuggestionAndClick(harness, "the");

  assert.equal(harness.input.value, "the");
  assert.equal(harness.input.textContent, "teh");
  assert.deepEqual(harness.input.dispatchedEvents, ["input"]);
  assert.equal(harness.input.focused, true);
  assert.equal(harness.form.submitCount, 1);
});

test("clicking a suggestion replaces contenteditable text and dispatches input", () => {
  const harness = buildInlineCheckerHarness({
    contentEditable: true,
  });

  openSuggestionAndClick(harness, "درست");

  assert.equal(harness.input.textContent, "درست");
  assert.equal(harness.input.value, "teh");
  assert.deepEqual(harness.input.dispatchedEvents, ["input"]);
  assert.equal(harness.input.focused, true);
  assert.equal(harness.form.submitCount, 1);
});
