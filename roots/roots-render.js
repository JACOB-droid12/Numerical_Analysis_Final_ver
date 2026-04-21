"use strict";

(function initRootsRender(globalScope) {
  const C = globalScope.CalcEngine;
  const EMPTY = "Not calculated yet";

  const TABLE_CONFIGS = {
    bisection: { headers: ["i", "a", "b", "c", "f(a)", "f(b)", "f(c)", "Signs", "Decision", "Width", "Bound", "Error", "Note"], colSpan: 13 },
    falsePosition: { headers: ["i", "a", "b", "c", "f(a)", "f(b)", "f(c)", "Signs", "Decision", "Width", "Target epsilon", "Error", "Note"], colSpan: 13 },
    newton: { headers: ["i", "xn", "f(xn)", "f'(xn)", "x next", "Error", "Note"], colSpan: 7 },
    secant: { headers: ["i", "x prev", "xn", "f(x prev)", "f(xn)", "x next", "Error", "Note"], colSpan: 8 },
    fixedPoint: { headers: ["i", "xn", "g(xn)", "Error", "Note"], colSpan: 5 }
  };

  const METHOD_INFO = {
    bisection: {
      label: "Bisection",
      summary: "Use an interval where f(a) and f(b) have opposite signs.",
      details: "Best for quiz problems that provide a bracket or ask for guaranteed interval shrinking."
    },
    falsePosition: {
      label: "False Position",
      summary: "Use a bracket, then estimate the crossing with a secant line.",
      details: "Often moves faster than bisection, but one endpoint can stay fixed for many steps."
    },
    newton: {
      label: "Newton-Raphson",
      summary: "Use one starting value and the derivative to jump toward the root.",
      details: "Fast near a good starting point, but sensitive to zero derivatives and unstable steps."
    },
    secant: {
      label: "Secant",
      summary: "Use two starting values to estimate the slope without a derivative.",
      details: "Useful when f'(x) is unavailable, but repeated function values can stall the method."
    },
    fixedPoint: {
      label: "Fixed Point",
      summary: "Enter g(x), then iterate x next = g(x).",
      details: "Works when the iteration settles near a fixed point; cycles and divergence mean the form or start should change."
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value == null || value === "" ? EMPTY : String(value);
  }

  function setOptionalText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  function setHidden(id, hidden) {
    const el = byId(id);
    if (el) el.hidden = !!hidden;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function realNumber(value) {
    if (value == null) return null;
    try {
      return C.requireRealNumber(value, "value");
    } catch (err) {
      return null;
    }
  }

  function fmtVal(value, digits) {
    const n = realNumber(value);
    if (n == null || !Number.isFinite(n)) return "-";
    return C.formatReal(n, digits || 12);
  }

  function fmtErr(value) {
    return value == null || !Number.isFinite(Number(value)) ? "-" : C.formatReal(Number(value), 8);
  }

  function fmtPoint(point, signDisplay, run) {
    if (!point) return "-";
    if (signDisplay === "exact") return fmtVal(point.reference, 12);
    if (signDisplay === "machine") return fmtVal(point.machine, 12);
    return "E: " + fmtVal(point.reference, 10) + " / M: " + fmtVal(point.machine, 10);
  }

  function formatSign(sign) {
    if (sign === 0) return "0";
    return sign < 0 ? "-" : "+";
  }

  function formatSignPair(signDisplay, exactSign, machineSign) {
    if (signDisplay === "exact") return "E(" + formatSign(exactSign) + ")";
    if (signDisplay === "machine") return "M(" + formatSign(machineSign) + ")";
    return "E(" + formatSign(exactSign) + ") / M(" + formatSign(machineSign) + ")";
  }

  function formatIntervalStatus(status) {
    const map = {
      "valid-bracket": "Valid bracket",
      "invalid-bracket": "Not a valid starting bracket",
      "invalid-continuity": "Continuity requirement failed",
      "root-at-a": "Root found at left endpoint a",
      "root-at-b": "Root found at right endpoint b",
      "root-at-midpoint": "Root found at midpoint"
    };
    return map[status] || status || EMPTY;
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
      "invalid-starting-interval": "Not a valid starting bracket",
      "invalid-input": "Input was rejected",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "singularity-encountered": "Evaluator raised an error inside the iteration",
      "non-finite-evaluation": "Evaluator produced a non-finite value",
      "derivative-zero": "Derivative is zero; method cannot continue",
      "stagnation": "Method stalled because the denominator is near zero",
      "diverged": "Iteration diverged",
      "diverged-step": "Step grew too quickly",
      "step-small-residual-large": "Step is small but residual remains large",
      "retained-endpoint-stagnation": "Same endpoint retained too long",
      "cycle-detected": "Iteration entered a cycle"
    };
    return map[reason] || reason || EMPTY;
  }

  function formatStoppingDetails(run) {
    const stopping = run && run.stopping;
    if (!stopping) return EMPTY;
    const planned = stopping.plannedIterations;
    const actual = stopping.actualIterations;
    const iterationNote = Number.isFinite(planned) && Number.isFinite(actual) && planned !== actual
      ? " (planned iterations = " + planned + ", actual iterations = " + actual + ")"
      : "";

    if (stopping.kind === "epsilon") {
      if (run.method === "bisection") {
        const label = stopping.toleranceType === "absolute" ? "Absolute tolerance" : "Relative tolerance";
        return label + " epsilon = " + stopping.input + iterationNote;
      }
      if (stopping.capReached) {
        return "epsilon = " + stopping.input + ", stopped after " + stopping.maxIterations + " attempts" + iterationNote;
      }
      return "epsilon = " + stopping.input + ", iterations tried = " + (stopping.iterationsRequired || 0) + iterationNote;
    }

    if (run.method === "bisection") {
      return "n = " + stopping.input + ", epsilon <= " + fmtErr(stopping.epsilonBound) + iterationNote;
    }
    return "n = " + stopping.input + ", final |error| = " + fmtErr(stopping.epsilonBound) + iterationNote;
  }

  function methodLabel(method) {
    return (METHOD_INFO[method] && METHOD_INFO[method].label) || method || EMPTY;
  }

  function finalMetric(run) {
    const summary = run && run.summary ? run.summary : {};
    if (run && run.method === "bisection" && run.stopping && run.stopping.epsilonBound != null) {
      return "epsilon <= " + fmtErr(run.stopping.epsilonBound);
    }
    if (summary.bound != null) return "Bound = " + fmtErr(summary.bound);
    if (summary.error != null) return "Final |error| = " + fmtErr(summary.error);
    if (summary.residual != null) return "Residual = " + fmtVal(summary.residual, 12);
    if (run && run.stopping && run.stopping.epsilonBound != null) {
      return "Final |error| = " + fmtErr(run.stopping.epsilonBound);
    }
    return "No final metric available.";
  }

  function interpretationText(run) {
    const summary = run && run.summary ? run.summary : {};
    const reason = summary.stopReason;
    const method = run && run.method;
    if (summary.intervalStatus === "invalid-bracket" || reason === "invalid-starting-interval") {
      return "The endpoints do not bracket a sign change, so this bracket method cannot start safely.";
    }
    if (reason === "iteration-limit") {
      return "The requested iterations completed. Use this root when the quiz asks for this fixed n.";
    }
    if (reason === "tolerance-reached") {
      return "The method reached the requested tolerance, so the last approximation satisfies your stopping rule.";
    }
    if (reason === "tolerance-already-met") {
      return "The starting interval already satisfies the requested tolerance.";
    }
    if (reason === "endpoint-root") {
      return "One endpoint is already a root, so no iteration is needed.";
    }
    if (reason === "exact-zero" || reason === "machine-zero") {
      return method === "fixedPoint"
        ? "The iteration landed on a fixed point under the current precision rule."
        : "The function value is zero or machine-zero at the reported approximation.";
    }
    if (reason === "derivative-zero") {
      return "Newton-Raphson cannot continue because the derivative is zero or too small at the current point.";
    }
    if (reason === "stagnation") {
      return "The update stalled because the denominator became too small.";
    }
    if (reason === "retained-endpoint-stagnation") {
      return "False Position kept the same endpoint too long, so the run stopped before claiming convergence.";
    }
    if (reason === "diverged" || reason === "diverged-step") {
      return "The iterates moved away from a stable answer instead of settling toward a root.";
    }
    if (reason === "cycle-detected") {
      return "The fixed-point iteration repeated a cycle instead of settling to one value.";
    }
    if (reason === "iteration-cap") {
      return "The safety cap was reached before the requested tolerance was satisfied.";
    }
    if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
      return "The evaluator hit an undefined or non-finite value during the run.";
    }
    if (reason === "invalid-input") {
      return "The run could not start because one or more inputs were rejected.";
    }
    return "The run completed with the displayed stopping result.";
  }

  function nextActionText(run) {
    const summary = run && run.summary ? run.summary : {};
    const reason = summary.stopReason;
    if (summary.intervalStatus === "invalid-bracket" || reason === "invalid-starting-interval") {
      return "Choose endpoints where f(a) and f(b) have opposite signs.";
    }
    if (reason === "iteration-limit") {
      return "Need a tighter answer? Increase n or switch to tolerance mode.";
    }
    if (reason === "tolerance-reached" || reason === "exact-zero" || reason === "machine-zero" || reason === "endpoint-root") {
      return "Copy the answer or inspect the table if your solution needs shown work.";
    }
    if (reason === "derivative-zero") {
      return "Change the starting point or check that f'(x) was entered correctly.";
    }
    if (reason === "stagnation") {
      return "Use different starting guesses or switch to a bracket method.";
    }
    if (reason === "retained-endpoint-stagnation") {
      return "Try Bisection for guaranteed interval shrinkage or choose a better bracket.";
    }
    if (reason === "diverged" || reason === "diverged-step") {
      return "Choose a closer starting point or use a bracket method when an interval is known.";
    }
    if (reason === "cycle-detected") {
      return "Try a different g(x) form or a different starting value.";
    }
    if (reason === "iteration-cap") {
      return "Increase the cap only if the table shows the error is improving.";
    }
    if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
      return "Move the interval or starting value away from undefined points.";
    }
    if (reason === "invalid-input") {
      return "Check the expression, machine precision, and stopping value.";
    }
    return "Review the diagnostics and table before trusting the approximation.";
  }

  function collectDiagnostics(run) {
    const out = [];
    (run.warnings || []).forEach(function addWarning(warning) {
      out.push({ title: warning.code || "Warning", message: warning.message || "", level: "warning" });
    });
    const summary = run.summary || {};
    if (summary.stopDetail) {
      out.push({ title: "Stop detail", message: summary.stopDetail, level: "warning" });
    }
    if (summary.residual != null) {
      out.push({ title: "Residual", message: "Final residual (" + (summary.residualBasis || "machine") + ") = " + fmtVal(summary.residual, 12), level: "info" });
    }
    if (summary.error != null) {
      out.push({ title: "Final error", message: "|error| = " + fmtErr(summary.error), level: "info" });
    }
    if (summary.bound != null) {
      out.push({ title: "Bound", message: "Bound = " + fmtErr(summary.bound), level: "info" });
    }
    if (summary.cyclePeriod != null) {
      out.push({ title: "Cycle detected", message: "Cycle period = " + summary.cyclePeriod, level: "warning" });
    }
    return out;
  }

  function renderDiagnostics(run) {
    const container = byId("root-diagnostics");
    if (!container) return;
    const diagnostics = collectDiagnostics(run);
    container.innerHTML = diagnostics.map(function renderDiagnostic(item) {
      const klass = item.level === "warning" ? "root-diagnostic root-diagnostic-warning" : "root-diagnostic";
      return "<div class=\"" + klass + "\"><strong>" + escapeHtml(item.title) + "</strong><div>" + escapeHtml(item.message) + "</div></div>";
    }).join("");
    container.hidden = diagnostics.length === 0;
  }

  function renderBracketPanel(run) {
    const isBracket = run.method === "bisection" || run.method === "falsePosition";
    setHidden("root-bracket-panel", !isBracket);
    if (!isBracket) return;

    setText("root-interval-status", formatIntervalStatus(run.summary && run.summary.intervalStatus));
    const sd = run.signDisplay || "both";
    if (run.initial && run.initial.left && run.initial.right) {
      const leftSummary = formatSignPair(sd, run.initial.left.exactSign, run.initial.left.machineSign);
      const rightSummary = formatSignPair(sd, run.initial.right.exactSign, run.initial.right.machineSign);
      setText("root-sign-summary", "f(a): " + leftSummary + ", f(b): " + rightSummary + (run.initial.note ? ". " + run.initial.note : ""));
    } else {
      setText("root-sign-summary", "Endpoint values unavailable.");
    }
    setText("root-decision-summary", run.decisionBasis === "exact" ? "Exact signs decide the interval" : "Machine signs decide the interval");
  }

  function graphValueForRow(row, method) {
    if (method === "bisection" || method === "falsePosition") return realNumber(row.c);
    if (method === "newton" || method === "secant") return realNumber(row.xNext != null ? row.xNext : row.xn);
    if (method === "fixedPoint") return realNumber(row.gxn != null ? row.gxn : row.xn);
    return null;
  }

  function renderGraph(run) {
    const container = byId("root-convergence-graph");
    if (!container) return;
    const points = (run.rows || []).map(function mapRow(row) {
      return { iteration: row.iteration, x: graphValueForRow(row, run.method), error: row.error };
    }).filter(function hasValue(point) {
      return Number.isFinite(point.x);
    });
    if (!points.length) {
      container.innerHTML = "<p class=\"root-graph-empty\">No iteration data for graph.</p>";
      return;
    }

    const width = 560;
    const height = 180;
    const left = 42;
    const top = 18;
    const plotW = 490;
    const plotH = 120;
    const minX = Math.min.apply(null, points.map(function getX(point) { return point.x; }));
    const maxX = Math.max.apply(null, points.map(function getX(point) { return point.x; }));
    const span = Math.max(maxX - minX, 1e-12);
    const xCoord = function xCoord(index) {
      return points.length === 1 ? left + plotW / 2 : left + (index / (points.length - 1)) * plotW;
    };
    const yCoord = function yCoord(point) {
      return top + plotH - ((point.x - minX) / span) * plotH;
    };
    const polyline = points.map(function pointPair(point, index) {
      return xCoord(index).toFixed(1) + "," + yCoord(point).toFixed(1);
    }).join(" ");
    const dots = points.map(function dot(point, index) {
      return "<circle cx=\"" + xCoord(index).toFixed(1) + "\" cy=\"" + yCoord(point).toFixed(1) + "\" r=\"3\" class=\"root-graph-dot\"><title>i=" + escapeHtml(point.iteration) + ", x=" + escapeHtml(fmtVal(point.x, 12)) + "</title></circle>";
    }).join("");
    const labels = points.map(function label(point, index) {
      return "<text x=\"" + xCoord(index).toFixed(1) + "\" y=\"156\" text-anchor=\"middle\" class=\"root-graph-label\">" + escapeHtml(point.iteration) + "</text>";
    }).join("");

    container.innerHTML =
      "<h4>Iterate path</h4>" +
      "<svg viewBox=\"0 0 " + width + " " + height + "\" class=\"root-convergence-svg\" role=\"img\" aria-label=\"Iterate values by iteration\">" +
      "<rect x=\"" + left + "\" y=\"" + top + "\" width=\"" + plotW + "\" height=\"" + plotH + "\" class=\"root-graph-bg\"/>" +
      "<line x1=\"" + left + "\" y1=\"" + (top + plotH) + "\" x2=\"" + (left + plotW) + "\" y2=\"" + (top + plotH) + "\" class=\"root-graph-axis\"/>" +
      "<line x1=\"" + left + "\" y1=\"" + top + "\" x2=\"" + left + "\" y2=\"" + (top + plotH) + "\" class=\"root-graph-axis\"/>" +
      "<polyline points=\"" + polyline + "\" class=\"root-graph-line\"/>" +
      dots + labels +
      "<text x=\"" + (left + plotW / 2) + "\" y=\"176\" text-anchor=\"middle\" class=\"root-graph-label\">Iteration</text>" +
      "<text x=\"12\" y=\"" + (top + plotH / 2) + "\" text-anchor=\"middle\" dominant-baseline=\"middle\" transform=\"rotate(-90,12," + (top + plotH / 2) + ")\" class=\"root-graph-label\">Approximation</text>" +
      "</svg>";
  }

  function estimateConvergenceRate(rows) {
    const errs = (rows || []).map(function getError(row) { return row.error; }).filter(function isUseful(error) {
      return error != null && Number(error) > 0;
    });
    if (errs.length < 3) return null;
    const e1 = errs[errs.length - 3];
    const e2 = errs[errs.length - 2];
    const e3 = errs[errs.length - 1];
    const order = Math.log(e3 / e2) / Math.log(e2 / e1);
    if (!Number.isFinite(order)) return null;
    return order;
  }

  function renderConvergenceSummary(run) {
    const rows = run.rows || [];
    if (!rows.length) {
      setOptionalText("root-rate-summary", "No iterations completed.");
      return;
    }
    const finalError = rows[rows.length - 1].error;
    const order = estimateConvergenceRate(rows);
    const orderText = order == null ? "" : " Estimated order = " + order.toFixed(2) + ".";
    setOptionalText("root-rate-summary", rows.length + " iteration" + (rows.length === 1 ? "" : "s") + " completed. Final |error| = " + fmtErr(finalError) + "." + orderText);
  }

  function renderMethodGuide(method) {
    const info = METHOD_INFO[method] || METHOD_INFO.bisection;
    setText("root-method-title", info.label);
    setOptionalText("root-method-summary", info.summary);
    setOptionalText("root-method-details", info.details);
  }

  function renderQuizAnswer(run) {
    setText("root-active-method", methodLabel(run.method));
    setText("root-final-metric", finalMetric(run));
    setOptionalText("root-interpretation", interpretationText(run));
    setOptionalText("root-next-action", nextActionText(run));
  }

  function buildBisectionSteps(run) {
    const isFP = run.method === "falsePosition";
    const methodName = isFP ? "false position" : "bisection";
    const formula = isFP ? "c = b - f(b)(b-a)/(f(b)-f(a))" : "c = (a + b) / 2";
    const left = run.initial && run.initial.left ? fmtVal(run.initial.left.x, 12) : "unavailable";
    const right = run.initial && run.initial.right ? fmtVal(run.initial.right.x, 12) : "unavailable";
    const steps = [
      "Apply the " + methodName + " method to f(x) = " + (run.canonical || run.expression || "f(x)") + " on [" + left + ", " + right + "].",
      "Check endpoint signs using " + (run.decisionBasis === "exact" ? "exact" : "machine") + " signs."
    ];
    if (run.summary && run.summary.intervalStatus === "invalid-bracket") {
      steps.push("The endpoints do not bracket a sign change for " + methodName + ".");
      steps.push("Choose a new interval where f(a) and f(b) have opposite signs.");
    } else if (run.summary && run.summary.approximation == null) {
      steps.push("The method could not produce a trusted approximation for this input.");
    } else {
      steps.push("Use " + formula + " and keep the subinterval that preserves the sign change.");
      steps.push("The approximate root after the final step is " + fmtVal(run.summary && run.summary.approximation, 18) + ".");
    }
    steps.push("Machine values use " + run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping") + ".");
    return steps;
  }

  function buildNewtonSteps(run) {
    return [
      "Apply Newton-Raphson to f(x) = " + (run.canonical || run.expression || "f(x)") + " with f'(x) = " + (run.dfCanonical || run.dfExpression || "f'(x)") + ".",
      "Use x next = x - f(x) / f'(x).",
      run.stopping.kind === "epsilon" ? "Stop when |x next - x| < epsilon = " + run.stopping.input + "." : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.approximation == null ? "No trusted approximation was produced." : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length === 1 ? "" : "s") + " is x ~ " + fmtVal(run.summary.approximation, 18) + ".",
      "Machine values use " + run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping") + "."
    ];
  }

  function buildSecantSteps(run) {
    return [
      "Apply the secant method to f(x) = " + (run.canonical || run.expression || "f(x)") + ".",
      "Use x next = x - f(x)(x - x prev) / (f(x) - f(x prev)).",
      run.stopping.kind === "epsilon" ? "Stop when |x next - x| < epsilon = " + run.stopping.input + "." : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.approximation == null ? "No trusted approximation was produced." : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length === 1 ? "" : "s") + " is x ~ " + fmtVal(run.summary.approximation, 18) + ".",
      "Machine values use " + run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping") + "."
    ];
  }

  function buildFixedPointSteps(run) {
    return [
      "Apply fixed-point iteration with g(x) = " + (run.canonical || run.expression || "g(x)") + ".",
      "Use x next = g(x). Convergence requires |g'(x)| < 1 near the fixed point.",
      run.stopping.kind === "epsilon" ? "Stop when |x next - x| < epsilon = " + run.stopping.input + "." : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.approximation == null ? "No trusted approximation was produced." : "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length === 1 ? "" : "s") + " is x ~ " + fmtVal(run.summary.approximation, 18) + ".",
      "Machine values use " + run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping") + "."
    ];
  }

  function solutionSteps(run) {
    const builders = {
      bisection: buildBisectionSteps,
      falsePosition: buildBisectionSteps,
      newton: buildNewtonSteps,
      secant: buildSecantSteps,
      fixedPoint: buildFixedPointSteps
    };
    const build = builders[run.method] || function emptySteps() { return []; };
    return build(run);
  }

  function renderSolutionSteps(run) {
    const list = byId("root-solution-steps");
    if (!list) return;
    const steps = solutionSteps(run);
    list.innerHTML = steps.length
      ? steps.map(function stepLi(step) { return "<li>" + escapeHtml(step) + "</li>"; }).join("")
      : "<li>No solution steps available.</li>";
    setOptionalText("root-copy-status", "");
  }

  function bracketRowValues(row, run) {
    const sd = run.signDisplay || "both";
    const exact = row.exactSigns || {};
    const machine = row.machineSigns || {};
    return [
      row.iteration,
      fmtVal(row.a, 12),
      fmtVal(row.b, 12),
      fmtVal(row.c, 12),
      fmtPoint(row.fa, sd, run),
      fmtPoint(row.fb, sd, run),
      fmtPoint(row.fc, sd, run),
      "a: " + formatSignPair(sd, exact.a, machine.a) + ", b: " + formatSignPair(sd, exact.b, machine.b) + ", c: " + formatSignPair(sd, exact.c, machine.c),
      row.decision === "left" ? "Keep [a, c]" : "Keep [c, b]",
      fmtErr(row.width),
      row.bound == null ? "-" : fmtErr(row.bound),
      fmtErr(row.error),
      row.note || ""
    ];
  }

  function rowValues(row, run) {
    if (run.method === "bisection" || run.method === "falsePosition") return bracketRowValues(row, run);
    if (run.method === "newton") {
      return [row.iteration, fmtVal(row.xn, 12), fmtVal(row.fxn, 12), fmtVal(row.dfxn, 12), fmtVal(row.xNext, 12), fmtErr(row.error), row.note || ""];
    }
    if (run.method === "secant") {
      return [row.iteration, fmtVal(row.xPrev, 12), fmtVal(row.xn, 12), fmtVal(row.fxPrev, 12), fmtVal(row.fxn, 12), fmtVal(row.xNext, 12), fmtErr(row.error), row.note || ""];
    }
    if (run.method === "fixedPoint") {
      return [row.iteration, fmtVal(row.xn, 12), fmtVal(row.gxn, 12), fmtErr(row.error), row.note || ""];
    }
    return [];
  }

  function renderTable(run) {
    const cfg = TABLE_CONFIGS[run.method] || TABLE_CONFIGS.bisection;
    const thead = byId("root-iteration-thead");
    const body = byId("root-iteration-body");
    if (!thead || !body) return;
    thead.innerHTML = "<tr>" + cfg.headers.map(function headerCell(header) {
      return "<th>" + escapeHtml(header) + "</th>";
    }).join("") + "</tr>";
    if (!run.rows || !run.rows.length) {
      body.innerHTML = "<tr class=\"empty-row\"><td colspan=\"" + cfg.colSpan + "\">No iteration steps yet.</td></tr>";
      return;
    }
    body.innerHTML = run.rows.map(function renderRow(row) {
      const values = rowValues(row, run);
      return "<tr>" + values.map(function dataCell(value, index) {
        return "<td data-label=\"" + escapeHtml(cfg.headers[index] || "") + "\">" + escapeHtml(value) + "</td>";
      }).join("") + "</tr>";
    }).join("");
  }

  function renderRun(run) {
    const summary = run.summary || {};
    setHidden("root-empty", true);
    setHidden("root-result-stage", false);
    setText("root-approx", summary.intervalStatus === "invalid-bracket" || summary.approximation == null ? "N/A" : fmtVal(summary.approximation, 18));
    setText("root-stopping-result", formatStopReason(summary.stopReason, run.method));
    setText("root-convergence", formatStoppingDetails(run));
    renderMethodGuide(run.method);
    renderQuizAnswer(run);
    renderDiagnostics(run);
    renderBracketPanel(run);
    renderGraph(run);
    renderConvergenceSummary(run);
    renderSolutionSteps(run);
    renderTable(run);
  }

  function resetResults(state) {
    Object.keys(state.emptyTextById).forEach(function resetText(id) {
      setText(id, state.emptyTextById[id]);
    });
    renderMethodGuide(state.activeMethod);
    setText("root-active-method", state.activeMethod ? methodLabel(state.activeMethod) : EMPTY);
    setText("root-final-metric", "Not calculated yet");
    setOptionalText("root-interpretation", "Run the method to see a short interpretation.");
    setOptionalText("root-next-action", "Run the method to see the next recommended action.");
    setHidden("root-empty", false);
    setHidden("root-result-stage", true);
    setHidden("root-bracket-panel", true);
    const diagnostics = byId("root-diagnostics");
    if (diagnostics) {
      diagnostics.innerHTML = "";
      diagnostics.hidden = true;
    }
    const graph = byId("root-convergence-graph");
    if (graph) graph.innerHTML = "";
    setOptionalText("root-rate-summary", "");
    const list = byId("root-solution-steps");
    if (list) list.innerHTML = "<li>Run the method to see steps.</li>";
    const thead = byId("root-iteration-thead");
    const body = byId("root-iteration-body");
    if (thead) thead.innerHTML = "";
    if (body) body.innerHTML = "<tr class=\"empty-row\"><td colspan=\"13\">No steps yet.</td></tr>";
    setOptionalText("root-copy-status", "");
  }

  function buildSolutionText(run) {
    const summary = run && run.summary ? run.summary : {};
    const machine = run && run.machine ? run.machine : {};
    const method = run && run.method ? run.method : "";
    const header = [
      "Method: " + methodLabel(method),
      "Approximate root: " + (summary.approximation == null ? "N/A" : fmtVal(summary.approximation, 18)),
      "Stopping reason: " + formatStopReason(summary.stopReason, method),
      "Stopping: " + formatStoppingDetails(run),
      "Next action: " + nextActionText(run)
    ];
    if (machine.k != null && machine.mode) {
      header.splice(1, 0, "Machine: " + machine.k + " significant digits, " + (machine.mode === "round" ? "rounding" : "chopping"));
    }
    const steps = solutionSteps(run).map(function numberStep(step, index) {
      return (index + 1) + ". " + step;
    }).join("\n");
    return header.concat(["", "Solution steps:"], steps).join("\n");
  }

  globalScope.RootsRender = { renderRun, renderBisection: renderRun, resetResults, buildSolutionText, renderMethodGuide };
})(window);
