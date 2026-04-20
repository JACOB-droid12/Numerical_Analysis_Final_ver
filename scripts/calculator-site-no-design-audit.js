"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "calculator-site-content");
const forbiddenPatterns = [
  /\bcolor palette\b/i,
  /\btypography\b/i,
  /\blayout instructions?\b/i,
  /\bcomponent recommendations?\b/i,
  /\banimation\b/i,
  /\bwireframe\b/i,
  /\bmockup\b/i,
  /<div/i,
  /<section/i,
  /\.btn-/i,
  /tailwind/i
];

const filesToScan = [
  path.join(CONTENT_ROOT, "README.md"),
  path.join(CONTENT_ROOT, "content", "site.json"),
  path.join(CONTENT_ROOT, "content", "modules.json"),
  path.join(CONTENT_ROOT, "content", "faqs.json"),
  path.join(CONTENT_ROOT, "content", "glossary.json"),
  path.join(CONTENT_ROOT, "content", "workflows.json"),
  path.join(CONTENT_ROOT, "content", "use-cases.json")
];

for (const filePath of filesToScan) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const pattern of forbiddenPatterns) {
    assert.ok(
      !pattern.test(text),
      `Forbidden design guidance found in ${path.relative(ROOT, filePath)} via pattern ${pattern}`
    );
  }
}

console.log("Calculator site no-design audit passed.");
