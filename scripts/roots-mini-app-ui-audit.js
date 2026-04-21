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
  const select = ROOTS_HTML.match(new RegExp(`<select[^>]*id="${id}"[^>]*>[\\s\\S]*?<option[^>]*value="([^"]*)"[^>]*selected`, "i"));
  if (select) return select[1];
  return "";
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName;
    this.id = id || "";
    this.value = valueFor(id || "");
    this.hidden = false;
    this.textContent = "";
    this.innerHTML = "";
    this.children = [];
    this.dataset = {};
    this.listeners = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

function makeDocument() {
  const elements = {};
  function ensure(id, tag = "div") {
    if (!elements[id]) elements[id] = new FakeElement(tag, id);
    return elements[id];
  }

  [
    "status-angle", "angle-toggle", "root-bis-expression", "root-bis-a", "root-bis-b",
    "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value",
    "root-bis-tolerance-type", "root-bis-decision-basis", "root-bis-sign-display",
    "root-bis-compute", "root-empty", "root-result-stage", "root-approx",
    "root-stopping-result", "root-convergence", "root-error-msg", "root-status-msg",
    "root-iteration-thead", "root-iteration-body", "root-solution-steps"
  ].forEach((id) => ensure(id, id.includes("compute") || id === "angle-toggle" ? "button" : "div"));

  const methodButtons = ["bisection", "newton", "secant", "falsePosition", "fixedPoint"].map((method) => {
    const button = new FakeElement("button");
    button.dataset.method = method;
    return button;
  });

  return {
    elements,
    createElement(tag) {
      return new FakeElement(tag);
    },
    getElementById(id) {
      return ensure(id);
    },
    querySelectorAll(selector) {
      return selector === "[data-method]" ? methodButtons : [];
    },
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded") handler();
    }
  };
}

const document = makeDocument();
const context = {
  console,
  document,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  window: null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

for (const file of FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

document.elements["root-bis-expression"].value = "x^2 - 2";
document.elements["root-bis-a"].value = "1";
document.elements["root-bis-b"].value = "2";
document.elements["root-bis-k"].value = "6";
document.elements["root-bis-mode"].value = "round";
document.elements["root-bis-stop-kind"].value = "iterations";
document.elements["root-bis-stop-value"].value = "4";
document.elements["root-bis-decision-basis"].value = "exact";
document.elements["root-bis-sign-display"].value = "both";

const clickHandlers = document.elements["root-bis-compute"].listeners.click || [];
assert.ok(clickHandlers.length > 0, "bisection compute button should be wired");
clickHandlers[0]();

assert.strictEqual(document.elements["root-approx"].textContent, "1.4375");
assert.strictEqual(document.elements["root-empty"].hidden, true);
assert.strictEqual(document.elements["root-result-stage"].hidden, false);

const angleHandlers = document.elements["angle-toggle"].listeners.click || [];
assert.ok(angleHandlers.length > 0, "angle toggle should be wired");
angleHandlers[0]();
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");
angleHandlers[0]();
assert.strictEqual(document.elements["status-angle"].textContent, "DEG");

document.elements["root-bis-expression"].value = "x^2 + 1";
document.elements["root-bis-a"].value = "0";
document.elements["root-bis-b"].value = "1";
document.elements["root-bis-k"].value = "6";
document.elements["root-bis-mode"].value = "round";
document.elements["root-bis-stop-kind"].value = "iterations";
document.elements["root-bis-stop-value"].value = "4";
document.elements["root-bis-decision-basis"].value = "exact";
document.elements["root-bis-sign-display"].value = "both";

assert.doesNotThrow(() => clickHandlers[0]());
assert.strictEqual(document.elements["root-approx"].textContent, "N/A");
assert.strictEqual(document.elements["root-stopping-result"].textContent, "invalid-bracket");

document.elements["root-bis-expression"].value = "x^2 - 2";
document.elements["root-bis-a"].value = "1";
document.elements["root-bis-b"].value = "2";
document.elements["root-bis-k"].value = "6";
document.elements["root-bis-mode"].value = "round";
document.elements["root-bis-stop-kind"].value = "iterations";
document.elements["root-bis-stop-value"].value = "0";
document.elements["root-bis-decision-basis"].value = "exact";
document.elements["root-bis-sign-display"].value = "both";

assert.doesNotThrow(() => clickHandlers[0]());
assert.strictEqual(document.elements["root-approx"].textContent, "N/A");
assert.ok(!document.elements["root-convergence"].textContent.includes("null"));
