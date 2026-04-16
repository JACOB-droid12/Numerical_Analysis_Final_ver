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
      const approxText = run.summary.approximation != null ? fmtVal(run.summary.approximation, 14) : "N/A";
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

  function formatBracketValue(point, signDisplay) {
    if (!point) return "—";
    if (signDisplay === "exact") return fmtVal(point.reference, 12);
    if (signDisplay === "machine") return fmtVal(point.machine, 12);
    return "E: " + fmtVal(point.reference, 10) + " / M: " + fmtVal(point.machine, 10);
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

  function formatStopReason(reason) {
    const map = {
      "iteration-limit": "Completed the requested iterations",
      "iteration-cap": "Stopped at the safety iteration cap",
      "tolerance-reached": "Reached the requested tolerance",
      "tolerance-already-met": "Initial interval already satisfies the tolerance",
      "endpoint-root": "An endpoint is already a root",
      "exact-zero": "Reference value is exactly zero",
      "machine-zero": "Machine value is zero or near zero",
      "invalid-starting-interval": "Not a valid bisection bracket",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "derivative-zero": "Derivative is zero — method cannot continue",
      "stagnation": "Method stalled (denominator \u2248 0)",
      "diverged": "Iteration diverged (|x| exceeds 10\u2078)"
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
      if (run.stopping.capReached) {
        return "\u03B5 = " + run.stopping.input + ", stopped after " + run.stopping.maxIterations + " attempts without reaching tolerance" + iterationNote;
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
      : fmtVal(run.summary.approximation, 18);
    setContent("root-approx", approxText);
    setContent("root-stopping-result", formatStopReason(run.summary.stopReason));

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

    // Convergence graph
    renderConvergenceGraph(run);

    // Convergence rate summary
    renderConvergenceSummary(run);

    // Solution steps
    renderSolutionSteps(run);

    // Table
    renderTable(run);
  }

  // ─── Convergence Graph ─────────────────────────────────────────────────────
  function renderConvergenceGraph(run) {
    const container = byId("root-convergence-graph");
    if (!container) return;

    const errorPoints = run.rows
      .map(function(r) { return { iteration: r.iteration, error: r.error }; })
      .filter(function(p) { return p.error != null && p.error > 0; });
    if (errorPoints.length < 2) {
      container.innerHTML = "<p class='focus-note root-graph-empty'>Not enough iterations to plot convergence.</p>";
      return;
    }

    const W = 480, H = 200, PL = 52, PR = 16, PT = 16, PB = 36;
    const plotW = W - PL - PR;
    const plotH = H - PT - PB;

    const logErrors = errorPoints.map(function(p) { return Math.log10(Math.max(p.error, 1e-15)); });
    const minLog = Math.floor(Math.min.apply(null, logErrors)) - 0.5;
    const maxLog = Math.ceil(Math.max.apply(null, logErrors)) + 0.5;
    const logRange = maxLog - minLog || 1;
    const minIteration = Math.min.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    const maxIteration = Math.max.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    const iterationRange = maxIteration - minIteration || 1;

    function xCoord(iteration) { return PL + ((iteration - minIteration) / iterationRange) * plotW; }
    function yCoord(v) { return PT + plotH - ((v - minLog) / logRange) * plotH; }

    const points = errorPoints.map(function(p) {
      return xCoord(p.iteration).toFixed(1) + "," + yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1);
    }).join(" ");

    // Y-axis ticks use integer powers so labels match their gridlines.
    const firstPower = Math.ceil(minLog);
    const lastPower = Math.floor(maxLog);
    const allPowers = [];
    for (let power = firstPower; power <= lastPower; power += 1) {
      allPowers.push(power);
    }
    const tickCount = Math.min(5, allPowers.length);
    const yTicks = [];
    for (let t = 0; t < tickCount; t += 1) {
      const sourceIndex = tickCount === 1
        ? 0
        : Math.round((t / (tickCount - 1)) * (allPowers.length - 1));
      const logVal = allPowers[sourceIndex];
      yTicks.push({ y: yCoord(logVal).toFixed(1), label: "10^" + logVal });
    }
    const yTicksHTML = yTicks.map(function(t) {
      return '<text x="' + (PL - 4) + '" y="' + t.y + '" text-anchor="end" dominant-baseline="middle" class="root-graph-label">' + t.label + '</text>' +
             '<line x1="' + PL + '" y1="' + t.y + '" x2="' + (PL + plotW) + '" y2="' + t.y + '" class="root-graph-grid"/>';
    }).join("");

    const xTicks = errorPoints.map(function(p, i) {
      if (errorPoints.length <= 10 || i % Math.ceil(errorPoints.length / 8) === 0 || i === errorPoints.length - 1) {
        return '<text x="' + xCoord(p.iteration).toFixed(1) + '" y="' + (H - PB + 14) + '" text-anchor="middle" class="root-graph-label">' + p.iteration + '</text>';
      }
      return "";
    }).join("");

    const circles = errorPoints.map(function(p) {
      return '<circle cx="' + xCoord(p.iteration).toFixed(1) + '" cy="' + yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1) + '" r="3" class="root-graph-dot"/>';
    }).join("");

    container.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="root-convergence-svg" aria-label="Convergence graph: error vs iteration">' +
      '<rect x="' + PL + '" y="' + PT + '" width="' + plotW + '" height="' + plotH + '" class="root-graph-bg"/>' +
      yTicksHTML +
      '<polyline points="' + points + '" class="root-graph-line"/>' +
      circles +
      xTicks +
      '<text x="' + (PL + plotW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="root-graph-label">Iteration</text>' +
      '<text x="' + (PL - 38) + '" y="' + (PT + plotH / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,' + (PL - 38) + ',' + (PT + plotH / 2) + ')" class="root-graph-label">log\u2081\u2080 |error|</text>' +
      '</svg>';
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
    const intervalText = "[" + (run.initial && run.initial.left ? fmtVal(run.initial.left.x, 12) : "unavailable") + ", " +
      (run.initial && run.initial.right ? fmtVal(run.initial.right.x, 12) : "unavailable") + "]";
    const basis = run.decisionBasis === "machine" ? "machine" : "exact";
    const prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
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
      steps.push("The left endpoint is already a root. The root is x = " + fmtVal(run.summary.approximation, 18) + ".");
    } else if (run.summary.intervalStatus === "root-at-b") {
      steps.push("The right endpoint is already a root. The root is x = " + fmtVal(run.summary.approximation, 18) + ".");
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
        steps.push(run.stopping.kind === "epsilon"
          ? "For tolerance \u03B5 = " + run.stopping.input + ", the required iterations is n = " + run.stopping.iterationsRequired + "."
          : "For n = " + run.stopping.input + " iterations, the error bound is \u03B5 \u2264 " + C.formatReal(run.stopping.epsilonBound, 8) + ".");
      }
      steps.push("The approximate root after the final step is " + fmtVal(run.summary.approximation, 18) + ".");
    }
    steps.push("Machine values use " + prec + ".");
    return steps;
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
          ? "The method stopped because the machine-computed f(x\u2099) was zero or below the numerical threshold."
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
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
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
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
          ? "The iteration reached the safety cap before satisfying the tolerance. Try a different g(x), starting point, or tolerance."
          : "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
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
      fmtVal(row.a, 12), fmtVal(row.b, 12), fmtVal(row.c, 12),
      formatBracketValue(row.fa, sd), formatBracketValue(row.fb, sd), formatBracketValue(row.fc, sd),
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
      row.iteration, fmtVal(row.xn, 12), fmtVal(row.fxn, 12),
      fmtVal(row.dfxn, 12), row.xNext != null ? fmtVal(row.xNext, 12) : "—",
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
      row.iteration, fmtVal(row.xPrev, 12), fmtVal(row.xn, 12),
      fmtVal(row.fxPrev, 12), fmtVal(row.fxn, 12),
      row.xNext != null ? fmtVal(row.xNext, 12) : "—",
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
    const values = [row.iteration, fmtVal(row.xn, 12), fmtVal(row.gxn, 12), fmtErr(row.error), row.note || ""];
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
