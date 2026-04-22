"use strict";

(function initRootsApp(globalScope) {
  function byId(id) {
    return document.getElementById(id);
  }

  function readFields(config) {
    const fields = {};
    config.fieldIds.forEach(function readField(id) {
      const el = byId(id);
      fields[id] = el ? el.value : "";
    });
    return fields;
  }

  function clearError() {
    const el = byId("root-error-msg");
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  function showError(err) {
    const el = byId("root-error-msg");
    if (!el) return;
    el.textContent = err && err.message ? err.message : "Root calculation failed.";
    el.hidden = false;
  }

  function setStatus(message) {
    const el = byId("root-status-msg");
    if (el) el.textContent = message || "";
  }

  function setCurrentShellLink(activeId) {
    [
      "root-shell-methods-link",
      "root-shell-setup-link",
      "root-shell-answer-link",
      "root-shell-evidence-link"
    ].forEach(function updateLink(id) {
      const link = byId(id);
      if (!link) return;
      const isActive = id === activeId;
      if (link.classList && link.classList.toggle) link.classList.toggle("active", isActive);
      if (link.setAttribute) link.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function syncBisectionToleranceControls() {
    const epsilonMode = byId("root-bis-stop-kind") && byId("root-bis-stop-kind").value === "epsilon";
    const wrap = byId("root-bis-tolerance-type-wrap");
    const note = byId("root-bis-tolerance-note");
    if (wrap) wrap.hidden = !epsilonMode;
    if (note) note.hidden = !epsilonMode;
  }

  function activateMethod(state, method) {
    const config = globalScope.RootsState.methodConfig(state, method);
    if (!config) return;

    state.activeMethod = method;
    if (globalScope.RootsRender.renderMethodGuide) {
      globalScope.RootsRender.renderMethodGuide(method);
    }
    state.methodConfigs.forEach(function updateMethod(item) {
      const isActive = item.name === method;
      const tab = byId(item.tabId);
      const panel = byId(item.panelId);
      if (tab) {
        if (tab.classList && tab.classList.toggle) tab.classList.toggle("active", isActive);
        if (tab.setAttribute) tab.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      if (panel) panel.hidden = !isActive;
    });

    const bisAdvanced = byId("root-bis-advanced");
    const fpAdvanced = byId("root-fp-advanced");
    if (bisAdvanced) bisAdvanced.hidden = method !== "bisection";
    if (fpAdvanced) fpAdvanced.hidden = method !== "falsePosition";

    clearError();
    setStatus("");
    const run = state.runs[method];
    if (run) {
      globalScope.RootsRender.renderRun(run);
    } else {
      globalScope.RootsRender.resetResults(state);
    }
  }

  function computeActiveMethod(state) {
    const config = globalScope.RootsState.methodConfig(state, state.activeMethod);
    if (!config) return;
    clearError();
    setStatus("");

    try {
      const run = globalScope.RootsEngineAdapter.runMethod(config.name, readFields(config), state.angleMode);
      globalScope.RootsState.storeRun(state, config.name, run);
      globalScope.RootsRender.renderRun(run);
      const approx = run.summary && run.summary.approximation != null ? byId("root-approx").textContent : "N/A";
      setStatus("Result updated. Approximate root = " + approx + ".");
      clearError();
    } catch (err) {
      globalScope.RootsState.clearRun(state, config.name);
      globalScope.RootsRender.resetResults(state);
      setStatus("");
      showError(err);
    }
  }

  function handleInputChange(state, method) {
    globalScope.RootsState.clearRun(state, method);
    if (state.activeMethod === method) {
      clearError();
      setStatus("");
      globalScope.RootsRender.resetResults(state);
    }
  }

  function handlePresentationChange(state, method, id) {
    const run = state.runs[method];
    const el = byId(id);
    if (!run || !el) return;
    if (id === "root-bis-sign-display" || id === "root-fp-sign-display") {
      run.signDisplay = el.value;
    }
    if (state.activeMethod === method) {
      clearError();
      setStatus("");
      globalScope.RootsRender.renderRun(run);
    }
  }

  function wireMethodControls(state) {
    state.methodConfigs.forEach(function wireConfig(config) {
      const tab = byId(config.tabId);
      if (tab) tab.addEventListener("click", function onTabClick() { activateMethod(state, config.name); });

      const compute = byId(config.computeId);
      if (compute) compute.addEventListener("click", function onComputeClick() {
        state.activeMethod = config.name;
        computeActiveMethod(state);
      });

      config.fieldIds.forEach(function wireField(id) {
        const el = byId(id);
        if (!el) return;
        if (!globalScope.RootsState.isPresentationField(config, id)) {
          el.addEventListener("input", function onInput() { handleInputChange(state, config.name); });
        }
        el.addEventListener("change", function onChange() {
          if (id === "root-bis-stop-kind") syncBisectionToleranceControls();
          if (globalScope.RootsState.isPresentationField(config, id)) {
            handlePresentationChange(state, config.name, id);
          } else {
            handleInputChange(state, config.name);
          }
        });
      });
    });
  }

  function insertAtCursor(input, text) {
    const current = input.value || "";
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : current.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    input.value = current.slice(0, start) + text + current.slice(end);
    const next = start + text.length;
    if (input.setSelectionRange) input.setSelectionRange(next, next);
    if (input.focus) input.focus();
  }

  function wireSymbols() {
    const popover = byId("symbol-popover");
    let targetId = null;

    Array.prototype.forEach.call(document.querySelectorAll(".symbol-trigger"), function wireTrigger(trigger) {
      trigger.addEventListener("click", function onSymbolTrigger() {
        targetId = trigger.dataset ? trigger.dataset.symbolTarget : null;
        if (popover) popover.hidden = false;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll(".symbol-btn"), function wireButton(button) {
      button.addEventListener("click", function onSymbolButton() {
        const target = targetId ? byId(targetId) : null;
        const insert = button.dataset ? button.dataset.symbolInsert : "";
        if (target && insert) {
          insertAtCursor(target, insert);
          if (target.dispatchEvent && typeof Event === "function") target.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (popover) popover.hidden = true;
      });
    });
  }

  function wireCopySolution(state) {
    const button = byId("root-copy-solution");
    if (!button) return;
    button.addEventListener("click", function onCopy() {
      const run = state.runs[state.activeMethod];
      const status = byId("root-copy-status");
      if (!run) {
        if (status) status.textContent = "Run the method first, then copy the solution.";
        return;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        if (status) status.textContent = "Clipboard not available. Select and copy the steps manually.";
        return;
      }
      navigator.clipboard.writeText(globalScope.RootsRender.buildSolutionText(run))
        .then(function copied() {
          if (status) status.textContent = "Solution copied.";
        })
        .catch(function failed() {
          if (status) status.textContent = "Copy failed. Select the steps and copy manually.";
        });
    });
  }

  function wireShellNavigation() {
    const links = [
      { id: "root-shell-methods-link", targetId: "root-method-section" },
      { id: "root-shell-setup-link", targetId: "root-setup-card" },
      { id: "root-shell-answer-link", targetId: "root-quiz-answer" },
      { id: "root-shell-evidence-link", targetId: "root-evidence-stack" }
    ];

    links.forEach(function wireLink(item) {
      const link = byId(item.id);
      const target = byId(item.targetId);
      if (!link || !target) return;
      link.addEventListener("click", function onShellNavClick() {
        setCurrentShellLink(item.id);
        if (target.scrollIntoView) target.scrollIntoView({ block: "start", behavior: "smooth" });
        if (target.focus) {
          try {
            target.focus({ preventScroll: true });
          } catch (err) {
            target.focus();
          }
        }
      });
    });
  }

  function wireAngleToggle(state) {
    const button = byId("angle-toggle");
    if (!button) return;
    button.addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      const status = byId("status-angle");
      if (status) status.textContent = state.angleMode.toUpperCase();
      button.textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
      globalScope.RootsState.clearAllRuns(state);
      globalScope.RootsRender.resetResults(state);
      setStatus("Angle mode changed. Re-run the method for updated trig values.");
    });
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    const state = globalScope.RootsState.createState();
    globalScope.RootsRender.resetResults(state);
    wireMethodControls(state);
    wireShellNavigation();
    setCurrentShellLink("root-shell-methods-link");
    wireAngleToggle(state);
    wireCopySolution(state);
    wireSymbols();
    syncBisectionToleranceControls();
    activateMethod(state, state.activeMethod);
  });
})(window);
