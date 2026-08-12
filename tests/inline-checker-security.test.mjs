import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../inline_checker.js', import.meta.url),
  'utf8'
);

test('inline checker contains no HTML injection sink', () => {
  const forbiddenPatterns = [
    /\.innerHTML\s*=/u,
    /\.outerHTML\s*=/u,
    /insertAdjacentHTML\s*\(/u,
    /document\.write\s*\(/u,
    /\beval\s*\(/u,
    /new\s+Function\s*\(/u
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `Forbidden sink detected: ${pattern}`
    );
  }
});

test('suggested text is rendered through textContent', () => {
  assert.match(
    source,
    /correctionText\.textContent\s*=\s*correctedText\b/u
  );
});

test('M2 contenteditable path does not replace the entire element text', () => {
  assert.doesNotMatch(
    source,
    /element\.textContent\s*=\s*correctedText\b/u
  );

  assert.match(source, /range\.deleteContents\s*\(\s*\)/u);
  assert.match(source, /range\.insertNode\s*\(/u);
});

test('the replacement click handler remains present', () => {
  assert.match(
    source,
    /action\.onclick\s*=\s*\(event\)\s*=>/u
  );
});

class FakeElement {
  constructor(tagName = 'input') {
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.textContent = '';
    this.value = 'teh';
    this.type = 'text';
    this.isContentEditable = false;
    this.onclick = null;
    this.focused = false;
    this.dispatchedEvents = [];
    this.selectionStart = 0;
    this.selectionEnd = 3;
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
      left: 10,
      right: 110,
      bottom: 30,
      width: 100,
      height: 20
    };
  }

  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
    return true;
  }

  focus() {
    this.focused = true;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  addEventListener() {}
}

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
  }

  stopPropagation() {}

  preventDefault() {}
}

function buildHarness() {
  const body = new FakeElement('body');

  const document = {
    body,
    documentElement: body,
    activeElement: null,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    addEventListener() {}
  };

  const input = new FakeElement('input');

  const context = vm.createContext({
    chrome: {
      storage: {
        sync: {
          get(_key, callback) {
            callback({ customDictionary: {} });
          }
        }
      }
    },
    console,
    document,
    window: {
      scrollX: 0,
      scrollY: 0
    },
    Event: FakeEvent,
    setTimeout,
    clearTimeout,
    smart_farsi_converter(value) {
      return value === 'teh' ? 'the' : value;
    },
    __input: input
  });

  vm.runInContext(source, context, {
    filename: 'inline_checker.js'
  });

  return {
    body,
    context,
    input
  };
}

test('captured suggestion action still targets the input after focus loss', () => {
  const harness = buildHarness();

  vm.runInContext(`
    showSuggestion(
      'the',
      'teh',
      __input,
      {
        fieldText: 'teh',
        start: 0,
        end: 3,
        originalText: 'teh',
        correctedText: 'the',
        mode: 'selection'
      }
    );
  `, harness.context);

  const host = harness.body.children.find(
    (element) =>
      element.className ===
      'farsi-smart-assistant-overlay-host'
  );

  assert.ok(host);

  const action = host.children.find(
    (element) =>
      element.className ===
      'farsi-smart-suggestion-action'
  );

  assert.ok(action);
  assert.equal(typeof action.onclick, 'function');

  vm.runInContext('activeInput = null;', harness.context);
  action.onclick(new FakeEvent('click'));

  assert.equal(harness.input.value, 'the');
  assert.deepEqual(harness.input.dispatchedEvents, ['input']);
  assert.equal(harness.input.focused, true);
  assert.equal(harness.input.selectionStart, 3);
  assert.equal(harness.input.selectionEnd, 3);
});

test('stale suggestion cannot overwrite newer field text', () => {
  const harness = buildHarness();

  harness.input.value = 'teh newer';

  harness.context.__suggestion = {
    fieldText: 'teh',
    start: 0,
    end: 3,
    originalText: 'teh',
    correctedText: 'the',
    mode: 'selection'
  };

  const applied = vm.runInContext(
    'applyEditingSuggestion(__input, __suggestion);',
    harness.context
  );

  assert.equal(applied, false);
  assert.equal(harness.input.value, 'teh newer');
  assert.deepEqual(harness.input.dispatchedEvents, []);
});