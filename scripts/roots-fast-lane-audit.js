"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredFiles = {
  "docs/roots-ai-fast-lane.md": fs.readFileSync(path.join(ROOT, "docs", "roots-ai-fast-lane.md"), "utf8"),
  "docs/roots-context.md": fs.readFileSync(path.join(ROOT, "docs", "roots-context.md"), "utf8"),
  "AGENTS.md": fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8"),
  "README.md": fs.readFileSync(path.join(ROOT, "README.md"), "utf8")
};

function check(name, expected, actual, passed) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  console.log("");
  if (!passed) process.exitCode = 1;
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

const fastLane = requiredFiles["docs/roots-ai-fast-lane.md"];
const context = requiredFiles["docs/roots-context.md"];
const agents = requiredFiles["AGENTS.md"];
const readme = requiredFiles["README.md"];

check(
  "Fast lane names the compact context docs",
  "docs/roots-context.md and docs/roots-ai-fast-lane.md",
  includesAll(fastLane, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"]) ? "present" : "missing",
  includesAll(fastLane, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"])
);

check(
  "Fast lane routes ordinary Roots UI work away from main shell files",
  "do not edit index.html, app.js, or styles.css for ordinary Roots UI work",
  includesAll(fastLane, ["Do not edit `index.html`, `app.js`, or `styles.css`", "ordinary Roots mini-app UI work"]) ? "present" : "missing",
  includesAll(fastLane, ["Do not edit `index.html`, `app.js`, or `styles.css`", "ordinary Roots mini-app UI work"])
);

check(
  "Fast lane maps all critical Roots files",
  "roots app, render, state, adapter, css, root-engine",
  includesAll(fastLane, [
    "roots/index.html",
    "roots/roots-app.js",
    "roots/roots-state.js",
    "roots/roots-render.js",
    "roots/roots-engine-adapter.js",
    "roots/roots.css",
    "root-engine.js"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "roots/index.html",
    "roots/roots-app.js",
    "roots/roots-state.js",
    "roots/roots-render.js",
    "roots/roots-engine-adapter.js",
    "roots/roots.css",
    "root-engine.js"
  ])
);

check(
  "Fast lane lists full verification commands",
  "all four Roots verification commands",
  includesAll(fastLane, [
    "node scripts/engine-correctness-audit.js",
    "node scripts/root-engine-audit.js",
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "node scripts/engine-correctness-audit.js",
    "node scripts/root-engine-audit.js",
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ])
);

check(
  "AGENTS.md reflects removed legacy root-ui.js",
  "root-ui.js has been removed",
  agents.includes("`root-ui.js` has been removed") ? "present" : "missing",
  agents.includes("`root-ui.js` has been removed")
);

check(
  "README points to Roots AI docs",
  "docs/roots-context.md and docs/roots-ai-fast-lane.md",
  includesAll(readme, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"]) ? "present" : "missing",
  includesAll(readme, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"])
);

check(
  "Roots context still names the main edit boundaries",
  "state, render, adapter, numerical behavior",
  includesAll(context, [
    "State, caches, and default values",
    "Render behavior",
    "Adapter and request packaging",
    "Numerical behavior"
  ]) ? "present" : "missing",
  includesAll(context, [
    "State, caches, and default values",
    "Render behavior",
    "Adapter and request packaging",
    "Numerical behavior"
  ])
);
