import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const source = await fs.readFile(
  path.join(repositoryRoot, 'inline_checker.js'),
  'utf8'
);

class FakeEditable {
  constructor(tagName, type = 'text') {
    this.tagName = tagName.toUpperCase();
    this.type = type;
    this.value = '';
    this.textContent = '';
    this.isContentEditable = false;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    this.listeners.get(type).push(listener);
  }

  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      right: 200,
      bottom: 40,
      width: 200,
      height: 40
    };
  }
}

function createHarness(initialActiveElement) {
  const documentListeners = new Map();

  const document = {
    activeElement: initialActiveElement,
    body: {
      appendChild() {}
    },
    documentElement: {
      appendChild() {},
      clientWidth: 1280,
      clientHeight: 800
    },
    addEventListener(type, listener, options) {
      if (!documentListeners.has(type)) {
        documentListeners.set(type, []);
      }

      documentListeners.get(type).push({
        listener,
        options
      });
    }
  };

  const context = vm.createContext({
    chrome: {
      storage: {
        sync: {
          get(_key, callback) {
            callback({});
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    },
    document,
    window: {
      addEventListener() {},
      innerWidth: 1280,
      innerHeight: 800
    },
    location: {
      hostname: 'www.google.com'
    },
    console,
    setTimeout() {
      return 1;
    },
    clearTimeout() {}
  });

  vm.runInContext(source, context, {
    filename: 'inline_checker.js'
  });

  return {
    context,
    documentListeners
  };
}

test('v4.6 bootstraps an INPUT focused before document_idle content-script initialization', () => {
  const input = new FakeEditable('input', 'search');

  createHarness(input);

  assert.equal(input.listeners.has('input'), true);
  assert.equal(input.listeners.has('select'), true);
});

test('v4.6 bootstraps a Google-like TEXTAREA focused before initialization', () => {
  const textarea = new FakeEditable('textarea');

  createHarness(textarea);

  assert.equal(textarea.listeners.has('input'), true);
  assert.equal(textarea.listeners.has('select'), true);
});

test('v4.6 delegated input fallback tracks a dynamic editable whose focusin was missed', () => {
  const body = new FakeEditable('body');
  const harness = createHarness(body);
  const dynamicInput = new FakeEditable('textarea');

  const entries = harness.documentListeners.get('input') || [];

  assert.equal(entries.length >= 1, true);

  const delegated = entries.find(
    (entry) => entry.options === true
  );

  assert.ok(delegated);

  delegated.listener({
    target: dynamicInput
  });

  assert.equal(dynamicInput.listeners.has('input'), true);
  assert.equal(dynamicInput.listeners.has('select'), true);
});

test('v4.6 source documents the document_idle autofocus gap defense', () => {
  assert.match(
    source,
    /trackEditable\(document\.activeElement\)/u
  );
  assert.match(
    source,
    /document-level fallback/u
  );
  assert.match(
    source,
    /document\.addEventListener\([\s\S]*'input'[\s\S]*true/u
  );
});
