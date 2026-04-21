"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOTS_HTML = path.join(ROOT, "roots", "index.html");

function check(name, expected, actual, passed) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  console.log("");
  if (!passed) process.exitCode = 1;
}

const exists = fs.existsSync(ROOTS_HTML);
const html = exists ? fs.readFileSync(ROOTS_HTML, "utf8") : "";
const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
const expectedScriptOrder = [
  "../math-engine.js?v=roots-v1",
  "../calc-engine.js?v=roots-v1",
  "../expression-engine.js?v=roots-v1",
  "../root-engine.js?v=roots-v1",
  "../math-display.js?v=roots-v1",
  "./roots-state.js?v=roots-v1",
  "./roots-engine-adapter.js?v=roots-v1",
  "./roots-render.js?v=roots-v1",
  "./roots-app.js?v=roots-v1"
];
const tabs = [
  { id: "root-tab-bisection", controls: "root-inputs-bisection" },
  { id: "root-tab-newton", controls: "root-inputs-newton" },
  { id: "root-tab-secant", controls: "root-inputs-secant" },
  { id: "root-tab-falseposition", controls: "root-inputs-falseposition" },
  { id: "root-tab-fixedpoint", controls: "root-inputs-fixedpoint" }
];

check(
  "Standalone entry exists",
  "roots/index.html should exist",
  exists ? "present" : "missing",
  exists
);

check(
  "Standalone entry loads shared roots dependencies",
  "../math-engine.js, ../calc-engine.js, ../expression-engine.js, ../root-engine.js, ../math-display.js",
  html.match(/\.\.\/[a-z-]+\.js/g)?.join(", ") || "no shared scripts",
  /\.\.\/math-engine\.js/.test(html) &&
    /\.\.\/calc-engine\.js/.test(html) &&
    /\.\.\/expression-engine\.js/.test(html) &&
    /\.\.\/root-engine\.js/.test(html) &&
    /\.\.\/math-display\.js/.test(html)
);

check(
  "Standalone entry orders shared and local scripts",
  expectedScriptOrder.join(", "),
  scriptSources.join(", ") || "no scripts found",
  expectedScriptOrder.every((src, index) => scriptSources[index] === src) &&
    scriptSources.length === expectedScriptOrder.length
);

check(
  "Standalone entry wires tab semantics to panels",
  tabs.map(({ id, controls }) => `${id} -> ${controls}`).join(", "),
  tabs
    .map(({ id, controls }) => {
      const tabPattern = new RegExp(`id="${id}"[^>]*aria-controls="${controls}"|aria-controls="${controls}"[^>]*id="${id}"`);
      const panelPattern = new RegExp(`<section[^>]*id="${controls}"[^>]*role="tabpanel"[^>]*aria-labelledby="${id}"|<section[^>]*aria-labelledby="${id}"[^>]*role="tabpanel"[^>]*id="${controls}"`);
      return tabPattern.test(html) && panelPattern.test(html) ? `${id} -> ${controls}` : null;
    })
    .filter(Boolean)
    .join(", ") || "missing tab-panel links",
  tabs.every(({ id, controls }) => {
    const tabPattern = new RegExp(`id="${id}"[^>]*aria-controls="${controls}"|aria-controls="${controls}"[^>]*id="${id}"`);
    const panelPattern = new RegExp(`<section[^>]*id="${controls}"[^>]*role="tabpanel"[^>]*aria-labelledby="${id}"|<section[^>]*aria-labelledby="${id}"[^>]*role="tabpanel"[^>]*id="${controls}"`);
    return tabPattern.test(html) && panelPattern.test(html);
  })
);

check(
  "Standalone entry includes local shell controls",
  "angle-toggle, status-angle, symbol-popover, root-method-tabs, root-result-stage",
  [
    /id="angle-toggle"/.test(html) ? "angle-toggle" : null,
    /id="status-angle"/.test(html) ? "status-angle" : null,
    /id="symbol-popover"/.test(html) ? "symbol-popover" : null,
    /class="root-method-tabs"/.test(html) ? "root-method-tabs" : null,
    /id="root-result-stage"/.test(html) ? "root-result-stage" : null
  ].filter(Boolean).join(", ") || "no required shell controls",
  /id="angle-toggle"/.test(html) &&
    /id="status-angle"/.test(html) &&
    /id="symbol-popover"/.test(html) &&
    /class="root-method-tabs"/.test(html) &&
    /id="root-result-stage"/.test(html)
);
