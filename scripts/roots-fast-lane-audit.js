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
const routeHeadings = [
  "### Roots UI, Copy, Or Styling",
  "### Roots Interaction Wiring",
  "### Roots Rendering",
  "### Roots Adapter Or Request Packaging",
  "### Roots Numerical Behavior",
  "### Main Calculator Roots Bridge"
];

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
  "Fast lane route structure stays intact",
  "Start Here, Routes, six route headings, Boundary Rule, Full Verification",
  includesAll(fastLane, [
    "## Start Here",
    "## Routes",
    ...routeHeadings,
    "## Boundary Rule",
    "## Full Verification"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "## Start Here",
    "## Routes",
    ...routeHeadings,
    "## Boundary Rule",
    "## Full Verification"
  ])
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
  "Fast lane keeps the Boundary Rule explicit",
  "ask one short clarification and name any boundary crossing",
  includesAll(fastLane, [
    "## Boundary Rule",
    "ask one short clarification before reading broad context",
    "name that boundary crossing before editing"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "## Boundary Rule",
    "ask one short clarification before reading broad context",
    "name that boundary crossing before editing"
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
  "AGENTS.md keeps the Roots mini-app audit lines",
  "roots-mini-app-static-audit.js and roots-mini-app-ui-audit.js",
  includesAll(agents, [
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ]) ? "present" : "missing",
  includesAll(agents, [
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ])
);

check(
  "AGENTS.md keeps the Roots architecture guidance",
  "Roots Fast Lane, root-engine, roots/index.html, roots/roots-app, roots/roots-state, roots/roots-render, roots/roots-engine-adapter, roots/roots.css",
  includesAll(agents, [
    "## Roots Fast Lane",
    "Roots UI work should start with `docs/roots-context.md` and `docs/roots-ai-fast-lane.md`.",
    "| `root-engine.js` | Root-finding numerical core: bisection, Newton, secant, false position, fixed point |",
    "| `roots/index.html` | Standalone Roots shell and markup |",
    "| `roots/roots-app.js` | Roots DOM events, angle toggle, symbols, compute orchestration |",
    "| `roots/roots-state.js` | Active method, cached runs, angle mode, default state |",
    "| `roots/roots-render.js` | Result cards, diagnostics, graph, solution steps, tables |",
    "| `roots/roots-engine-adapter.js` | Maps UI fields to `RootEngine` calls |",
    "| `roots/roots.css` | Roots-only styling |",
    "| `index.html` | Main calculator shell; the Roots tab is only a bridge to `roots/index.html` |",
    "For ordinary Roots UI/copy/style work, do not edit `index.html`, `app.js`, or `styles.css`."
  ]) ? "present" : "missing",
  includesAll(agents, [
    "## Roots Fast Lane",
    "Roots UI work should start with `docs/roots-context.md` and `docs/roots-ai-fast-lane.md`.",
    "| `root-engine.js` | Root-finding numerical core: bisection, Newton, secant, false position, fixed point |",
    "| `roots/index.html` | Standalone Roots shell and markup |",
    "| `roots/roots-app.js` | Roots DOM events, angle toggle, symbols, compute orchestration |",
    "| `roots/roots-state.js` | Active method, cached runs, angle mode, default state |",
    "| `roots/roots-render.js` | Result cards, diagnostics, graph, solution steps, tables |",
    "| `roots/roots-engine-adapter.js` | Maps UI fields to `RootEngine` calls |",
    "| `roots/roots.css` | Roots-only styling |",
    "| `index.html` | Main calculator shell; the Roots tab is only a bridge to `roots/index.html` |",
    "For ordinary Roots UI/copy/style work, do not edit `index.html`, `app.js`, or `styles.css`."
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
