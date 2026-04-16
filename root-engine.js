"use strict";

(function initRootEngine(globalScope) {
  const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  const E = globalScope.ExpressionEngine;
  if (!M || !C || !E) {
    throw new Error("MathEngine, CalcEngine, and ExpressionEngine must be loaded before RootEngine.");
  }

  const TWO = M.makeRational(1, 2n, 1n);
  const MAX_OPEN_ITER = 100;

  function parseOpenStopping(options) {
    if (options.stopping.kind === "epsilon") {
      const eps = realNumber(parseScalarInput(options.stopping.value, "Tolerance epsilon"), "Tolerance epsilon");
      if (!(eps > 0)) {
        throw new Error("Enter a tolerance epsilon greater than 0.");
      }
      return { kind: "epsilon", input: String(options.stopping.value), epsilon: eps, maxIterations: MAX_OPEN_ITER };
    }
    const n = Number(options.stopping.value);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error("Enter a whole number of iterations, 1 or greater.");
    }
    return { kind: "iterations", input: n, epsilon: null, maxIterations: n };
  }

  function fmtStopResult(stopping, rows, stopReason) {
    const finalError = rows.length ? rows[rows.length - 1].error : null;
    return {
      kind: stopping.kind,
      input: stopping.input,
      iterationsRequired: rows.length,
      epsilonBound: stopping.kind === "epsilon" ? stopping.epsilon : finalError,
      maxIterations: stopping.maxIterations || rows.length,
      capReached: stopping.kind === "epsilon" && stopReason === "iteration-cap"
    };
  }

  function initialOpenStopReason(stopping) {
    return stopping.kind === "epsilon" ? "iteration-cap" : "iteration-limit";
  }

  function isStrictZeroValue(value) {
    if (C.isRationalValue(value)) {
      return M.isZero(value);
    }
    if (C.isCalcValue(value)) {
      return value.re === 0 && value.im === 0;
    }
    return value === 0;
  }

  function zeroStopReasonForValue(referenceValue) {
    return isStrictZeroValue(referenceValue) ? "exact-zero" : "machine-zero";
  }

  function zeroStopReasonForPoint(point) {
    return point && point.exactAvailable && isStrictZeroValue(point.reference)
      ? "exact-zero"
      : "machine-zero";
  }

  function summaryPackage(approximation, intervalStatus, stopReason, diagnostics) {
    return Object.assign({
      approximation,
      intervalStatus,
      stopReason,
      residual: null,
      residualBasis: "unavailable",
      error: null,
      bound: null,
      stopDetail: ""
    }, diagnostics || {});
  }

  function pointResidual(point, basis) {
    if (!point) {
      return { residual: null, residualBasis: "unavailable" };
    }
    if (basis === "machine") {
      return { residual: point.machine, residualBasis: "machine" };
    }
    return {
      residual: point.reference,
      residualBasis: point.exactAvailable ? "exact" : "reference"
    };
  }

  function lastRow(rows) {
    return rows.length ? rows[rows.length - 1] : null;
  }

  function evaluateFn(ast, xValue, machine, angleMode) {
    const env = { x: xValue, angleMode: angleMode || "rad" };
    const exact = E.evaluateValue(ast, env);
    const data = C.machineApproxValue(exact, machine.k, machine.mode);
    return { exact, approx: data.approx };
  }

  function runNewtonRaphson(options) {
    if (!options || !options.machine) {
      throw new Error("Newton options require a machine configuration.");
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const dfAst = E.parseExpression(String(options.dfExpression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = parseOpenStopping(options);

    const x0Value = parseScalarInput(options.x0, "Starting point x\u2080");
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fn = evaluateFn(fAst, xn, machine, options.angleMode);
      const dfn = evaluateFn(dfAst, xn, machine, options.angleMode);
      const dfVal = realNumber(dfn.approx, "f'(x\u2099)");

      if (Math.abs(dfVal) < C.EPS) {
        finalStopReason = "derivative-zero";
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext: null, error: null, note: "f\u2032(x) \u2248 0, method cannot continue" });
        break;
      }

      const stepExact = C.div(fn.approx, dfn.approx);
      const stepStored = machineStore(stepExact, machine);
      const xNextExact = C.sub(xn, stepStored);
      const xNext = machineStore(xNextExact, machine);
      const error = Math.abs(realNumber(C.sub(xNext, xn), "Newton error"));

      rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext, error, note: "" });

      const fnVal = realNumber(fn.approx, "f(x\u2099)");
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = zeroStopReasonForValue(fn.exact);
        xn = xNext;
        break;
      }

      xn = xNext;

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        finalStopReason = "tolerance-reached";
        break;
      }
    }

    const finalRow = lastRow(rows);
    const approx = finalRow ? (finalRow.xNext != null ? finalRow.xNext : finalRow.xn) : x0Value;
    const finalResidual = approx != null ? evaluateFn(fAst, approx, machine, options.angleMode).approx : null;
    const finalError = finalRow && finalRow.error != null ? finalRow.error : null;

    return {
      method: "newton",
      expression: options.expression,
      dfExpression: options.dfExpression,
      canonical: E.formatExpression(fAst),
      dfCanonical: E.formatExpression(dfAst),
      machine,
      stopping: fmtStopResult(stopping, rows, finalStopReason),
      summary: summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }),
      initial: null,
      decisionBasis: null,
      signDisplay: null,
      rows
    };
  }

  function runSecant(options) {
    if (!options || !options.machine) {
      throw new Error("Secant options require a machine configuration.");
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = parseOpenStopping(options);

    const x0Value = parseScalarInput(options.x0, "First point x\u2080");
    const x1Value = parseScalarInput(options.x1, "Second point x\u2081");

    let xPrev = machineStore(x0Value, machine);
    let xn = machineStore(x1Value, machine);
    let fPrev = evaluateFn(fAst, xPrev, machine, options.angleMode).approx;

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fn = evaluateFn(fAst, xn, machine, options.angleMode);
      const denomExact = C.sub(fn.approx, fPrev);
      const denomStored = machineStore(denomExact, machine);
      const denomVal = realNumber(denomStored, "secant denominator");

      if (Math.abs(denomVal) < C.EPS) {
        finalStopReason = "stagnation";
        rows.push({ iteration: iter, xPrev, xn, fxPrev: fPrev, fxn: fn.approx, xNext: null, error: null, note: "f(x\u2099) \u2248 f(x\u2099\u208B\u2081), method stalled" });
        break;
      }

      const numExact = C.mul(fn.approx, C.sub(xn, xPrev));
      const numStored = machineStore(numExact, machine);
      const stepExact = C.div(numStored, denomStored);
      const stepStored = machineStore(stepExact, machine);
      const xNextExact = C.sub(xn, stepStored);
      const xNext = machineStore(xNextExact, machine);
      const error = Math.abs(realNumber(C.sub(xNext, xn), "Secant error"));

      rows.push({ iteration: iter, xPrev, xn, fxPrev: fPrev, fxn: fn.approx, xNext, error, note: "" });

      const fnVal = realNumber(fn.approx, "f(x\u2099)");
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = zeroStopReasonForValue(fn.exact);
        xPrev = xn; fPrev = fn.approx; xn = xNext;
        break;
      }

      xPrev = xn;
      fPrev = fn.approx;
      xn = xNext;

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        finalStopReason = "tolerance-reached";
        break;
      }
    }

    const finalRow = lastRow(rows);
    const approx = finalRow ? (finalRow.xNext != null ? finalRow.xNext : finalRow.xn) : x1Value;
    const finalResidual = approx != null ? evaluateFn(fAst, approx, machine, options.angleMode).approx : null;
    const finalError = finalRow && finalRow.error != null ? finalRow.error : null;

    return {
      method: "secant",
      expression: options.expression,
      canonical: E.formatExpression(fAst),
      machine,
      stopping: fmtStopResult(stopping, rows, finalStopReason),
      summary: summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }),
      initial: null,
      decisionBasis: null,
      signDisplay: null,
      rows
    };
  }

  function runFalsePosition(options) {
    if (!options || !options.machine) {
      throw new Error("False position options require a machine configuration.");
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const leftInput = parseScalarInput(options.interval.a, "Left endpoint a");
    const rightInput = parseScalarInput(options.interval.b, "Right endpoint b");
    if (realNumber(leftInput, "Left endpoint a") >= realNumber(rightInput, "Right endpoint b")) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }

    let left = iterationValue(leftInput, machine, basis);
    let right = iterationValue(rightInput, machine, basis);
    const stopping = parseOpenStopping(options);
    const leftPoint = evaluatePoint(ast, left, machine, options.angleMode);
    const rightPoint = evaluatePoint(ast, right, machine, options.angleMode);
    const leftSign = decisionSign(leftPoint, basis);
    const rightSign = decisionSign(rightPoint, basis);

    const earlyResult = function(approximation, intervalStatus, stopReason, rows) {
      const resultRows = rows || [];
      const finalBracketRow = lastRow(resultRows);
      const endpointPoint = intervalStatus === "root-at-a" ? leftPoint
        : intervalStatus === "root-at-b" ? rightPoint
        : null;
      const residualData = finalBracketRow
        ? pointResidual(finalBracketRow.fc, basis)
        : pointResidual(endpointPoint, basis);
      return {
        method: "falsePosition",
        expression: options.expression,
        canonical: E.formatExpression(ast),
        machine,
        stopping: fmtStopResult(stopping, resultRows, stopReason),
        summary: summaryPackage(approximation, intervalStatus, stopReason, {
          residual: residualData.residual,
          residualBasis: residualData.residualBasis,
          error: finalBracketRow ? finalBracketRow.error : null,
          bound: finalBracketRow ? finalBracketRow.bound : null
        }),
        initial: makeInitial(leftPoint, rightPoint),
        decisionBasis: options.decisionBasis,
        signDisplay: options.signDisplay,
        rows: resultRows
      };
    };

    if (leftSign === 0) return earlyResult(left, "root-at-a", "endpoint-root", []);
    if (rightSign === 0) return earlyResult(right, "root-at-b", "endpoint-root", []);
    if (leftSign * rightSign > 0) return earlyResult(null, "invalid-bracket", "invalid-starting-interval", []);

    const rows = [];
    let prevC = null;

    for (let iteration = 1; iteration <= stopping.maxIterations; iteration += 1) {
      const aPoint = evaluatePoint(ast, left, machine, options.angleMode);
      const bPoint = evaluatePoint(ast, right, machine, options.angleMode);
      const denomMachine = C.sub(bPoint.machine, aPoint.machine);
      const denomVal = realNumber(denomMachine, "false position denominator");

      let midpoint;
      if (Math.abs(denomVal) < C.EPS) {
        midpoint = iterationValue(C.div(C.add(left, right), TWO), machine, basis);
      } else {
        const width = C.sub(right, left);
        const numerator = C.mul(bPoint.machine, width);
        const step = C.div(numerator, denomMachine);
        midpoint = iterationValue(C.sub(right, step), machine, basis);
      }

      const cPoint = evaluatePoint(ast, midpoint, machine, options.angleMode);
      const currentLeftSign = decisionSign(aPoint, basis);
      const midSign = decisionSign(cPoint, basis);
      const keepLeftHalf = currentLeftSign === 0 || currentLeftSign * midSign <= 0;
      const error = prevC != null ? finiteDistanceOrMachine(midpoint, prevC, machine, "FP error") : null;

      rows.push({
        iteration,
        a: left, b: right, c: midpoint,
        fa: aPoint, fb: bPoint, fc: cPoint,
        exactSigns: { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
        machineSigns: { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign },
        decision: keepLeftHalf ? "left" : "right",
        width: finiteDistanceOrMachine(right, left, machine, "Interval width"),
        bound: stopping.kind === "epsilon" ? stopping.epsilon : null,
        error,
        note: formatDisagreementNote(disagreementLabels(
          ["a", "b", "c"],
          { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
          { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign }
        ))
      });

      prevC = midpoint;

      if (midSign === 0) {
        return earlyResult(midpoint, "root-at-midpoint", zeroStopReasonForPoint(cPoint), rows);
      }
      if (stopping.kind === "epsilon" && error != null && error < stopping.epsilon) {
        return earlyResult(midpoint, "valid-bracket", "tolerance-reached", rows);
      }
      if (keepLeftHalf) {
        right = midpoint;
      } else {
        left = midpoint;
      }
    }

    const lastApprox = rows.length ? rows[rows.length - 1].c : C.div(C.add(left, right), TWO);
    return earlyResult(lastApprox, "valid-bracket", initialOpenStopReason(stopping), rows);
  }

  function runFixedPoint(options) {
    if (!options || !options.machine) {
      throw new Error("Fixed point options require a machine configuration.");
    }
    const gAst = E.parseExpression(String(options.gExpression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = parseOpenStopping(options);

    const x0Value = parseScalarInput(options.x0, "Starting point x\u2080");
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);
    const DIVERGE_LIMIT = 1e8;

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const gn = evaluateFn(gAst, xn, machine, options.angleMode);
      const xNext = machineStore(gn.approx, machine);
      const xnReal = realNumber(xn, "x\u2099");
      const xNextReal = realNumber(xNext, "g(x\u2099)");
      const error = Math.abs(xNextReal - xnReal);

      rows.push({ iteration: iter, xn, gxn: xNext, error, note: "" });

      if (Math.abs(xNextReal) > DIVERGE_LIMIT) {
        finalStopReason = "diverged";
        break;
      }

      xn = xNext;

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        finalStopReason = "tolerance-reached";
        break;
      }
    }

    const finalRow = lastRow(rows);
    const approx = finalStopReason === "diverged" ? null
      : (finalRow ? finalRow.gxn : x0Value);
    const finalResidual = approx != null ? C.sub(evaluateFn(gAst, approx, machine, options.angleMode).approx, approx) : null;
    const finalError = finalRow && finalRow.error != null ? finalRow.error : null;

    return {
      method: "fixedPoint",
      expression: options.gExpression,
      canonical: E.formatExpression(gAst),
      machine,
      stopping: fmtStopResult(stopping, rows, finalStopReason),
      summary: summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }),
      initial: null,
      decisionBasis: null,
      signDisplay: null,
      rows
    };
  }

  function parseScalarInput(text, label) {
    const rawText = String(text);
    const ast = E.parseExpression(String(text), { allowVariable: false });
    let value = E.evaluateValue(ast, { angleMode: "rad" });
    const trimmed = rawText.trim();
    if (
      trimmed[0] === "-" &&
      ast.kind === "binary" &&
      ast.op === "^" &&
      ast.left &&
      ast.left.kind === "unary" &&
      ast.left.op === "-"
    ) {
      value = C.negate(E.evaluateValue(Object.assign({}, ast, { left: ast.left.expr }), { angleMode: "rad" }));
    }
    if (C.isRationalValue(value)) {
      return value;
    }
    const real = C.requireRealNumber(value, label);
    if (!Number.isFinite(real)) {
      throw new Error(label + " must be finite.");
    }
    return M.parseRational(String(real));
  }

  function realNumber(value, label) {
    const real = C.requireRealNumber(value, label);
    if (!Number.isFinite(real)) {
      throw new Error(label + " must be finite.");
    }
    return real;
  }

  function machineStore(value, machine) {
    return C.machineApproxValue(value, machine.k, machine.mode).approx;
  }

  function distanceNumber(left, right, label) {
    return Math.abs(realNumber(C.sub(left, right), label));
  }

  function absNumber(value) {
    return Math.abs(realNumber(value, "Absolute value"));
  }

  function bisectionRelativeBound(left, right) {
    const leftMag = absNumber(left);
    const rightMag = absNumber(right);
    const denom = Math.min(leftMag, rightMag);
    if (!(denom > 0)) {
      throw new Error("Relative tolerance needs a bracket whose endpoints stay away from 0.");
    }
    return distanceNumber(right, left, "Relative tolerance width") / denom;
  }

  function finiteDistanceOrMachine(left, right, machine, label) {
    try {
      return distanceNumber(left, right, label);
    } catch (err) {
      return distanceNumber(machineStore(left, machine), machineStore(right, machine), label);
    }
  }

  function iterationValue(value, machine, decisionBasis) {
    return decisionBasis === "machine" ? machineStore(value, machine) : value;
  }

  function compareValues(left, right, label) {
    if (C.isRationalValue(left) && C.isRationalValue(right)) {
      return M.cmp(left, right);
    }
    const leftReal = realNumber(left, label + " left");
    const rightReal = realNumber(right, label + " right");
    return leftReal === rightReal ? 0 : (leftReal < rightReal ? -1 : 1);
  }

  function absValue(value) {
    if (C.isRationalValue(value)) {
      return value.sign < 0 ? M.negate(value) : value;
    }
    return Math.abs(realNumber(value, "Absolute value"));
  }

  function assertPositive(value, label) {
    if (C.isRationalValue(value)) {
      if (value.sign <= 0 || M.isZero(value)) {
        throw new Error("Enter a " + label.toLowerCase() + " greater than 0.");
      }
      return;
    }
    const numeric = realNumber(value, label);
    if (!(numeric > 0)) {
      throw new Error("Enter a " + label.toLowerCase() + " greater than 0.");
    }
  }

  function bitLength(n) {
    if (n < 0n) {
      throw new Error("Bit length requires a non-negative integer.");
    }
    return n === 0n ? 0 : n.toString(2).length;
  }

  function ceilLog2PositiveRational(value) {
    assertPositive(value, "Positive rational");
    if (!C.isRationalValue(value)) {
      throw new Error("Expected a positive rational value.");
    }
    if (value.num <= value.den) {
      return 0;
    }
    const ceiling = (value.num + value.den - 1n) / value.den;
    return bitLength(ceiling - 1n);
  }

  function iterationsFromTolerance(aValue, bValue, epsilonValue) {
    const widthValue = absValue(C.sub(bValue, aValue));
    assertPositive(epsilonValue, "Tolerance epsilon");

    if (C.isRationalValue(widthValue) && C.isRationalValue(epsilonValue)) {
      if (M.isZero(widthValue)) {
        return 0;
      }
      return ceilLog2PositiveRational(C.div(widthValue, epsilonValue));
    }

    const width = C.isRationalValue(widthValue) ? realNumber(widthValue, "Interval width") : widthValue;
    const epsilon = realNumber(epsilonValue, "Tolerance epsilon");
    if (epsilon === 0) {
      throw new Error("Tolerance epsilon is positive but too small for this browser number path. Use a larger epsilon or an iteration count.");
    }
    return Math.max(0, Math.ceil(Math.log2(width / epsilon)));
  }

  function toleranceFromIterations(aValue, bValue, iterations) {
    const width = Math.abs(realNumber(C.sub(bValue, aValue), "Interval width"));
    if (!Number.isInteger(iterations) || iterations < 0) {
      throw new Error("Enter a whole number of iterations, 0 or greater.");
    }
    return width / Math.pow(2, iterations);
  }

  function classifySign(value) {
    if (C.isRationalValue(value)) {
      if (M.isZero(value)) {
        return 0;
      }
      return value.sign < 0 ? -1 : 1;
    }
    const real = realNumber(value, "Bisection value");
    if (Math.abs(real) < C.EPS) {
      return 0;
    }
    return real < 0 ? -1 : 1;
  }

  function strictSign(value, label) {
    if (C.isRationalValue(value)) {
      if (M.isZero(value)) {
        return 0;
      }
      return value.sign < 0 ? -1 : 1;
    }
    const real = realNumber(value, label);
    if (real === 0) {
      return 0;
    }
    return real < 0 ? -1 : 1;
  }

  function decisionSign(point, basis) {
    return basis === "machine" ? point.machineSign : point.exactSign;
  }

  function expressionUsesTrig(expression) {
    if (!expression || typeof expression !== "object") {
      return false;
    }
    if (expression.kind === "call") {
      const name = String(expression.name || "").toLowerCase();
      if (name === "sin" || name === "cos" || name === "tan") {
        return true;
      }
      return expression.args.some(expressionUsesTrig);
    }
    if (expression.kind === "unary") {
      return expressionUsesTrig(expression.expr);
    }
    if (expression.kind === "binary") {
      return expressionUsesTrig(expression.left) || expressionUsesTrig(expression.right);
    }
    return false;
  }

  function addWarning(warnings, code, message) {
    warnings.push({ code, message });
  }

  function evaluatePoint(ast, xValue, machine, angleMode) {
    const env = { x: xValue, angleMode: angleMode || "rad" };
    const exactAvailable = E.isExactCompatible(ast, env);
    const reference = exactAvailable ? E.evaluateExact(ast, env) : E.evaluateValue(ast, env);
    const comparison = E.evaluateComparison(ast, machine, env, { expression: E.formatExpression(ast) });
    return {
      x: xValue,
      exactAvailable,
      reference,
      machine: comparison.step.approx,
      exactSign: strictSign(reference, "Exact bisection value"),
      machineSign: strictSign(comparison.step.approx, "Machine bisection value"),
      canonical: comparison.canonical
    };
  }

  function disagreementLabels(labels, exactSigns, machineSigns) {
    const out = [];
    for (const label of labels) {
      if (exactSigns[label] !== machineSigns[label]) {
        out.push(label);
      }
    }
    return out;
  }

  function formatDisagreementNote(labels) {
    if (!labels.length) {
      return "";
    }
    if (labels.length === 1) {
      return "Exact and machine signs differ at " + labels[0] + ".";
    }
    return "Exact and machine signs differ at " + labels.join(", ") + ".";
  }

  function makeInitial(leftPoint, rightPoint) {
    if (!leftPoint || !rightPoint) {
      return {
        left: leftPoint || null,
        right: rightPoint || null,
        hasDisagreement: false,
        disagreementPoints: [],
        note: ""
      };
    }
    const labels = disagreementLabels(
      ["a", "b"],
      { a: leftPoint.exactSign, b: rightPoint.exactSign },
      { a: leftPoint.machineSign, b: rightPoint.machineSign }
    );
    return {
      left: leftPoint,
      right: rightPoint,
      hasDisagreement: labels.length > 0,
      disagreementPoints: labels,
      note: formatDisagreementNote(labels)
    };
  }

  function resultPackage(options, ast, machine, leftPoint, rightPoint, stopping, summary, rows) {
    return {
      method: "bisection",
      expression: options.expression,
      canonical: E.formatExpression(ast),
      machine,
      decisionBasis: options.decisionBasis,
      signDisplay: options.signDisplay,
      initial: makeInitial(leftPoint, rightPoint),
      stopping,
      summary,
      rows
    };
  }

  function withActualIterations(stopping, rows) {
    return Object.assign({}, stopping, {
      actualIterations: rows.length
    });
  }

  function bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summary, rows, warnings) {
    const result = resultPackage(options, ast, machine, leftPoint, rightPoint, withActualIterations(stopping, rows), summary, rows);
    result.warnings = warnings;
    return result;
  }

  function continuityFailure(message) {
    return summaryPackage(null, "invalid-continuity", "discontinuity-detected", {
      stopDetail: message,
      residualBasis: "unavailable"
    });
  }

  function sampleSignChanges(ast, left, right, machine, angleMode) {
    const SAMPLE_COUNT = 16;
    let previous = null;
    let changes = 0;
    let failed = false;

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const numerator = C.add(
        C.mul(left, M.makeRational(1, BigInt(SAMPLE_COUNT - 1 - index), BigInt(SAMPLE_COUNT - 1))),
        C.mul(right, M.makeRational(1, BigInt(index), BigInt(SAMPLE_COUNT - 1)))
      );
      try {
        const point = evaluatePoint(ast, numerator, machine, angleMode);
        const sign = strictSign(point.reference, "Sample value");
        if (sign !== 0) {
          if (previous != null && previous !== sign) {
            changes += 1;
          }
          previous = sign;
        }
      } catch (err) {
        failed = true;
      }
    }

    return { changes, failed };
  }

  function normalizeBisectionToleranceType(stopping) {
    return stopping && stopping.toleranceType === "absolute" ? "absolute" : "relative";
  }

  function buildStopping(options, left, right) {
    if (options.stopping.kind === "epsilon") {
      const epsilonValue = parseScalarInput(options.stopping.value, "Tolerance epsilon");
      const toleranceType = options.method === "bisection"
        ? normalizeBisectionToleranceType(options.stopping)
        : "absolute";
      const plannedIterations = toleranceType === "absolute"
        ? iterationsFromTolerance(left, right, epsilonValue)
        : null;

      return {
        kind: "epsilon",
        input: String(options.stopping.value),
        toleranceType,
        plannedIterations,
        actualIterations: 0,
        iterationsRequired: plannedIterations,
        epsilonBound: realNumber(epsilonValue, "Tolerance epsilon"),
        maxIterations: MAX_OPEN_ITER
      };
    }

    const iterations = Number(options.stopping.value);
    return {
      kind: "iterations",
      input: iterations,
      plannedIterations: iterations,
      actualIterations: 0,
      iterationsRequired: iterations,
      epsilonBound: toleranceFromIterations(left, right, iterations)
    };
  }

  function runBisection(options) {
    if (!options || !options.machine) {
      throw new Error("Bisection options require a machine configuration.");
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const warnings = [];
    if (expressionUsesTrig(ast)) {
      addWarning(warnings, "angle-mode", "This expression uses trigonometric functions; bisection evaluates them using the selected angle mode.");
    }
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const leftInput = parseScalarInput(options.interval.a, "Left endpoint a");
    const rightInput = parseScalarInput(options.interval.b, "Right endpoint b");
    if (compareValues(leftInput, rightInput, "Bisection interval") >= 0) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }

    let left = iterationValue(leftInput, machine, basis);
    let right = iterationValue(rightInput, machine, basis);
    const stopping = buildStopping(Object.assign({}, options, { method: "bisection" }), left, right);
    const initialLeft = left;
    const initialRight = right;
    let leftPoint;
    let rightPoint;
    try {
      leftPoint = evaluatePoint(ast, left, machine, options.angleMode);
    } catch (err) {
      return bisectionResult(options, ast, machine, null, null, stopping, continuityFailure("Failed to evaluate f(a): " + err.message), [], warnings);
    }
    try {
      rightPoint = evaluatePoint(ast, right, machine, options.angleMode);
    } catch (err) {
      return bisectionResult(options, ast, machine, leftPoint, null, stopping, continuityFailure("Failed to evaluate f(b): " + err.message), [], warnings);
    }
    const leftSign = decisionSign(leftPoint, basis);
    const rightSign = decisionSign(rightPoint, basis);

    if (leftSign === 0) {
      const residualData = pointResidual(leftPoint, basis);
      return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
        left,
        "root-at-a",
        "endpoint-root",
        {
          residual: residualData.residual,
          residualBasis: residualData.residualBasis
        }
      ), [], warnings);
    }

    if (rightSign === 0) {
      const residualData = pointResidual(rightPoint, basis);
      return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
        right,
        "root-at-b",
        "endpoint-root",
        {
          residual: residualData.residual,
          residualBasis: residualData.residualBasis
        }
      ), [], warnings);
    }

    if (leftSign * rightSign > 0) {
      addWarning(warnings, "invalid-bracket", "The selected endpoints have the same sign for the bisection decision basis.");
      return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
        null,
        "invalid-bracket",
        "invalid-starting-interval"
      ), [], warnings);
    }

    const samples = sampleSignChanges(ast, left, right, machine, options.angleMode);
    if (!samples.failed && samples.changes > 1) {
      addWarning(warnings, "possible-multiple-roots", "Sampled signs changed more than once inside the interval; bisection may converge to one of multiple roots.");
    }

    const relativeMode = stopping.kind === "epsilon" && stopping.toleranceType === "relative";
    const absoluteMode = stopping.kind === "epsilon" && stopping.toleranceType === "absolute";

    if (absoluteMode && stopping.iterationsRequired === 0) {
      const midpoint = C.div(C.add(left, right), TWO);
      let midpointPoint;
      try {
        midpointPoint = evaluatePoint(ast, midpoint, machine, options.angleMode);
      } catch (err) {
        return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, continuityFailure(err.message), [], warnings);
      }
      const residualData = pointResidual(midpointPoint, basis);
      return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
        midpoint,
        "valid-bracket",
        "tolerance-already-met",
        {
          residual: residualData.residual,
          residualBasis: residualData.residualBasis,
          bound: stopping.epsilonBound
        }
      ), [], warnings);
    }

    const rows = [];
    let prevC = null;
    const loopLimit = relativeMode ? stopping.maxIterations : stopping.iterationsRequired;
    for (let iteration = 1; iteration <= loopLimit; iteration += 1) {
      const midpointExact = C.div(C.add(left, right), TWO);
      const midpoint = iterationValue(midpointExact, machine, basis);
      const aPoint = evaluatePoint(ast, left, machine, options.angleMode);
      const bPoint = evaluatePoint(ast, right, machine, options.angleMode);
      let cPoint;
      try {
        cPoint = evaluatePoint(ast, midpoint, machine, options.angleMode);
      } catch (err) {
        return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, continuityFailure(err.message), rows, warnings);
      }
      const currentLeftSign = decisionSign(aPoint, basis);
      const midSign = decisionSign(cPoint, basis);
      const keepLeftHalf = currentLeftSign === 0 || currentLeftSign * midSign <= 0;
      const error = prevC != null ? Math.abs(realNumber(C.sub(midpoint, prevC), "Bisection error")) : null;
      const nextLeft = keepLeftHalf ? left : midpoint;
      const nextRight = keepLeftHalf ? midpoint : right;
      let bound;
      if (midSign === 0) {
        bound = relativeMode ? 0 : toleranceFromIterations(initialLeft, initialRight, iteration);
      } else {
        try {
          bound = relativeMode
            ? bisectionRelativeBound(nextLeft, nextRight)
            : toleranceFromIterations(initialLeft, initialRight, iteration);
        } catch (err) {
          addWarning(warnings, "relative-tolerance-invalid", err.message);
          return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
            null,
            "valid-bracket",
            "relative-tolerance-invalid",
            {
              stopDetail: err.message,
              residualBasis: "unavailable",
              error
            }
          ), rows, warnings);
        }
      }

      rows.push({
        iteration,
        a: left,
        b: right,
        c: midpoint,
        fa: aPoint,
        fb: bPoint,
        fc: cPoint,
        exactSigns: { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
        machineSigns: { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign },
        decision: keepLeftHalf ? "left" : "right",
        width: Math.abs(realNumber(C.sub(right, left), "Interval width")),
        bound,
        error,
        note: formatDisagreementNote(disagreementLabels(
          ["a", "b", "c"],
          { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
          { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign }
        ))
      });
      prevC = midpoint;

      if (midSign === 0) {
        const residualData = pointResidual(cPoint, basis);
        return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
          midpoint,
          "root-at-midpoint",
          zeroStopReasonForPoint(cPoint),
          {
            residual: residualData.residual,
            residualBasis: residualData.residualBasis,
            error,
            bound: rows[rows.length - 1].bound
          }
        ), rows, warnings);
      }

      if (relativeMode && bound < stopping.epsilonBound) {
        const residualData = pointResidual(cPoint, basis);
        return bisectionResult(options, ast, machine, leftPoint, rightPoint, Object.assign({}, stopping, {
          iterationsRequired: iteration,
          epsilonBound: stopping.epsilonBound
        }), summaryPackage(
          midpoint,
          "valid-bracket",
          "tolerance-reached",
          {
            residual: residualData.residual,
            residualBasis: residualData.residualBasis,
            error,
            bound
          }
        ), rows, warnings);
      }

      if (keepLeftHalf) {
        right = midpoint;
      } else {
        left = midpoint;
      }
    }

    const finalBracketRow = lastRow(rows);
    const residualData = finalBracketRow ? pointResidual(finalBracketRow.fc, basis) : { residual: null, residualBasis: "unavailable" };
    return bisectionResult(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
      finalBracketRow ? finalBracketRow.c : C.div(C.add(left, right), TWO),
      "valid-bracket",
      relativeMode ? "iteration-cap" : (options.stopping.kind === "epsilon" ? "tolerance-reached" : "iteration-limit"),
      {
        residual: residualData.residual,
        residualBasis: residualData.residualBasis,
        error: finalBracketRow ? finalBracketRow.error : null,
        bound: finalBracketRow ? finalBracketRow.bound : null
      }
    ), rows, warnings);
  }

  globalScope.RootEngine = {
    iterationsFromTolerance,
    toleranceFromIterations,
    runBisection,
    runNewtonRaphson,
    runSecant,
    runFalsePosition,
    runFixedPoint
  };
})(window);
