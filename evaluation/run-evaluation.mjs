import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { loadConverter } from './load-converter.mjs';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(moduleDirectory, 'corpus.v1.json');

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1
  );

  return sortedValues[Math.max(0, index)];
}

const corpus = JSON.parse(await fs.readFile(corpusPath, 'utf8'));
const convert = await loadConverter();

const results = [];

for (const testCase of corpus.cases) {
  const startedAt = performance.now();
  const actual = convert(testCase.input);
  const latencyMs = performance.now() - startedAt;

  results.push({
    id: testCase.id,
    category: testCase.category,
    enforcement: testCase.enforcement,
    input: testCase.input,
    expected: testCase.expected,
    actual,
    exactMatch: actual === testCase.expected,
    changed: actual !== testCase.input,
    latencyMs: Number(latencyMs.toFixed(3))
  });
}

const enforced = results.filter((item) => item.enforcement === 'required');
const enforcedMatches = enforced.filter((item) => item.exactMatch).length;
const enforcedExactMatchRate =
  enforced.length === 0 ? 0 : enforcedMatches / enforced.length;

const noChangeEnforced = enforced.filter(
  (item) => item.input === item.expected
);
const falsePositives = noChangeEnforced.filter((item) => item.changed).length;
const falsePositiveRate =
  noChangeEnforced.length === 0
    ? 0
    : falsePositives / noChangeEnforced.length;

const latencies = results
  .map((item) => item.latencyMs)
  .sort((left, right) => left - right);

const p50LatencyMs = percentile(latencies, 50);
const p95LatencyMs = percentile(latencies, 95);

const failures = [];

if (
  enforcedExactMatchRate <
  corpus.thresholds.enforcedExactMatchRate
) {
  failures.push(
    `enforced exact-match rate ${enforcedExactMatchRate} is below ${corpus.thresholds.enforcedExactMatchRate}`
  );
}

if (
  falsePositiveRate >
  corpus.thresholds.maximumFalsePositiveRate
) {
  failures.push(
    `false-positive rate ${falsePositiveRate} is above ${corpus.thresholds.maximumFalsePositiveRate}`
  );
}

if (p95LatencyMs > corpus.thresholds.maximumP95LatencyMs) {
  failures.push(
    `p95 latency ${p95LatencyMs}ms is above ${corpus.thresholds.maximumP95LatencyMs}ms`
  );
}

const report = {
  schemaVersion: corpus.schemaVersion,
  corpusVersion: corpus.corpusVersion,
  totalCases: results.length,
  enforcedCases: enforced.length,
  manualReviewCases: results.length - enforced.length,
  enforcedExactMatchRate,
  falsePositiveRate,
  p50LatencyMs,
  p95LatencyMs,
  failures,
  decision: failures.length === 0 ? 'PASS' : 'FAIL',
  results
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
