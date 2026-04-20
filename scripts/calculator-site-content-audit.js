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

assert.ok(Array.isArray(modules), "modules.json must be an array.");
assert.deepStrictEqual(
  modules.map((module) => module.id),
  ["machine-arithmetic", "error-analysis", "polynomial-methods", "root-finding"],
  "modules.json must contain the expected module ids in order."
);

for (const module of modules) {
  [
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
  ].forEach((key) => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(module, key),
      `Module ${module.id} is missing key: ${key}`
    );
  });
}

console.log("Calculator site content presence audit passed.");
