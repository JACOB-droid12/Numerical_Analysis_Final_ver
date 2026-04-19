"use strict";

(function initRootUI(globalScope) {
  const R = globalScope.RootEngine;
  const C = globalScope.CalcEngine;
  const M = globalScope.MathEngine;
  const E = globalScope.ExpressionEngine;
  if (!R || !C || !M || !E) {
    throw new Error("RootEngine, CalcEngine, MathEngine, and ExpressionEngine must be loaded before root-ui.js.");
  }

  const EMPTY_VALUE = "Not calculated yet.";
  const DEBOUNCE_MS = 60;

  // ─── helpers (injected from app.js) ───────────────────────────────────────
  let h = {};  // app helpers: byId, setContent, setHidden, showError, markInvalid, clearInvalid, announceStatus, clearStatus, debounce, syncMathPreviews

  function byId(id) { return h.byId(id); }
  function setContent(id, text) { h.setContent(id, text, false); }
  function setHidden(id, val) { h.setHidden(id, val); }
  function showError(id, msg) { h.showError(id, msg); }
  function markInvalid(ids, errId) { h.markInvalid(ids, errId); }
  function clearInvalid(ids, errId) { h.clearInvalid(ids, errId); }
  function announceStatus(id, msg) { h.announceStatus(id, msg); }
  function clearStatus(id) { h.clearStatus(id); }

  function fmtVal(value, digits) {
    if (value == null) return "—";
    if (M.isZero(value)) return "0";
    if (C.isRationalValue(value)) {
      const d = M.rationalToDecimalString(value, digits || 14);
      if (!d.endsWith("...") && d.length <= 24) return d;
      return M.toScientificString(value, 10);
    }
    if (C.isCalcValue(value)) return C.rectString(value, digits || 10);
    if (typeof value === "number" && Number.isFinite(value)) return C.formatReal(value, digits || 10);
    return String(value);
  }

  function usesMachineIterates(run) {
    return run && (run.method === "newton" || run.method === "secant" || run.method === "fixedPoint" || run.decisionBasis === "machine");
  }

  function fmtMachineVal(value, run) {
    if (value == null) return "—";
    if (!run || !run.machine) return fmtVal(value, 12);
    try {
      return C.machineValueString(C.machineApproxValue(value, run.machine.k, run.machine.mode));
    } catch (err) {
      return fmtVal(value, run.machine.k || 12);
    }
  }

  function fmtRunVal(value, run, digits) {
    return usesMachineIterates(run) ? fmtMachineVal(value, run) : fmtVal(value, digits);
  }

  function fmtErr(error) {
    if (error == null) return "—";
    return C.formatReal(error, 8);
  }

  // ─── Method configuration ──────────────────────────────────────────────────
  const METHOD_CONFIGS = [
    {
      name: "bisection",
      label: "Bisection",
      panelId: "root-inputs-bisection",
      fieldIds: ["root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type"],
      resetFieldIds: ["root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value", "root-bis-tolerance-type", "root-bis-decision-basis"],
      previewIds: [{ inputId: "root-bis-expression", allowVariable: true }]
    },
    {
      name: "newton",
      label: "Newton\u2013Raphson",
      panelId: "root-inputs-newton",
      fieldIds: ["root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"],
      resetFieldIds: ["root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k", "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"],
      previewIds: [{ inputId: "root-newton-expression", allowVariable: true }, { inputId: "root-newton-df", allowVariable: true }]
    },
    {
      name: "secant",
      label: "Secant",
      panelId: "root-inputs-secant",
      fieldIds: ["root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"],
      resetFieldIds: ["root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k", "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"],
      previewIds: [{ inputId: "root-secant-expression", allowVariable: true }]
    },
    {
      name: "falsePosition",
      label: "False Position",
      panelId: "root-inputs-falseposition",
      fieldIds: ["root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value"],
      resetFieldIds: ["root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k", "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value", "root-fp-decision-basis"],
      previewIds: [{ inputId: "root-fp-expression", allowVariable: true }]
    },
    {
      name: "fixedPoint",
      label: "Fixed Point",
      panelId: "root-inputs-fixedpoint",
      fieldIds: ["root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"],
      resetFieldIds: ["root-fpi-expression", "root-fpi-x0", "root-fpi-k", "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"],
      previewIds: [{ inputId: "root-fpi-expression", allowVariable: true }]
    }
  ];

  const TABLE_CONFIGS = {
    bisection:    { headers: ["i", "a", "b", "c", "f(a)", "f(b)", "f(c)", "Signs", "Decision", "Width", "Bound", "Error", "Note"], colSpan: 13 },
    falsePosition:{ headers: ["i", "a", "b", "c", "f(a)", "f(b)", "f(c)", "Signs", "Decision", "Width", "Target ε", "Error", "Note"], colSpan: 13 },
    newton:       { headers: ["i", "x\u2099", "f(x\u2099)", "f\u2032(x\u2099)", "x\u2099\u208A\u2081", "Error", "Note"], colSpan: 7 },
    secant:       { headers: ["i", "x\u2099\u208B\u2081", "x\u2099", "f(x\u2099\u208B\u2081)", "f(x\u2099)", "x\u2099\u208A\u2081", "Error", "Note"], colSpan: 8 },
    fixedPoint:   { headers: ["i", "x\u2099", "g(x\u2099)", "Error", "Note"], colSpan: 5 }
  };

  // ─── State ─────────────────────────────────────────────────────────────────
  const state = {
    activeMethod: "bisection",
    runs: {},           // keyed by method name
    debounces: {}       // keyed by method name
  };

  // ─── Compute ───────────────────────────────────────────────────────────────
  function getAngleMode() { return h.getAngleMode ? h.getAngleMode() : "rad"; }

  function computeBisection() {
    const run = R.runBisection({
      expression: byId("root-bis-expression").value,
      interval: { a: byId("root-bis-a").value, b: byId("root-bis-b").value },
      machine: { k: Number(byId("root-bis-k").value), mode: byId("root-bis-mode").value },
      stopping: {
        kind: byId("root-bis-stop-kind").value,
        value: byId("root-bis-stop-value").value,
        toleranceType: byId("root-bis-tolerance-type").value
      },
      decisionBasis: byId("root-bis-decision-basis").value,
      signDisplay: byId("root-bis-sign-display").value,
      angleMode: getAngleMode()
    });
    return run;
  }

  function computeNewton() {
    const run = R.runNewtonRaphson({
      expression: byId("root-newton-expression").value,
      dfExpression: byId("root-newton-df").value,
      x0: byId("root-newton-x0").value,
      machine: { k: Number(byId("root-newton-k").value), mode: byId("root-newton-mode").value },
      stopping: { kind: byId("root-newton-stop-kind").value, value: byId("root-newton-stop-value").value },
      angleMode: getAngleMode()
    });
    return run;
  }

  function computeSecant() {
    const run = R.runSecant({
      expression: byId("root-secant-expression").value,
      x0: byId("root-secant-x0").value,
      x1: byId("root-secant-x1").value,
      machine: { k: Number(byId("root-secant-k").value), mode: byId("root-secant-mode").value },
      stopping: { kind: byId("root-secant-stop-kind").value, value: byId("root-secant-stop-value").value },
      angleMode: getAngleMode()
    });
    return run;
  }

  function computeFalsePosition() {
    const run = R.runFalsePosition({
      expression: byId("root-fp-expression").value,
      interval: { a: byId("root-fp-a").value, b: byId("root-fp-b").value },
      machine: { k: Number(byId("root-fp-k").value), mode: byId("root-fp-mode").value },
      stopping: { kind: byId("root-fp-stop-kind").value, value: byId("root-fp-stop-value").value },
      decisionBasis: byId("root-fp-decision-basis").value,
      signDisplay: byId("root-fp-sign-display").value,
      angleMode: getAngleMode()
    });
    return run;
  }

  function computeFixedPoint() {
    const run = R.runFixedPoint({
      gExpression: byId("root-fpi-expression").value,
      x0: byId("root-fpi-x0").value,
      machine: { k: Number(byId("root-fpi-k").value), mode: byId("root-fpi-mode").value },
      stopping: { kind: byId("root-fpi-stop-kind").value, value: byId("root-fpi-stop-value").value },
      angleMode: getAngleMode()
    });
    return run;
  }

  const COMPUTE_FNS = { bisection: computeBisection, newton: computeNewton, secant: computeSecant, falsePosition: computeFalsePosition, fixedPoint: computeFixedPoint };

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
      const approxText = run.summary.approximation != null ? fmtRunVal(run.summary.approximation, run, 14) : "N/A";
      announceStatus("root-status-msg", "Result updated. Approximate root = " + approxText + ".");
    } catch (err) {
      state.runs[state.activeMethod] = null;
      resetResults();
      markInvalid(cfg.fieldIds, "root-error-msg");
      showError("root-error-msg", formatRootError(err));
      clearStatus("root-status-msg");
    }
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────
  function formatSign(sign) {
    if (sign === 0) return "0";
    return sign < 0 ? "\u2212" : "+";
  }

  function formatSignPair(signDisplay, exactSign, machineSign) {
    if (signDisplay === "exact") return "E(" + formatSign(exactSign) + ")";
    if (signDisplay === "machine") return "M(" + formatSign(machineSign) + ")";
    return "E(" + formatSign(exactSign) + ") / M(" + formatSign(machineSign) + ")";
  }

  function formatBracketValue(point, signDisplay, run) {
    if (!point) return "—";
    if (signDisplay === "exact") return fmtVal(point.reference, 12);
    if (signDisplay === "machine") return fmtMachineVal(point.machine, run);
    return "E: " + fmtVal(point.reference, 10) + " / M: " + fmtMachineVal(point.machine, run);
  }

  function formatRootError(error) {
    const message = error && error.message ? String(error.message) : String(error || "");
    const lower = message.toLowerCase();
    if (lower.includes("division by zero")) {
      return "Division by zero. Check whether the expression can be simplified before the root-finding step.";
    }
    if (lower.includes("natural logarithm") || (lower.includes("logarithm") && lower.includes("greater than 0"))) {
      return "Logarithms require a positive input.";
    }
    if (lower.includes("tangent is undefined") || lower.includes("asymptote")) {
      return "Tangent is undefined at that angle because it hits an asymptote.";
    }
    if (lower.includes("too small for this browser number path") || lower.includes("epsilon is positive but too small")) {
      return "The requested tolerance is too small for this browser path. Use a larger epsilon or an iteration count.";
    }
    return message || "An unexpected root-finding error occurred.";
  }

  function formatContinuityDetail(detail) {
    const raw = String(detail || "").trim();
    if (!raw) {
      return "Bisection needs f(x) to be defined and continuous on the whole interval before a sign change can guarantee a root.";
    }

    const prefixMatch = raw.match(/^(Failed to evaluate f\([^)]+\):)\s*(.*)$/);
    const prefix = prefixMatch ? prefixMatch[1] + " " : "";
    const message = prefixMatch ? prefixMatch[2] : raw;
    const lower = message.toLowerCase();
    const friendly = lower.includes("division by zero")
      ? "The function is undefined at a tested point because it divides by zero."
      : formatRootError({ message });
    return prefix + friendly + " Bisection cannot continue until the interval avoids discontinuities or undefined values.";
  }

  function formatIntervalStatus(status) {
    const map = {
      "valid-bracket": "Valid bracket",
      "invalid-bracket": "Not a valid bisection bracket",
      "invalid-continuity": "Continuity requirement failed",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "root-at-a": "Root found at left endpoint a",
      "root-at-b": "Root found at right endpoint b",
      "root-at-midpoint": "Root found at midpoint"
    };
    return map[status] || status || EMPTY_VALUE;
  }

  function formatStopReason(reason, method) {
    const map = {
      "iteration-limit": "Completed the requested iterations",
      "iteration-cap": "Stopped at the safety iteration cap",
      "tolerance-reached": "Reached the requested tolerance",
      "tolerance-already-met": "Initial interval already satisfies the tolerance",
      "endpoint-root": "An endpoint is already a root",
      "exact-zero": method === "fixedPoint" ? "The iteration reached an exact fixed point" : "Reference value is exactly zero",
      "machine-zero": "Machine value is zero or near zero",
      "invalid-starting-interval": "Not a valid bisection bracket",
      "invalid-input": "Input was rejected",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "singularity-encountered": "Evaluator raised an error inside the iteration",
      "non-finite-evaluation": "Evaluator produced a non-finite value",
      "derivative-zero": "Derivative is zero — method cannot continue",
      "stagnation": "Method stalled (denominator \u2248 0)",
      "diverged": "Iteration diverged (|x| exceeds 10\u2078)",
      "diverged-step": "Step grew more than 10x without a residual drop",
      "step-small-residual-large": "Step is below epsilon but |f(x)| is too large to trust",
      "retained-endpoint-stagnation": "Same endpoint retained for too many iterations without convergence",
      "cycle-detected": "Iteration fell into a short-period cycle"
    };
    return map[reason] || reason || EMPTY_VALUE;
  }

  function formatStoppingDetails(run) {
    const plannedIterations = run.stopping && run.stopping.plannedIterations;
    const actualIterations = run.stopping && run.stopping.actualIterations;
    const iterationNote = Number.isFinite(plannedIterations) && Number.isFinite(actualIterations) && plannedIterations !== actualIterations
      ? " (planned iterations = " + plannedIterations + ", actual iterations = " + actualIterations + ")"
      : "";
    if (run.stopping.kind === "epsilon") {
      if (run.method === "bisection") {
        const label = run.stopping.toleranceType === "absolute"
          ? "Absolute tolerance"
          : "Relative tolerance";
        return label + " \u03B5 = " + run.stopping.input + iterationNote;
      }
      if (run.stopping.capReached) {
        return "\u03B5 = " + run.stopping.input + ", stopped after " + run.stopping.maxIterations + " attempts; convergence was not verified before the cap" + iterationNote;
      }
      const suffix = run.summary.stopReason === "tolerance-reached"
        ? ", iterations = " + run.stopping.iterationsRequired
        : ", iterations tried = " + run.stopping.iterationsRequired;
      return "\u03B5 = " + run.stopping.input + suffix + iterationNote;
    }

    if (run.method === "bisection") {
      return "n = " + run.stopping.input + ", \u03B5 \u2264 " + C.formatReal(run.stopping.epsilonBound, 8) + iterationNote;
    }

    const finalError = run.stopping.epsilonBound != null
      ? C.formatReal(run.stopping.epsilonBound, 8)
      : "\u2014";
    return "n = " + run.stopping.input + ", final |error| = " + finalError + iterationNote;
  }

  function diagnosticTitle(code) {
    const map = {
      "invalid-bracket": "Not a valid bisection bracket",
      "invalid-continuity": "Continuity requirement failed",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "early-exit": "Early exit",
      "angle-mode": "Angle mode note",
      "possible-multiple-roots": "Possible multiple roots"
    };
    return map[code] || String(code || "diagnostic").replace(/-/g, " ").replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
  }

  function collectDiagnostics(run) {
    const diagnostics = [];
    (run.warnings || []).forEach(function(warning) {
      diagnostics.push({
        code: warning.code || "warning",
        title: diagnosticTitle(warning.code || "warning"),
        message: warning.message || "",
        level: "warning"
      });
    });

    const plannedIterations = run.stopping && run.stopping.plannedIterations;
    const actualIterations = run.stopping && run.stopping.actualIterations;
    const stopReason = run.summary && run.summary.stopReason;
    const intervalStatus = run.summary && run.summary.intervalStatus;
    if (run.method === "bisection" && intervalStatus === "invalid-continuity") {
      diagnostics.push({
        code: "invalid-continuity",
        title: diagnosticTitle("invalid-continuity"),
        message: formatContinuityDetail(run.summary && run.summary.stopDetail),
        level: "warning"
      });
    }

    const isEarlyRootExit =
      stopReason === "endpoint-root" ||
      stopReason === "exact-zero" ||
      stopReason === "machine-zero" ||
      (typeof intervalStatus === "string" && intervalStatus.indexOf("root-at-") === 0);
    if (
      run.method === "bisection" &&
      run.stopping &&
      run.stopping.kind === "epsilon" &&
      Number.isFinite(plannedIterations) &&
      Number.isFinite(actualIterations) &&
      plannedIterations !== actualIterations &&
      isEarlyRootExit
    ) {
      diagnostics.push({
        code: "early-exit",
        title: diagnosticTitle("early-exit"),
        message: "Planned " + plannedIterations + " iteration" + (plannedIterations !== 1 ? "s" : "") +
          " but completed " + actualIterations + " before stopping.",
        level: "warning"
      });
    }

    return diagnostics;
  }

  function renderDiagnostics(run) {
    const container = byId("root-diagnostics");
    if (!container) return;

    const diagnostics = collectDiagnostics(run);
    container.innerHTML = "";
    if (!diagnostics.length) {
      container.hidden = true;
      return;
    }

    diagnostics.forEach(function(diagnostic) {
      const item = document.createElement("div");
      item.className = "root-diagnostic" + (diagnostic.level === "warning" ? " root-diagnostic-warning" : "");
      item.setAttribute("data-code", diagnostic.code);

      const title = document.createElement("strong");
      title.textContent = diagnostic.title;
      item.appendChild(title);

      if (diagnostic.message) {
        const message = document.createElement("div");
        message.textContent = diagnostic.message;
        item.appendChild(message);
      }

      container.appendChild(item);
    });

    container.hidden = false;
  }

  function renderRun(run) {
    setHidden("root-empty", true);
    setHidden("root-result-stage", false);

    // Hero boxes
    const approxText = (run.summary.intervalStatus === "invalid-bracket" || run.summary.approximation == null)
      ? "N/A"
      : fmtRunVal(run.summary.approximation, run, 18);
    setContent("root-approx", approxText);
    setContent("root-stopping-result", formatStopReason(run.summary.stopReason, run.method));

    setContent("root-convergence", formatStoppingDetails(run));
    renderDiagnostics(run);

    // Bracket-only fields
    const isBracket = run.method === "bisection" || run.method === "falsePosition";
    const bracketPanel = byId("root-bracket-panel");
    if (bracketPanel) setHidden("root-bracket-panel", !isBracket);

    if (isBracket && run.initial) {
      setContent("root-interval-status", formatIntervalStatus(run.summary.intervalStatus));
      const sd = run.signDisplay || "both";
      const leftSummary = run.initial.left
        ? formatSignPair(sd, run.initial.left.exactSign, run.initial.left.machineSign)
        : "unavailable";
      const rightSummary = run.initial.right
        ? formatSignPair(sd, run.initial.right.exactSign, run.initial.right.machineSign)
        : "unavailable";
      const signSummary = "f(a): " + leftSummary + ", f(b): " + rightSummary +
        (run.initial.note ? ". " + run.initial.note : "");
      setContent("root-sign-summary", signSummary);
      setContent("root-decision-summary", run.decisionBasis === "machine" ? "Machine signs decide the interval" : "Exact signs decide the interval");
    } else if (isBracket) {
      setContent("root-interval-status", formatIntervalStatus(run.summary.intervalStatus));
      setContent("root-sign-summary", "Endpoint values unavailable.");
      setContent("root-decision-summary", run.decisionBasis === "machine" ? "Machine signs decide the interval" : "Exact signs decide the interval");
    }

    // Convergence graph (tabbed: function plot + error plot)
    renderGraphTabs(run);

    // Convergence rate summary
    renderConvergenceSummary(run);

    // Solution steps
    renderSolutionSteps(run);

    // Table
    renderTable(run);
  }

  // ─── Convergence Graph (tabbed: Function f(x) + Error plot) ────────────────

  // ── helpers for function plot ──

  function toReal(value) {
    if (value == null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    try { return C.requireRealNumber(value, "iterate"); } catch (e) { return null; }
  }

  function extractIteratePoint(row, method) {
    var ix = row.iteration;
    var x, y;
    if (method === "newton" || method === "secant") {
      x = toReal(row.xn);
      y = toReal(row.fxn);
    } else if (method === "bisection" || method === "falsePosition") {
      x = toReal(row.c);
      y = row.fc && row.fc.approx != null ? toReal(row.fc.approx) : null;
    } else if (method === "fixedPoint") {
      x = toReal(row.xn);
      var gxn = toReal(row.gxn);
      y = (x != null && gxn != null) ? gxn - x : null;
    } else {
      x = null;
      y = null;
    }
    return { iteration: ix, x: x, y: y };
  }

  function niceStep(range, targetTicks) {
    if (range <= 0 || !Number.isFinite(range)) return 1;
    var rawStep = range / Math.max(targetTicks, 1);
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var residual = rawStep / mag;
    var nice;
    if (residual <= 1.5) nice = 1;
    else if (residual <= 3.5) nice = 2;
    else if (residual <= 7.5) nice = 5;
    else nice = 10;
    return nice * mag;
  }

  function safeSampleFn(ast, xVal, isFixedPoint) {
    try {
      var result = E.evaluateValue(ast, { x: M.parseRational(String(xVal)), angleMode: "rad" });
      var real = C.requireRealNumber(result, "sample");
      if (!Number.isFinite(real)) return null;
      return isFixedPoint ? real - xVal : real;
    } catch (e) {
      return null;
    }
  }

  // ── tooltip wiring (shared by both plots) ──

  function wireGraphTooltip(svgEl, panelEl) {
    if (!svgEl || !panelEl) return;
    var tooltip = document.createElement("div");
    tooltip.className = "root-graph-tooltip";
    tooltip.hidden = true;
    tooltip.setAttribute("role", "tooltip");
    panelEl.style.position = "relative";
    panelEl.appendChild(tooltip);

    function showTip(target) {
      var i = target.getAttribute("data-i");
      var x = target.getAttribute("data-x");
      if (i == null || x == null) return;
      tooltip.textContent = "Iteration " + i + ": x\u2099 = " + x;
      tooltip.hidden = false;
      var svgRect = svgEl.getBoundingClientRect();
      var dotRect = target.getBoundingClientRect();
      var tipLeft = dotRect.left - svgRect.left + dotRect.width / 2;
      var tipTop = dotRect.top - svgRect.top - 8;
      tooltip.style.left = tipLeft + "px";
      tooltip.style.top = tipTop + "px";
      tooltip.style.transform = "translate(-50%, -100%)";
    }

    function hideTip() { tooltip.hidden = true; }

    svgEl.addEventListener("mouseover", function(e) {
      if (e.target.hasAttribute("data-i")) showTip(e.target);
    });
    svgEl.addEventListener("mouseout", function(e) {
      if (e.target.hasAttribute("data-i")) hideTip();
    });
    svgEl.addEventListener("focusin", function(e) {
      if (e.target.hasAttribute("data-i")) showTip(e.target);
    });
    svgEl.addEventListener("focusout", function(e) {
      if (e.target.hasAttribute("data-i")) hideTip();
    });
  }

  // ── tab shell ──

  function renderGraphTabs(run) {
    var container = byId("root-convergence-graph");
    if (!container) return;

    container.innerHTML =
      '<div class="root-graph-tabs" role="tablist" aria-label="Graph view">' +
        '<button class="root-graph-tab" role="tab" aria-selected="true" aria-controls="root-graph-panel-function" id="root-graph-tab-function" tabindex="0" data-panel="function">Function f(x)</button>' +
        '<button class="root-graph-tab" role="tab" aria-selected="false" aria-controls="root-graph-panel-error" id="root-graph-tab-error" tabindex="-1" data-panel="error">Convergence rate</button>' +
      '</div>' +
      '<div class="root-graph-panel" role="tabpanel" id="root-graph-panel-function" aria-labelledby="root-graph-tab-function"></div>' +
      '<div class="root-graph-panel" role="tabpanel" id="root-graph-panel-error" aria-labelledby="root-graph-tab-error" hidden></div>';

    var functionPanel = container.querySelector("#root-graph-panel-function");
    var errorPanel = container.querySelector("#root-graph-panel-error");

    renderFunctionPlot(run, functionPanel);
    renderErrorPlot(run, errorPanel);

    // Wire tab keyboard + click
    var tabs = container.querySelectorAll("[role='tab']");
    var panels = container.querySelectorAll("[role='tabpanel']");

    function activateTab(tab) {
      tabs.forEach(function(t) {
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });
      panels.forEach(function(p) { p.hidden = true; });
      tab.setAttribute("aria-selected", "true");
      tab.setAttribute("tabindex", "0");
      tab.focus();
      var targetId = tab.getAttribute("aria-controls");
      var targetPanel = container.querySelector("#" + targetId);
      if (targetPanel) targetPanel.hidden = false;
    }

    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() { activateTab(tab); });
    });

    container.querySelector("[role='tablist']").addEventListener("keydown", function(e) {
      var tabArr = Array.prototype.slice.call(tabs);
      var currentIndex = tabArr.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      var newIndex = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        newIndex = (currentIndex + 1) % tabArr.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        newIndex = (currentIndex - 1 + tabArr.length) % tabArr.length;
      } else if (e.key === "Home") {
        newIndex = 0;
      } else if (e.key === "End") {
        newIndex = tabArr.length - 1;
      }
      if (newIndex >= 0) {
        e.preventDefault();
        activateTab(tabArr[newIndex]);
      }
    });
  }

  // ── function plot: f(x) with iterate markers ──

  function renderFunctionPlot(run, panelEl) {
    if (!panelEl) return;

    // Determine expression source
    var exprSource = run.expression || "";
    if (!exprSource) {
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>No expression to plot.</p>";
      return;
    }

    var ast;
    try {
      ast = E.parseExpression(String(exprSource), { allowVariable: true });
    } catch (e) {
      console.warn("renderFunctionPlot: parse failed:", e.message);
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>Could not re-parse expression for plot.</p>";
      return;
    }

    var isFixedPoint = run.method === "fixedPoint";
    var isBracket = run.method === "bisection" || run.method === "falsePosition";

    // Extract iterate points
    var iterates = [];
    for (var ri = 0; ri < run.rows.length; ri++) {
      var pt = extractIteratePoint(run.rows[ri], run.method);
      if (pt.x != null && Number.isFinite(pt.x)) {
        iterates.push(pt);
      }
    }

    // Collect all x-values for window computation
    var allXs = iterates.map(function(p) { return p.x; });
    var approxReal = toReal(run.summary.approximation);
    if (approxReal != null && Number.isFinite(approxReal)) allXs.push(approxReal);
    if (run.initial) {
      if (run.initial.left && run.initial.left.x != null) {
        var lx = toReal(run.initial.left.x);
        if (lx != null && Number.isFinite(lx)) allXs.push(lx);
      }
      if (run.initial.right && run.initial.right.x != null) {
        var rx = toReal(run.initial.right.x);
        if (rx != null && Number.isFinite(rx)) allXs.push(rx);
      }
    }

    allXs = allXs.filter(Number.isFinite);
    if (allXs.length === 0) {
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>Not enough data to plot.</p>";
      return;
    }

    // Window computation (spec §4)
    allXs.sort(function(a, b) { return a - b; });
    var xMinRaw = allXs[0];
    var xMaxRaw = allXs[allXs.length - 1];
    var span = xMaxRaw - xMinRaw;
    var median = allXs[Math.floor(allXs.length / 2)];
    var floor = Math.max(1e-6, 0.01 * Math.abs(median));
    span = Math.max(span, floor);
    var xMin = xMinRaw - 0.2 * span;
    var xMax = xMaxRaw + 0.2 * span;
    if (xMin === xMax) { xMin -= 0.5; xMax += 0.5; }

    // Sample the curve
    var SAMPLES = 120;
    var dx = (xMax - xMin) / SAMPLES;
    var samples = [];
    for (var si = 0; si <= SAMPLES; si++) {
      var sx = xMin + si * dx;
      var sy = safeSampleFn(ast, sx, isFixedPoint);
      samples.push({ x: sx, y: sy });
    }

    // Y-window from iterates (spec §4)
    var yIterateVals = iterates.map(function(p) { return p.y; }).filter(function(v) { return v != null && Number.isFinite(v); });
    var yAbsMax = yIterateVals.length > 0 ? Math.max.apply(null, yIterateVals.map(Math.abs)) : 1;
    var yMax = Math.max(1, yAbsMax * 1.25);
    var yMin = -yMax;

    // SVG dimensions
    var W = 480, H = 280, PL = 52, PR = 16, PT = 20, PB = 36;
    var plotW = W - PL - PR;
    var plotH = H - PT - PB;

    function xCoord(v) { return PL + ((v - xMin) / (xMax - xMin)) * plotW; }
    function yCoord(v) { return PT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    // Grid lines
    var xStep = niceStep(xMax - xMin, 5);
    var yStep = niceStep(yMax - yMin, 5);
    var gridHTML = "";

    var xGridStart = Math.ceil(xMin / xStep) * xStep;
    for (var gx = xGridStart; gx <= xMax; gx += xStep) {
      var gxc = xCoord(gx).toFixed(1);
      gridHTML += '<line x1="' + gxc + '" y1="' + PT + '" x2="' + gxc + '" y2="' + (PT + plotH) + '" class="root-graph-grid"/>';
      gridHTML += '<text x="' + gxc + '" y="' + (H - PB + 14) + '" text-anchor="middle" class="root-graph-label">' + C.formatReal(gx, 4) + '</text>';
    }
    var yGridStart = Math.ceil(yMin / yStep) * yStep;
    for (var gy = yGridStart; gy <= yMax; gy += yStep) {
      var gyc = yCoord(gy).toFixed(1);
      gridHTML += '<line x1="' + PL + '" y1="' + gyc + '" x2="' + (PL + plotW) + '" y2="' + gyc + '" class="root-graph-grid"/>';
      gridHTML += '<text x="' + (PL - 4) + '" y="' + gyc + '" text-anchor="end" dominant-baseline="middle" class="root-graph-label">' + C.formatReal(gy, 4) + '</text>';
    }

    // Zero line
    var zeroY = yCoord(0);
    var zeroLineHTML = "";
    if (zeroY >= PT && zeroY <= PT + plotH) {
      zeroLineHTML = '<line x1="' + PL + '" y1="' + zeroY.toFixed(1) + '" x2="' + (PL + plotW) + '" y2="' + zeroY.toFixed(1) + '" class="root-graph-axis"/>';
    }

    // Bracket shading (bracket methods only)
    var bracketHTML = "";
    if (isBracket && run.initial) {
      var bLeft = run.initial.left ? toReal(run.initial.left.x) : null;
      var bRight = run.initial.right ? toReal(run.initial.right.x) : null;
      if (bLeft != null && bRight != null && Number.isFinite(bLeft) && Number.isFinite(bRight)) {
        var bx1 = Math.max(xCoord(bLeft), PL);
        var bx2 = Math.min(xCoord(bRight), PL + plotW);
        if (bx2 > bx1) {
          bracketHTML = '<rect x="' + bx1.toFixed(1) + '" y="' + PT + '" width="' + (bx2 - bx1).toFixed(1) + '" height="' + plotH + '" class="root-graph-bracket"/>';
        }
      }
    }

    // Curve segments (split at breaks for singularities)
    var curveHTML = "";
    var segment = [];
    for (var ci = 0; ci <= SAMPLES; ci++) {
      var s = samples[ci];
      if (s.y != null && Number.isFinite(s.y) && Math.abs(s.y) <= yMax) {
        segment.push(xCoord(s.x).toFixed(1) + "," + yCoord(s.y).toFixed(1));
      } else {
        if (segment.length >= 2) {
          curveHTML += '<polyline points="' + segment.join(" ") + '" class="root-graph-line"/>';
        }
        segment = [];
      }
    }
    if (segment.length >= 2) {
      curveHTML += '<polyline points="' + segment.join(" ") + '" class="root-graph-line"/>';
    }

    // Iterate dots with recency fade
    var iterateHTML = "";
    var totalIterates = iterates.length;
    for (var ii = 0; ii < totalIterates; ii++) {
      var ip = iterates[ii];
      if (ip.x == null) continue;
      var recency = totalIterates <= 1 ? 1 : 0.3 + 0.7 * (ii / (totalIterates - 1));
      var iy = ip.y != null && Number.isFinite(ip.y) ? ip.y : 0;
      var offscreen = false;
      var drawX = ip.x;
      var drawY = iy;
      if (drawX < xMin) { drawX = xMin; offscreen = true; }
      if (drawX > xMax) { drawX = xMax; offscreen = true; }
      if (drawY < yMin) { drawY = yMin; offscreen = true; }
      if (drawY > yMax) { drawY = yMax; offscreen = true; }
      var cxStr = xCoord(drawX).toFixed(1);
      var cyStr = yCoord(drawY).toFixed(1);
      iterateHTML += '<circle cx="' + cxStr + '" cy="' + cyStr + '" r="3.5" class="root-graph-iterate" style="--recency:' + recency.toFixed(2) + '" tabindex="0" data-i="' + ip.iteration + '" data-x="' + fmtRunVal(ip.x, run, 10) + '"' + (offscreen ? ' data-offscreen="true"' : '') + '/>';
    }

    // Final root marker
    var rootMarkerHTML = "";
    if (approxReal != null && Number.isFinite(approxReal)) {
      var rmx = xCoord(Math.max(xMin, Math.min(xMax, approxReal)));
      var rmy = yCoord(0);
      if (rmy >= PT && rmy <= PT + plotH) {
        rootMarkerHTML = '<circle cx="' + rmx.toFixed(1) + '" cy="' + rmy.toFixed(1) + '" r="5" class="root-graph-root-marker"/>';
      }
    }

    // Axis titles
    var yAxisLabel = isFixedPoint ? "g(x) \u2212 x" : "f(x)";
    var axisTitles =
      '<text x="' + (PL + plotW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="root-graph-label">x</text>' +
      '<text x="' + (PL - 38) + '" y="' + (PT + plotH / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,' + (PL - 38) + ',' + (PT + plotH / 2) + ')" class="root-graph-label">' + yAxisLabel + '</text>';

    // Assemble SVG
    var svgTitle = isFixedPoint ? "Fixed-point residual g(x) minus x" : "Function f(x) with iterate markers";
    var svgDesc = isFixedPoint
      ? "Plot of g(x) minus x showing iterates converging toward the fixed point."
      : "Plot of f(x) showing iterates converging toward a root.";

    panelEl.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="root-function-svg" role="img" aria-labelledby="root-fn-plot-title root-fn-plot-desc">' +
      '<title id="root-fn-plot-title">' + svgTitle + '</title>' +
      '<desc id="root-fn-plot-desc">' + svgDesc + '</desc>' +
      '<rect x="' + PL + '" y="' + PT + '" width="' + plotW + '" height="' + plotH + '" class="root-graph-bg"/>' +
      gridHTML + zeroLineHTML + bracketHTML + curveHTML + iterateHTML + rootMarkerHTML + axisTitles +
      '</svg>';

    // Wire tooltip
    var fnSvg = panelEl.querySelector("svg");
    if (fnSvg) wireGraphTooltip(fnSvg, panelEl);
  }

  // ── error plot: log₁₀|error| vs iteration (relocated from renderConvergenceGraph) ──

  function renderErrorPlot(run, panelEl) {
    var container = panelEl;
    if (!container) return;

    var errorPoints = run.rows
      .map(function(r) { return { iteration: r.iteration, error: r.error }; })
      .filter(function(p) { return p.error != null && p.error > 0; });
    if (errorPoints.length < 2) {
      container.innerHTML = "<p class='focus-note root-graph-empty'>Not enough iterations to plot convergence.</p>";
      return;
    }

    var W = 480, H = 200, PL = 52, PR = 16, PT = 16, PB = 36;
    var plotW = W - PL - PR;
    var plotH = H - PT - PB;

    var logErrors = errorPoints.map(function(p) { return Math.log10(Math.max(p.error, 1e-15)); });
    var minLog = Math.floor(Math.min.apply(null, logErrors)) - 0.5;
    var maxLog = Math.ceil(Math.max.apply(null, logErrors)) + 0.5;
    var logRange = maxLog - minLog || 1;
    var minIteration = Math.min.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    var maxIteration = Math.max.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    var iterationRange = maxIteration - minIteration || 1;

    function xCoord(iteration) { return PL + ((iteration - minIteration) / iterationRange) * plotW; }
    function yCoord(v) { return PT + plotH - ((v - minLog) / logRange) * plotH; }

    var points = errorPoints.map(function(p) {
      return xCoord(p.iteration).toFixed(1) + "," + yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1);
    }).join(" ");

    // Y-axis ticks use integer powers so labels match their gridlines.
    var firstPower = Math.ceil(minLog);
    var lastPower = Math.floor(maxLog);
    var allPowers = [];
    for (var power = firstPower; power <= lastPower; power += 1) {
      allPowers.push(power);
    }
    var tickCount = Math.min(5, allPowers.length);
    var yTicks = [];
    for (var t = 0; t < tickCount; t += 1) {
      var sourceIndex = tickCount === 1
        ? 0
        : Math.round((t / (tickCount - 1)) * (allPowers.length - 1));
      var logVal = allPowers[sourceIndex];
      yTicks.push({ y: yCoord(logVal).toFixed(1), label: "10^" + logVal });
    }
    var yTicksHTML = yTicks.map(function(t) {
      return '<text x="' + (PL - 4) + '" y="' + t.y + '" text-anchor="end" dominant-baseline="middle" class="root-graph-label">' + t.label + '</text>' +
             '<line x1="' + PL + '" y1="' + t.y + '" x2="' + (PL + plotW) + '" y2="' + t.y + '" class="root-graph-grid"/>';
    }).join("");

    var xTicks = errorPoints.map(function(p, i) {
      if (errorPoints.length <= 10 || i % Math.ceil(errorPoints.length / 8) === 0 || i === errorPoints.length - 1) {
        return '<text x="' + xCoord(p.iteration).toFixed(1) + '" y="' + (H - PB + 14) + '" text-anchor="middle" class="root-graph-label">' + p.iteration + '</text>';
      }
      return "";
    }).join("");

    var circles = errorPoints.map(function(p) {
      var cx = xCoord(p.iteration).toFixed(1);
      var cy = yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1);
      return '<circle cx="' + cx + '" cy="' + cy + '" r="3" class="root-graph-dot" tabindex="0" data-i="' + p.iteration + '" data-x="' + C.formatReal(p.error, 8) + '"/>';
    }).join("");

    container.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="root-convergence-svg" role="img" aria-labelledby="root-error-plot-title root-error-plot-desc">' +
      '<title id="root-error-plot-title">Convergence rate</title>' +
      '<desc id="root-error-plot-desc">Log base 10 of the absolute error on each iteration.</desc>' +
      '<rect x="' + PL + '" y="' + PT + '" width="' + plotW + '" height="' + plotH + '" class="root-graph-bg"/>' +
      yTicksHTML +
      '<polyline points="' + points + '" class="root-graph-line"/>' +
      circles +
      xTicks +
      '<text x="' + (PL + plotW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="root-graph-label">Iteration</text>' +
      '<text x="' + (PL - 38) + '" y="' + (PT + plotH / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,' + (PL - 38) + ',' + (PT + plotH / 2) + ')" class="root-graph-label">log\u2081\u2080 |error|</text>' +
      '</svg>';

    // Wire tooltip
    var errSvg = container.querySelector("svg");
    if (errSvg) wireGraphTooltip(errSvg, container);
  }

  // ─── Convergence Rate Summary ───────────────────────────────────────────────
  function estimateConvergenceRate(rows) {
    const errs = rows.map(function(r) { return r.error; }).filter(function(e) { return e != null && e > 0; });
    if (errs.length < 3) return null;
    const e1 = errs[errs.length - 3];
    const e2 = errs[errs.length - 2];
    const e3 = errs[errs.length - 1];
    if (e1 < 1e-15 || e2 < 1e-15) return null;
    const p = Math.log(e3 / e2) / Math.log(e2 / e1);
    if (!Number.isFinite(p)) return null;
    let label;
    if (p < 1.2) label = "linear";
    else if (p < 1.8) label = "superlinear";
    else label = "quadratic";
    return { p: p.toFixed(2), label };
  }

  function renderConvergenceSummary(run) {
    const el = byId("root-rate-summary");
    if (!el) return;
    if (!run.rows.length) { el.textContent = "No iterations completed."; return; }
    const finalError = run.rows[run.rows.length - 1].error;
    const errorText = finalError != null ? C.formatReal(finalError, 8) : "—";
    const rate = estimateConvergenceRate(run.rows);
    const rateText = rate ? " Convergence order \u2248 " + rate.p + " (" + rate.label + ")." : "";
    el.textContent = run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") +
      " completed. Final |error| = " + errorText + "." + rateText;
  }

  // ─── Solution Steps ─────────────────────────────────────────────────────────
  function buildBisectionSteps(run) {
    const isFP = run.method === "falsePosition";
    const methodName = isFP ? "false position" : "bisection";
    const formula = isFP ? "c = b \u2212 f(b)(b\u2212a)/(f(b)\u2212f(a))" : "c = (a + b) / 2";
    const intervalText = "[" + (run.initial && run.initial.left ? fmtRunVal(run.initial.left.x, run, 12) : "unavailable") + ", " +
      (run.initial && run.initial.right ? fmtRunVal(run.initial.right.x, run, 12) : "unavailable") + "]";
    const basis = run.decisionBasis === "machine" ? "machine" : "exact";
    const prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
    const toleranceMode = run.stopping && run.stopping.kind === "epsilon" && !isFP
      ? (run.stopping.toleranceType === "absolute" ? "absolute" : "relative")
      : null;
    const toleranceSelection = toleranceMode
      ? "The selected " + toleranceMode + " tolerance was \u03B5 = " + run.stopping.input + "."
      : null;
    const steps = [
      "Start with f(x) = " + run.canonical + " on the interval " + intervalText + ".",
      "Check the endpoint signs using " + basis + " signs."
    ];
    if (run.summary.intervalStatus === "invalid-bracket") {
      steps.push("The same-sign endpoints do not prove that no root exists; they only show this interval does not bracket a root for the " + methodName + " method.");
      steps.push("Choose a new interval where f(a) and f(b) have opposite signs.");
    } else if (run.summary.intervalStatus === "invalid-continuity") {
      steps.push(formatContinuityDetail(run.summary.stopDetail));
    } else if (run.summary.intervalStatus === "root-at-a") {
      steps.push("The left endpoint is already a root, so the method stops before any " + (toleranceMode || "selected") + " tolerance test is needed. The root is x = " + fmtRunVal(run.summary.approximation, run, 18) + ".");
      if (toleranceSelection) {
        steps.push(toleranceSelection);
      }
    } else if (run.summary.intervalStatus === "root-at-b") {
      steps.push("The right endpoint is already a root, so the method stops before any " + (toleranceMode || "selected") + " tolerance test is needed. The root is x = " + fmtRunVal(run.summary.approximation, run, 18) + ".");
      if (toleranceSelection) {
        steps.push(toleranceSelection);
      }
    } else if (run.summary.intervalStatus === "root-at-midpoint") {
      const midpointStopText = run.summary.stopReason === "exact-zero"
        ? "The midpoint is an exact root"
        : "The midpoint has a zero or near-zero machine value";
      steps.push(midpointStopText + ", so the method stops before any " + (toleranceMode || "selected") + " tolerance test is needed. The approximation is x = " + fmtRunVal(run.summary.approximation, run, 18) + ".");
      if (toleranceSelection) {
        steps.push(toleranceSelection);
      }
    } else {
      steps.push("Endpoint signs are opposite — the interval brackets a root. Use " + formula + " and keep the bracketed subinterval with the sign change.");
      if (isFP) {
        if (run.stopping.kind === "epsilon") {
          const reached = run.summary.stopReason === "tolerance-reached";
          steps.push("For tolerance \u03B5 = " + run.stopping.input + ", stop when successive c values differ by less than \u03B5. This run used " + run.stopping.iterationsRequired + " iteration" + (run.stopping.iterationsRequired !== 1 ? "s" : "") + (reached ? " and reached the tolerance." : " without reaching the tolerance.") );
        } else {
          steps.push("For n = " + run.stopping.input + " iterations, the final |c\u2099 - c\u2099\u208B\u2081| is " + fmtErr(run.stopping.epsilonBound) + ".");
        }
      } else {
        if (run.stopping.kind === "epsilon") {
          if (run.stopping.toleranceType === "relative") {
            steps.push(
              "For relative tolerance \u03B5 = " + run.stopping.input +
              ", stop when the current bracket gives a relative error bound below \u03B5."
            );
          } else {
            steps.push(
              "For absolute tolerance \u03B5 = " + run.stopping.input +
              ", stop when the current Bisection bound is at or below \u03B5."
            );
          }
        } else {
          steps.push("For n = " + run.stopping.input + " iterations, the error bound is \u03B5 \u2264 " + C.formatReal(run.stopping.epsilonBound, 8) + ".");
        }
      }
      steps.push("The approximate root after the final step is " + fmtRunVal(run.summary.approximation, run, 18) + ".");
    }
    steps.push("Machine values use " + prec + ".");
    return steps;
  }

  function openMethodLimitText(run, noun) {
    const reason = run.summary && run.summary.stopReason;
    if (reason !== "iteration-cap" && reason !== "iteration-limit") return null;
    return "The method stopped without verifying convergence; the last iterate is " + noun + " \u2248 " + fmtRunVal(run.summary.approximation, run, 18) + ".";
  }

  function buildNewtonSteps(run) {
    const prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
    return [
      "Apply Newton\u2013Raphson to f(x) = " + run.canonical + " with f\u2032(x) = " + run.dfCanonical + ".",
      "The iteration formula is x\u2099\u208A\u2081 = x\u2099 \u2212 f(x\u2099) / f\u2032(x\u2099).",
      run.stopping.kind === "epsilon"
        ? "Stop when |x\u2099\u208A\u2081 \u2212 x\u2099| < \u03B5 = " + run.stopping.input + "."
        : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.stopReason === "derivative-zero"
        ? "The method stopped early because f\u2032(x\u2099) \u2248 0."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(x\u2099) was near zero and the Newton step was stable."
          : openMethodLimitText(run, "x") || "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtRunVal(run.summary.approximation, run, 18) + ".",
      "Machine values use " + prec + "."
    ];
  }

  function buildSecantSteps(run) {
    const prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
    return [
      "Apply the secant method to f(x) = " + run.canonical + ".",
      "The iteration formula is x\u2099\u208A\u2081 = x\u2099 \u2212 f(x\u2099)(x\u2099 \u2212 x\u2099\u208B\u2081) / (f(x\u2099) \u2212 f(x\u2099\u208B\u2081)).",
      run.stopping.kind === "epsilon"
        ? "Stop when |x\u2099\u208A\u2081 \u2212 x\u2099| < \u03B5 = " + run.stopping.input + "."
        : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.stopReason === "stagnation"
        ? "The method stopped because f(x\u2099) and f(x\u2099\u208B\u2081) made the secant denominator zero or near zero."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(x\u2099) was zero or below the numerical threshold."
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtRunVal(run.summary.approximation, run, 18) + ".",
      "Machine values use " + prec + "."
    ];
  }

  function buildFixedPointSteps(run) {
    const prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
    return [
      "Apply fixed-point iteration with g(x) = " + run.canonical + ".",
      "The iteration formula is x\u2099\u208A\u2081 = g(x\u2099). Convergence requires |g\u2032(x)| < 1 near the fixed point.",
      run.stopping.kind === "epsilon"
        ? "Stop when |x\u2099\u208A\u2081 \u2212 x\u2099| < \u03B5 = " + run.stopping.input + "."
        : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.stopReason === "diverged"
        ? "The iteration diverged (|x| exceeded 10\u2078). Try a different g(x) or starting point."
        : run.summary.stopReason === "iteration-cap"
          ? "The iteration reached the safety cap before verifying convergence. Try a different g(x), starting point, or tolerance."
          : run.summary.stopReason === "exact-zero"
            ? "The method stopped because g(x\u2099) equals x\u2099 exactly."
            : openMethodLimitText(run, "x") || "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtRunVal(run.summary.approximation, run, 18) + ".",
      "Machine values use " + prec + "."
    ];
  }

  function renderSolutionSteps(run) {
    const list = byId("root-solution-steps");
    if (!list) return;
    list.innerHTML = "";
    const builders = { bisection: buildBisectionSteps, falsePosition: buildBisectionSteps, newton: buildNewtonSteps, secant: buildSecantSteps, fixedPoint: buildFixedPointSteps };
    const build = builders[run.method] || function() { return []; };
    const steps = build(run);
    for (const step of steps) {
      const li = document.createElement("li");
      li.textContent = step;
      list.appendChild(li);
    }
    setContent("root-copy-status", "");
  }

  // ─── Iteration Table ────────────────────────────────────────────────────────
  function buildBracketRow(row, run, tr) {
    const sd = run.signDisplay || "both";
    const signText = "a: " + formatSignPair(sd, row.exactSigns.a, row.machineSigns.a) +
      ", b: " + formatSignPair(sd, row.exactSigns.b, row.machineSigns.b) +
      ", c: " + formatSignPair(sd, row.exactSigns.c, row.machineSigns.c);
    const values = [
      row.iteration,
      fmtRunVal(row.a, run, 12), fmtRunVal(row.b, run, 12), fmtRunVal(row.c, run, 12),
      formatBracketValue(row.fa, sd, run), formatBracketValue(row.fb, sd, run), formatBracketValue(row.fc, sd, run),
      signText,
      row.decision === "left" ? "Keep [a, c]" : "Keep [c, b]",
      C.formatReal(row.width, 8),
      row.bound == null ? "\u2014" : C.formatReal(row.bound, 8),
      fmtErr(row.error),
      row.note || ""
    ];
    const headers = TABLE_CONFIGS[run.method].headers;
    for (let i = 0; i < values.length; i += 1) {
      const td = document.createElement("td");
      td.textContent = String(values[i]);
      td.setAttribute("data-label", headers[i] || "");
      tr.appendChild(td);
    }
  }

  function buildNewtonRow(row, run, tr) {
    const headers = TABLE_CONFIGS.newton.headers;
    const values = [
      row.iteration, fmtRunVal(row.xn, run, 12), fmtRunVal(row.fxn, run, 12),
      fmtRunVal(row.dfxn, run, 12), row.xNext != null ? fmtRunVal(row.xNext, run, 12) : "—",
      fmtErr(row.error), row.note || ""
    ];
    for (let i = 0; i < values.length; i += 1) {
      const td = document.createElement("td");
      td.textContent = String(values[i]);
      td.setAttribute("data-label", headers[i] || "");
      tr.appendChild(td);
    }
  }

  function buildSecantRow(row, run, tr) {
    const headers = TABLE_CONFIGS.secant.headers;
    const values = [
      row.iteration, fmtRunVal(row.xPrev, run, 12), fmtRunVal(row.xn, run, 12),
      fmtRunVal(row.fxPrev, run, 12), fmtRunVal(row.fxn, run, 12),
      row.xNext != null ? fmtRunVal(row.xNext, run, 12) : "—",
      fmtErr(row.error), row.note || ""
    ];
    for (let i = 0; i < values.length; i += 1) {
      const td = document.createElement("td");
      td.textContent = String(values[i]);
      td.setAttribute("data-label", headers[i] || "");
      tr.appendChild(td);
    }
  }

  function buildFixedPointRow(row, run, tr) {
    const headers = TABLE_CONFIGS.fixedPoint.headers;
    const values = [row.iteration, fmtRunVal(row.xn, run, 12), fmtRunVal(row.gxn, run, 12), fmtErr(row.error), row.note || ""];
    for (let i = 0; i < values.length; i += 1) {
      const td = document.createElement("td");
      td.textContent = String(values[i]);
      td.setAttribute("data-label", headers[i] || "");
      tr.appendChild(td);
    }
  }

  const ROW_BUILDERS = {
    bisection: buildBracketRow,
    falsePosition: buildBracketRow,
    newton: buildNewtonRow,
    secant: buildSecantRow,
    fixedPoint: buildFixedPointRow
  };

  function renderTable(run) {
    const cfg = TABLE_CONFIGS[run.method];
    const thead = byId("root-iteration-thead");
    const body = byId("root-iteration-body");
    if (!thead || !body) return;

    // Update headers
    thead.innerHTML = "<tr>" + cfg.headers.map(function(h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";

    body.innerHTML = "";
    if (!run.rows.length) {
      const emptyRow = document.createElement("tr");
      emptyRow.className = "empty-row";
      const td = document.createElement("td");
      td.colSpan = cfg.colSpan;
      td.textContent = "No iteration steps yet.";
      emptyRow.appendChild(td);
      body.appendChild(emptyRow);
      return;
    }

    const builder = ROW_BUILDERS[run.method];
    const frag = document.createDocumentFragment();
    for (const row of run.rows) {
      const tr = document.createElement("tr");
      builder(row, run, tr);
      frag.appendChild(tr);
    }
    body.appendChild(frag);
  }

  // ─── Copy Solution ──────────────────────────────────────────────────────────
  function copyRootSolution() {
    const run = state.runs[state.activeMethod];
    if (!run) {
      setContent("root-copy-status", "Run the method first, then copy the solution.");
      return;
    }
    const steps = buildSolutionText(run);
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setContent("root-copy-status", "Clipboard not available. Select and copy the steps manually.");
      return;
    }
    navigator.clipboard.writeText(steps)
      .then(function() { setContent("root-copy-status", "Solution copied."); })
      .catch(function() { setContent("root-copy-status", "Copy failed. Select the steps and copy manually."); });
  }

  function buildSolutionText(run) {
    const builders = { bisection: buildBisectionSteps, falsePosition: buildBisectionSteps, newton: buildNewtonSteps, secant: buildSecantSteps, fixedPoint: buildFixedPointSteps };
    const build = builders[run.method] || function() { return []; };
    return build(run).map(function(step, i) { return (i + 1) + ". " + step; }).join("\n");
  }

  // ─── Reset ─────────────────────────────────────────────────────────────────
  function resetResults() {
    setHidden("root-empty", false);
    setHidden("root-result-stage", true);
    const thead = byId("root-iteration-thead");
    const body = byId("root-iteration-body");
    if (thead) thead.innerHTML = "";
    if (body) {
      body.innerHTML = "<tr class='empty-row'><td colspan='13'>No steps yet.</td></tr>";
    }
    const list = byId("root-solution-steps");
    if (list) list.innerHTML = "<li>Run the method to see steps.</li>";
    const graphEl = byId("root-convergence-graph");
    if (graphEl) graphEl.innerHTML = "";
    const rateEl = byId("root-rate-summary");
    if (rateEl) rateEl.textContent = "";
    const diagnosticsEl = byId("root-diagnostics");
    if (diagnosticsEl) {
      diagnosticsEl.innerHTML = "";
      diagnosticsEl.hidden = true;
    }
    setContent("root-copy-status", "");
    clearStatus("root-status-msg");
    ["root-approx", "root-stopping-result", "root-convergence", "root-interval-status", "root-sign-summary", "root-decision-summary"].forEach(function(id) {
      const el = byId(id);
      if (el) el.textContent = EMPTY_VALUE;
    });
  }

  // ─── Tab Switching ─────────────────────────────────────────────────────────
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

    // Show/hide bracket-only controls
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
  }

  // ─── Bisection sign display re-render ──────────────────────────────────────
  function handleBisSignDisplayChange() {
    const run = state.runs["bisection"];
    if (run) { run.signDisplay = byId("root-bis-sign-display").value; renderRun(run); }
  }
  function handleFPSignDisplayChange() {
    const run = state.runs["falsePosition"];
    if (run) { run.signDisplay = byId("root-fp-sign-display").value; renderRun(run); }
  }

  function syncBisectionToleranceControls() {
    const epsilonMode = byId("root-bis-stop-kind").value === "epsilon";
    setHidden("root-bis-tolerance-type-wrap", !epsilonMode);
    setHidden("root-bis-tolerance-note", !epsilonMode);
  }

  function isPresentationOnlyRootControl(target) {
    return !!target && (
      target.id === "root-bis-sign-display" ||
      target.id === "root-fp-sign-display"
    );
  }

  // ─── Event wiring ──────────────────────────────────────────────────────────
  function wireEvents() {
    // Method tab buttons
    document.querySelectorAll("[data-method]").forEach(function(btn) {
      if (btn.closest("#tab-root")) {
        btn.addEventListener("click", function() { activateMethod(btn.dataset.method); });
      }
    });

    // Compute buttons
    ["root-bis-compute", "root-newton-compute", "root-secant-compute", "root-fp-compute", "root-fpi-compute"].forEach(function(id) {
      const btn = byId(id);
      if (btn) btn.addEventListener("click", runCompute);
    });

    // Copy solution
    const copyBtn = byId("root-copy-solution");
    if (copyBtn) copyBtn.addEventListener("click", copyRootSolution);

    // Sign display reactive re-render
    const bisSD = byId("root-bis-sign-display");
    if (bisSD) bisSD.addEventListener("change", handleBisSignDisplayChange);
    const fpSD = byId("root-fp-sign-display");
    if (fpSD) fpSD.addEventListener("change", handleFPSignDisplayChange);
    const bisStopKind = byId("root-bis-stop-kind");
    if (bisStopKind) {
      bisStopKind.addEventListener("change", syncBisectionToleranceControls);
    }

    // Debounced resets — use event delegation on the root tab panel
    const rootPanel = byId("tab-root");
    if (rootPanel) {
      const debouncedReset = h.debounce(function() {
        const cfg = METHOD_CONFIGS.find(function(c) { return c.name === state.activeMethod; });
        if (cfg) clearInvalid(cfg.fieldIds, "root-error-msg");
        showError("root-error-msg", "");
        state.runs[state.activeMethod] = null;
        resetResults();
        syncBisectionToleranceControls();
        if (h.syncMathPreviews) h.syncMathPreviews();
      }, DEBOUNCE_MS);
      rootPanel.addEventListener("input", function(e) {
        if (e.target.matches("input, select") && !isPresentationOnlyRootControl(e.target)) debouncedReset();
      });
      rootPanel.addEventListener("change", function(e) {
        if (e.target.matches("select") && !isPresentationOnlyRootControl(e.target)) {
          debouncedReset();
        }
      });
    }

    // Enter key on text inputs triggers compute
    const rootTabEl = byId("tab-root");
    if (rootTabEl) {
      rootTabEl.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && e.target.matches("input[type='text'], input[type='number']")) {
          e.preventDefault();
          runCompute();
        }
      });
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  function init(appHelpers) {
    h = appHelpers;
    wireEvents();
    syncBisectionToleranceControls();
    activateMethod("bisection");
  }

  function recompute() {
    const run = state.runs[state.activeMethod];
    if (run) {
      try {
        const freshRun = COMPUTE_FNS[state.activeMethod]();
        state.runs[state.activeMethod] = freshRun;
        renderRun(freshRun);
      } catch (e) { /* stale inputs — ignore */ }
    }
  }

  globalScope.RootUI = { init, recompute };
})(window);
