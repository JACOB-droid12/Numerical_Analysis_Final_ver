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
    el.textContent = err && err.message ? err.message : "The root calculation could not finish.";
    el.hidden = false;
  }

  function setStatus(message) {
    const el = byId("root-status-msg");
    if (el) el.textContent = message || "";
  }

  function prefersReducedMotion() {
    return !!(globalScope.matchMedia && globalScope.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function scrollBehavior() {
    return prefersReducedMotion() ? "auto" : "smooth";
  }

  function scrollElementIntoView(target) {
    if (!target || !target.scrollIntoView) return;
    target.scrollIntoView({ block: "start", behavior: scrollBehavior() });
  }

  function revealQuizAnswer() {
    const answer = byId("root-quiz-answer");
    if (!answer || !answer.getBoundingClientRect || !globalScope.scrollTo) return;
    const scroll = function scrollToAnswer() {
      try {
        const top = answer.getBoundingClientRect().top + (globalScope.pageYOffset || 0) - 14;
        globalScope.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
      } catch (err) {
        try {
          const fallbackTop = answer.getBoundingClientRect().top + (globalScope.pageYOffset || 0) - 14;
          globalScope.scrollTo(0, Math.max(0, fallbackTop));
        } catch (fallbackErr) {
          // Some non-browser audit environments do not implement scrolling.
        }
      }
    };
    if (globalScope.requestAnimationFrame) {
      globalScope.requestAnimationFrame(scroll);
    } else {
      scroll();
    }
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

  function syncStoppingControls() {
    [
      { prefix: "root-bis", toleranceWrapId: "root-bis-tolerance-type-wrap", toleranceNoteId: "root-bis-tolerance-note" },
      { prefix: "root-newton" },
      { prefix: "root-secant" },
      { prefix: "root-fp" },
      { prefix: "root-fpi" }
    ].forEach(function syncControl(config) {
      const stopKind = byId(config.prefix + "-stop-kind");
      const stopValueLabel = byId(config.prefix + "-stop-value-label-text");
      const stopValueInput = byId(config.prefix + "-stop-value");
      const epsilonMode = !!(stopKind && stopKind.value === "epsilon");
      if (stopValueLabel) stopValueLabel.textContent = epsilonMode ? "Tolerance (epsilon)" : "Iterations (n)";
      if (stopValueInput && stopValueInput.setAttribute) {
        stopValueInput.setAttribute("aria-label", epsilonMode ? "Tolerance epsilon" : "Iterations n");
      }
      if (config.toleranceWrapId) {
        const wrap = byId(config.toleranceWrapId);
        if (wrap) wrap.hidden = !epsilonMode;
      }
      if (config.toleranceNoteId) {
        const note = byId(config.toleranceNoteId);
        if (note) note.hidden = !epsilonMode;
      }
    });
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
        tab.tabIndex = isActive ? 0 : -1;
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
      setStatus("Answer ready. Approximate root: " + approx + ".");
      clearError();
      revealQuizAnswer();
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
    function focusMethodAt(nextIndex) {
      const count = state.methodConfigs.length;
      if (!count) return;
      const normalizedIndex = ((nextIndex % count) + count) % count;
      const nextConfig = state.methodConfigs[normalizedIndex];
      if (!nextConfig) return;
      activateMethod(state, nextConfig.name);
      const nextTab = byId(nextConfig.tabId);
      if (nextTab && nextTab.focus) nextTab.focus();
    }

    state.methodConfigs.forEach(function wireConfig(config) {
      const tab = byId(config.tabId);
      if (tab) {
        tab.addEventListener("click", function onTabClick() { activateMethod(state, config.name); });
        tab.addEventListener("keydown", function onTabKeydown(event) {
          const currentIndex = state.methodConfigs.findIndex(function findMethod(item) {
            return item.name === config.name;
          });
          if (currentIndex === -1) return;
          switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
              event.preventDefault();
              focusMethodAt(currentIndex + 1);
              break;
            case "ArrowLeft":
            case "ArrowUp":
              event.preventDefault();
              focusMethodAt(currentIndex - 1);
              break;
            case "Home":
              event.preventDefault();
              focusMethodAt(0);
              break;
            case "End":
              event.preventDefault();
              focusMethodAt(state.methodConfigs.length - 1);
              break;
            default:
              break;
          }
        });
      }

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
          if (/-stop-kind$/.test(id)) syncStoppingControls();
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
    let popoverTargetId = null;

    function wireSymbolButton(button) {
      button.addEventListener("click", function onSymbolButton() {
        const targetId = button.dataset ? (button.dataset.symbolTarget || popoverTargetId) : popoverTargetId;
        const target = targetId ? byId(targetId) : null;
        const insert = button.dataset ? button.dataset.symbolInsert : "";
        if (target && insert) {
          insertAtCursor(target, insert);
          if (target.dispatchEvent && typeof Event === "function") target.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (popover) popover.hidden = true;
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".symbol-trigger"), function wireTrigger(trigger) {
      trigger.addEventListener("click", function onSymbolTrigger() {
        popoverTargetId = trigger.dataset ? trigger.dataset.symbolTarget : null;
        if (popover) popover.hidden = false;
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll(".symbol-btn"), wireSymbolButton);
    Array.prototype.forEach.call(document.querySelectorAll(".root-symbol-insert"), wireSymbolButton);

    Array.prototype.forEach.call(document.querySelectorAll(".root-symbol-toggle"), function wireToggle(button) {
      button.addEventListener("click", function onToggle() {
        const targetId = button.dataset ? button.dataset.symbolMoreTarget : null;
        const target = targetId ? byId(targetId) : null;
        if (!target) return;
        const shouldExpand = !!target.hidden;
        target.hidden = !shouldExpand;
        button.setAttribute("aria-expanded", shouldExpand ? "true" : "false");
        button.textContent = shouldExpand ? "Fewer symbols" : "More symbols";
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
        if (status) status.textContent = "Run a method first, then copy the full work.";
        return;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        if (status) status.textContent = "Clipboard access is unavailable. Select and copy the full work manually.";
        return;
      }
      navigator.clipboard.writeText(globalScope.RootsRender.buildSolutionText(run))
        .then(function copied() {
          if (status) status.textContent = "Solution copied.";
        })
        .catch(function failed() {
          if (status) status.textContent = "Copy failed. Select and copy the full work manually.";
        });
    });
  }

  function wireCopyAnswer(state) {
    const button = byId("root-copy-answer");
    if (!button) return;
    button.addEventListener("click", function onCopyAnswer() {
      const run = state.runs[state.activeMethod];
      const status = byId("root-answer-copy-status");
      if (!run) {
        if (status) status.textContent = "Run a method first to copy the answer.";
        return;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        if (status) status.textContent = "Clipboard access is unavailable. Select and copy the answer manually.";
        return;
      }
      navigator.clipboard.writeText(globalScope.RootsRender.buildAnswerText(run))
        .then(function copied() {
          if (status) status.textContent = "Quiz-ready answer copied.";
        })
        .catch(function failed() {
          if (status) status.textContent = "Copy failed. Select and copy the answer manually.";
        });
    });
  }

  function wireEvidenceToggle() {
    const button = byId("root-evidence-toggle");
    const evidence = byId("root-evidence-stack");
    if (!button || !evidence) return;
    button.addEventListener("click", function onToggleEvidence() {
      const shouldExpand = evidence.hidden;
      if (globalScope.RootsRender && globalScope.RootsRender.setEvidenceExpanded) {
        globalScope.RootsRender.setEvidenceExpanded(shouldExpand);
      } else {
        evidence.hidden = !shouldExpand;
        button.setAttribute("aria-expanded", shouldExpand ? "true" : "false");
        button.textContent = shouldExpand ? "Hide full work" : "Show full work";
      }
      if (shouldExpand) {
        scrollElementIntoView(evidence);
        if (evidence.focus) {
          try {
            evidence.focus({ preventScroll: true });
          } catch (err) {
            evidence.focus();
          }
        }
      }
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
        const resultStage = byId("root-result-stage");
        const evidence = byId("root-evidence-stack");
        const resultsHidden = !!(resultStage && resultStage.hidden);
        const shouldRouteToSetup = resultsHidden && (item.id === "root-shell-answer-link" || item.id === "root-shell-evidence-link");
        const nextLinkId = shouldRouteToSetup ? "root-shell-setup-link" : item.id;
        const nextTarget = shouldRouteToSetup ? byId("root-setup-card") : target;

        setCurrentShellLink(nextLinkId);
        if (shouldRouteToSetup) setStatus("Run a method first, then open the answer or the full work.");
        if (!shouldRouteToSetup && item.id === "root-shell-evidence-link" && evidence && evidence.hidden && globalScope.RootsRender && globalScope.RootsRender.setEvidenceExpanded) {
          globalScope.RootsRender.setEvidenceExpanded(true);
        }

        scrollElementIntoView(nextTarget);
        if (nextTarget && nextTarget.focus) {
          try {
            nextTarget.focus({ preventScroll: true });
          } catch (err) {
            nextTarget.focus();
          }
        }
      });
    });
  }

  function syncAngleToggleUI(state) {
    const status = byId("status-angle");
    const button = byId("angle-toggle");
    if (status) status.textContent = state.angleMode.toUpperCase();
    if (button) button.textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
  }

  function wireAngleToggle(state) {
    const button = byId("angle-toggle");
    if (!button) return;
    syncAngleToggleUI(state);
    button.addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      syncAngleToggleUI(state);
      globalScope.RootsState.clearAllRuns(state);
      globalScope.RootsRender.resetResults(state);
      setStatus("Angle mode changed. Re-run to update trig values.");
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
    wireCopyAnswer(state);
    wireEvidenceToggle();
    wireSymbols();
    syncStoppingControls();
    activateMethod(state, state.activeMethod);
  });
})(window);
