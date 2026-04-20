"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "calculator-site-content");
const forbiddenPatterns = [
  /\bdesign system\b/i,
  /\bcolor palette\b/i,
  /\bcolor scheme\b/i,
  /\btypography\b/i,
  /\btype scale\b/i,
  /\bfont(s)?\b/i,
  /\bspacing\b/i,
  /\bspace(r|d)?\b/i,
  /\blayout\b/i,
  /\bgrid\b/i,
  /\btheme(s)?\b/i,
  /\bresponsive\b/i,
  /\bbreakpoint(s)?\b/i,
  /\blayout instructions?\b/i,
  /\bcomponent recommendations?\b/i,
  /\banimation\b/i,
  /\bwireframe\b/i,
  /\bmockup\b/i,
  /\bvisual hierarchy\b/i,
  /\bstyle guide\b/i,
  /<div/i,
  /<section/i,
  /\.btn-/i,
  /tailwind/i
];

function collectFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

for (const filePath of collectFiles(CONTENT_ROOT)) {
  if (path.basename(filePath).toLowerCase() === "readme.md") {
    continue;
  }

  const text = fs.readFileSync(filePath, "utf8");
  for (const pattern of forbiddenPatterns) {
    assert.ok(
      !pattern.test(text),
      `Forbidden design guidance found in ${path.relative(ROOT, filePath)} via pattern ${pattern}`
    );
  }
}

console.log("Calculator site no-design audit passed.");
