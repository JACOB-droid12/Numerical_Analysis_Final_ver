"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();

const suites = [
  { file: "scripts/battery-cat1-4.js", expected: 60 },
  { file: "scripts/battery-cat2-3.js", expected: 35 },
  { file: "scripts/convergence-tests.js", expected: 70 },
  { file: "scripts/battery-cat9-10.js", expected: 42 },
  { file: "scripts/battery-cat11-12.js", expected: 37 },
  { file: "scripts/battery-validation.js", expected: 18 },
  { file: "scripts/supplemental-brutal-11.js", expected: 11 }
];

let total = 0;
let failedSuites = 0;

for (const suite of suites) {
  const run = spawnSync(process.execPath, [suite.file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  const output = `${run.stdout || ""}${run.stderr || ""}`;
  const count = (output.match(/^TEST\s/mg) || []).length;
  total += count;

  console.log(`\n===== ${suite.file} =====`);
  process.stdout.write(output);
  console.log(`\n[SUITE COUNT] expected=${suite.expected} actual=${count}`);

  if (count !== suite.expected || run.status !== 0) {
    failedSuites += 1;
  }
}

const expectedTotal = suites.reduce((sum, suite) => sum + suite.expected, 0);

console.log(`\n===== RUN SUMMARY =====`);
console.log(`Expected total: ${expectedTotal}`);
console.log(`Actual total:   ${total}`);
console.log(`Failed suites:  ${failedSuites}`);

if (total !== expectedTotal || failedSuites > 0) {
  process.exitCode = 1;
}
