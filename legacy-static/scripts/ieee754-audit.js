"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();

function loadIEEE754() {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  const source = fs.readFileSync(path.join(ROOT, "ieee754.js"), "utf8");
  vm.runInContext(source, context, { filename: "ieee754.js" });
  return context.IEEE754;
}

function makeReporter() {
  const results = [];
  return {
    check(name, expected, actual, passed, note) {
      results.push({ name, expected, actual, passed, note: note || "" });
    },
    finish() {
      const failures = results.filter((result) => !result.passed);
      for (const result of results) {
        console.log(`[${result.passed ? "PASS" : "FAIL"}] ${result.name}`);
        console.log(`  Expected: ${result.expected}`);
        console.log(`  Actual:   ${result.actual}`);
        if (result.note) {
          console.log(`  Note:     ${result.note}`);
        }
        console.log("");
      }
      console.log(`Summary: ${results.length - failures.length}/${results.length} passed`);
      if (failures.length) {
        process.exitCode = 1;
      }
    }
  };
}

function safeStringify(value) {
  if (Object.is(value, -0)) {
    return "-0";
  }
  if (Number.isNaN(value)) {
    return "NaN";
  }
  return String(value);
}

function run() {
  const IEEE754 = loadIEEE754();
  const report = makeReporter();

  {
    const encoded = IEEE754.decimalToIEEE("13.25");
    const expected = "0100000000101010100000000000000000000000000000000000000000000000";
    report.check(
      "13.25 encodes to the known double-precision bit pattern",
      expected,
      encoded.final64Bit,
      encoded.final64Bit === expected
    );
  }

  {
    const encoded = IEEE754.decimalToIEEE("0.1");
    const expected = "0011111110111001100110011001100110011001100110011001100110011010";
    report.check(
      "0.1 encodes to the standard repeating-binary double pattern",
      expected,
      encoded.final64Bit,
      encoded.final64Bit === expected
    );
  }

  {
    const encoded = IEEE754.decimalToIEEE("-0");
    report.check(
      "Negative zero preserves the sign bit",
      "sign bit 1",
      `sign bit ${encoded.sign}`,
      encoded.sign === 1
    );
  }

  {
    const decoded = IEEE754.ieeeToDecimal("0000000000000000000000000000000000000000000000000000000000000001");
    report.check(
      "Smallest subnormal decodes as a finite subnormal",
      "trueExp = -1022 and finite value 5e-324",
      `trueExp = ${decoded.trueExp} and finite value ${safeStringify(decoded.finalValue)}`,
      decoded.trueExp === -1022 && decoded.finalValue === Number.MIN_VALUE,
      "The least positive subnormal should decode to Number.MIN_VALUE."
    );
  }

  {
    const encoded = IEEE754.decimalToIEEE("Infinity");
    report.check(
      "Infinity encodes with all-ones exponent and zero mantissa",
      "0111111111110000000000000000000000000000000000000000000000000000",
      encoded.final64Bit,
      encoded.final64Bit === "0111111111110000000000000000000000000000000000000000000000000000"
    );
  }

  {
    let actual = "throws";
    let passed = false;
    try {
      const encoded = IEEE754.decimalToIEEE("NaN");
      actual = `${encoded.specialReason} / ${encoded.final64Bit.slice(0, 12)}`;
      passed = encoded.specialReason === "NaN"
        && encoded.exponentBinary === "11111111111"
        && encoded.mantissaBinary.includes("1");
    } catch (error) {
      actual = error.message;
    }
    report.check(
      "NaN encodes as a NaN classification with exponent all ones",
      "NaN / 11111111111...",
      actual,
      passed
    );
  }

  {
    const decoded = IEEE754.ieeeToDecimal("0111111111111000000000000000000000000000000000000000000000000000");
    report.check(
      "Known NaN payload decodes as NaN",
      "NaN",
      `${decoded.specialType} / ${safeStringify(decoded.finalValue)}`,
      decoded.specialType === "NaN" && Number.isNaN(decoded.finalValue)
    );
  }

  report.finish();
}

run();
