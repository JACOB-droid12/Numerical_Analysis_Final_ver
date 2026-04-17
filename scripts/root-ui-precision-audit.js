"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const INDEX_HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const ENGINE_FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js",
  "root-ui.js"
];

function defaultInputValue(id) {
  const match = INDEX_HTML.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`, "i"));
  if (!match) return "";
  const value = match[0].match(/\svalue="([^"]*)"/i);
  return value ? value[1] : "";
}

function defaultSelectValue(id) {
  const match = INDEX_HTML.match(new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/select>`, "i"));
  if (!match) return "";
  const selected = match[1].match(/<option[^>]*value="([^"]*)"[^>]*selected/i);
  if (selected) return selected[1];
  const first = match[1].match(/<option[^>]*value="([^"]*)"/i);
  return first ? first[1] : "";
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName;
    this.id = id || "";
    this.value = "";
    this.hidden = false;
    this.textContent = "";
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.parent = null;
    this.classList = {
      toggle: () => {}
    };
    let html = "";
    Object.defineProperty(this, "innerHTML", {
      get: () => html,
      set: (value) => {
        html = String(value);
        this.children = [];
      }
    });
  }

  appendChild(child) {
    if (child.tagName === "#fragment") {
      child.children.forEach((grandchild) => {
        grandchild.parent = this;
        this.children.push(grandchild);
      });
      return child;
    }
    child.parent = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  closest(selector) {
    return selector === "#tab-root" ? this : null;
  }

  matches() {
    return false;
  }
}

function makeDocument() {
  const elements = {};
  const methodButtons = ["bisection", "newton", "secant", "falsePosition", "fixedPoint"].map((method) => {
    const el = new FakeElement("button");
    el.dataset.method = method;
    return el;
  });

  function ensure(id, tagName) {
    if (!elements[id]) elements[id] = new FakeElement(tagName || "div", id);
    return elements[id];
  }

  const ids = [
    "root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode",
    "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis",
    "root-bis-sign-display", "root-bis-compute", "root-bis-advanced", "root-bis-tolerance-type-wrap",
    "root-bis-tolerance-note", "root-inputs-bisection",
    "root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k",
    "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value", "root-newton-compute",
    "root-inputs-newton",
    "root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k",
    "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value", "root-secant-compute",
    "root-inputs-secant",
    "root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode",
    "root-fp-stop-kind", "root-fp-stop-value", "root-fp-decision-basis", "root-fp-sign-display",
    "root-fp-compute", "root-fp-advanced", "root-inputs-falseposition",
    "root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind",
    "root-fpi-stop-value", "root-fpi-compute", "root-inputs-fixedpoint",
    "tab-root", "root-empty", "root-result-stage", "root-approx", "root-stopping-result",
    "root-convergence", "root-diagnostics", "root-bracket-panel", "root-interval-status",
    "root-sign-summary", "root-decision-summary", "root-convergence-graph", "root-rate-summary",
    "root-solution-steps", "root-copy-solution", "root-copy-status", "root-iteration-thead",
    "root-iteration-body", "root-error-msg", "root-status-msg"
  ];

  ids.forEach((id) => {
    const tagName = id.includes("compute") || id === "root-copy-solution" ? "button" : "div";
    const el = ensure(id, tagName);
    if (id.includes("-mode") || id.includes("stop-kind") || id.includes("decision-basis") || id.includes("sign-display") || id.includes("tolerance-type")) {
      el.value = defaultSelectValue(id);
    } else {
      el.value = defaultInputValue(id);
    }
  });

  return {
    elements,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createDocumentFragment() {
      return new FakeElement("#fragment");
    },
    querySelectorAll(selector) {
      return selector === "[data-method]" ? methodButtons : [];
    },
    querySelector(selector) {
      const method = selector.match(/^\[data-method='([^']+)'\]$/);
      if (method) return methodButtons.find((button) => button.dataset.method === method[1]) || null;
      return null;
    }
  };
}

function loadRootUI() {
  const document = makeDocument();
  const context = {
    console,
    document,
    navigator: { clipboard: { writeText: () => Promise.resolve() } }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);

  for (const file of ENGINE_FILES) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }

  const helpers = {
    byId: (id) => document.elements[id] || null,
    setContent: (id, text) => { document.elements[id].textContent = String(text); },
    setHidden: (id, hidden) => { document.elements[id].hidden = Boolean(hidden); },
    showError: (id, message) => {
      document.elements[id].textContent = String(message || "");
      document.elements[id].hidden = !message;
    },
    markInvalid: () => {},
    clearInvalid: () => {},
    announceStatus: (id, message) => { document.elements[id].textContent = String(message); },
    clearStatus: (id) => { document.elements[id].textContent = ""; },
    debounce: (fn) => {
      fn.cancel = () => {};
      return fn;
    },
    getAngleMode: () => "rad",
    syncMathPreviews: () => {}
  };

  context.RootUI.init(helpers);
  return { context, document };
}

function click(element) {
  assert.ok(element.listeners.click && element.listeners.click.length > 0, "element has a click listener");
  element.listeners.click[0]();
}

function rootTableRows(document) {
  return document.elements["root-iteration-body"].children;
}

const { document } = loadRootUI();

document.elements["root-bis-expression"].value = "x - 1.455";
document.elements["root-bis-a"].value = "1";
document.elements["root-bis-b"].value = "2";
document.elements["root-bis-k"].value = "3";
document.elements["root-bis-mode"].value = "chop";
document.elements["root-bis-stop-kind"].value = "iterations";
document.elements["root-bis-stop-value"].value = "5";
click(document.elements["root-bis-compute"]);

assert.strictEqual(
  document.elements["root-decision-summary"].textContent,
  "Machine signs decide the interval",
  "Bisection should use machine signs by default so k/mode affect the visible root path."
);
assert.strictEqual(
  document.elements["root-approx"].textContent,
  "1.46",
  "Bisection k=3 chopping should display the machine-stored root approximation."
);

const newtonButton = document.querySelector("[data-method='newton']");
click(newtonButton);
document.elements["root-newton-expression"].value = "x^2 - 2";
document.elements["root-newton-df"].value = "2*x";
document.elements["root-newton-x0"].value = "1";
document.elements["root-newton-k"].value = "3";
document.elements["root-newton-mode"].value = "chop";
document.elements["root-newton-stop-kind"].value = "iterations";
document.elements["root-newton-stop-value"].value = "2";
click(document.elements["root-newton-compute"]);

assert.strictEqual(
  rootTableRows(document)[0].children[1].textContent,
  "1.00",
  "Newton table values should preserve selected significant digits, including trailing zeros."
);
assert.strictEqual(
  rootTableRows(document)[0].children[4].textContent,
  "1.50",
  "Newton x_n+1 should preserve selected significant digits, including trailing zeros."
);

console.log("Root UI precision audit passed.");
