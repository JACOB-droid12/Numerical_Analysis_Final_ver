"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredFiles = [
  "calculator-site-content/README.md",
  "calculator-site-content/content/site.json",
  "calculator-site-content/content/modules.json",
  "calculator-site-content/content/faqs.json",
  "calculator-site-content/content/glossary.json",
  "calculator-site-content/content/workflows.json",
  "calculator-site-content/content/use-cases.json"
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing required file: ${relativePath}`);
}

const site = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/site.json"), "utf8")
);

const readme = fs.readFileSync(
  path.join(ROOT, "calculator-site-content/README.md"),
  "utf8"
);

[
  "projectName",
  "tagline",
  "shortDescription",
  "longDescription",
  "audience",
  "valueProposition",
  "tone",
  "highlights",
  "pageIntent"
].forEach((key) => {
  assert.ok(Object.prototype.hasOwnProperty.call(site, key), `site.json is missing key: ${key}`);
});

assert.ok(Array.isArray(site.audience), "site.json audience must be an array.");
assert.ok(Array.isArray(site.highlights), "site.json highlights must be an array.");
assert.ok(
  readme.includes("content-only") && readme.includes("no design guidance"),
  "README must explain that this package is content-only and contains no design guidance."
);

const modules = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/modules.json"), "utf8")
);
const faqs = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/faqs.json"), "utf8")
);
const glossary = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/glossary.json"), "utf8")
);

assert.ok(Array.isArray(modules), "modules.json must be an array.");
assert.ok(Array.isArray(faqs) && faqs.length >= 6, "faqs.json must contain at least 6 items.");
assert.ok(Array.isArray(glossary) && glossary.length >= 8, "glossary.json must contain at least 8 terms.");

const expectedModuleIds = [
  "machine-arithmetic",
  "error-analysis",
  "polynomial-methods",
  "root-finding"
];
assert.deepStrictEqual(
  modules.map((module) => module.id),
  expectedModuleIds,
  "modules.json must contain the expected module ids in order."
);

const expectedModuleKeys = [
  "id",
  "label",
  "title",
  "summary",
  "whatItDoes",
  "whyItMatters",
  "inputs",
  "outputs",
  "keyConcepts",
  "learnerOutcomes",
  "commonUseCases",
  "limitations",
  "notes"
];

function assertNonEmptyString(value, message) {
  assert.strictEqual(typeof value, "string", message);
  assert.ok(value.trim().length > 0, message);
}

function assertStringArray(value, message) {
  assert.ok(Array.isArray(value), message);
  assert.ok(value.length > 0, message);
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${message} (item ${index + 1})`);
  });
}

const seenIds = new Set();
for (const [index, module] of modules.entries()) {
  assert.ok(module && typeof module === "object" && !Array.isArray(module), `Module at index ${index} must be an object.`);

  const moduleKeys = Object.keys(module).sort();
  assert.deepStrictEqual(
    moduleKeys,
    expectedModuleKeys.slice().sort(),
    `Module ${module.id ?? index} must contain exactly the expected keys.`
  );

  assertNonEmptyString(module.id, `Module ${index + 1} id must be a non-empty string.`);
  assert.ok(!seenIds.has(module.id), `Duplicate module id found: ${module.id}`);
  seenIds.add(module.id);

  assertNonEmptyString(module.label, `Module ${module.id} label must be a non-empty string.`);
  assertNonEmptyString(module.title, `Module ${module.id} title must be a non-empty string.`);
  assertNonEmptyString(module.summary, `Module ${module.id} summary must be a non-empty string.`);
  assertNonEmptyString(module.whatItDoes, `Module ${module.id} whatItDoes must be a non-empty string.`);
  assertNonEmptyString(module.whyItMatters, `Module ${module.id} whyItMatters must be a non-empty string.`);
  assertStringArray(module.inputs, `Module ${module.id} inputs must be a non-empty array of strings.`);
  assertStringArray(module.outputs, `Module ${module.id} outputs must be a non-empty array of strings.`);
  assertStringArray(module.keyConcepts, `Module ${module.id} keyConcepts must be a non-empty array of strings.`);
  assertStringArray(module.learnerOutcomes, `Module ${module.id} learnerOutcomes must be a non-empty array of strings.`);
  assertStringArray(module.commonUseCases, `Module ${module.id} commonUseCases must be a non-empty array of strings.`);
  assertStringArray(module.limitations, `Module ${module.id} limitations must be a non-empty array of strings.`);
  assertStringArray(module.notes, `Module ${module.id} notes must be a non-empty array of strings.`);
}

for (const faq of faqs) {
  ["id", "question", "answer", "category"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(faq, key), `FAQ item is missing key: ${key}`);
  });
}

for (const term of glossary) {
  ["id", "term", "definition", "plainLanguage", "relatedTerms"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(term, key), `Glossary term is missing key: ${key}`);
  });
}

console.log("Calculator site content presence audit passed.");
