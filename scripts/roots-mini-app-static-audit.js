"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOTS_HTML = path.join(ROOT, "roots", "index.html");
const MAIN_HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const APP_JS = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const LEGACY_ROOT_UI = path.join(ROOT, "root-ui.js");

function check(name, expected, actual, passed) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  console.log("");
  if (!passed) process.exitCode = 1;
}

function extractSectionById(source, id) {
  const startPattern = new RegExp(`<section\\b[^>]*id="${id}"[^>]*>`, "i");
  const startMatch = startPattern.exec(source);
  if (!startMatch) return "";

  let depth = 0;
  const tagPattern = /<\/?section\b[^>]*>/gi;
  tagPattern.lastIndex = startMatch.index;
  for (const match of source.matchAll(tagPattern)) {
    const isClosing = /^<\//.test(match[0]);
    depth += isClosing ? -1 : 1;
    if (depth === 0) {
      return source.slice(startMatch.index, match.index + match[0].length);
    }
  }

  return "";
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

const exists = fs.existsSync(ROOTS_HTML);
const html = exists ? fs.readFileSync(ROOTS_HTML, "utf8") : "";
const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
const mainScriptSources = [...MAIN_HTML.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
const rootTabPanel = extractSectionById(MAIN_HTML, "tab-root");
const rootEmptyHtml = extractSectionById(html, "root-empty");
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

check(
  "Standalone entry includes a Roots first-run guide",
  "root-start-guide with three steps",
  /class="[^"]*root-start-guide[^"]*"/.test(html) &&
    countMatches(html, /class="[^"]*root-start-step[^"]*"/g) >= 3 &&
    includesAll(html, ["Step 1", "Step 2", "Step 3", "Choose a method", "Run the method"])
    ? "first-run guide present"
    : "first-run guide missing",
  /class="[^"]*root-start-guide[^"]*"/.test(html) &&
    countMatches(html, /class="[^"]*root-start-step[^"]*"/g) >= 3 &&
    includesAll(html, ["Step 1", "Step 2", "Step 3", "Choose a method", "Run the method"])
);

check(
  "Method tabs expose method categories",
  "two bracket tabs, two open tabs, one fixed-point tab",
  [
    `bracket:${countMatches(html, /data-method-kind="bracket"/g)} / labels:${countMatches(html, />Bisection<\/button>|>False Position<\/button>/g)}`,
    `open:${countMatches(html, /data-method-kind="open"/g)} / labels:${countMatches(html, />Newton-Raphson<\/button>|>Secant<\/button>/g)}`,
    `fixed-point:${countMatches(html, /data-method-kind="fixed-point"/g)} / labels:${countMatches(html, />Fixed Point<\/button>/g)}`
  ].join(", "),
  countMatches(html, /data-method-kind="bracket"/g) === 2 &&
    countMatches(html, /data-method-kind="open"/g) === 2 &&
    countMatches(html, /data-method-kind="fixed-point"/g) === 1 &&
    includesAll(html, ["Bisection", "Newton-Raphson", "Secant", "False Position", "Fixed Point"])
);

check(
  "Empty state gives a useful first action",
  "root-empty includes a short action prompt",
  /<section\b[^>]*id="root-empty"[^>]*>[\s\S]*<p class="result-label">Try a root-finding run<\/p>[\s\S]*<p\b[^>]*>[\s\S]*Pick a method[\s\S]*Run the method[\s\S]*<\/p>[\s\S]*<\/section>/.test(rootEmptyHtml)
    ? "empty prompt present"
    : "empty prompt missing",
  /<section\b[^>]*id="root-empty"[^>]*>[\s\S]*<p class="result-label">Try a root-finding run<\/p>[\s\S]*<p\b[^>]*>[\s\S]*Pick a method[\s\S]*Run the method[\s\S]*<\/p>[\s\S]*<\/section>/.test(rootEmptyHtml)
);

check(
  "Standalone diagnostics keep live-region semantics",
  'id="root-diagnostics" with role="status" and aria-live="polite"',
  html.match(/<[^>]*id="root-diagnostics"[^>]*>/)?.[0] || "missing root-diagnostics",
  /id="root-diagnostics"[^>]*role="status"[^>]*aria-live="polite"|id="root-diagnostics"[^>]*aria-live="polite"[^>]*role="status"/.test(html)
);

check(
  "Standalone iteration table has a scroll wrapper",
  "root-iteration-table-wrap contains root-iteration-table",
  /class="root-iteration-table-wrap"[\s\S]*class="root-iteration-table"/.test(html)
    ? "wrapped table present"
    : "wrapped table missing",
  /class="root-iteration-table-wrap"[\s\S]*class="root-iteration-table"/.test(html)
);

check(
  "Main calculator root tab bridge links to standalone roots app",
  'href="roots/index.html"',
  rootTabPanel.match(/href="[^"]+"/)?.[0] || "no link in #tab-root",
  /href="roots\/index\.html"/.test(rootTabPanel)
);

check(
  "Main calculator no longer loads root-engine.js",
  "root-engine.js script tag should be absent",
  mainScriptSources.find((src) => /root-engine\.js/.test(src)) || "absent",
  !mainScriptSources.some((src) => /root-engine\.js/.test(src))
);

check(
  "Main calculator no longer loads root-ui.js",
  "root-ui.js script tag should be absent",
  /root-ui\.js/.test(MAIN_HTML) ? "present" : "absent",
  !/root-ui\.js/.test(MAIN_HTML)
);

check(
  "App bootstrap no longer references RootUI",
  "app.js should not reference RootUI or RU.recompute()",
  /RootUI|RU\.recompute|RU\.init/.test(APP_JS) ? "legacy references present" : "legacy references removed",
  !/RootUI|RU\.recompute|RU\.init/.test(APP_JS)
);

check(
  "App shell no longer tracks root-only previews or result IDs",
  "ROOT_RESULT_IDS and root preview IDs removed from app.js",
  /ROOT_RESULT_IDS|root-bis-expression-preview|root-newton-expression-preview|root-fpi-expression-preview/.test(APP_JS)
    ? "root shell bookkeeping present"
    : "root shell bookkeeping removed",
  !/ROOT_RESULT_IDS|root-bis-expression-preview|root-newton-expression-preview|root-fpi-expression-preview/.test(APP_JS)
);

check(
  "Legacy root-ui.js file removed",
  "root-ui.js deleted after cutover",
  fs.existsSync(LEGACY_ROOT_UI) ? "present" : "deleted",
  !fs.existsSync(LEGACY_ROOT_UI)
);
