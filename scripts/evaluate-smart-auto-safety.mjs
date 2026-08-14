import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const directory =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const root =
  path.resolve(directory,'..');

const MODEL_SALT =
  'v6.2-blind';

const EN_TO_FA = Object.freeze({
  q:'ض',w:'ص',e:'ث',r:'ق',t:'ف',y:'غ',u:'ع',i:'ه',o:'خ',p:'ح',
  '[':'ج',']':'چ','\\':'پ',
  a:'ش',s:'س',d:'ی',f:'ب',g:'ل',h:'ا',j:'ت',k:'ن',l:'م',
  ';':'ک',"'":'گ',z:'ظ',x:'ط',c:'ز',v:'ر',b:'ذ',n:'د',m:'پ',',':'و'
});

const FA_TO_EN = Object.freeze({
  'ض':'q','ص':'w','ث':'e','ق':'r','ف':'t','غ':'y','ع':'u','ه':'i',
  'خ':'o','ح':'p','ج':'[','چ':']','پ':'m','ش':'a','س':'s','ی':'d',
  'ي':'d','ب':'f','ل':'g','ا':'h','آ':'h','ت':'j','ن':'k','م':'l',
  'ک':';','ك':';','گ':"'",'ظ':'z','ط':'x','ز':'c','ژ':'C','ر':'v',
  'ذ':'b','د':'n','و':','
});

const PERSIAN_TO_FINGLISH =
  Object.freeze({
    'ا':'a','آ':'aa','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'ch',
    'ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','ژ':'zh','س':'s',
    'ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f',
    'ق':'gh','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'i'
  });

function fnv1a(value) {
  let hash = 0x811c9dc5;

  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(
      hash,
      0x01000193
    );
  }

  return hash >>> 0;
}

function splitBucket(value) {
  return fnv1a(
    `${MODEL_SALT}:${value}`
  ) % 100;
}

function normalizeEnglish(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/gu,'');
}

function normalizePersian(value) {
  return String(value ?? '')
    .replace(/[ًٌٍَُِّْـ]/gu,'')
    .replaceAll('ي','ی')
    .replaceAll('ى','ی')
    .replaceAll('ك','ک')
    .replaceAll('\u200c','')
    .replace(/[^\u0621-\u06CC]/gu,'');
}

function parseHoldout(
  buffer,
  language,
  limit
) {
  const normalize =
    language === 'en'
      ? normalizeEnglish
      : normalizePersian;

  const lines =
    buffer.toString('utf8')
      .split(/\r?\n/u);

  const result =
    new Set();

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const word =
      normalize(
        lines[index]
          .trim()
          .split('/')[0]
      );

    if (
      word.length < 3 ||
      word.length > 16 ||
      splitBucket(word) > 9
    ) {
      continue;
    }

    if (
      language === 'en' &&
      /^[a-z]+$/u.test(word)
    ) {
      result.add(word);
    }

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(word)
    ) {
      result.add(word);
    }
  }

  return [...result]
    .sort((a,b) => {
      const ha = fnv1a(a);
      const hb = fnv1a(b);

      if (ha !== hb) return ha-hb;

      return a < b
        ? -1
        : a > b
          ? 1
          : 0;
    })
    .slice(0,limit);
}

function enToFa(value) {
  return [...value]
    .map(
      char =>
        EN_TO_FA[char] ?? char
    )
    .join('');
}

function faToEn(value) {
  return [...value]
    .map(
      char =>
        FA_TO_EN[char] ?? char
    )
    .join('');
}

function romanize(value) {
  if (
    ![...value].every(
      char =>
        Object.hasOwn(
          PERSIAN_TO_FINGLISH,
          char
        )
    )
  ) {
    return '';
  }

  return [...value]
    .map(
      char =>
        PERSIAN_TO_FINGLISH[char]
    )
    .join('');
}

const baseRuntime = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js',
  'finglish_source_model.js'
];

async function loadEngine(
  useLexicalPrior
) {
  const sources = [];

  for (const file of baseRuntime) {
    sources.push(
      await fs.readFile(
        path.join(root,file),
        'utf8'
      )
    );
  }

  if (useLexicalPrior) {
    sources.push(
      await fs.readFile(
        path.join(
          root,
          'lexical_priors.js'
        ),
        'utf8'
      )
    );
  } else {
    sources.push(
      `function isFsaKnownEnglishLexeme(){ return false; }`
    );
  }

  sources.push(
    await fs.readFile(
      path.join(
        root,
        'smart_auto_intent.js'
      ),
      'utf8'
    )
  );

  const context =
    vm.createContext({console});

  vm.runInContext(
    `${sources.join('\n')}
;globalThis.__smartAutoEval = {
  analyzeFsaSmartAutoIntent
};`,
    context
  );

  return context.__smartAutoEval;
}

const runtimeEngine =
  await loadEngine(true);

const lexicalMissEngine =
  await loadEngine(false);

const english =
  parseHoldout(
    englishDictionary.dic,
    'en',
    8000
  );

const persian =
  parseHoldout(
    persianDictionary.dic,
    'fa',
    8000
  );

const persianContext = {
  beforeText:'در متن فارسی ',
  afterText:' نوشته شده است',
  fieldLanguage:'fa',
  pageLanguage:'fa',
  direction:'rtl'
};

function ratio(a,b) {
  return b > 0 ? a / b : 0;
}

let validEnglishAuto = 0;
let validPersianAuto = 0;
let validPersianPhysicalKeyboardAuto = 0;
let englishContextRuntimeAuto = 0;
let englishContextLexicalMissAuto = 0;
let reverseCorrect = 0;
let forwardCorrect = 0;
let finglishCorrect = 0;
let finglishTotal = 0;

const lexicalMissSamples = [];
const finglishAutoSamples = [];
const persianPhysicalKeyboardFalsePositiveSamples = [];

for (const word of english) {
  if (
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        word
      )
      .autoEligible
  ) {
    validEnglishAuto += 1;
  }

  if (
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        word,
        persianContext
      )
      .autoEligible
  ) {
    englishContextRuntimeAuto += 1;
  }

  const lexicalMiss =
    lexicalMissEngine
      .analyzeFsaSmartAutoIntent(
        word,
        persianContext
      );

  if (lexicalMiss.autoEligible) {
    englishContextLexicalMissAuto += 1;

    if (
      lexicalMissSamples.length < 20
    ) {
      lexicalMissSamples.push({
        word,
        corrected:
          lexicalMiss.corrected,
        kind:
          lexicalMiss.kind,
        confidence:
          lexicalMiss.confidence,
        sourceScore:
          lexicalMiss
            .sourceIntent
            ?.score
      });
    }
  }

  const wrong =
    enToFa(word);

  const reverse =
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        wrong
      );

  if (
    reverse.autoEligible &&
    reverse.corrected
      .toLowerCase() === word
  ) {
    reverseCorrect += 1;
  }
}

for (const word of persian) {
  if (
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        word
      )
      .autoEligible
  ) {
    validPersianAuto += 1;
  }

  const physicalKeyboardContext = {
    beforeText:'',
    afterText:'',
    fieldLanguage:'',
    pageLanguage:'en',
    direction:'ltr',
    browserLanguage:'en-US',
    keyboardEvidence:{
      latinKeys:0,
      persianKeys:word.length,
      physicalAlphaKeys:word.length
    }
  };

  const physicalKeyboardResult =
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        word,
        physicalKeyboardContext
      );

  if (
    physicalKeyboardResult.autoEligible &&
    physicalKeyboardResult.corrected !== word
  ) {
    validPersianPhysicalKeyboardAuto += 1;

    if (
      persianPhysicalKeyboardFalsePositiveSamples
        .length < 20
    ) {
      persianPhysicalKeyboardFalsePositiveSamples
        .push({
          word,
          corrected:
            physicalKeyboardResult.corrected,
          kind:
            physicalKeyboardResult.kind
        });
    }
  }

  const wrong =
    faToEn(word);

  const forward =
    runtimeEngine
      .analyzeFsaSmartAutoIntent(
        wrong
      );

  if (
    forward.autoEligible &&
    forward.corrected === word
  ) {
    forwardCorrect += 1;
  }

  const input =
    romanize(word);

  if (
    input.length >= 3 &&
    input.length <= 24
  ) {
    finglishTotal += 1;

    const auto =
      runtimeEngine
        .analyzeFsaSmartAutoIntent(
          input,
          persianContext
        );

    if (
      auto.autoEligible &&
      auto.corrected === word
    ) {
      finglishCorrect += 1;

      if (
        finglishAutoSamples.length < 12
      ) {
        finglishAutoSamples.push({
          input,
          corrected:
            auto.corrected,
          confidence:
            auto.confidence,
          sourceScore:
            auto
              .sourceIntent
              ?.score,
          sourceThreshold:
            auto
              .sourceIntent
              ?.threshold
        });
      }
    }
  }
}

const result = {
  schemaVersion:4,
  protocol:
    'locked v6.2 salted blind split',
  holdout:{
    english:english.length,
    persian:persian.length,
    finglish:finglishTotal
  },
  runtime:{
    validEnglishAutoFalsePositiveRate:
      ratio(
        validEnglishAuto,
        english.length
      ),
    validPersianAutoFalsePositiveRate:
      ratio(
        validPersianAuto,
        persian.length
      ),
    validPersianPhysicalKeyboardAutoFalsePositiveRate:
      ratio(
        validPersianPhysicalKeyboardAuto,
        persian.length
      ),
    englishInPersianContextAutoRate:
      ratio(
        englishContextRuntimeAuto,
        english.length
      )
  },
  lexicalMiss:{
    englishInPersianContextAutoRate:
      ratio(
        englishContextLexicalMissAuto,
        english.length
      ),
    samples:
      lexicalMissSamples
  },
  samples:{
    finglishAutoSamples,
    persianPhysicalKeyboardFalsePositiveSamples
  },
  recall:{
    reverseLayoutAuto:
      ratio(
        reverseCorrect,
        english.length
      ),
    forwardLayoutAuto:
      ratio(
        forwardCorrect,
        persian.length
      ),
    finglishExactAuto:
      ratio(
        finglishCorrect,
        finglishTotal
      )
  },
  gates:{
    validSourceCeiling:0.002,
    physicalKeyboardValidPersianCeiling:0.002,
    runtimeEnglishContextCeiling:0.01,
    lexicalMissEnglishContextCeiling:0.01,
    reverseLayoutFloor:0.80,
    forwardLayoutFloor:0.80,
    finglishFloor:0.30
  }
};

result.pass = {
  validEnglish:
    result.runtime
      .validEnglishAutoFalsePositiveRate <=
    result.gates
      .validSourceCeiling,
  validPersian:
    result.runtime
      .validPersianAutoFalsePositiveRate <=
    result.gates
      .validSourceCeiling,
  physicalKeyboardValidPersian:
    result.runtime
      .validPersianPhysicalKeyboardAutoFalsePositiveRate <=
    result.gates
      .physicalKeyboardValidPersianCeiling,
  runtimeEnglishContext:
    result.runtime
      .englishInPersianContextAutoRate <=
    result.gates
      .runtimeEnglishContextCeiling,
  lexicalMissEnglishContext:
    result.lexicalMiss
      .englishInPersianContextAutoRate <=
    result.gates
      .lexicalMissEnglishContextCeiling,
  reverseLayout:
    result.recall
      .reverseLayoutAuto >=
    result.gates
      .reverseLayoutFloor,
  forwardLayout:
    result.recall
      .forwardLayoutAuto >=
    result.gates
      .forwardLayoutFloor,
  finglish:
    result.recall
      .finglishExactAuto >=
    result.gates
      .finglishFloor
};

result.decision =
  Object.values(result.pass)
    .every(Boolean)
    ? 'PASS'
    : 'FAIL';

process.stdout.write(
  `${JSON.stringify(result,null,2)}\n`
);

if (
  result.decision !== 'PASS'
) {
  process.exitCode = 1;
}
