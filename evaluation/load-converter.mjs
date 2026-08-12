import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, '..');

export async function loadConverter() {
  const keyboardLayoutPath = path.join(repositoryRoot, 'keyboard_layout.js');
  const logicPath = path.join(repositoryRoot, 'logic.js');

  const keyboardLayoutSource = await fs.readFile(keyboardLayoutPath, 'utf8');
  const logicSource = await fs.readFile(logicPath, 'utf8');

  const context = {
    console,
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout,
    chrome: {},
    window: {},
    document: {}
  };

  vm.createContext(context);

  const instrumentedSource = `${keyboardLayoutSource}
${logicSource}
;globalThis.__farsiSmartConverter =
  typeof smart_farsi_converter === 'function'
    ? smart_farsi_converter
    : undefined;`;

  vm.runInContext(instrumentedSource, context, {
    filename: logicPath,
    timeout: 1000
  });

  if (typeof context.__farsiSmartConverter !== 'function') {
    throw new Error('smart_farsi_converter was not exposed as a callable function.');
  }

  return (text, customDictionary = {}) => {
    const output = context.__farsiSmartConverter(text, customDictionary);

    if (typeof output !== 'string') {
      throw new TypeError('smart_farsi_converter must return a string.');
    }

    return output;
  };
}