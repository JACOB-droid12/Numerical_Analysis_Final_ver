"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROOTS_HTML = fs.readFileSync(path.join(ROOT, "roots", "index.html"), "utf8");
const FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js",
  "math-display.js",
  "roots/roots-state.js",
  "roots/roots-engine-adapter.js",
  "roots/roots-render.js",
  "roots/roots-app.js"
];

function valueFor(id) {
  const input = ROOTS_HTML.match(new RegExp(`<input[^>]*id="${id}"[^>]*value="([^"]*)"`, "i"));
  if (input) return input[1];
  const selected = ROOTS_HTML.match(new RegExp(`<select[^>]*id="${id}"[^>]*>[\\s\\S]*?<option[^>]*value="([^"]*)"[^>]*selected`, "i"));
  if (selected) return selected[1];
  const firstOption = ROOTS_HTML.match(new RegExp(`<select[^>]*id="${id}"[^>]*>[\\s\\S]*?<option[^>]*value="([^"]*)"`, "i"));
  if (firstOption) return firstOption[1];
  return "";
}

function attrsFor(id) {
  const match = ROOTS_HTML.match(new RegExp(`<[^>]+id="${id}"[^>]*>`, "i"));
  return match ? match[0] : "";
}

function datasetFrom(attrs) {
  const dataset = {};
  for (const match of attrs.matchAll(/\sdata-([a-z0-9-]+)="([^"]*)"/gi)) {
    const key = match[1].replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    dataset[key] = match[2];
  }
  return dataset;
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }
  add(name) { this.values.add(name); }
  remove(name) { this.values.delete(name); }
  toggle(name, force) {
    if (force) this.add(name);
    else this.remove(name);
  }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName;
    this.id = id || "";
    this.value = valueFor(id || "");
    this.hidden = /\shidden(?:\s|>)/i.test(attrsFor(id || ""));
    this.textContent = "";
    this.innerHTML = "";
    this.children = [];
    this.dataset = datasetFrom(attrsFor(id || ""));
    this.listeners = {};
    this.attributes = {};
    this.classList = new FakeClassList();
    this.selectionStart = this.value.length;
    this.selectionEnd = this.value.length;
    this.focusCount = 0;
    this.scrollCount = 0;
  }
  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  focus() {
    this.focusCount += 1;
  }
  scrollIntoView() {
    this.scrollCount += 1;
  }
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach((handler) => handler.call(this, event));
  }
}

const IDS = [
  "status-angle", "angle-toggle", "symbol-popover",
  "root-tab-bisection", "root-tab-newton", "root-tab-secant", "root-tab-falseposition", "root-tab-fixedpoint",
  "root-inputs-bisection", "root-inputs-newton", "root-inputs-secant", "root-inputs-falseposition", "root-inputs-fixedpoint",
  "root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind",
  "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis", "root-bis-sign-display", "root-bis-compute",
  "root-bis-tolerance-type-wrap", "root-bis-tolerance-note", "root-bis-advanced",
  "root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode",
  "root-newton-stop-kind", "root-newton-stop-value", "root-newton-compute",
  "root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode",
  "root-secant-stop-kind", "root-secant-stop-value", "root-secant-compute",
  "root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind",
  "root-fp-stop-value", "root-fp-decision-basis", "root-fp-sign-display", "root-fp-compute", "root-fp-advanced",
  "root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind",
  "root-fpi-stop-value", "root-fpi-compute",
  "root-empty", "root-result-stage", "root-approx", "root-stopping-result", "root-convergence",
  "root-shell-rail", "root-shell-header", "root-shell-methods-link", "root-shell-setup-link", "root-shell-answer-link", "root-shell-evidence-link",
  "root-method-section", "root-studio-workspace", "root-setup-card", "root-quiz-answer", "root-evidence-stack", "root-evidence-heading",
  "root-active-method", "root-final-metric", "root-interpretation", "root-next-action",
  "root-method-guide", "root-method-title", "root-method-summary", "root-method-details",
  "root-error-msg", "root-status-msg", "root-diagnostics", "root-bracket-panel", "root-interval-status",
  "root-sign-summary", "root-decision-summary", "root-convergence-graph", "root-rate-summary",
  "root-iteration-thead", "root-iteration-body", "root-solution-steps", "root-copy-solution", "root-copy-status"
];

function makeDocument() {
  const elements = {};
  function ensure(id, tag = "div") {
    if (!elements[id]) elements[id] = new FakeElement(tag, id);
    return elements[id];
  }

  IDS.forEach((id) => ensure(
    id,
    id.includes("compute") ||
    id.includes("tab") ||
    id === "angle-toggle" ||
    id === "root-copy-solution" ||
    id === "root-shell-methods-link" ||
    id === "root-shell-setup-link" ||
    id === "root-shell-answer-link" ||
    id === "root-shell-evidence-link"
      ? "button"
      : "div"
  ));

  const symbolTriggers = [...ROOTS_HTML.matchAll(/<button[^>]*class="[^"]*symbol-trigger[^"]*"[^>]*>/gi)].map((match, index) => {
    const el = new FakeElement("button", "symbol-trigger-" + index);
    el.dataset = datasetFrom(match[0]);
    return el;
  });
  const symbolButtons = [...ROOTS_HTML.matchAll(/<button[^>]*class="[^"]*symbol-btn[^"]*"[^>]*>/gi)].map((match, index) => {
    const el = new FakeElement("button", "symbol-btn-" + index);
    el.dataset = datasetFrom(match[0]);
    return el;
  });

  return {
    elements,
    symbolTriggers,
    symbolButtons,
    createElement(tag) {
      return new FakeElement(tag);
    },
    createDocumentFragment() {
      return new FakeElement("fragment");
    },
    getElementById(id) {
      return ensure(id);
    },
    querySelectorAll(selector) {
      if (selector === ".symbol-trigger") return symbolTriggers;
      if (selector === ".symbol-btn") return symbolButtons;
      return [];
    },
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded") handler();
    }
  };
}

function click(el) {
  const handlers = el.listeners.click || [];
  assert.ok(handlers.length > 0, `${el.id || el.tagName} should be wired for click`);
  handlers[0]();
}

function setValues(document, values) {
  Object.entries(values).forEach(([id, value]) => {
    document.elements[id].value = value;
    document.elements[id].selectionStart = String(value).length;
    document.elements[id].selectionEnd = String(value).length;
  });
}

function closeTo(actualText, expected, tolerance, label) {
  const actual = Number.parseFloat(actualText);
  assert.ok(Number.isFinite(actual), `${label} should be numeric, got ${actualText}`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

const document = makeDocument();
const clipboard = {
  text: "",
  writeText(text) {
    this.text = text;
    return {
      then(fn) {
        fn();
        return { catch() {} };
      }
    };
  }
};
const context = {
  console,
  document,
  navigator: { clipboard },
  window: null,
  Event: function Event(type) { this.type = type; }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

for (const file of FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

assert.strictEqual(document.elements["root-inputs-bisection"].hidden, false);
assert.strictEqual(document.elements["root-inputs-newton"].hidden, true);

setValues(document, {
  "root-bis-expression": "x^2 - 2",
  "root-bis-a": "1",
  "root-bis-b": "2",
  "root-bis-k": "6",
  "root-bis-mode": "round",
  "root-bis-stop-kind": "iterations",
  "root-bis-stop-value": "4",
  "root-bis-decision-basis": "exact",
  "root-bis-sign-display": "both"
});
click(document.elements["root-bis-compute"]);
assert.strictEqual(document.elements["root-approx"].textContent, "1.4375");
assert.strictEqual(document.elements["root-active-method"].textContent, "Bisection");
assert.ok(
  document.elements["root-final-metric"].textContent.includes("epsilon <=") ||
    document.elements["root-final-metric"].textContent.includes("Final |error|"),
  "bisection final metric should summarize error or bound"
);
assert.ok(
  document.elements["root-interpretation"].textContent.includes("requested iterations"),
  "bisection interpretation should explain the stopping result"
);
assert.ok(
  document.elements["root-next-action"].textContent.includes("Increase n") ||
    document.elements["root-next-action"].textContent.includes("tolerance"),
  "bisection next action should guide tighter answers"
);
assert.ok(
  document.elements["root-method-summary"].textContent.includes("interval"),
  "bisection method guide should explain interval use"
);
assert.strictEqual(document.elements["root-empty"].hidden, true);
assert.strictEqual(document.elements["root-result-stage"].hidden, false);
assert.ok(document.elements["root-convergence-graph"].innerHTML.includes("<svg"), "bisection graph should render an svg");
assert.ok(
  ROOTS_HTML.includes("root-studio-workspace"),
  "NET shell workspace should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-setup-card"),
  "NET shell setup card should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-quiz-answer"),
  "NET shell quiz answer section should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-evidence-stack"),
  "NET shell evidence stack should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-evidence-heading"),
  "NET shell evidence heading should exist in the standalone Roots HTML"
);
assert.strictEqual(
  document.elements["root-evidence-heading"].textContent || "Evidence",
  "Evidence"
);
document.elements["root-bis-sign-display"].value = "machine";
document.elements["root-bis-sign-display"].dispatchEvent({ type: "change" });
assert.strictEqual(document.elements["root-result-stage"].hidden, false, "bisection sign display change should keep results visible");
assert.strictEqual(document.elements["root-approx"].textContent, "1.4375", "bisection sign display change should preserve cached approximation");
assert.ok(document.elements["root-sign-summary"].textContent.includes("M("), "bisection sign summary should re-render with machine signs");
click(document.elements["root-shell-answer-link"]);
assert.strictEqual(document.elements["root-quiz-answer"].scrollCount, 1, "Quiz Answer rail click should scroll to the answer section");
assert.strictEqual(document.elements["root-quiz-answer"].focusCount, 1, "Quiz Answer rail click should focus the answer section");
assert.strictEqual(document.elements["root-shell-answer-link"].getAttribute("aria-current"), "true", "Quiz Answer rail link should become current");
click(document.elements["root-shell-evidence-link"]);
assert.strictEqual(document.elements["root-evidence-stack"].scrollCount, 1, "Evidence rail click should scroll to the evidence section");
assert.strictEqual(document.elements["root-shell-evidence-link"].getAttribute("aria-current"), "true", "Evidence rail link should become current");
assert.strictEqual(document.elements["root-shell-answer-link"].getAttribute("aria-current"), "false", "Previous rail link should clear current state");
assert.ok(ROOTS_HTML.includes("root-shell-rail"), "NET shell rail should exist in the standalone Roots HTML");
assert.ok(ROOTS_HTML.includes("root-shell-header"), "NET shell header should exist in the standalone Roots HTML");
assert.ok(ROOTS_HTML.includes("root-method-section"), "Methods section should exist in the standalone Roots HTML");

setValues(document, {
  "root-bis-expression": "x^2 + 1",
  "root-bis-a": "0",
  "root-bis-b": "1",
  "root-bis-k": "6",
  "root-bis-mode": "round",
  "root-bis-stop-kind": "iterations",
  "root-bis-stop-value": "4",
  "root-bis-decision-basis": "exact",
  "root-bis-sign-display": "both"
});
assert.doesNotThrow(() => click(document.elements["root-bis-compute"]));
assert.strictEqual(document.elements["root-approx"].textContent, "N/A");
assert.strictEqual(document.elements["root-stopping-result"].textContent, "Not a valid starting bracket");
assert.ok(
  document.elements["root-interpretation"].textContent.includes("do not bracket"),
  "invalid bracket interpretation should explain the sign problem"
);
assert.ok(
  document.elements["root-next-action"].textContent.includes("opposite signs"),
  "invalid bracket next action should tell the user how to recover"
);

setValues(document, {
  "root-bis-expression": "x^2 - 2",
  "root-bis-a": "1",
  "root-bis-b": "2",
  "root-bis-k": "6",
  "root-bis-mode": "round",
  "root-bis-stop-kind": "iterations",
  "root-bis-stop-value": "0",
  "root-bis-decision-basis": "exact",
  "root-bis-sign-display": "both"
});
assert.doesNotThrow(() => click(document.elements["root-bis-compute"]));
assert.strictEqual(document.elements["root-approx"].textContent, "N/A");
assert.ok(!document.elements["root-convergence"].textContent.includes("null"));

click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");
click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "DEG");
click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");

click(document.elements["root-tab-newton"]);
assert.strictEqual(document.elements["root-method-title"].textContent, "Newton-Raphson");
assert.ok(document.elements["root-method-summary"].textContent.includes("derivative"));
setValues(document, {
  "root-newton-expression": "x^2 - 2",
  "root-newton-df": "2x",
  "root-newton-x0": "1",
  "root-newton-k": "12",
  "root-newton-mode": "round",
  "root-newton-stop-kind": "iterations",
  "root-newton-stop-value": "4"
});
click(document.elements["root-newton-compute"]);
assert.strictEqual(document.elements["root-approx"].textContent, "1.41421356237");
assert.ok(document.elements["root-solution-steps"].innerHTML.includes("Newton-Raphson"));

click(document.elements["root-tab-fixedpoint"]);
assert.strictEqual(document.elements["root-method-title"].textContent, "Fixed Point");
assert.ok(document.elements["root-method-summary"].textContent.includes("g(x)"));
setValues(document, {
  "root-fpi-expression": "cos(x)",
  "root-fpi-x0": "1",
  "root-fpi-k": "12",
  "root-fpi-mode": "round",
  "root-fpi-stop-kind": "iterations",
  "root-fpi-stop-value": "1"
});
click(document.elements["root-fpi-compute"]);
assert.ok(document.elements["root-iteration-body"].innerHTML.includes("0.540302305868"), "fixed-point table should include first cosine iterate");

click(document.elements["root-tab-secant"]);
setValues(document, {
  "root-secant-expression": "x^2 - 2",
  "root-secant-x0": "1",
  "root-secant-x1": "2",
  "root-secant-k": "12",
  "root-secant-mode": "round",
  "root-secant-stop-kind": "iterations",
  "root-secant-stop-value": "4"
});
click(document.elements["root-secant-compute"]);
assert.notStrictEqual(document.elements["root-approx"].textContent, "");
closeTo(document.elements["root-approx"].textContent, 1.41421143847, 1e-11, "secant root");

click(document.elements["root-tab-falseposition"]);
setValues(document, {
  "root-fp-expression": "x^2 - 2",
  "root-fp-a": "1",
  "root-fp-b": "2",
  "root-fp-k": "12",
  "root-fp-mode": "round",
  "root-fp-stop-kind": "iterations",
  "root-fp-stop-value": "4",
  "root-fp-decision-basis": "exact",
  "root-fp-sign-display": "both"
});
click(document.elements["root-fp-compute"]);
assert.notStrictEqual(document.elements["root-approx"].textContent, "");
closeTo(document.elements["root-approx"].textContent, 1.41379310345, 1e-10, "false-position root");
const fpApprox = document.elements["root-approx"].textContent;
document.elements["root-fp-sign-display"].value = "exact";
document.elements["root-fp-sign-display"].dispatchEvent({ type: "change" });
assert.strictEqual(document.elements["root-result-stage"].hidden, false, "false-position sign display change should keep results visible");
assert.strictEqual(document.elements["root-approx"].textContent, fpApprox, "false-position sign display change should preserve cached approximation");
assert.ok(document.elements["root-sign-summary"].textContent.includes("E("), "false-position sign summary should re-render with exact signs");

click(document.elements["root-copy-solution"]);
assert.strictEqual(document.elements["root-copy-status"].textContent, "Solution copied.");
const copiedLines = clipboard.text.split(/\r?\n/);
const nextActionIndex = copiedLines.indexOf("Next action");
const evidenceIndex = copiedLines.indexOf("Evidence");
assert.strictEqual(copiedLines[0], "Quiz-ready answer", "copied solution should start with quiz-ready answer");
assert.ok(nextActionIndex >= 0, "copied solution should include next action heading");
assert.ok(evidenceIndex >= 0, "copied solution should include evidence heading");
assert.ok(evidenceIndex > nextActionIndex, "evidence heading should appear after next action");
assert.ok(clipboard.text.includes("false position"), "copy should include current solution text");
assert.ok(clipboard.text.includes("Method: False Position"), "copy should include method header");
assert.ok(clipboard.text.includes("Approximate root:"), "copy should include approximate root");
assert.ok(clipboard.text.includes("Stopping result:"), "copy should include stopping result");
assert.ok(clipboard.text.includes("Stopping parameters:"), "copy should include stopping parameters");
assert.ok(clipboard.text.includes("Next action"), "copy should include next action guidance");
assert.ok(clipboard.text.includes("Evidence"), "copied solution should include evidence section");

const bisTrigger = document.symbolTriggers.find((trigger) => trigger.dataset.symbolTarget === "root-bis-expression");
const sqrtButton = document.symbolButtons.find((button) => button.dataset.symbolInsert === "sqrt(");
document.elements["root-bis-expression"].value = "x";
document.elements["root-bis-expression"].selectionStart = 1;
document.elements["root-bis-expression"].selectionEnd = 1;
click(bisTrigger);
assert.strictEqual(document.elements["symbol-popover"].hidden, false);
click(sqrtButton);
assert.strictEqual(document.elements["root-bis-expression"].value, "xsqrt(");
assert.strictEqual(document.elements["symbol-popover"].hidden, true);

click(document.elements["root-tab-newton"]);
assert.strictEqual(document.elements["root-inputs-newton"].hidden, false);
assert.strictEqual(document.elements["root-inputs-bisection"].hidden, true);
assert.strictEqual(document.elements["root-approx"].textContent, "1.41421356237");

click(document.elements["root-tab-secant"]);
assert.strictEqual(document.elements["root-approx"].textContent, "1.41421143847");
