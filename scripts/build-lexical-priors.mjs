import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z]/gu,'');
}

const words = new Set();
const lines = englishDictionary.dic.toString('utf8').split(/\r?\n/u);

for (let i = 1; i < lines.length; i += 1) {
  const word = normalize(lines[i].trim().split('/')[0]);
  if (word.length >= 2 && word.length <= 32) words.add(word);
}

const hashes = [...words]
  .map(fnv1a)
  .sort((a,b) => a-b)
  .filter((value,index,array) => index === 0 || value !== array[index-1]);

const source = `// Generated build-time English lexical safety prior.
// Contains only 32-bit hashes, never source dictionary words.
const FSA_ENGLISH_LEXICAL_HASHES = Object.freeze(${JSON.stringify(hashes)});

function fsaLexicalHash(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value ?? '').toLowerCase()) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function isFsaKnownEnglishLexeme(value) {
  const normalized = String(value ?? '').toLowerCase().replace(/[^a-z]/gu,'');
  if (normalized.length < 2) return false;
  const needle = fsaLexicalHash(normalized);
  let low = 0;
  let high = FSA_ENGLISH_LEXICAL_HASHES.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const current = FSA_ENGLISH_LEXICAL_HASHES[mid];
    if (current === needle) return true;
    if (current < needle) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}
`;

await fs.writeFile(path.join(root,'lexical_priors.js'),source,'utf8');
console.log(JSON.stringify({
  decision:'GENERATED',
  sourceWords:words.size,
  uniqueHashes:hashes.length,
  rawWordsPackaged:false,
  purpose:'auto-safety-prior-only'
},null,2));