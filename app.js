"use strict";

(function initApp(globalScope) {
    const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  const E = globalScope.ExpressionEngine;
  const D = globalScope.MathDisplay;
  const P = globalScope.PolyEngine;
  if (!M || !C || !E || !D || !P) {
    throw new Error("MathEngine, CalcEngine, ExpressionEngine, MathDisplay, and PolyEngine must be loaded before app.js.");
  }

  const EMPTY_VALUE = "Not calculated yet.";
  const EXPRESSION_RESULT_IDS = [
    "basic-expression-stepwise",
    "basic-expression-final",
    "basic-expression-exact",
    "basic-expression-canonical",
    "basic-expression-ops",
    "basic-expression-bound",
    "basic-expression-note"
  ];
  const BASIC_RESULT_IDS = [
    "basic-a-exact",
    "basic-a-normalized",
    "basic-a-machine",
    "basic-b-exact",
    "basic-b-normalized",
    "basic-b-machine",
    "basic-exact-summary",
    "basic-exact-scientific",
    "basic-approx-primary",
    "basic-approx-stored",
    "basic-guard",
    "basic-bound",
    "basic-ulp",
    "basic-prev",
    "basic-next",
    "basic-interval",
    "basic-normalization-note",
    "basic-guard-note",
    "basic-rounding-note"
  ];
  const ERROR_RESULT_IDS = [
    "error-rel",
    "error-verdict",
    "error-rel-pct",
    "error-abs",
    "error-t",
    "error-check",
    "error-maxabs",
    "error-meaning-abs",
    "error-meaning-rel",
    "error-meaning-t",
    "error-meaning-extra"
  ];
  const POLY_RESULT_IDS = [
    "poly-canonical",
    "poly-exact",
    "poly-xapprox",
    "poly-final-shared",
    "poly-horner-step-approx",
    "poly-horner-step-abs",
    "poly-horner-final-abs",
    "poly-horner-step-rel",
    "poly-horner-final-rel",
    "poly-horner-step-t",
    "poly-horner-final-t",
    "poly-horner-mults",
    "poly-horner-adds",
    "poly-horner-ops-summary",
    "poly-direct-step-approx",
    "poly-direct-step-abs",
    "poly-direct-final-abs",
    "poly-direct-step-rel",
    "poly-direct-final-rel",
    "poly-direct-step-t",
    "poly-direct-final-t",
    "poly-direct-mults",
    "poly-direct-adds",
    "poly-direct-ops-summary",
    "poly-accuracy-winner",
    "poly-next-step",
    "poly-operation-winner",
    "poly-sensitivity-note"
  ];
  const BASIC_FIELD_IDS = ["basic-a", "basic-b", "basic-k"];
  const EXPRESSION_FIELD_IDS = ["basic-expression", "basic-expression-k"];
  const ERROR_FIELD_IDS = ["error-exact", "error-approx"];
  const POLY_FIELD_IDS = ["poly-expression", "poly-x", "poly-k"];
  const PREVIEW_FIELDS = [
    { inputId: "basic-expression", previewId: "basic-expression-preview", allowVariable: false, className: "math-preview math-preview-wide" },
    { inputId: "basic-a", previewId: "basic-a-preview", allowVariable: false, className: "math-preview math-preview-inline" },
    { inputId: "basic-b", previewId: "basic-b-preview", allowVariable: false, className: "math-preview math-preview-inline" },
    { inputId: "error-exact", previewId: "error-exact-preview", allowVariable: false, className: "math-preview math-preview-inline" },
    { inputId: "error-approx", previewId: "error-approx-preview", allowVariable: false, className: "math-preview math-preview-inline" },
    { inputId: "poly-expression", previewId: "poly-expression-preview", allowVariable: true, className: "math-preview math-preview-wide" },
    { inputId: "poly-x", previewId: "poly-x-preview", allowVariable: false, className: "math-preview math-preview-inline" }
  ];
  const TWO = M.makeRational(1, 2n, 1n);
  const HUNDRED = M.makeRational(1, 100n, 1n);
  const ONBOARDING_KEY = "ma-lab-guide-state-v2";
  const ONBOARDING_COMPLETE_KEY = "ma-lab-onboarding-complete-v1";
    const THEME_KEY = "ma-lab-theme-v1";
  const ANGLE_MODE_KEY = "ma-lab-angle-mode-v1";
  const COMPLEX_DISPLAY_KEY = "ma-lab-complex-display-v1";

  const BASIC_PRESETS = {
    pi: {
      a: "3.14159265",
      op: "*",
      b: "1",
      k: 5,
      mode: "chop",
      note: "Use the same input with chopping and rounding to compare 3.1415 against 3.1416 at five digits."
    },
    third: {
      a: "1",
      op: "/",
      b: "3",
      k: 6,
      mode: "round",
      note: "1 / 3 produces a repeating decimal, so the module shows how a non-terminating value is stored in finite precision."
    },
    cancel: {
      a: "1000001",
      op: "-",
      b: "1000000",
      k: 6,
      mode: "chop",
      note: "This preset highlights cancellation: the exact difference is 1, but storing the operands first can erase that small gap."
    }
  };

  const STEP_TABLE_LABELS = ["#", "Description", "Exact step", "Machine step", "Normalized machine step"];

  const POLY_PRESETS = {
    sqrt3: {
      expression: "2x - x^3/3 + x^5/60",
      x: "3.14159/3",
      k: 8,
      mode: "round",
      stepMethod: "horner",
      note: "This short odd polynomial is a clean comparison case for Horner, direct evaluation, and final-only rounding."
    },
    root13: {
      expression: "(x - 2)^13",
      x: "2.0001",
      k: 6,
      mode: "round",
      stepMethod: "horner",
      note: "Near a repeated root, expanded coefficients become sensitive and the stepwise method comparison is easier to see."
    },
    root9: {
      expression: "(x - 10)^9",
      x: "9.99",
      k: 7,
      mode: "round",
      stepMethod: "direct",
      note: "This preset emphasizes how an expanded polynomial near a root can magnify round-off differently across evaluation methods."
    }
  };

  const state = {
    expressionComparison: null,
    basicExact: null,
    basicApprox: null,
    basicStoredApprox: null,
    basicContext: null,
    errorSource: "Entered manually",
    errorSourceKind: "manual",
    errorComputed: false,
    polyComparison: null,
    onboardingGuidePreference: null,
    onboardingComplete: false,
    theme: "light",
    angleMode: "deg",
    complexDisplay: "rect",
    symbolTargetId: null,
    symbolAnchorId: null,
    symbolSelectionStart: null,
    symbolSelectionEnd: null
  };

  function byId(id) {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error("Missing expected element: " + id);
    }
    return el;
  }

  function setContent(id, value, isEmpty) {
    const el = byId(id);
    el.textContent = value;
    el.classList.toggle("is-empty", Boolean(isEmpty));
  }

  function setText(id, value) {
    setContent(id, value, value === EMPTY_VALUE);
  }

  function ensureMathPreviewMount(config) {
    let preview = document.getElementById(config.previewId);
    if (preview) {
      return preview;
    }

    const input = byId(config.inputId);
    preview = document.createElement("div");
    preview.id = config.previewId;
    preview.className = config.className || "math-preview";
    preview.hidden = true;
    preview.setAttribute("role", "img");
    preview.setAttribute("aria-label", "");

    const searchShell = input.closest(".search-shell");
    if (searchShell && searchShell.parentElement) {
      preview.classList.add("math-preview-search");
      searchShell.insertAdjacentElement("afterend", preview);
      return preview;
    }

    const host = input.closest("label") || input.parentElement || input;
    host.appendChild(preview);
    return preview;
  }

  function setMathMarkup(id, html) {
    const el = byId(id);
    el.innerHTML = html;
    el.classList.remove("is-empty");
  }

  function renderTextbookValue(id, value, options) {
    setMathMarkup(id, D.renderValueDisplay(value, Object.assign({
      displayMode: state.complexDisplay,
      angleMode: state.angleMode,
      previewDigits: 14,
      scientificDigits: 12
    }, options || {})));
  }

  function renderTextbookExpressionAst(id, ast) {
    setMathMarkup(id, '<div class="math-display"><div class="math-display-primary">' + D.renderExpressionHTML(ast) + '</div></div>');
  }

  function renderTextbookExpressionString(id, expression, allowVariable) {
    try {
      const ast = E.parseExpression(expression, { allowVariable: allowVariable !== false });
      renderTextbookExpressionAst(id, ast);
    } catch (error) {
      setContent(id, expression, false);
    }
  }

  function renderMathPreview(config) {
    const preview = ensureMathPreviewMount(config);
    const raw = byId(config.inputId).value.trim();
    if (!raw) {
      preview.hidden = true;
      preview.innerHTML = "";
      preview.setAttribute("aria-label", "");
      return;
    }

    try {
      const ast = E.parseExpression(raw, { allowVariable: config.allowVariable !== false });
      preview.innerHTML = '<div class="math-display math-display-preview"><div class="math-display-primary">' + D.renderExpressionHTML(ast) + '</div></div>';
      preview.setAttribute("aria-label", "Parsed expression: " + raw);
      preview.hidden = false;
    } catch (error) {
      preview.hidden = true;
      preview.innerHTML = "";
      preview.setAttribute("aria-label", "");
    }
  }

  function syncMathPreviews() {
    for (const config of PREVIEW_FIELDS) {
      renderMathPreview(config);
    }
  }

  function showError(id, message) {
    const el = byId(id);
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.hidden = true;
      el.textContent = "";
    }
  }

  function updateDescribedBy(el, targetId, shouldInclude) {
    const current = (el.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter(function keep(id) {
        return id !== targetId;
      });

    if (shouldInclude) {
      current.push(targetId);
    }

    if (current.length > 0) {
      el.setAttribute("aria-describedby", Array.from(new Set(current)).join(" "));
    } else {
      el.removeAttribute("aria-describedby");
    }
  }

  function markInvalid(fieldIds, errorId) {
    for (const fieldId of fieldIds) {
      const el = byId(fieldId);
      el.setAttribute("aria-invalid", "true");
      updateDescribedBy(el, errorId, true);
    }
  }

  function clearInvalid(fieldIds, errorId) {
    for (const fieldId of fieldIds) {
      const el = byId(fieldId);
      el.removeAttribute("aria-invalid");
      updateDescribedBy(el, errorId, false);
    }
  }

  function clearExpressionFeedback() {
    clearInvalid(EXPRESSION_FIELD_IDS, "basic-expression-error-msg");
    showError("basic-expression-error-msg", "");
  }

  function clearBasicFeedback() {
    clearInvalid(BASIC_FIELD_IDS, "basic-error-msg");
    showError("basic-error-msg", "");
  }

  function clearErrorFeedback() {
    clearInvalid(ERROR_FIELD_IDS, "error-error-msg");
    showError("error-error-msg", "");
  }

  function clearPolyFeedback() {
    clearInvalid(POLY_FIELD_IDS, "poly-error-msg");
    showError("poly-error-msg", "");
  }

  function renderErrorSource() {
    setContent("error-source", state.errorSource, false);
  }

  const statusTimers = Object.create(null);

  function clearStatus(id) {
    if (statusTimers[id]) {
      window.clearTimeout(statusTimers[id]);
      delete statusTimers[id];
    }
    byId(id).textContent = "";
  }

  function announceStatus(id, message) {
    clearStatus(id);
    if (!message) {
      return;
    }

    statusTimers[id] = window.setTimeout(function writeStatus() {
      byId(id).textContent = message;
      delete statusTimers[id];
    }, 20);
  }

  function setErrorSource(text, kind) {
    state.errorSource = text;
    if (kind) {
      state.errorSourceKind = kind;
    }
    renderErrorSource();
  }

  function shouldShowErrorSource() {
    return state.errorComputed || state.errorSourceKind !== "manual";
  }

  function readOnboardingPreference() {
    try {
      const stored = window.localStorage.getItem(ONBOARDING_KEY);
      if (stored === "open" || stored === "closed") {
        return stored;
      }
      return stored === "1" ? "closed" : null;
    } catch (error) {
      return null;
    }
  }

  function writeOnboardingPreference(stateValue) {
    try {
      if (stateValue === "open" || stateValue === "closed") {
        window.localStorage.setItem(ONBOARDING_KEY, stateValue);
      } else {
        window.localStorage.removeItem(ONBOARDING_KEY);
      }
    } catch (error) {
      // Ignore storage failures in file:// or privacy-restricted contexts.
    }
  }

  function readOnboardingCompletionPreference() {
    try {
      return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeOnboardingCompletionPreference(isComplete) {
    try {
      if (isComplete) {
        window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, "1");
      } else {
        window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      }
    } catch (error) {
      // Ignore storage failures in file:// or privacy-restricted contexts.
    }
  }

  function getSystemTheme() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (error) {
      return "light";
    }
  }

  function readThemePreference() {
    try {
      const theme = window.localStorage.getItem(THEME_KEY);
      return theme === "dark" || theme === "light" ? theme : null;
    } catch (error) {
      return null;
    }
  }

  function writeThemePreference(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }

  function syncThemeToggle() {
    const button = byId("theme-toggle");
    const current = state.theme;
    const next = current === "dark" ? "light" : "dark";
    button.textContent = current === "dark" ? "Use light theme" : "Use dark theme";
    button.dataset.theme = current;
    button.setAttribute("aria-label", "Switch to " + next + " theme");
    button.setAttribute("title", "Switch to " + next + " theme");
    button.setAttribute("aria-pressed", current === "dark" ? "true" : "false");
  }

  function applyTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    syncThemeToggle();
  }

  function initializeTheme() {
    const savedTheme = readThemePreference();
    applyTheme(savedTheme || document.documentElement.getAttribute("data-theme") || getSystemTheme());
    syncStatusStrip();
  }

  function toggleTheme() {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    writeThemePreference(nextTheme);
    applyTheme(nextTheme);
  }

  function readSimplePreference(key, allowed, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return allowed.includes(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeSimplePreference(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage failures in restricted contexts.
    }
  }

  function refreshComputedViews() {
    if (state.expressionComparison) {
      computeExpressionModule();
    }
    if (state.basicExact !== null) {
      computeBasicModule();
    }
    if (state.errorComputed) {
      computeErrorModule();
    }
    if (state.polyComparison) {
      computePolynomialModule();
    }
    clearStatus("basic-status-msg");
    clearStatus("error-status-msg");
    clearStatus("poly-status-msg");
  }

  function currentEngineMode() {
    const activeButton = getTabButtons().find(function (button) {
      return button.classList.contains("active");
    });
    const tab = activeButton ? activeButton.dataset.tab : "basic";

    if (tab === "basic") {
      if (state.expressionComparison && state.expressionComparison.path === "calc") {
        return "calc";
      }
      if (state.basicExact && usesCalcPath(state.basicExact)) {
        return "calc";
      }
      return "exact";
    }

    if (tab === "poly") {
      return state.polyComparison && state.polyComparison.path === "calc" ? "calc" : "exact";
    }

    if (hasInputValue("error-exact") || hasInputValue("error-approx")) {
      try {
        const exact = hasInputValue("error-exact") ? parseStandaloneValue(byId("error-exact").value, "True value p") : null;
        const approx = hasInputValue("error-approx") ? parseStandaloneValue(byId("error-approx").value, "Approximation p*") : null;
        if ((exact && usesCalcPath(exact)) || (approx && usesCalcPath(approx))) {
          return "calc";
        }
      } catch (error) {
        return "calc";
      }
    }

    return "exact";
  }

  function syncStatusStrip() {
    const angle = document.getElementById("status-angle");
    const display = document.getElementById("status-display");
    const engine = document.getElementById("status-engine");
    if (!angle || !display || !engine) {
      return;
    }
    angle.textContent = state.angleMode === "rad" ? "RAD" : "DEG";
    display.textContent = state.complexDisplay === "polar" ? "POLAR" : "RECT";
    engine.textContent = currentEngineMode().toUpperCase();
    const angleToggle = document.getElementById("angle-toggle");
    const displayToggle = document.getElementById("display-toggle");
    if (angleToggle) {
      angleToggle.textContent = state.angleMode === "rad" ? "Use degrees" : "Use radians";
    }
    if (displayToggle) {
      displayToggle.textContent = state.complexDisplay === "polar" ? "Show rectangular" : "Show polar";
    }
    document.documentElement.setAttribute("data-angle-mode", state.angleMode);
    document.documentElement.setAttribute("data-complex-display", state.complexDisplay);
  }

  function applyAngleMode(mode) {
    state.angleMode = mode === "rad" ? "rad" : "deg";
    writeSimplePreference(ANGLE_MODE_KEY, state.angleMode);
    syncStatusStrip();
  }

  function applyComplexDisplay(mode) {
    state.complexDisplay = mode === "polar" ? "polar" : "rect";
    writeSimplePreference(COMPLEX_DISPLAY_KEY, state.complexDisplay);
    syncStatusStrip();
  }

  function initializeDisplaySettings() {
    applyAngleMode(readSimplePreference(ANGLE_MODE_KEY, ["deg", "rad"], "deg"));
    applyComplexDisplay(readSimplePreference(COMPLEX_DISPLAY_KEY, ["rect", "polar"], "rect"));
  }

  function toggleAngleMode() {
    applyAngleMode(state.angleMode === "deg" ? "rad" : "deg");
    refreshComputedViews();
  }

  function toggleComplexDisplay() {
    applyComplexDisplay(state.complexDisplay === "rect" ? "polar" : "rect");
    refreshComputedViews();
  }

  function syncMicroPanels() {
    const panels = Array.from(document.querySelectorAll(".micro-panel"));
    panels.forEach(function (panel) {
      panel.addEventListener("toggle", function onPanelToggle() {
        if (!panel.open) {
          return;
        }
        panels.forEach(function (otherPanel) {
          if (otherPanel !== panel) {
            otherPanel.open = false;
          }
        });
      });
    });
  }

  function setHidden(id, hidden) {
    byId(id).hidden = hidden;
  }

  function hasInputValue(id) {
    return byId(id).value.trim() !== "";
  }

  function getSymbolCompatibleIds() {
    return ["basic-expression", "poly-expression", "poly-x"];
  }

  function updateSymbolSelection(input) {
    if (!input || !getSymbolCompatibleIds().includes(input.id)) {
      return;
    }
    state.symbolTargetId = input.id;
    state.symbolSelectionStart = typeof input.selectionStart === "number" ? input.selectionStart : input.value.length;
    state.symbolSelectionEnd = typeof input.selectionEnd === "number" ? input.selectionEnd : input.value.length;
  }

  function closeSymbolPopover() {
    const popover = document.getElementById("symbol-popover");
    if (!popover) {
      return;
    }
    popover.hidden = true;
    popover.removeAttribute("data-open");
    state.symbolAnchorId = null;
  }

  function positionSymbolPopover(anchor) {
    const popover = byId("symbol-popover");
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(244, window.innerWidth - 24);
    let left = rect.right - width;
    if (left < 12) {
      left = 12;
    }
    let top = rect.bottom + 10;
    if (top + 72 > window.innerHeight - 12) {
      top = Math.max(12, rect.top - 88);
    }
    popover.style.left = left + "px";
    popover.style.top = top + "px";
    popover.style.width = width + "px";
  }

  function openSymbolPopover(targetId, anchor) {
    state.symbolTargetId = targetId;
    state.symbolAnchorId = anchor.id || null;
    updateSymbolSelection(byId(targetId));
    const popover = byId("symbol-popover");
    positionSymbolPopover(anchor);
    popover.hidden = false;
    popover.setAttribute("data-open", "true");
  }

  function insertTokenAtCursor(targetId, token) {
    const input = byId(targetId);
    const value = input.value;
    const start = typeof state.symbolSelectionStart === "number" ? state.symbolSelectionStart : value.length;
    const end = typeof state.symbolSelectionEnd === "number" ? state.symbolSelectionEnd : value.length;
    input.value = value.slice(0, start) + token + value.slice(end);
    const nextPos = start + token.length;
    input.focus();
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(nextPos, nextPos);
    }
    state.symbolTargetId = targetId;
    state.symbolSelectionStart = nextPos;
    state.symbolSelectionEnd = nextPos;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function createDisclosurePanel(className, summaryText) {
    const details = document.createElement("details");
    details.className = className;
    const summary = document.createElement("summary");
    summary.textContent = summaryText;
    details.appendChild(summary);
    const body = document.createElement("div");
    body.className = "utility-stack";
    details.appendChild(body);
    return { details, body };
  }

  function moveIntoPanel(body, nodes) {
    nodes.forEach(function (node) {
      if (node) {
        body.appendChild(node);
      }
    });
  }

  function openDisclosure(details) {
    if (!details) {
      return;
    }
    details.open = true;
    const summary = details.querySelector("summary");
    if (summary) {
      summary.focus();
    }
  }

  function openBasicMachineTrace() {
    const basicModule = document.querySelector(".module-basic");
    if (!basicModule) {
      return;
    }
    const advancedPanel = basicModule.querySelector(".advanced-tools-section");
    openDisclosure(advancedPanel);
    const tracePanel = findPanelBySummary(basicModule, "details.disclosure", ["Machine trace", "Expression trace"]);
    openDisclosure(tracePanel);
  }

  function findPanelBySummary(container, selector, labels) {
    return Array.from(container.querySelectorAll(selector)).find(function (panel) {
      const summary = panel.querySelector("summary");
      return summary && labels.includes(summary.textContent.trim());
    }) || null;
  }

  function ensureAdvancedToolsPanel(module, anchorNode) {
    const existing = module.querySelector("details.advanced-tools-section");
    if (existing) {
      if (anchorNode && existing.previousElementSibling !== anchorNode) {
        anchorNode.insertAdjacentElement("afterend", existing);
      } else if (!anchorNode && existing.parentElement !== module) {
        module.appendChild(existing);
      }
      return {
        details: existing,
        body: existing.querySelector(".utility-stack") || existing.lastElementChild
      };
    }

    const panel = createDisclosurePanel("utility-panel utility-panel-subtle advanced-tools-section", "Advanced tools");
    if (anchorNode) {
      anchorNode.insertAdjacentElement("afterend", panel.details);
    } else {
      module.appendChild(panel.details);
    }
    return panel;
  }

  function applyExamModeLayout() {
    document.documentElement.setAttribute("data-density", "exam");

    const basicModule = document.querySelector(".module-basic");
    if (basicModule) {
      basicModule.querySelectorAll(".standalone-helper-divider").forEach(function (divider) {
        divider.remove();
      });

      const basicActions = document.getElementById("basic-actions") || basicModule.querySelector(".control-actions.control-actions-secondary");
      if (basicActions && !basicActions.id) {
        basicActions.id = "basic-actions";
      }

      const basicNextSteps = document.getElementById("basic-next-steps");
      const basicAdvanced = ensureAdvancedToolsPanel(
        basicModule,
        basicNextSteps || basicActions || document.getElementById("basic-result-stage") || document.getElementById("basic-empty")
      );

      const expressionStrip = document.getElementById("basic-expression-canonical")
        ? document.getElementById("basic-expression-canonical").closest(".answer-strip")
        : null;
      const expressionNote = document.getElementById("basic-expression-note");
      if (expressionStrip && expressionNote && !expressionStrip.closest(".advanced-tools-section")) {
        const detailsPanel = createDisclosurePanel("disclosure disclosure-secondary details-section", "Exact details");
        moveIntoPanel(detailsPanel.body, [expressionStrip, expressionNote]);
        basicAdvanced.body.appendChild(detailsPanel.details);
      }

      const helperSection = basicModule.querySelector(".standalone-helper");
      if (helperSection && !helperSection.closest(".advanced-tools-section")) {
        const toolsPanel = createDisclosurePanel("utility-panel utility-panel-subtle tools-section", "Operation helper");
        helperSection.querySelectorAll(".utility-panel.utility-panel-subtle").forEach(function (nestedPanel) {
          nestedPanel.classList.add("utility-panel-nested");
          const summary = nestedPanel.querySelector("summary");
          if (summary && summary.textContent.trim() === "Tools: examples") {
            summary.textContent = "Examples";
          }
        });
        const machineDetails = findPanelBySummary(helperSection, "details.disclosure", ["Machine notes and neighborhood", "Stored-number details"]);
        if (machineDetails) {
          const summary = machineDetails.querySelector("summary");
          if (summary) {
            summary.textContent = "Stored-number details";
          }
          machineDetails.classList.add("details-section");
        }
        toolsPanel.body.appendChild(helperSection);
        basicAdvanced.body.appendChild(toolsPanel.details);
      }

      const tracePanel = findPanelBySummary(basicModule, "details.disclosure", ["Expression trace", "Machine trace"]);
      if (tracePanel && !tracePanel.closest(".advanced-tools-section")) {
        tracePanel.classList.add("details-section");
        const summary = tracePanel.querySelector("summary");
        if (summary) {
          summary.textContent = "Machine trace";
        }
        basicAdvanced.body.appendChild(tracePanel);
      }
    }

    const errorModule = document.querySelector(".module-error");
    if (errorModule) {
      const controlNote = errorModule.querySelector(".control-note");
      if (controlNote) {
        controlNote.remove();
      }

      const errorAdvanced = ensureAdvancedToolsPanel(
        errorModule,
        document.getElementById("error-result-stage") || document.getElementById("error-empty")
      );

      const importTools = findPanelBySummary(errorModule, "details.utility-panel", ["Tools: more imports", "Tools", "Import tools"]);
      if (importTools) {
        const summary = importTools.querySelector("summary");
        if (summary) {
          summary.textContent = "Import tools";
        }
        if (!importTools.closest(".advanced-tools-section")) {
          errorAdvanced.body.appendChild(importTools);
        }
      }

      const readingGrid = errorModule.querySelector(".reading-grid");
      if (readingGrid && !readingGrid.closest(".advanced-tools-section")) {
        const howPanel = createDisclosurePanel("disclosure disclosure-secondary details-section", "How to read this");
        howPanel.body.appendChild(readingGrid);
        errorAdvanced.body.appendChild(howPanel.details);
      }
    }

    const polyModule = document.querySelector(".module-poly");
    if (polyModule) {
      const focusNote = polyModule.querySelector(".comparison-board .focus-note");
      if (focusNote) {
        focusNote.remove();
      }

      const polyAdvanced = ensureAdvancedToolsPanel(
        polyModule,
        document.getElementById("poly-comparison-board") || document.getElementById("poly-summary-band") || document.getElementById("poly-empty")
      );

      const presetBand = polyModule.querySelector(".preset-band");
      const presetNote = document.getElementById("poly-preset-note");
      if (presetBand && presetNote && !presetBand.closest(".advanced-tools-section")) {
        const toolsPanel = createDisclosurePanel("utility-panel utility-panel-subtle tools-section", "Examples");
        moveIntoPanel(toolsPanel.body, [presetBand, presetNote]);
        polyAdvanced.body.appendChild(toolsPanel.details);
      }

      const summaryStrip = document.getElementById("poly-canonical")
        ? document.getElementById("poly-canonical").closest(".answer-strip")
        : null;
      if (summaryStrip && !summaryStrip.closest(".advanced-tools-section")) {
        const detailsPanel = createDisclosurePanel("disclosure disclosure-secondary details-section", "Exact details");
        detailsPanel.body.appendChild(summaryStrip);
        polyAdvanced.body.appendChild(detailsPanel.details);
      }

      const methodDetails = findPanelBySummary(polyModule, "details.disclosure", ["Tools: more method details", "Details", "Method details"]);
      if (methodDetails) {
        const summary = methodDetails.querySelector("summary");
        if (summary) {
          summary.textContent = "Method details";
        }
        methodDetails.classList.add("details-section");
        if (!methodDetails.closest(".advanced-tools-section")) {
          polyAdvanced.body.appendChild(methodDetails);
        }
      }

      const machineTrace = document.getElementById("poly-machine-trace");
      if (machineTrace && !machineTrace.closest(".advanced-tools-section")) {
        polyAdvanced.body.appendChild(machineTrace);
      }
    }
  }

  function syncOnboardingUI() {
    const showBasicStarter = !state.expressionComparison && !hasInputValue("basic-expression");
    const showErrorEmpty = !state.errorComputed && !hasInputValue("error-exact") && !hasInputValue("error-approx");
    const showPolyEmpty = !state.polyComparison && !hasInputValue("poly-expression") && !hasInputValue("poly-x");
    var hasExprResults = Boolean(state.expressionComparison);
    var hasErrorResults = state.errorComputed;
    var hasPolyResults = Boolean(state.polyComparison);
    setHidden("basic-empty", !showBasicStarter);
    setHidden("basic-next-steps", !hasExprResults);
    setHidden("basic-result-stage", !hasExprResults);
    // Exam mode moves the answer strip and note out of basic-result-stage,
    // so they need individual hidden control as well.
    setHidden("basic-answer-strip", !hasExprResults);
    setHidden("basic-expression-answer-guide", !hasExprResults);
    setHidden("basic-expression-note", !hasExprResults);
    setHidden("error-empty", !showErrorEmpty);
    setHidden("error-source-line", !shouldShowErrorSource());
    setHidden("error-result-stage", !hasErrorResults);
    // Exam mode moves reading-grid into its own disclosure panel.
    setHidden("error-reading-grid", !hasErrorResults);
    setHidden("poly-empty", !showPolyEmpty);
    setHidden("poly-summary-band", !hasPolyResults);
    setHidden("poly-comparison-board", !hasPolyResults);
    setHidden("poly-method-details", !hasPolyResults);
    setHidden("poly-machine-trace", !hasPolyResults);
    setHidden("poly-next-step", !hasPolyResults);
    syncMathPreviews();
    syncStatusStrip();
  }

  function markOnboardingComplete() {
    if (state.onboardingComplete) {
      return;
    }
    state.onboardingComplete = true;
    writeOnboardingCompletionPreference(true);
    state.onboardingGuidePreference = "closed";
    writeOnboardingPreference("closed");
    byId("welcome-strip").open = false;
  }

  function loadBasicStarter() {
    byId("basic-expression").value = "((1/3 + 6/5) + 0.948854) - (5/30 + 6/59)";
    byId("basic-expression-k").value = "8";
    byId("basic-expression-mode").value = "chop";
    byId("basic-a").value = "2.1892";
    byId("basic-op").value = "*";
    byId("basic-b").value = "3.7008";
    byId("basic-k").value = "8";
    byId("basic-mode").value = "chop";
    byId("basic-preset").value = "";
    clearExpressionFeedback();
    clearBasicFeedback();
    resetExpressionResults();
    resetBasicResults();
    setContent("basic-preset-note", "Select an example to populate the inputs.", true);
    announceStatus("basic-status-msg", "Starter expression loaded into Module I. Select Calculate.");
    activateTab("basic");
    byId("basic-expression-compute").focus();
  }

  function loadErrorSample() {
    byId("error-exact").value = "8.10179136";
    byId("error-approx").value = "8.1017913";
    clearErrorFeedback();
    resetErrorResults();
    setErrorSource("sample values from the required multiplication test", "sample");
    activateTab("error");
    computeErrorModule({ sourceStatusPrefix: "Sample values loaded into Error Analysis." });
  }

  function focusErrorManualEntry() {
    activateTab("error");
    handleErrorInputsChanged();
    byId("error-exact").focus();
  }

  function loadPolyQuickStart() {
    byId("poly-preset").value = "sqrt3";
    activateTab("poly");
    loadPolyPreset();
  }

  function handleWelcomeGuideToggle() {
    const isOpen = byId("welcome-strip").open;
    state.onboardingGuidePreference = isOpen ? "open" : "closed";
    writeOnboardingPreference(state.onboardingGuidePreference);
  }

  function openBasicGuide() {
    activateTab("basic");
    byId("basic-expression").focus();
  }

  function renderEmptyBasicExpressionSteps() {
    const body = byId("basic-expression-steps-body");
    body.innerHTML = "";

    const row = document.createElement("tr");
    row.className = "empty-row";

    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Ready to calculate.";
    row.appendChild(cell);
    body.appendChild(row);
  }

  function resetExpressionResults() {
    updateExpressionFinalLabel(byId("basic-expression-mode").value);
    for (const id of EXPRESSION_RESULT_IDS) {
      setText(id, EMPTY_VALUE);
    }
    state.expressionComparison = null;
    byId("basic-send-step").disabled = true;
    byId("basic-send-final").disabled = true;
    byId("basic-open-trace").disabled = true;
    renderEmptyBasicExpressionSteps();
    clearStatus("basic-status-msg");
    syncOnboardingUI();
  }

  function resetBasicResults() {
    for (const id of BASIC_RESULT_IDS) {
      setText(id, EMPTY_VALUE);
    }
    state.basicExact = null;
    state.basicApprox = null;
    state.basicStoredApprox = null;
    state.basicContext = null;
    syncOnboardingUI();
  }

  function resetErrorResults() {
    for (const id of ERROR_RESULT_IDS) {
      setText(id, EMPTY_VALUE);
    }
    state.errorComputed = false;
    clearStatus("error-status-msg");
    syncOnboardingUI();
  }

  function handleErrorInputsChanged() {
    clearErrorFeedback();
    resetErrorResults();
    setErrorSource("Entered manually", "manual");
    syncOnboardingUI();
  }

  function renderEmptyPolySteps() {
    const body = byId("poly-steps-body");
    body.innerHTML = "";

    const row = document.createElement("tr");
    row.className = "empty-row";

    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Ready to calculate.";
    row.appendChild(cell);
    body.appendChild(row);
  }

  function resetPolyResults() {
    updatePolyFinalLabels(byId("poly-mode").value);
    for (const id of POLY_RESULT_IDS) {
      setText(id, EMPTY_VALUE);
    }
    state.polyComparison = null;
    renderEmptyPolySteps();
    clearStatus("poly-status-msg");
    syncOnboardingUI();
  }

  let cachedTabButtons = null;
  let cachedTabPanels = null;

  function getTabButtons() {
    if (!cachedTabButtons) {
      cachedTabButtons = Array.from(document.querySelectorAll(".tab-btn[role='tab']"));
    }
    return cachedTabButtons;
  }

  function getTabPanels() {
    if (!cachedTabPanels) {
      cachedTabPanels = Array.from(document.querySelectorAll(".panel[role='tabpanel']"));
    }
    return cachedTabPanels;
  }

  function activateTab(tabName) {
    for (const button of getTabButtons()) {
      const isActive = button.dataset.tab === tabName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    }

    for (const panel of getTabPanels()) {
      const isActive = panel.id === "tab-" + tabName;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
      panel.tabIndex = isActive ? 0 : -1;
    }

    syncStatusStrip();
  }

  function onTabKeyDown(event) {
    const buttons = getTabButtons();
    const currentIndex = buttons.indexOf(event.currentTarget);
    if (currentIndex === -1) {
      return;
    }

    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "Right") {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === "ArrowLeft" || event.key === "Left") {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextButton = buttons[nextIndex];
    activateTab(nextButton.dataset.tab || "basic");
    nextButton.focus();
  }

  function parsePositiveInt(id, label) {
    const raw = byId(id).value;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error("Enter a whole number of 1 or greater for " + label + ".");
    }
    return value;
  }

  function formatNumericInputError(label, rawValue, error) {
    const text = String(rawValue || "").trim();
    if (!text) {
      return label + " is empty. Enter a decimal, fraction, scientific notation, pi, sqrt(2), or a complex value like 3+4i.";
    }

    if (error && error.message === "Denominator cannot be zero.") {
      return label + " cannot use 0 as the denominator.";
    }

    if (error && error.message === "Division by zero.") {
      return label + " cannot divide by zero.";
    }

    if (error && error.message.indexOf("Invalid number format:") === 0) {
      return label + " isn't in a supported format. Try 2.1892, 314159/300000, pi, sqrt(2), 3+4i, or 5∠30.";
    }

    return label + " couldn't be read. Use a decimal, fraction, scientific notation, pi, sqrt(), or complex notation like 3+4i.";
  }

  function formatPolynomialInputError(error) {
    const base = "Enter a valid polynomial in x, like 2x - x^3/3.";
    if (!error || !error.message) {
      return base;
    }
    return base + " (" + error.message + ")";
  }

  function formatExpressionInputError(error) {
    const base = "Enter a valid math expression, like (1/3 + 6/5).";
    if (!error || !error.message) {
      return base;
    }
    return base + " (" + error.message + ")";
  }

  function isRationalValue(value) {
    return C.isRationalValue(value);
  }

  function isCalcValue(value) {
    return C.isCalcValue(value);
  }

  function isPlainNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function usesCalcPath(value) {
    return isCalcValue(value);
  }

  function shortValue(value, maxDigits, scientificDigits) {
    if (isRationalValue(value)) {
      if (M.isZero(value)) {
        return "0";
      }
      const decimal = M.rationalToDecimalString(value, maxDigits || 16);
      if (!decimal.endsWith("...") && decimal.length <= 22) {
        return decimal;
      }
      return M.toScientificString(value, scientificDigits || 10);
    }
    if (isCalcValue(value)) {
      return state.complexDisplay === "polar"
        ? C.polarString(value, state.angleMode, Math.max(6, Math.min(maxDigits || 10, 12)))
        : C.rectString(value, Math.max(6, Math.min(maxDigits || 10, 12)));
    }
    if (isPlainNumber(value)) {
      return C.formatReal(value, maxDigits || 12);
    }
    return String(value);
  }

  function inlineValue(value, maxDigits, scientificDigits) {
    if (isRationalValue(value)) {
      if (M.isZero(value)) {
        return "0";
      }
      const decimal = M.rationalToDecimalString(value, maxDigits || 18);
      if (!decimal.endsWith("...") && decimal.length <= 30) {
        return decimal;
      }
      return decimal + " | " + M.toScientificString(value, scientificDigits || 12);
    }
    if (isCalcValue(value)) {
      const primary = state.complexDisplay === "polar"
        ? C.polarString(value, state.angleMode, Math.max(8, Math.min(maxDigits || 10, 12)))
        : C.rectString(value, Math.max(8, Math.min(maxDigits || 10, 12)));
      const secondary = state.complexDisplay === "polar"
        ? C.rectString(value, Math.max(8, Math.min(maxDigits || 10, 12)))
        : C.polarString(value, state.angleMode, Math.max(8, Math.min(maxDigits || 10, 12)));
      return primary === secondary ? primary : primary + " | " + secondary;
    }
    if (isPlainNumber(value)) {
      return C.formatReal(value, maxDigits || 14);
    }
    return String(value);
  }

  function detailValue(value, previewDigits, scientificDigits) {
    if (isRationalValue(value)) {
      const decimal = M.rationalToDecimalString(value, previewDigits || 24);
      const fraction = M.rationalToFractionString(value);
      const scientific = M.toScientificString(value, scientificDigits || 14);
      const parts = [decimal];
      if (fraction !== decimal) {
        parts.push(fraction);
      }
      if (scientific !== decimal) {
        parts.push(scientific);
      }
      return Array.from(new Set(parts)).join(" | ");
    }
    if (isCalcValue(value)) {
      const rect = C.rectString(value, Math.max(10, Math.min(previewDigits || 12, 14)));
      const polar = C.polarString(value, state.angleMode, Math.max(10, Math.min(previewDigits || 12, 14)));
      return rect === polar ? rect : rect + " | " + polar;
    }
    if (isPlainNumber(value)) {
      return C.formatReal(value, previewDigits || 14);
    }
    return String(value);
  }

  function terminatingDecimalPlaces(rational) {
    let denominator = rational.den;
    let twos = 0;
    let fives = 0;

    while (denominator % 2n === 0n) {
      denominator /= 2n;
      twos += 1;
    }

    while (denominator % 5n === 0n) {
      denominator /= 5n;
      fives += 1;
    }

    if (denominator !== 1n) {
      return null;
    }

    return Math.max(twos, fives);
  }

  function importFieldValue(value) {
    if (isRationalValue(value)) {
      if (M.isZero(value)) {
        return "0";
      }
      const decimalPlaces = terminatingDecimalPlaces(value);
      if (decimalPlaces !== null) {
        return M.rationalToDecimalString(value, Math.max(1, decimalPlaces));
      }
      return M.rationalToFractionString(value);
    }
    if (isCalcValue(value)) {
      return C.inputString(value);
    }
    if (isPlainNumber(value)) {
      return C.formatReal(value, 14);
    }
    return String(value);
  }

  function machineDecimalFromNormalized(normalized) {
    return C.machineDecimalFromNormalized(normalized);
  }

  function machineValueFromData(data) {
    if (!data) {
      return EMPTY_VALUE;
    }
    return C.machineValueString(data, state.complexDisplay, state.angleMode);
  }

  function machineValue(value, k) {
    if (isRationalValue(value) && M.isZero(value)) {
      return "0";
    }
    if (isCalcValue(value) && C.isZeroValue(value)) {
      return "0";
    }
    return machineValueFromData(C.machineApproxValue(value, k, "chop"));
  }

  function machineDetailFromData(data, k, scientificDigits) {
    const decimal = machineValueFromData(data && data.approx !== undefined ? data : C.machineApproxValue(data, k, "chop"));
    const target = data && data.approx !== undefined ? data.approx : data;
    let scientific;
    if (data && data.scientific) {
      scientific = data.scientific;
    } else if (isRationalValue(target)) {
      scientific = M.toScientificString(target, scientificDigits || 12);
    } else if (isCalcValue(target)) {
      scientific = state.complexDisplay === "polar"
        ? C.rectString(target, 12)
        : C.polarString(target, state.angleMode, 10);
    } else {
      scientific = C.formatReal(target, scientificDigits || 12);
    }
    return decimal === scientific ? decimal : decimal + " | " + scientific;
  }

  function percentSummary(value) {
    if (isRationalValue(value)) {
      const percent = M.mul(value, HUNDRED);
      const decimal = M.rationalToDecimalString(percent, 12);
      if (!decimal.endsWith("...") && decimal.length <= 16) {
        return decimal + "%";
      }
      return M.toScientificString(percent, 10) + "%";
    }
    if (isPlainNumber(value)) {
      return C.formatReal(value * 100, 10) + "%";
    }
    return EMPTY_VALUE;
  }

  function powerOfTenRational(exp) {
    if (exp >= 0) {
      return M.makeRational(1, M.pow10(exp), 1n);
    }
    return M.makeRational(1, 1n, M.pow10(-exp));
  }

  function applyOperation(op, left, right) {
    if (op === "+") {
      return C.add(left, right);
    }
    if (op === "-") {
      return C.sub(left, right);
    }
    if (op === "*") {
      return C.mul(left, right);
    }
    if (op === "/") {
      return C.div(left, right);
    }
    throw new Error("Unsupported operation: " + op);
  }

  function computeErrorMetrics(exact, approx) {
    if (isRationalValue(exact) && isRationalValue(approx)) {
      const absError = M.absoluteError(exact, approx);
      const relError = M.relativeError(exact, approx);
      const t = M.significantDigits(exact, approx);
      let maxAbs = null;
      if (relError !== null) {
        maxAbs = t === Infinity ? M.ZERO : M.maxAbsoluteError(exact, t);
      }
      return { absError, relError, t, maxAbs };
    }

    const absError = C.magnitude(C.sub(exact, approx));
    const exactMagnitude = C.magnitude(exact);
    const relError = exactMagnitude < C.EPS ? null : absError / exactMagnitude;
    let t = null;
    let maxAbs = null;
    if (relError !== null) {
      if (relError === 0) {
        t = Infinity;
        maxAbs = 0;
      } else {
        t = 0;
        while (relError <= 5 * Math.pow(10, -t) && t < 1000) {
          t += 1;
        }
        t = Math.max(t - 1, 0);
        maxAbs = exactMagnitude * 5 * Math.pow(10, -t);
      }
    }

    return { absError, relError, t, maxAbs };
  }

  function compareScalar(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.cmp(left, right);
    }
    const a = isRationalValue(left) ? C.toNumber(left) : Number(left);
    const b = isRationalValue(right) ? C.toNumber(right) : Number(right);
    if (Math.abs(a - b) < 1e-12) {
      return 0;
    }
    return a < b ? -1 : 1;
  }

  function valuesEquivalent(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.eq(left, right);
    }
    if (isCalcValue(left) || isCalcValue(right)) {
      return C.magnitude(C.sub(left, right)) < 1e-9;
    }
    return Math.abs(Number(left) - Number(right)) < 1e-12;
  }

  function thresholdForDigits(t) {
    return M.makeRational(1, 5n, M.pow10(t));
  }

  function significantCheckString(relError, t) {
    if (relError === null) {
      return "Relative error is undefined when p = 0. Use absolute error instead.";
    }
    if ((isRationalValue(relError) && M.isZero(relError)) || (isPlainNumber(relError) && relError === 0) || t === Infinity) {
      return "Relative error is 0, so every threshold 5 x 10^-t is satisfied.";
    }

    if (isRationalValue(relError)) {
      const currentThreshold = thresholdForDigits(t);
      const nextThreshold = thresholdForDigits(t + 1);
      const currentPass = M.cmp(relError, currentThreshold) <= 0;
      const nextPass = M.cmp(relError, nextThreshold) <= 0;
      return "Check 1: relative error <= 5 x 10^-" + t + " is " + (currentPass ? "yes" : "no") + ". Check 2: relative error <= 5 x 10^-" + (t + 1) + " is " + (nextPass ? "yes" : "no") + ".";
    }

    const currentPass = relError <= 5 * Math.pow(10, -t);
    const nextPass = relError <= 5 * Math.pow(10, -(t + 1));
    return "Check 1: relative error <= 5 x 10^-" + t + " is " + (currentPass ? "yes" : "no") + ". Check 2: relative error <= 5 x 10^-" + (t + 1) + " is " + (nextPass ? "yes" : "no") + ".";
  }

  function formatBound(k, mode, perComponent) {
    const bound = M.maxRelativeErrorBound(k, mode);
    const formula = mode === "chop" ? "10^(-k+1)" : "0.5 x 10^(-k+1)";
    return shortValue(bound, 14, 10) + " using " + formula + (perComponent ? " per component" : "");
  }

  function machineRuleGerund(mode) {
    return mode === "round" ? "rounding" : "chopping";
  }

  function machineRulePast(mode) {
    return mode === "round" ? "rounded" : "chopped";
  }

  function machineRuleTitle(mode) {
    return mode === "round" ? "Rounding" : "Chopping";
  }

  function finalOnlyVerb(mode) {
    return mode === "round" ? "round" : "chop";
  }

  function finalOnlyPast(mode) {
    return mode === "round" ? "rounded" : "chopped";
  }

  function expressionFinalLabel(mode) {
    return "Final-only p* (exact expression, then " + finalOnlyVerb(mode) + " once)";
  }

  function expressionAnswerGuide(mode) {
    return "Use the stepwise machine answer for machine-arithmetic exercises. Use the final-only machine answer only when the whole exact expression is " + finalOnlyPast(mode) + " once at the end.";
  }

  function polyFinalLabel(mode) {
    return "Final-only p* (exact f(x), then " + finalOnlyVerb(mode) + " once)";
  }

  function updateExpressionFinalLabel(mode) {
    byId("basic-expression-final-label").textContent = expressionFinalLabel(mode);
    const guide = document.getElementById("basic-expression-answer-guide");
    if (guide) {
      guide.textContent = expressionAnswerGuide(mode);
    }
  }

  function updatePolyFinalLabels(mode) {
    byId("poly-final-shared-label").textContent = polyFinalLabel(mode);
  }

  function formatMachineNeighborhood(approx, exponentN, k) {
    if (!isRationalValue(approx) || M.isZero(approx)) {
      return {
        ulp: "N/A",
        prev: "N/A",
        next: "N/A",
        interval: "N/A"
      };
    }

    const ulp = powerOfTenRational(exponentN - k);
    const halfUlp = M.div(ulp, TWO);
    const prev = M.sub(approx, ulp);
    const next = M.add(approx, ulp);
    const low = M.sub(approx, halfUlp);
    const high = M.add(approx, halfUlp);

    return {
      ulp: detailValue(ulp, 18, 10),
      prev: detailValue(prev, 18, 10),
      next: detailValue(next, 18, 10),
      interval: "[" + shortValue(low, 18, 10) + ", " + shortValue(high, 18, 10) + ")"
    };
  }


  function renderBasicExpressionSteps(steps) {
    const body = byId("basic-expression-steps-body");
    body.innerHTML = "";

    if (!steps.length) {
      renderEmptyBasicExpressionSteps();
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const step of steps) {
      fragment.appendChild(buildStepRow(step));
    }
    body.appendChild(fragment);
  }

  function renderExpressionResults(ast, reference, stepRun, finalData, k, mode, exactCompatible) {
    updateExpressionFinalLabel(mode);
    const basicReferenceLabel = document.getElementById("basic-expression-reference-label");
    if (basicReferenceLabel) {
      basicReferenceLabel.textContent = exactCompatible ? "Exact value p" : "Reference value";
    }
    setContent("basic-expression-stepwise", machineValueFromData(C.machineApproxValue(stepRun.approx, k, mode)), false);
    setContent("basic-expression-final", machineValueFromData(finalData), false);
    setContent("basic-expression-exact", inlineValue(reference, 24, 14), false);
    setContent("basic-expression-canonical", stepRun.canonical, false);
    renderTextbookValue("basic-expression-exact", reference, { decimalFirst: true, previewDigits: 18, scientificDigits: 12 });
    renderTextbookExpressionAst("basic-expression-canonical", ast);
    setContent("basic-expression-ops", String(stepRun.opCount) + " arithmetic operations", false);
    setContent("basic-expression-bound", formatBound(k, mode, !exactCompatible), false);

    let comparisonNote;
    if (valuesEquivalent(stepRun.approx, finalData.approx)) {
      comparisonNote = "The stepwise p* and final-only p* match here. Intermediate " + machineRuleGerund(mode) + " does not change the final stored value for this expression at the chosen precision.";
    } else {
      comparisonNote = "The stepwise p* and final-only p* differ here. Intermediate " + machineRuleGerund(mode) + " changes the arithmetic before the final stored value is reached.";
    }
    if (!exactCompatible) {
      comparisonNote += " This expression uses calculator-style approximation, so the reference value is already an approximate complex/scientific-calculator value.";
    }
    setContent("basic-expression-note", comparisonNote, false);
    renderBasicExpressionSteps(stepRun.steps);
  }

  function handleExpressionError(message, invalidIds) {
    resetExpressionResults();
    markInvalid(invalidIds, "basic-expression-error-msg");
    showError("basic-expression-error-msg", message);
    if (invalidIds.length > 0) { byId(invalidIds[0]).focus(); }
  }

  function computeExpressionModule() {
    clearExpressionFeedback();

    const expression = byId("basic-expression").value;
    let ast;
    try {
      ast = E.parseExpression(expression, { allowVariable: false });
    } catch (error) {
      handleExpressionError(formatExpressionInputError(error), ["basic-expression"]);
      return;
    }

    let k;
    try {
      k = parsePositiveInt("basic-expression-k", "k");
    } catch (error) {
      handleExpressionError(error.message, ["basic-expression-k"]);
      return;
    }

    const mode = byId("basic-expression-mode").value;

    try {
      const exactCompatible = E.isExactCompatible(ast, { angleMode: state.angleMode });
      const reference = exactCompatible
        ? E.evaluateExact(ast, { angleMode: state.angleMode })
        : E.evaluateValue(ast, { angleMode: state.angleMode });
      const stepRun = E.evaluateStepwise(ast, { k, mode }, { angleMode: state.angleMode });
      const finalData = C.machineApproxValue(reference, k, mode);
      renderExpressionResults(ast, reference, stepRun, finalData, k, mode, exactCompatible);
      state.expressionComparison = {
        expression,
        canonical: stepRun.canonical,
        exact: reference,
        k,
        mode,
        path: exactCompatible ? "exact" : "calc",
        step: {
          approx: stepRun.approx,
          steps: stepRun.steps,
          opCount: stepRun.opCount
        },
        final: {
          approx: finalData.approx,
          scientific: finalData.scientific
        }
      };
      byId("basic-send-step").disabled = false;
      byId("basic-send-final").disabled = false;
      byId("basic-open-trace").disabled = false;
      markOnboardingComplete();
      syncOnboardingUI();
      announceStatus(
        "basic-status-msg",
        "Expression results updated. Stepwise p* = " + shortValue(stepRun.approx, 16, 10) + ". Final-only p* = " + shortValue(finalData.approx, 16, 10) + "."
      );
    } catch (error) {
      handleExpressionError(error.message === "Division by zero." ? "The expression cannot divide by 0." : formatExpressionInputError(error), ["basic-expression"]);
    }
  }

  function renderBasicResults(a, b, exact, approxData, storedOutcome, k, mode, op, aData, bData) {
    setContent("basic-a-exact", detailValue(a, 20, 12), false);
    renderTextbookValue("basic-a-exact", a, { previewDigits: 14, scientificDigits: 10 });
    setContent("basic-a-normalized", isRationalValue(a) ? M.toScientificString(a, 12) : detailValue(a, 12, 10), false);
    setContent("basic-a-machine", machineDetailFromData(aData, k, 12), false);
    setContent("basic-b-exact", detailValue(b, 20, 12), false);
    renderTextbookValue("basic-b-exact", b, { previewDigits: 14, scientificDigits: 10 });
    setContent("basic-b-normalized", isRationalValue(b) ? M.toScientificString(b, 12) : detailValue(b, 12, 10), false);
    setContent("basic-b-machine", machineDetailFromData(bData, k, 12), false);

    setContent("basic-exact-summary", inlineValue(exact, 20, 12), false);
    renderTextbookValue("basic-exact-summary", exact, { decimalFirst: true, previewDigits: 18, scientificDigits: 12 });
    setContent("basic-exact-scientific", isRationalValue(exact) ? M.toScientificString(exact, 14) : detailValue(exact, 12, 10), false);
    setContent("basic-approx-primary", machineValueFromData(approxData), false);
    if (isRationalValue(approxData.approx)) {
      setContent("basic-guard", String(approxData.normalized.guardDigit), false);
    } else {
      setContent("basic-guard", "Re " + approxData.normalized.re.guardDigit + " / Im " + approxData.normalized.im.guardDigit, false);
    }
    setContent("basic-bound", formatBound(k, mode, !isRationalValue(exact)), false);

    if (storedOutcome.error) {
      setContent("basic-approx-stored", storedOutcome.error, false);
    } else {
      setContent("basic-approx-stored", machineValueFromData(storedOutcome.data), false);
    }

    const neighborhood = isRationalValue(approxData.approx)
      ? formatMachineNeighborhood(approxData.approx, approxData.normalized.exponentN, k)
      : { ulp: "N/A (complex calculator mode)", prev: "N/A", next: "N/A", interval: "N/A" };
    setContent("basic-ulp", neighborhood.ulp, false);
    setContent("basic-prev", neighborhood.prev, false);
    setContent("basic-next", neighborhood.next, false);
    setContent("basic-interval", neighborhood.interval, false);

    const normalizationNote = isRationalValue(a) && isRationalValue(b)
      ? "x normalizes to " + M.toScientificString(a, 10) + " and y normalizes to " + M.toScientificString(b, 10) + ". The exact result is normalized before the mantissa is trimmed to k = " + k + " digits."
      : "Calculator mode stores each component separately. Real and imaginary parts are trimmed component-wise after every stored operation.";
    setContent("basic-normalization-note", normalizationNote, false);

    let guardNote;
    if (isRationalValue(approxData.approx)) {
      if (mode === "round") {
        if (approxData.normalized.guardDigit >= 5) {
          guardNote = "Guard digit " + approxData.normalized.guardDigit + " rounds the last kept digit up, so the stored value moves to the nearest k-digit machine number.";
        } else {
          guardNote = "Guard digit " + approxData.normalized.guardDigit + " is below 5, so rounding keeps the chopped mantissa unchanged.";
        }
      } else {
        guardNote = "Chopping keeps the first " + k + " mantissa digits and drops guard digit " + approxData.normalized.guardDigit + " without changing the last kept digit.";
      }
    } else {
      guardNote = "Component-wise " + machineRuleGerund(mode) + " is applied separately to the real and imaginary parts after each stored operation.";
    }
    setContent("basic-guard-note", guardNote, false);

    let comparisonNote = "For the same k, rounding has half the worst-case relative-error bound of chopping.";
    if (!storedOutcome.error) {
      if (valuesEquivalent(approxData.approx, storedOutcome.data.approx)) {
        comparisonNote += " Here, storing the operands first does not change the final machine result.";
      } else {
        comparisonNote += " Here, fl(fl(x) " + op + " fl(y)) differs from fl(x " + op + " y), so storing the operands changes the arithmetic before the final " + machineRuleGerund(mode) + " step.";
      }
    } else {
      comparisonNote += " In the stored-operand path, " + machineRuleGerund(mode) + " the inputs makes the operation invalid.";
    }
    setContent("basic-rounding-note", comparisonNote, false);
  }

  function handleBasicError(message, invalidIds) {
    resetBasicResults();
    markInvalid(invalidIds, "basic-error-msg");
    showError("basic-error-msg", message);
    if (invalidIds.length > 0) { byId(invalidIds[0]).focus(); }
  }

  function parseStandaloneValue(rawValue, label) {
    try {
      const ast = E.parseExpression(rawValue, { allowVariable: false });
      return E.evaluateValue(ast, { angleMode: state.angleMode });
    } catch (error) {
      throw new Error(formatNumericInputError(label, rawValue, error));
    }
  }

  function computeBasicModule() {
    clearBasicFeedback();

    let a;
    try {
      a = parseStandaloneValue(byId("basic-a").value, "First number");
    } catch (error) {
      handleBasicError(error.message, ["basic-a"]);
      return;
    }

    let b;
    try {
      b = parseStandaloneValue(byId("basic-b").value, "Second number");
    } catch (error) {
      handleBasicError(error.message, ["basic-b"]);
      return;
    }

    let k;
    try {
      k = parsePositiveInt("basic-k", "k");
    } catch (error) {
      handleBasicError(error.message, ["basic-k"]);
      return;
    }

    const mode = byId("basic-mode").value;
    const op = byId("basic-op").value;

    try {
      const exact = applyOperation(op, a, b);
      const approxData = C.machineApproxValue(exact, k, mode);
      const aData = C.machineApproxValue(a, k, mode);
      const bData = C.machineApproxValue(b, k, mode);

      let storedOutcome;
      try {
        const storedExact = applyOperation(op, aData.approx, bData.approx);
        storedOutcome = {
          data: C.machineApproxValue(storedExact, k, mode),
          error: null
        };
      } catch (storedError) {
        storedOutcome = {
          data: null,
          error: "Stored-operand path failed: " + storedError.message
        };
      }

      renderBasicResults(a, b, exact, approxData, storedOutcome, k, mode, op, aData, bData);

      state.basicExact = exact;
      state.basicApprox = approxData.approx;
      state.basicStoredApprox = storedOutcome.data ? storedOutcome.data.approx : null;
      state.basicContext = {
        op,
        k,
        mode,
        label: "the Module I result (p* = fl(x op y), op = " + op + ", k = " + k + ", mode = " + mode + ")"
      };
      markOnboardingComplete();
      syncOnboardingUI();
      announceStatus("basic-status-msg", "Machine answer updated. p* = " + machineValueFromData(approxData) + ".");
    } catch (error) {
      handleBasicError(error.message === "Division by zero." ? "Second number cannot be 0 when you divide." : error.message, op === "/" ? ["basic-b"] : ["basic-a", "basic-b"]);
    }
  }

  function runMandatoryVerification() {
    try {
      const a = M.parseRational("2.1892");
      const b = M.parseRational("3.7008");
      const exact = M.mul(a, b);

      const expectedExact = M.parseRational("8.10179136");
      const expectedChop = M.parseRational("8.1017913");
      const expectedRound = M.parseRational("8.1017914");

      const chopResult = M.machineApprox(exact, 8, "chop").approx;
      const roundResult = M.machineApprox(exact, 8, "round").approx;

      const passExact = M.eq(exact, expectedExact);
      const passChop = M.eq(chopResult, expectedChop);
      const passRound = M.eq(roundResult, expectedRound);

      const lines = [];
      lines.push("Exact check: " + (passExact ? "PASS" : "FAIL"));
      lines.push("  Expected p  = 8.10179136");
      lines.push("  Computed p  = " + M.rationalToDecimalString(exact, 20));
      lines.push("");
      lines.push("k=8 chop check: " + (passChop ? "PASS" : "FAIL"));
      lines.push("  Expected p* = 8.1017913");
      lines.push("  Computed p* = " + M.rationalToDecimalString(chopResult, 20));
      lines.push("");
      lines.push("k=8 round check: " + (passRound ? "PASS" : "FAIL"));
      lines.push("  Expected p* = 8.1017914");
      lines.push("  Computed p* = " + M.rationalToDecimalString(roundResult, 20));

      byId("basic-verify-output").textContent = lines.join("\n");
    } catch (error) {
      byId("basic-verify-output").textContent = "Verification failed: " + error.message;
    }
  }

  function loadBasicPreset() {
    const presetKey = byId("basic-preset").value;
    const preset = BASIC_PRESETS[presetKey];
    if (!preset) {
      setContent("basic-preset-note", "Select an example to populate the inputs.", true);
      return;
    }

    byId("basic-a").value = preset.a;
    byId("basic-op").value = preset.op;
    byId("basic-b").value = preset.b;
    byId("basic-k").value = String(preset.k);
    byId("basic-mode").value = preset.mode;
    clearBasicFeedback();
    resetBasicResults();
    setContent("basic-preset-note", preset.note + " Then select Calculate p*.", false);
    announceStatus("basic-status-msg", "Module I example loaded. Select Calculate.");
    byId("basic-compute").focus();
  }

  function importBasicIntoErrorModule(kind) {
    const resultKind = kind === "final" ? "final" : "step";
    if (!state.expressionComparison) {
      showError("error-error-msg", "Calculate Module I first, then import a result here.");
      return;
    }

    const approx = resultKind === "final"
      ? state.expressionComparison.final.approx
      : state.expressionComparison.step.approx;
    const referenceLabel = state.expressionComparison.path === "exact" ? "Exact" : "Reference";
    const label = "Module I " + (resultKind === "final" ? "final-only p*" : "stepwise p*") + " for " + state.expressionComparison.canonical + " (k = " + state.expressionComparison.k + ", mode = " + state.expressionComparison.mode + ")";
    const statusMessage = resultKind === "final"
      ? "Module I final-only values imported into Error Analysis."
      : "Module I step-by-step values imported into Error Analysis.";

    byId("error-exact").value = importFieldValue(state.expressionComparison.exact);
    byId("error-approx").value = importFieldValue(approx);
    clearErrorFeedback();
    resetErrorResults();
    setErrorSource(label, "module1");
    activateTab("error");
    syncOnboardingUI();
    announceStatus("error-status-msg", statusMessage);
  }

  function importPolyIntoErrorModule(kind) {
    if (!state.polyComparison) {
      showError("error-error-msg", "Calculate Module III first, then import a result here.");
      return;
    }

    let approx;
    let label;
    let statusMessage;
    if (kind === "horner") {
      approx = state.polyComparison.horner.step.approx;
      label = "Module III Horner stepwise p* for x = " + state.polyComparison.xInput + " (k = " + state.polyComparison.k + ", mode = " + state.polyComparison.mode + ")";
      statusMessage = "Module III Horner stepwise p* imported into Error Analysis.";
    } else if (kind === "direct") {
      approx = state.polyComparison.direct.step.approx;
      label = "Module III Direct stepwise p* for x = " + state.polyComparison.xInput + " (k = " + state.polyComparison.k + ", mode = " + state.polyComparison.mode + ")";
      statusMessage = "Module III Direct stepwise p* imported into Error Analysis.";
    } else {
      approx = state.polyComparison.final.approx;
      label = "Module III final-only p* for x = " + state.polyComparison.xInput + " (k = " + state.polyComparison.k + ", mode = " + state.polyComparison.mode + ")";
      statusMessage = "Module III final-only p* imported into Error Analysis.";
    }

    byId("error-exact").value = importFieldValue(state.polyComparison.exact);
    byId("error-approx").value = importFieldValue(approx);
    clearErrorFeedback();
    resetErrorResults();
    setErrorSource(label, "module3");
    activateTab("error");
    syncOnboardingUI();
    announceStatus("error-status-msg", statusMessage);
  }

  function handleErrorModuleFailure(message, invalidIds) {
    resetErrorResults();
    markInvalid(invalidIds, "error-error-msg");
    showError("error-error-msg", message);
    if (invalidIds.length > 0) { byId(invalidIds[0]).focus(); }
  }

  function errorVerdictMessage(metrics, exact) {
    if (metrics.relError === null) {
      return "Use absolute error here because the true value is 0, so relative error does not apply.";
    }
    if (metrics.t === Infinity || (isRationalValue(metrics.relError) && M.isZero(metrics.relError)) || (isPlainNumber(metrics.relError) && metrics.relError === 0)) {
      return "This approximation matches the true value in this computation.";
    }

    let verdict;
    if (metrics.t >= 5) {
      verdict = "This is a strong approximation with " + metrics.t + " significant digits.";
    } else if (metrics.t >= 3) {
      verdict = "This approximation is acceptable, but it is already losing precision.";
    } else {
      verdict = "This is a poor approximation for the chosen true value.";
    }

    if (isCalcValue(exact)) {
      verdict += " The comparison uses magnitudes for the complex values.";
    }
    return verdict;
  }

  function computeErrorModule(options) {
    options = options || {};
    clearErrorFeedback();

    let exact;
    try {
      exact = parseStandaloneValue(byId("error-exact").value, "True value p");
    } catch (error) {
      handleErrorModuleFailure(error.message, ["error-exact"]);
      return;
    }

    let approx;
    try {
      approx = parseStandaloneValue(byId("error-approx").value, "Approximation p*");
    } catch (error) {
      handleErrorModuleFailure(error.message, ["error-approx"]);
      return;
    }

    try {
      const metrics = computeErrorMetrics(exact, approx);
      setContent("error-abs", inlineValue(metrics.absError, 18, 12), false);

      if (metrics.relError === null) {
        setContent("error-rel", "N/A (relative error is undefined when p = 0)", false);
        setContent("error-rel-pct", "N/A", false);
        setContent("error-t", "N/A", false);
        setContent("error-check", "Relative error is undefined when p = 0. Use absolute error instead.", false);
        setContent("error-verdict", errorVerdictMessage(metrics, exact), false);
        setContent("error-maxabs", "N/A", false);
        setContent("error-meaning-abs", "Absolute error is the raw distance between p and p*, measured in the same units as p.", false);
        setContent("error-meaning-rel", "Relative error is undefined because p is 0 and the ratio would divide by zero.", false);
        setContent("error-meaning-t", "Without a relative error, the significant-digit test does not apply.", false);
        setContent("error-meaning-extra", "When |p| = 0, use absolute error to judge the approximation.", false);
        state.errorComputed = true;
        markOnboardingComplete();
        syncOnboardingUI();
        announceStatus("error-status-msg", (options.sourceStatusPrefix ? options.sourceStatusPrefix + " " : "") + "Relative error is undefined because p = 0.");
        return;
      }

      setContent("error-rel", shortValue(metrics.relError, 16, 10), false);
      setContent("error-rel-pct", percentSummary(metrics.relError), false);
      setContent("error-check", significantCheckString(metrics.relError, metrics.t === Infinity ? 0 : metrics.t), false);
      setContent("error-verdict", errorVerdictMessage(metrics, exact), false);

      if (metrics.t === Infinity) {
        setContent("error-t", "Infinity", false);
        setContent("error-maxabs", "0", false);
      } else {
        setContent("error-t", String(metrics.t), false);
        setContent("error-maxabs", inlineValue(metrics.maxAbs, 18, 12), false);
      }

      setContent("error-meaning-abs", "Absolute error is the magnitude of p - p*.", false);
      setContent("error-meaning-rel", "Relative error compares the miss with the size of the true value. Here the approximation is off by about " + percentSummary(metrics.relError) + ".", false);
      if (metrics.t === Infinity) {
        setContent("error-meaning-t", "The relative error is zero, so this approximation matches the true value in this computation.", false);
      } else {
        setContent("error-meaning-t", "t = " + metrics.t + " because the relative error meets the 5 x 10^-" + metrics.t + " test but fails the tighter 5 x 10^-" + (metrics.t + 1) + " test.", false);
      }
      setContent("error-meaning-extra", "For complex values, the calculator uses magnitudes: |p - p*| and |p - p*| / |p|.", false);
      state.errorComputed = true;
      markOnboardingComplete();
      syncOnboardingUI();
      announceStatus("error-status-msg", (options.sourceStatusPrefix ? options.sourceStatusPrefix + " " : "Error metrics updated. ") + "Relative error = " + shortValue(metrics.relError, 14, 8) + ".");
    } catch (error) {
      handleErrorModuleFailure(error.message, ERROR_FIELD_IDS);
    }
  }

  function buildStepRow(step) {
    const row = document.createElement("tr");
    const columns = [
      String(step.index),
      step.description,
      detailValue(step.exact, 24, 12),
      detailValue(step.approx, 24, 12),
      step.scientific
    ];

    columns.forEach(function appendCell(col, index) {
      const td = document.createElement("td");
      td.textContent = col;
      td.setAttribute("data-label", STEP_TABLE_LABELS[index]);
      row.appendChild(td);
    });

    return row;
  }

  function countOperations(steps, method) {
    let multiplications = 0;
    let additions = 0;
    for (const step of steps) {
      if (method === "horner") {
        if (step.description === "Multiply accumulator by x*") {
          multiplications += 1;
        }
        if (step.description.indexOf("Add coefficient") === 0) {
          additions += 1;
        }
      } else {
        if (step.description.indexOf("Power step") === 0 || step.description.indexOf("Compute term coefficient") === 0) {
          multiplications += 1;
        }
        if (step.description.indexOf("Accumulate term") === 0) {
          additions += 1;
        }
      }
    }
    return {
      multiplications,
      additions
    };
  }

  function formatSignificantDigitsValue(t) {
    if (t === Infinity) {
      return "Infinite significant digits";
    }
    return String(t) + " significant digits";
  }

  function formatOperationSummary(counts) {
    return String(counts.multiplications) + " mults / " + String(counts.additions) + " adds";
  }

  function renderMethodMetrics(cardPrefix, stepMetrics, finalMetrics, stepApprox, counts, k) {
    setContent(cardPrefix + "-step-approx", machineValue(stepApprox, k), false);
    setContent(cardPrefix + "-step-abs", inlineValue(stepMetrics.absError, 18, 12), false);
    setContent(cardPrefix + "-final-abs", inlineValue(finalMetrics.absError, 18, 12), false);

    if (stepMetrics.relError === null) {
      setContent(cardPrefix + "-step-rel", "N/A (relative error undefined when p = 0)", false);
      setContent(cardPrefix + "-final-rel", "N/A (relative error undefined when p = 0)", false);
      setContent(cardPrefix + "-step-t", "N/A", false);
      setContent(cardPrefix + "-final-t", "N/A", false);
    } else {
      setContent(cardPrefix + "-step-rel", inlineValue(stepMetrics.relError, 18, 12), false);
      setContent(cardPrefix + "-final-rel", inlineValue(finalMetrics.relError, 18, 12), false);
      setContent(cardPrefix + "-step-t", formatSignificantDigitsValue(stepMetrics.t), false);
      setContent(cardPrefix + "-final-t", formatSignificantDigitsValue(finalMetrics.t), false);
    }

    setContent(cardPrefix + "-mults", String(counts.multiplications), false);
    setContent(cardPrefix + "-adds", String(counts.additions), false);
    setContent(cardPrefix + "-ops-summary", formatOperationSummary(counts), false);
  }

  function renderSelectedPolySteps() {
    const body = byId("poly-steps-body");
    body.innerHTML = "";

    if (!state.polyComparison) {
      renderEmptyPolySteps();
      return;
    }

    const selected = byId("poly-method").value;
    const run = selected === "direct" ? state.polyComparison.direct.step : state.polyComparison.horner.step;
    if (!run.steps.length) {
      renderEmptyPolySteps();
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const step of run.steps) {
      fragment.appendChild(buildStepRow(step));
    }
    body.appendChild(fragment);
  }

  function renderPolyConclusion(hornerStepMetrics, directStepMetrics, finalMetrics, hornerCounts, directCounts, mode) {
    const totalHorner = hornerCounts.multiplications + hornerCounts.additions;
    const totalDirect = directCounts.multiplications + directCounts.additions;

    let accuracyNote;
    const compareStepAccuracy = compareScalar(hornerStepMetrics.absError, directStepMetrics.absError);
    if (compareStepAccuracy < 0) {
      accuracyNote = "Horner keeps more useful digits for this input, so use the Horner stepwise p* when the rule is applied at every operation.";
    } else if (compareStepAccuracy > 0) {
      accuracyNote = "Direct evaluation keeps more useful digits for this input, so use the Direct stepwise p* when the rule is applied at every operation.";
    } else {
      accuracyNote = "Horner and Direct are effectively tied for this input, so either stepwise result is acceptable.";
    }
    setContent("poly-accuracy-winner", accuracyNote, false);
    setContent("poly-next-step", "Open Advanced tools to inspect the method details and machine trace.", false);

    let operationNote;
    if (totalHorner < totalDirect) {
      operationNote = "Horner uses fewer counted operations here (" + totalHorner + " versus " + totalDirect + "), which is why it is usually preferred for polynomial evaluation.";
    } else if (totalHorner > totalDirect) {
      operationNote = "Direct evaluation uses fewer counted operations here (" + totalDirect + " versus " + totalHorner + "), which is unusual for a dense polynomial.";
    } else {
      operationNote = "Horner and direct evaluation use the same number of counted arithmetic operations in this case.";
    }
    setContent("poly-operation-winner", operationNote, false);

    let sensitivityNote = "Final-only " + machineRuleGerund(mode) + " is identical for both methods because the machine rule is deferred until after the reference polynomial value is computed.";
    const finalBetterThanHorner = compareScalar(finalMetrics.absError, hornerStepMetrics.absError) < 0;
    const finalBetterThanDirect = compareScalar(finalMetrics.absError, directStepMetrics.absError) < 0;
    if (finalBetterThanHorner || finalBetterThanDirect) {
      sensitivityNote += " The gap between final-only and stepwise errors shows that most of the visible loss comes from intermediate " + machineRuleGerund(mode) + ", not from the last stored value alone.";
    }
    if (compareStepAccuracy < 0) {
      sensitivityNote += " Direct evaluation amplifies round-off more strongly for this polynomial at the chosen x.";
    } else if (compareStepAccuracy > 0) {
      sensitivityNote += " The two formulations are close enough that Horner does not dominate for this specific input.";
    } else {
      sensitivityNote += " Both methods behave similarly at this x, so the polynomial is relatively well-behaved at the chosen precision.";
    }
    setContent("poly-sensitivity-note", sensitivityNote, false);
  }

  function handlePolyError(message, invalidIds) {
    resetPolyResults();
    markInvalid(invalidIds, "poly-error-msg");
    showError("poly-error-msg", message);
    if (invalidIds.length > 0) { byId(invalidIds[0]).focus(); }
  }

  function computePolynomialModule() {
    clearPolyFeedback();

    const expression = byId("poly-expression").value;

    let poly;
    try {
      poly = P.parsePolynomial(expression);
    } catch (error) {
      handlePolyError(formatPolynomialInputError(error), ["poly-expression"]);
      return;
    }

    let xValue;
    try {
      xValue = parseStandaloneValue(byId("poly-x").value, "Value of x");
    } catch (error) {
      handlePolyError(error.message, ["poly-x"]);
      return;
    }

    let k;
    try {
      k = parsePositiveInt("poly-k", "k");
    } catch (error) {
      handlePolyError(error.message, ["poly-k"]);
      return;
    }

    const mode = byId("poly-mode").value;

    try {
      const exact = P.evaluateExact(poly, xValue);
      const hornerStep = P.evaluateApprox(poly, xValue, { k, mode }, "horner");
      const directStep = P.evaluateApprox(poly, xValue, { k, mode }, "direct");
      const finalRun = P.evaluateApproxFinal(poly, xValue, { k, mode });

      const hornerStepMetrics = computeErrorMetrics(exact, hornerStep.approx);
      const directStepMetrics = computeErrorMetrics(exact, directStep.approx);
      const finalMetrics = computeErrorMetrics(exact, finalRun.approx);
      const hornerCounts = countOperations(hornerStep.steps, "horner");
      const directCounts = countOperations(directStep.steps, "direct");
      const exactCompatible = isRationalValue(exact);

      updatePolyFinalLabels(mode);
      const polyReferenceLabel = document.getElementById("poly-reference-label");
      if (polyReferenceLabel) {
        polyReferenceLabel.textContent = exactCompatible ? "Exact polynomial value f(x)" : "Reference polynomial value f(x)";
      }
      setContent("poly-canonical", P.formatPolynomial(poly), false);
      setContent("poly-exact", shortValue(exact, 20, 12), false);
      renderTextbookExpressionString("poly-canonical", P.formatPolynomial(poly), true);
      renderTextbookValue("poly-exact", exact, { decimalFirst: true, previewDigits: 18, scientificDigits: 12 });
      setContent("poly-xapprox", machineDetailFromData({ approx: hornerStep.xApprox, scientific: hornerStep.xApproxScientific }, k, 12), false);

      setContent("poly-final-shared", machineValue(finalRun.approx, k), false);
      renderMethodMetrics("poly-horner", hornerStepMetrics, finalMetrics, hornerStep.approx, hornerCounts, k);
      renderMethodMetrics("poly-direct", directStepMetrics, finalMetrics, directStep.approx, directCounts, k);
      renderPolyConclusion(hornerStepMetrics, directStepMetrics, finalMetrics, hornerCounts, directCounts, mode);

      state.polyComparison = {
        exact,
        k,
        mode,
        path: exactCompatible ? "exact" : "calc",
        expression,
        xInput: byId("poly-x").value,
        xValue,
        final: finalRun,
        horner: {
          step: hornerStep,
          stepMetrics: hornerStepMetrics,
          counts: hornerCounts
        },
        direct: {
          step: directStep,
          stepMetrics: directStepMetrics,
          counts: directCounts
        }
      };

      renderSelectedPolySteps();
      markOnboardingComplete();
      syncOnboardingUI();
      announceStatus("poly-status-msg", "Polynomial comparison updated. Final-only p* = " + shortValue(finalRun.approx, 14, 8) + ". Horner stepwise p* = " + shortValue(hornerStep.approx, 14, 8) + ". Direct stepwise p* = " + shortValue(directStep.approx, 14, 8) + ".");
    } catch (error) {
      handlePolyError(error.message === "Division by zero." ? "The polynomial cannot divide by 0 at the chosen value of x." : error.message, ["poly-expression", "poly-x"]);
    }
  }

  function loadPolyPreset() {
    const presetKey = byId("poly-preset").value;
    const preset = POLY_PRESETS[presetKey];
    if (!preset) {
      setContent("poly-preset-note", "Select an example to populate the fields.", true);
      return;
    }

    byId("poly-expression").value = preset.expression;
    byId("poly-x").value = preset.x;
    byId("poly-k").value = String(preset.k);
    byId("poly-mode").value = preset.mode;
    byId("poly-method").value = preset.stepMethod;
    clearPolyFeedback();
    resetPolyResults();
    setContent("poly-preset-note", preset.note + " Then select Calculate polynomial.", false);
    announceStatus("poly-status-msg", "Polynomial example loaded. Select Calculate polynomial.");
    byId("poly-expression").focus();
  }

  function debounce(fn, delay) {
    var timer = null;
    return function debounced() {
      if (timer) { clearTimeout(timer); }
      timer = setTimeout(function run() { timer = null; fn(); }, delay);
    };
  }

  function wireEvents() {
    for (const btn of getTabButtons()) {
      btn.addEventListener("click", function onTabClick() {
        activateTab(btn.dataset.tab || "basic");
      });
      btn.addEventListener("keydown", onTabKeyDown);
    }

    byId("theme-toggle").addEventListener("click", toggleTheme);
    const angleToggle = document.getElementById("angle-toggle");
    const displayToggle = document.getElementById("display-toggle");
    if (angleToggle) {
      angleToggle.addEventListener("click", toggleAngleMode);
    }
    if (displayToggle) {
      displayToggle.addEventListener("click", toggleComplexDisplay);
    }
    document.querySelectorAll("[data-symbol-target]").forEach(function (button, index) {
      if (!button.id) {
        button.id = "symbol-trigger-" + index;
      }
      button.addEventListener("click", function onSymbolTriggerClick() {
        const targetId = button.getAttribute("data-symbol-target");
        const popover = byId("symbol-popover");
        if (!popover.hidden && state.symbolAnchorId === button.id) {
          closeSymbolPopover();
          return;
        }
        openSymbolPopover(targetId, button);
      });
    });

    document.querySelectorAll("#symbol-popover [data-symbol-insert]").forEach(function (button) {
      button.addEventListener("click", function onSymbolInsertClick() {
        if (!state.symbolTargetId) {
          return;
        }
        insertTokenAtCursor(state.symbolTargetId, button.getAttribute("data-symbol-insert"));
        closeSymbolPopover();
      });
    });
    byId("welcome-open-basic").addEventListener("click", openBasicGuide);
    byId("welcome-load-poly").addEventListener("click", loadPolyQuickStart);
    byId("welcome-strip").addEventListener("toggle", handleWelcomeGuideToggle);

    byId("basic-expression-compute").addEventListener("click", computeExpressionModule);
    byId("basic-send-step").addEventListener("click", function onImportModule1Step() {
      importBasicIntoErrorModule("step");
    });
    byId("basic-send-final").addEventListener("click", function onImportModule1Final() {
      importBasicIntoErrorModule("final");
    });
    byId("basic-open-trace").addEventListener("click", openBasicMachineTrace);
    byId("basic-compute").addEventListener("click", computeBasicModule);
    byId("basic-load-preset").addEventListener("click", loadBasicPreset);
    byId("basic-verify").addEventListener("click", runMandatoryVerification);
    byId("basic-empty-compute").addEventListener("click", loadBasicStarter);

    byId("error-empty-import").addEventListener("click", function onImportDefaultModule1() {
      importBasicIntoErrorModule("step");
    });
    byId("error-empty-manual").addEventListener("click", focusErrorManualEntry);
    byId("error-empty-sample").addEventListener("click", loadErrorSample);
    byId("error-import-basic").addEventListener("click", function onImportModule1Visible() {
      importBasicIntoErrorModule("step");
    });
    byId("error-import-basic-final").addEventListener("click", function onImportModule1FinalVisible() {
      importBasicIntoErrorModule("final");
    });
    byId("error-import-horner").addEventListener("click", function onImportHorner() {
      importPolyIntoErrorModule("horner");
    });
    byId("error-import-direct").addEventListener("click", function onImportDirect() {
      importPolyIntoErrorModule("direct");
    });
    byId("error-import-final").addEventListener("click", function onImportFinal() {
      importPolyIntoErrorModule("final");
    });
    byId("error-compute").addEventListener("click", computeErrorModule);

    byId("poly-compute").addEventListener("click", computePolynomialModule);
    byId("poly-load-preset").addEventListener("click", loadPolyPreset);
    byId("poly-empty-load").addEventListener("click", loadPolyQuickStart);
    byId("poly-method").addEventListener("change", renderSelectedPolySteps);
    byId("poly-mode").addEventListener("change", function onPolyModeChange() {
      clearPolyFeedback();
      resetPolyResults();
    });

    var debouncedExpressionReset = debounce(function () {
      clearExpressionFeedback();
      resetExpressionResults();
    }, 60);
    byId("basic-expression").addEventListener("input", debouncedExpressionReset);
    byId("basic-expression-k").addEventListener("input", debouncedExpressionReset);
    byId("basic-expression-mode").addEventListener("change", function onExpressionModeChange() {
      clearExpressionFeedback();
      resetExpressionResults();
    });
    var debouncedBasicReset = debounce(function () {
      clearBasicFeedback();
      resetBasicResults();
      syncOnboardingUI();
    }, 60);
    byId("basic-a").addEventListener("input", debouncedBasicReset);
    byId("basic-b").addEventListener("input", debouncedBasicReset);
    var debouncedErrorReset = debounce(handleErrorInputsChanged, 60);
    byId("error-exact").addEventListener("input", debouncedErrorReset);
    byId("error-approx").addEventListener("input", debouncedErrorReset);
    var debouncedPolyReset = debounce(function () {
      clearPolyFeedback();
      resetPolyResults();
      syncOnboardingUI();
    }, 60);
    byId("poly-expression").addEventListener("input", debouncedPolyReset);
    byId("poly-x").addEventListener("input", debouncedPolyReset);

    function onEnterKey(inputId, computeFn) {
      byId(inputId).addEventListener("keydown", function onKeyDown(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          computeFn();
        }
      });
    }

    onEnterKey("basic-expression", computeExpressionModule);
    onEnterKey("basic-expression-k", computeExpressionModule);
    onEnterKey("basic-a", computeBasicModule);
    onEnterKey("basic-b", computeBasicModule);
    onEnterKey("basic-k", computeBasicModule);
    onEnterKey("error-exact", computeErrorModule);
    onEnterKey("error-approx", computeErrorModule);
    onEnterKey("poly-expression", computePolynomialModule);
    onEnterKey("poly-x", computePolynomialModule);
    onEnterKey("poly-k", computePolynomialModule);
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    state.onboardingGuidePreference = readOnboardingPreference();
    state.onboardingComplete = readOnboardingCompletionPreference();
    initializeTheme();
    initializeDisplaySettings();
    applyExamModeLayout();
    syncMicroPanels();
    wireEvents();

    document.addEventListener("keydown", function onGlobalKeyDown(e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".micro-panel[open]").forEach(function (panel) {
          panel.open = false;
        });
        closeSymbolPopover();
      }
    });

    document.addEventListener("click", function onGlobalClick(event) {
      const popover = document.getElementById("symbol-popover");
      if (!popover || popover.hidden) {
        return;
      }
      const trigger = event.target.closest("[data-symbol-target]");
      if (trigger || popover.contains(event.target)) {
        return;
      }
      closeSymbolPopover();
    });

    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(function (input) {
      input.addEventListener('focus', function () {
        this.select();
        updateSymbolSelection(this);
      });
      input.addEventListener('click', function () {
        updateSymbolSelection(this);
      });
      input.addEventListener('keyup', function () {
        updateSymbolSelection(this);
      });
      input.addEventListener('select', function () {
        updateSymbolSelection(this);
      });
      input.addEventListener('input', function () {
        updateSymbolSelection(this);
      });
    });

    resetExpressionResults();
    resetBasicResults();
    resetErrorResults();
    resetPolyResults();
    activateTab("basic");
    setErrorSource("Entered manually", "manual");
    setContent("basic-preset-note", "Select an example to populate the inputs.", true);
    setContent("poly-preset-note", "Select an example to populate the fields.", true);
    byId("welcome-strip").open = state.onboardingGuidePreference ? state.onboardingGuidePreference === "open" : !state.onboardingComplete;
    syncOnboardingUI();
  });
})(window);























































