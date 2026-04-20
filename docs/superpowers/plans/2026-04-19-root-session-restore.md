# Root Session Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add root-module-only session recovery that restores the last active root method immediately on page load, preserves unfinished drafts, and automatically recomputes only previously successful root runs.

**Architecture:** Keep the feature inside `root-ui.js`, because that file already owns active root method selection, root compute orchestration, and root rendering. Persist one small versioned session object in `localStorage`, store only the last active method's raw field values, and verify behavior with a new Node-based audit script that follows the existing `scripts/root-ui-precision-audit.js` pattern.

**Tech Stack:** Vanilla JavaScript, HTML, existing Node `vm`-based audit scripts, browser `localStorage`

---

## File Structure

**Create:**
- `scripts/root-ui-session-restore-audit.js` — Node audit harness for root draft restore, successful-run restore, invalid payload handling, and overwrite behavior using the same fake-DOM approach as `scripts/root-ui-precision-audit.js`.

**Modify:**
- `root-ui.js` — Adds the root session schema, storage helpers, method-field collection/application, autosave hooks, restore-on-init flow, successful-run capture, and restore failure downgrade logic. This remains the only production file for this feature.

**Verify only:**
- `scripts/root-ui-precision-audit.js` — Existing root UI regression coverage.
- `scripts/root-engine-audit.js` — Existing solver correctness regression coverage.
- `index.html` — Reference only for field IDs and default form values; do not modify it for this feature.

**Do not modify unless implementation proves it is unavoidable:**
- `app.js`
- `root-engine.js`
- `styles.css`

---

### Task 1: Add A Script-Based Audit Harness For Root Session Recovery

**Files:**
- Create: `scripts/root-ui-session-restore-audit.js`
- Reference: `scripts/root-ui-precision-audit.js`

- [ ] **Step 1: Create the failing audit script**

Create `scripts/root-ui-session-restore-audit.js` with this full harness:

```javascript
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

const ROOT_SESSION_KEY = "ma-lab-root-session-v1";

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

class FakeLocalStorage {
  constructor(seed) {
    this.store = Object.assign({}, seed || {});
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

class FakeClassList {
  constructor() {
    this.set = new Set();
  }
  toggle(name, force) {
    if (force === true) this.set.add(name);
    else if (force === false) this.set.delete(name);
    else if (this.set.has(name)) this.set.delete(name);
    else this.set.add(name);
  }
  contains(name) {
    return this.set.has(name);
  }
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName.toLowerCase();
    this.id = id || "";
    this.value = "";
    this.hidden = false;
    this.textContent = "";
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.parent = null;
    this.classList = new FakeClassList();
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
    child.parent = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }

  matches(selector) {
    if (selector === "input, select") return this.tagName === "input" || this.tagName === "select";
    if (selector === "select") return this.tagName === "select";
    if (selector === "input[type='text'], input[type='number']") {
      return this.tagName === "input" && (this.attributes.type === "text" || this.attributes.type === "number");
    }
    return false;
  }

  closest(selector) {
    if (selector === "#tab-root") return this.parent && this.parent.id === "tab-root" ? this.parent : null;
    return null;
  }

  focus() {}
}

function makeDocument() {
  const elements = {};
  const methodButtons = ["bisection", "newton", "secant", "falsePosition", "fixedPoint"].map((method) => {
    const button = new FakeElement("button");
    button.dataset.method = method;
    return button;
  });

  function ensure(id, tagName) {
    if (!elements[id]) elements[id] = new FakeElement(tagName || "div", id);
    return elements[id];
  }

  const fieldIds = [
    "root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode",
    "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis",
    "root-bis-sign-display", "root-inputs-bisection", "root-bis-advanced", "root-bis-tolerance-type-wrap",
    "root-bis-tolerance-note", "root-bis-compute",
    "root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode",
    "root-newton-stop-kind", "root-newton-stop-value", "root-inputs-newton", "root-newton-compute",
    "root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode",
    "root-secant-stop-kind", "root-secant-stop-value", "root-inputs-secant", "root-secant-compute",
    "root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind",
    "root-fp-stop-value", "root-fp-decision-basis", "root-fp-sign-display", "root-inputs-falseposition",
    "root-fp-advanced", "root-fp-compute",
    "root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind",
    "root-fpi-stop-value", "root-inputs-fixedpoint", "root-fpi-compute",
    "tab-root", "root-empty", "root-result-stage", "root-approx", "root-stopping-result",
    "root-convergence", "root-diagnostics", "root-bracket-panel", "root-interval-status",
    "root-sign-summary", "root-decision-summary", "root-convergence-graph", "root-rate-summary",
    "root-solution-steps", "root-copy-solution", "root-copy-status", "root-iteration-thead",
    "root-iteration-body", "root-error-msg", "root-status-msg"
  ];

  fieldIds.forEach((id) => {
    const isButton = id.endsWith("-compute") || id === "root-copy-solution";
    const isSelect = id.endsWith("-mode") || id.includes("stop-kind") || id.includes("decision-basis") || id.includes("sign-display") || id.includes("tolerance-type");
    const isInput = !isButton && !id.startsWith("root-inputs-") && !id.endsWith("-advanced") && !id.endsWith("-wrap") && !id.endsWith("-note") && !id.startsWith("root-") ? false : false;
    const tagName = isButton ? "button" : (isSelect ? "select" : (id.startsWith("root-") && (id.includes("expression") || id.endsWith("-a") || id.endsWith("-b") || id.endsWith("-x0") || id.endsWith("-x1") || id.endsWith("-k") || id.endsWith("-value") || id.endsWith("-df")) ? "input" : "div"));
    const el = ensure(id, tagName);
    if (tagName === "input") {
      el.setAttribute("type", id.endsWith("-k") ? "number" : "text");
      el.value = defaultInputValue(id);
    } else if (tagName === "select") {
      el.value = defaultSelectValue(id);
    }
  });

  const tabRoot = ensure("tab-root", "div");
  Object.keys(elements).forEach((id) => {
    if (id !== "tab-root" && id.startsWith("root-")) {
      elements[id].parent = tabRoot;
    }
  });

  return {
    elements,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelectorAll(selector) {
      if (selector === "[data-method]") return methodButtons;
      return [];
    },
    querySelector(selector) {
      const match = selector.match(/^\[data-method='([^']+)'\]$/);
      if (match) return methodButtons.find((button) => button.dataset.method === match[1]) || null;
      return null;
    }
  };
}

function loadRootUI(seed) {
  const document = makeDocument();
  const storage = new FakeLocalStorage(seed || {});
  const context = {
    console,
    document,
    localStorage: storage,
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
  return { context, document, storage };
}

function click(element) {
  assert.ok(element.listeners.click && element.listeners.click.length > 0, "missing click handler");
  element.listeners.click[0]({ target: element, preventDefault() {} });
}

function triggerInput(document, id) {
  const panel = document.elements["tab-root"];
  const target = document.elements[id];
  assert.ok(panel.listeners.input && panel.listeners.input.length > 0, "missing delegated input handler");
  panel.listeners.input[0]({ target });
}

function parseStored(storage) {
  const raw = storage.getItem(ROOT_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function seedDraft(method, fields) {
  return {
    [ROOT_SESSION_KEY]: JSON.stringify({
      version: 1,
      activeMethod: method,
      fields,
      hasSuccessfulRun: false,
      savedAt: "2026-04-19T16:00:00.000Z"
    })
  };
}

// Draft restore should restore fields but not compute.
{
  const { document } = loadRootUI(seedDraft("newton", {
    "root-newton-expression": "x^2 - 2",
    "root-newton-df": "2*x",
    "root-newton-x0": "1",
    "root-newton-k": "6",
    "root-newton-mode": "round",
    "root-newton-stop-kind": "iterations",
    "root-newton-stop-value": "4"
  }));

  assert.strictEqual(document.elements["root-inputs-newton"].hidden, false, "saved draft method should be visible");
  assert.strictEqual(document.elements["root-newton-expression"].value, "x^2 - 2", "draft expression should restore");
  assert.strictEqual(document.elements["root-newton-df"].value, "2*x", "draft derivative should restore");
  assert.strictEqual(document.elements["root-result-stage"].hidden, true, "draft restore should not auto-compute");
}

// Autosave should overwrite the stored session with the current active method only.
{
  const { document, storage } = loadRootUI();
  click(document.querySelector("[data-method='secant']"));
  document.elements["root-secant-expression"].value = "cos(x) - x";
  document.elements["root-secant-x0"].value = "0.5";
  document.elements["root-secant-x1"].value = "1";
  triggerInput(document, "root-secant-expression");

  const saved = parseStored(storage);
  assert.strictEqual(saved.activeMethod, "secant", "autosave should target the current active method");
  assert.strictEqual(saved.fields["root-secant-expression"], "cos(x) - x", "autosave should persist the active method fields");
  assert.ok(!Object.prototype.hasOwnProperty.call(saved.fields, "root-newton-expression"), "autosave should not keep another method snapshot");
}

// Invalid payloads should be ignored safely.
{
  const { document } = loadRootUI({ [ROOT_SESSION_KEY]: "{not-json" });
  assert.strictEqual(document.elements["root-inputs-bisection"].hidden, false, "invalid storage should fall back to the default method");
}

console.log("Root UI session restore audit passed.");
```

- [ ] **Step 2: Run the audit and verify it fails before implementation**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected: `FAIL` with an assertion or runtime error because `root-ui.js` does not yet restore from `localStorage` or autosave root drafts.

- [ ] **Step 3: Commit the failing audit**

```bash
git add scripts/root-ui-session-restore-audit.js
git commit -m "test(root): add failing session restore audit"
```

---

### Task 2: Implement Draft Autosave And Draft Restore In root-ui.js

**Files:**
- Modify: `root-ui.js`
- Test: `scripts/root-ui-session-restore-audit.js`

- [ ] **Step 1: Extend the root method config with session field coverage**

In `root-ui.js`, replace the current `METHOD_CONFIGS` block with this version so each method explicitly defines persisted fields and a single primary formula field for meaningful draft detection:

```javascript
  const METHOD_CONFIGS = [
    {
      name: "bisection",
      label: "Bisection",
      panelId: "root-inputs-bisection",
      fieldIds: ["root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type"],
      resetFieldIds: ["root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis"],
      sessionFieldIds: ["root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis", "root-bis-sign-display"],
      primaryFieldIds: ["root-bis-expression"],
      previewIds: [{ inputId: "root-bis-expression", allowVariable: true }]
    },
    {
      name: "newton",
      label: "Newton\u2013Raphson",
      panelId: "root-inputs-newton",
      fieldIds: ["root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"],
      resetFieldIds: ["root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"],
      sessionFieldIds: ["root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"],
      primaryFieldIds: ["root-newton-expression"],
      previewIds: [{ inputId: "root-newton-expression", allowVariable: true }, { inputId: "root-newton-df", allowVariable: true }]
    },
    {
      name: "secant",
      label: "Secant",
      panelId: "root-inputs-secant",
      fieldIds: ["root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"],
      resetFieldIds: ["root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"],
      sessionFieldIds: ["root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"],
      primaryFieldIds: ["root-secant-expression"],
      previewIds: [{ inputId: "root-secant-expression", allowVariable: true }]
    },
    {
      name: "falsePosition",
      label: "False Position",
      panelId: "root-inputs-falseposition",
      fieldIds: ["root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value"],
      resetFieldIds: ["root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value", "root-fp-decision-basis"],
      sessionFieldIds: ["root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value", "root-fp-decision-basis", "root-fp-sign-display"],
      primaryFieldIds: ["root-fp-expression"],
      previewIds: [{ inputId: "root-fp-expression", allowVariable: true }]
    },
    {
      name: "fixedPoint",
      label: "Fixed Point",
      panelId: "root-inputs-fixedpoint",
      fieldIds: ["root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"],
      resetFieldIds: ["root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"],
      sessionFieldIds: ["root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"],
      primaryFieldIds: ["root-fpi-expression"],
      previewIds: [{ inputId: "root-fpi-expression", allowVariable: true }]
    }
  ];
```

- [ ] **Step 2: Add the root session constants, helpers, and draft persistence layer**

In `root-ui.js`, add these constants after `DEBOUNCE_MS`, extend the `state` object, and insert the helper block immediately after the `state` declaration:

```javascript
  const ROOT_SESSION_KEY = "ma-lab-root-session-v1";
  const ROOT_SESSION_VERSION = 1;
```

```javascript
  const state = {
    activeMethod: "bisection",
    runs: {},
    debounces: {},
    restoringSession: false
  };
```

```javascript
  function getMethodConfig(name) {
    return METHOD_CONFIGS.find(function(cfg) { return cfg.name === name; }) || null;
  }

  function readRootSession() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(ROOT_SESSION_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (!session || session.version !== ROOT_SESSION_VERSION) return null;
      if (!getMethodConfig(session.activeMethod)) return null;
      if (!session.fields || typeof session.fields !== "object") return null;
      return {
        version: ROOT_SESSION_VERSION,
        activeMethod: session.activeMethod,
        fields: session.fields,
        hasSuccessfulRun: session.hasSuccessfulRun === true,
        savedAt: session.savedAt || null
      };
    } catch (error) {
      return null;
    }
  }

  function writeRootSession(session) {
    try {
      if (!window.localStorage) return;
      window.localStorage.setItem(ROOT_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }

  function clearRootSession() {
    try {
      if (!window.localStorage) return;
      window.localStorage.removeItem(ROOT_SESSION_KEY);
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }

  function collectFieldsForMethod(methodName) {
    var cfg = getMethodConfig(methodName);
    var fields = {};
    if (!cfg) return fields;
    cfg.sessionFieldIds.forEach(function(id) {
      var el = byId(id);
      if (el) fields[id] = el.value;
    });
    return fields;
  }

  function applyFieldsForMethod(methodName, fields) {
    var cfg = getMethodConfig(methodName);
    if (!cfg) return;
    cfg.sessionFieldIds.forEach(function(id) {
      if (!Object.prototype.hasOwnProperty.call(fields, id)) return;
      var el = byId(id);
      if (el) el.value = fields[id];
    });
  }

  function hasMeaningfulDraft(methodName, fields) {
    var cfg = getMethodConfig(methodName);
    if (!cfg) return false;
    return cfg.primaryFieldIds.some(function(id) {
      return Object.prototype.hasOwnProperty.call(fields, id) && String(fields[id]).trim() !== "";
    });
  }

  function buildRootSession(hasSuccessfulRun) {
    return {
      version: ROOT_SESSION_VERSION,
      activeMethod: state.activeMethod,
      fields: collectFieldsForMethod(state.activeMethod),
      hasSuccessfulRun: hasSuccessfulRun === true,
      savedAt: new Date().toISOString()
    };
  }

  function captureRootDraft() {
    if (state.restoringSession) return;
    var session = buildRootSession(false);
    if (!hasMeaningfulDraft(session.activeMethod, session.fields)) {
      clearRootSession();
      return;
    }
    writeRootSession(session);
  }
```

- [ ] **Step 3: Wire draft autosave into method activation and delegated input/change handling**

In `activateMethod(name)`, add `captureRootDraft();` at the very end of the function:

```javascript
  function activateMethod(name) {
    state.activeMethod = name;
    METHOD_CONFIGS.forEach(function(cfg) {
      const btn = document.querySelector("[data-method='" + cfg.name + "']");
      const panel = byId(cfg.panelId);
      const isActive = cfg.name === name;
      if (btn) {
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      if (panel) panel.hidden = !isActive;
    });

    const advBis = byId("root-bis-advanced");
    const advFP = byId("root-fp-advanced");
    if (advBis) advBis.hidden = (name !== "bisection");
    if (advFP) advFP.hidden = (name !== "falsePosition");
    const bracketPanel = byId("root-bracket-panel");
    if (bracketPanel) setHidden("root-bracket-panel", name !== "bisection" && name !== "falsePosition");

    const run = state.runs[name];
    if (run) {
      renderRun(run);
    } else {
      resetResults();
    }

    captureRootDraft();
  }
```

In the delegated reset handler inside `wireEvents()`, add `captureRootDraft();` after `syncBisectionToleranceControls();`:

```javascript
      const debouncedReset = h.debounce(function() {
        const cfg = METHOD_CONFIGS.find(function(c) { return c.name === state.activeMethod; });
        if (cfg) clearInvalid(cfg.fieldIds, "root-error-msg");
        showError("root-error-msg", "");
        state.runs[state.activeMethod] = null;
        resetResults();
        syncBisectionToleranceControls();
        captureRootDraft();
        if (h.syncMathPreviews) h.syncMathPreviews();
      }, DEBOUNCE_MS);
```

- [ ] **Step 4: Run the audit and verify the draft tests pass**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected:

```text
Root UI session restore audit passed.
```

- [ ] **Step 5: Commit the draft autosave/restore work**

```bash
git add root-ui.js
git commit -m "feat(root): persist and restore unfinished root drafts"
```

---

### Task 3: Add Successful-Run Capture And Automatic Recompute On Restore

**Files:**
- Modify: `root-ui.js`
- Modify: `scripts/root-ui-session-restore-audit.js`

- [ ] **Step 1: Extend the audit with a failing successful-run restore test**

Append this new test block just before the final `console.log("Root UI session restore audit passed.");` line in `scripts/root-ui-session-restore-audit.js`:

```javascript
// Successful sessions should auto-recompute on load.
{
  const seed = {
    [ROOT_SESSION_KEY]: JSON.stringify({
      version: 1,
      activeMethod: "bisection",
      fields: {
        "root-bis-expression": "x^2 - 2",
        "root-bis-a": "1",
        "root-bis-b": "2",
        "root-bis-k": "6",
        "root-bis-mode": "round",
        "root-bis-stop-kind": "iterations",
        "root-bis-stop-value": "5",
        "root-bis-tolerance-type": "relative",
        "root-bis-decision-basis": "machine",
        "root-bis-sign-display": "both"
      },
      hasSuccessfulRun: true,
      savedAt: "2026-04-19T16:00:00.000Z"
    })
  };

  const { document } = loadRootUI(seed);
  assert.strictEqual(document.elements["root-result-stage"].hidden, false, "successful restore should recompute and show results");
  assert.notStrictEqual(document.elements["root-approx"].textContent, "Not calculated yet.", "successful restore should recompute the approximation");
}
```

- [ ] **Step 2: Run the audit and verify it fails**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected: `FAIL` on `successful restore should recompute and show results`.

- [ ] **Step 3: Add successful-session capture and restore logic to root-ui.js**

In `root-ui.js`, add these helpers after `captureRootDraft()`:

```javascript
  function captureRootSuccess() {
    if (state.restoringSession) return;
    writeRootSession(buildRootSession(true));
  }

  function restoreRootSession() {
    var session = readRootSession();
    if (!session) return false;

    state.restoringSession = true;
    try {
      activateMethod(session.activeMethod);
      applyFieldsForMethod(session.activeMethod, session.fields);
      syncBisectionToleranceControls();
      if (h.syncMathPreviews) h.syncMathPreviews();

      if (session.hasSuccessfulRun) {
        var run = COMPUTE_FNS[state.activeMethod]();
        state.runs[state.activeMethod] = run;
        renderRun(run);
        announceStatus("root-status-msg", "Restored previous " + getMethodConfig(state.activeMethod).label + " session.");
      } else {
        announceStatus("root-status-msg", "Restored unfinished " + getMethodConfig(state.activeMethod).label + " draft.");
      }

      return true;
    } catch (error) {
      var cfg = getMethodConfig(state.activeMethod);
      if (cfg) clearInvalid(cfg.fieldIds, "root-error-msg");
      showError("root-error-msg", formatRootError(error));
      state.runs[state.activeMethod] = null;
      resetResults();
      captureRootDraft();
      return true;
    } finally {
      state.restoringSession = false;
    }
  }
```

In `runCompute()`, save successful sessions after rendering:

```javascript
  function runCompute() {
    const cfg = METHOD_CONFIGS.find(function(c) { return c.name === state.activeMethod; });
    if (!cfg) return;
    if (state.debounces[state.activeMethod]) {
      state.debounces[state.activeMethod].cancel && state.debounces[state.activeMethod].cancel();
    }
    clearInvalid(cfg.fieldIds, "root-error-msg");
    showError("root-error-msg", "");

    try {
      const run = COMPUTE_FNS[state.activeMethod]();
      state.runs[state.activeMethod] = run;
      renderRun(run);
      captureRootSuccess();
      const approxText = run.summary.approximation != null ? fmtRunVal(run.summary.approximation, run, 14) : "N/A";
      announceStatus("root-status-msg", "Result updated. Approximate root = " + approxText + ".");
    } catch (err) {
      state.runs[state.activeMethod] = null;
      resetResults();
      markInvalid(cfg.fieldIds, "root-error-msg");
      showError("root-error-msg", formatRootError(err));
      clearStatus("root-status-msg");
      captureRootDraft();
    }
  }
```

In `init(appHelpers)`, replace the current default activation sequence:

```javascript
  function init(appHelpers) {
    h = appHelpers;
    wireEvents();
    syncBisectionToleranceControls();
    if (!restoreRootSession()) {
      activateMethod("bisection");
    }
  }
```

- [ ] **Step 4: Run the audit and verify it passes**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected:

```text
Root UI session restore audit passed.
```

- [ ] **Step 5: Commit successful-run restore**

```bash
git add root-ui.js scripts/root-ui-session-restore-audit.js
git commit -m "feat(root): restore successful root sessions on load"
```

---

### Task 4: Harden Restore Failures And Keep Storage Durable

**Files:**
- Modify: `root-ui.js`
- Modify: `scripts/root-ui-session-restore-audit.js`

- [ ] **Step 1: Add a failing test for auto-recompute downgrade after a stale success payload**

Append this test block above the final `console.log("Root UI session restore audit passed.");` line:

```javascript
// Failed recompute should keep fields and downgrade the session back to a draft.
{
  const seed = {
    [ROOT_SESSION_KEY]: JSON.stringify({
      version: 1,
      activeMethod: "newton",
      fields: {
        "root-newton-expression": "x^2 - 2",
        "root-newton-df": "",
        "root-newton-x0": "1",
        "root-newton-k": "6",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "iterations",
        "root-newton-stop-value": "4"
      },
      hasSuccessfulRun: true,
      savedAt: "2026-04-19T16:00:00.000Z"
    })
  };

  const { document, storage } = loadRootUI(seed);
  const saved = parseStored(storage);
  assert.strictEqual(document.elements["root-newton-expression"].value, "x^2 - 2", "failed recompute should keep restored fields");
  assert.strictEqual(saved.hasSuccessfulRun, false, "failed recompute should downgrade the saved session to a draft");
}
```

- [ ] **Step 2: Run the audit and verify it fails**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected: `FAIL` on `failed recompute should downgrade the saved session to a draft`.

- [ ] **Step 3: Preserve restored fields when recompute fails and only then downgrade**

In `restoreRootSession()`, replace the `catch` block with this version so it does not wipe restored fields:

```javascript
    } catch (error) {
      var cfg = getMethodConfig(state.activeMethod);
      if (cfg) clearInvalid(cfg.fieldIds, "root-error-msg");
      showError("root-error-msg", formatRootError(error));
      state.runs[state.activeMethod] = null;
      writeRootSession({
        version: ROOT_SESSION_VERSION,
        activeMethod: state.activeMethod,
        fields: collectFieldsForMethod(state.activeMethod),
        hasSuccessfulRun: false,
        savedAt: new Date().toISOString()
      });
      announceStatus("root-status-msg", "Restored unfinished " + getMethodConfig(state.activeMethod).label + " draft.");
      return true;
    } finally {
      state.restoringSession = false;
    }
```

Also tighten `captureRootDraft()` so it clears storage when the active method's primary formula field is blank:

```javascript
  function captureRootDraft() {
    if (state.restoringSession) return;
    var session = buildRootSession(false);
    if (!hasMeaningfulDraft(session.activeMethod, session.fields)) {
      clearRootSession();
      return;
    }
    writeRootSession(session);
  }
```

This is the implementation of "clear" for the current UI: there is no explicit Root reset button today, so clearing the active method's main formula field removes the saved session instead of preserving an empty shell.

- [ ] **Step 4: Run the audit and verify it passes again**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
```

Expected:

```text
Root UI session restore audit passed.
```

- [ ] **Step 5: Commit the hardening pass**

```bash
git add root-ui.js scripts/root-ui-session-restore-audit.js
git commit -m "fix(root): downgrade failed session restores to drafts"
```

---

### Task 5: Run Regression Checks And Manual Browser Verification

**Files:**
- Verify: `scripts/root-ui-session-restore-audit.js`
- Verify: `scripts/root-ui-precision-audit.js`
- Verify: `scripts/root-engine-audit.js`
- Verify: `root-ui.js`

- [ ] **Step 1: Run the automated audits**

Run:

```powershell
node scripts/root-ui-session-restore-audit.js
node scripts/root-ui-precision-audit.js
node scripts/root-engine-audit.js
```

Expected:

```text
Root UI session restore audit passed.
Root UI precision audit passed.
Summary: 45/45 passed
```

- [ ] **Step 2: Manually verify draft restore in the browser**

Open `index.html` in a browser and perform this exact sequence:

1. Open the Root module and switch to Newton.
2. Enter `x^2 - 2` for `f(x)`, `2*x` for `f′(x)`, and `1` for `x₀`.
3. Do not press `=`.
4. Refresh the page.
5. Confirm the Newton tab is still active, the fields are restored, and no result table is shown.

Expected: the status region announces `Restored unfinished Newton draft.` and the workbench remains in the empty-state/result-hidden mode.

- [ ] **Step 3: Manually verify successful-run restore in the browser**

In the same browser session:

1. Switch to Bisection.
2. Enter `x^2 - 2`, `a = 1`, `b = 2`, `k = 6`, `iterations = 5`.
3. Press `=`.
4. Refresh the page.
5. Confirm the Bisection tab is active, the result summary is present, and the table/graph have been recomputed.

Expected: the status region announces `Restored previous Bisection session.` and the approximation card is populated immediately after load.

- [ ] **Step 4: Confirm storage clears when the active formula is emptied**

In the browser:

1. Stay on any root method with a saved draft.
2. Delete the main expression field so it is blank.
3. Blur the field or make any second input change to trigger the debounced handler.
4. Refresh the page.

Expected: no root session is restored, and the module falls back to the default empty Bisection view.

- [ ] **Step 5: Confirm working tree scope**

Run:

```powershell
git status --short
```

Expected: only `root-ui.js` and `scripts/root-ui-session-restore-audit.js` are modified by this feature work. Do not use `git add -A` in this repository.

- [ ] **Step 6: Commit the verified feature**

```bash
git add root-ui.js scripts/root-ui-session-restore-audit.js
git commit -m "feat(root): add session restore for drafts and successful runs"
```
