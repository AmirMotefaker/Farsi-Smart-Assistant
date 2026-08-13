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

class FakeInputEvent {
  constructor(type, options = {}) {
    this.type = type;
    Object.assign(this, options);
  }
}

class FakeEvent extends FakeInputEvent {}

class FakeInput {
  constructor(value = '') {
    this._value = value;
    this.tagName = 'INPUT';
    this.type = 'text';
    this.selectionStart = value.length;
    this.selectionEnd = value.length;
    this.dispatched = [];
    this.focusCount = 0;
  }

  get value() {
    return this._value;
  }

  set value(next) {
    this._value = String(next);
  }

  dispatchEvent(event) {
    this.dispatched.push(event);
    return true;
  }

  focus() {
    this.focusCount += 1;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  addEventListener() {}
}

class FakeTextArea extends FakeInput {
  constructor(value = '') {
    super(value);
    this.tagName = 'TEXTAREA';
  }
}

const documentStub = {
  activeElement: null,
  addEventListener() {},
  execCommand() {
    throw new Error(
      'execCommand fallback must not run when the native setter succeeds'
    );
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
  document: documentStub,
  window: {
    addEventListener() {}
  },
  HTMLInputElement: FakeInput,
  HTMLTextAreaElement: FakeTextArea,
  InputEvent: FakeInputEvent,
  Event: FakeEvent,
  console,
  setTimeout,
  clearTimeout
});

vm.runInContext(
  `${source}
;globalThis.__apply = {
  replaceStandardRange,
  applyEditingSuggestion
};`,
  context
);

const apply = context.__apply;

test('v4.6 controlled INPUT uses native setter and verifies token-local replacement', () => {
  const element = new FakeInput('search هقشد');
  const suggestion = {
    fieldText: 'search هقشد',
    start: 7,
    end: 11,
    originalText: 'هقشد',
    correctedText: 'iran',
    mode: 'token'
  };

  assert.equal(
    apply.applyEditingSuggestion(element, suggestion),
    true
  );
  assert.equal(element.value, 'search iran');
  assert.equal(element.selectionStart, 11);
  assert.equal(element.selectionEnd, 11);
  assert.equal(element.dispatched.length, 1);
  assert.equal(element.dispatched[0].type, 'input');
  assert.equal(
    element.dispatched[0].inputType,
    'insertReplacementText'
  );
});

test('v4.6 controlled TEXTAREA uses native setter and preserves surrounding text', () => {
  const element = new FakeTextArea('سلام هقشد پایان');
  const start = 'سلام '.length;
  const suggestion = {
    fieldText: element.value,
    start,
    end: start + 'هقشد'.length,
    originalText: 'هقشد',
    correctedText: 'iran',
    mode: 'token'
  };

  assert.equal(
    apply.applyEditingSuggestion(element, suggestion),
    true
  );
  assert.equal(element.value, 'سلام iran پایان');
  assert.equal(element.dispatched.length, 1);
});

test('v4.6 stale suggestion is rejected before any controlled-input mutation', () => {
  const element = new FakeInput('search changed');
  const suggestion = {
    fieldText: 'search هقشد',
    start: 7,
    end: 11,
    originalText: 'هقشد',
    correctedText: 'iran',
    mode: 'token'
  };

  assert.equal(
    apply.applyEditingSuggestion(element, suggestion),
    false
  );
  assert.equal(element.value, 'search changed');
  assert.equal(element.dispatched.length, 0);
});

test('v4.6 suggestion click path recomputes instead of silently losing failed application', () => {
  assert.match(
    source,
    /const applied = inputElement/u
  );
  assert.match(
    source,
    /if \(!applied && inputElement\)/u
  );
  assert.match(
    source,
    /scheduleCorrectionCheck\(inputElement, 0\)/u
  );
});


test('v4.6 prototype-chain setter lookup stays available for textarea-like controls', () => {
  assert.match(
    source,
    /function findValueSetterInPrototypeChain\(prototype\)/u
  );
  assert.match(
    source,
    /Object\.getPrototypeOf\(current\)/u
  );
});


test('v4.6 final writable-value fallback remains available when native constructors are absent', () => {
  assert.match(
    source,
    /element\.value = newText/u
  );
  assert.match(
    source,
    /dispatchReplacementInput\([\s\S]*suggestion\.correctedText/u
  );
  assert.match(
    source,
    /return finalizeStandardReplacement\([\s\S]*newText[\s\S]*caret/u
  );
});
