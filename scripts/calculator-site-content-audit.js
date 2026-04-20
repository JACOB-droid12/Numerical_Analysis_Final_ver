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

console.log("Calculator site content presence audit passed.");
