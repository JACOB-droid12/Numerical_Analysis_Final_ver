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
  const NEWTON_STEP_BLOWUP_RATIO = 10;
  const NEWTON_RESIDUAL_BOUND = 1e-10;
  const FP_STAGNATION_WINDOW = 20;
  const FP_CYCLE_PERIODS = [2, 3, 4];

  function valueHasNonFinite(value) {
    if (value == null) {
      return false;
    }
    if (C.isRationalValue(value)) {
      return false;
    }
    if (C.isCalcValue(value)) {
      return !Number.isFinite(value.re) || !Number.isFinite(value.im);
    }
    if (typeof value === "number") {
      return !Number.isFinite(value);
    }
    if (typeof value === "object") {
      if (Object.prototype.hasOwnProperty.call(value, "approx")) {
        return valueHasNonFinite(value.approx);
      }
      if (Object.prototype.hasOwnProperty.call(value, "machine")) {
        return valueHasNonFinite(value.machine);
      }
      if (Object.prototype.hasOwnProperty.call(value, "reference")) {
        return valueHasNonFinite(value.reference);
      }
    }
    return false;
  }

  function safeEvaluate(evalFn, ...args) {
    try {
      const point = evalFn(...args);
      if (point && (valueHasNonFinite(point.approx) || valueHasNonFinite(point.machine))) {
        return { ok: false, reason: "non-finite-evaluation", message: "Evaluation produced a non-finite result." };
      }
      return { ok: true, point };
    } catch (error) {
      return { ok: false, reason: "singularity-encountered", message: error.message };
    }
  }

  function validateAndParseOpenStopping(options) {
    try {
      return { ok: true, value: parseOpenStopping(options) };
    } catch (error) {
      return { ok: false, reason: "invalid-input", message: error.message };
    }
  }

  function validateAndParseStartingScalar(text, label) {
    try {
      return { ok: true, value: parseScalarInput(text, label) };
    } catch (error) {
      return { ok: false, reason: "invalid-input", message: error.message };
    }
  }

  function buildInvalidInputResult(options, method, rejection) {
    const expression = options && Object.prototype.hasOwnProperty.call(options, "expression")
      ? options.expression
      : (options && Object.prototype.hasOwnProperty.call(options, "gExpression")
        ? options.gExpression
        : null);
    const stoppingInput = options && options.stopping && Object.prototype.hasOwnProperty.call(options.stopping, "value")
      ? options.stopping.value
      : null;
    return {
      method,
      expression,
      canonical: "",
      machine: options && options.machine ? options.machine : null,
      stopping: {
        kind: options && options.stopping && Object.prototype.hasOwnProperty.call(options.stopping, "kind") ? options.stopping.kind : null,
        input: stoppingInput,
        iterationsRequired: 0,
        epsilonBound: null,
        maxIterations: 0,
        capReached: false
      },
      summary: summaryPackage(null, null, "invalid-input", {
        stopDetail: rejection && rejection.message ? rejection.message : ""
      }),
      initial: null,
      decisionBasis: null,
      signDisplay: null,
      rows: []
    };
  }

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

  function validateBisectionStopping(options) {
    if (!options || !options.stopping) {
      return { ok: false, reason: "invalid-input", message: "Stopping rule is required." };
    }
    if (options.stopping.kind === "epsilon") {
      try {
        const epsilonValue = parseScalarInput(options.stopping.value, "Tolerance epsilon");
        if (C.isRationalValue(epsilonValue)) {
          if (M.isZero(epsilonValue) || epsilonValue.sign <= 0) {
            return { ok: false, reason: "invalid-input", message: "Enter a tolerance epsilon greater than 0." };
          }
          return { ok: true, value: options.stopping };
        }
        const epsilon = C.requireRealNumber(epsilonValue, "Tolerance epsilon");
        if (!Number.isFinite(epsilon) || !(epsilon > 0)) {
          return { ok: false, reason: "invalid-input", message: "Enter a tolerance epsilon greater than 0." };
        }
        return { ok: true, value: options.stopping };
      } catch (error) {
        return { ok: false, reason: "invalid-input", message: "Enter a tolerance epsilon greater than 0." };
      }
    }
    if (options.stopping.kind === "iterations") {
      const iterations = Number(options.stopping.value);
      if (!Number.isInteger(iterations) || iterations < 1) {
        return { ok: false, reason: "invalid-input", message: "Enter a whole number of iterations, 1 or greater." };
      }
      return { ok: true, value: options.stopping };
    }
    return { ok: false, reason: "invalid-input", message: "Unknown stopping rule." };
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

  function stepTolerance(stopping) {
    return stopping && stopping.kind === "epsilon" ? stopping.epsilon : C.EPS;
  }

  function relativeStepError(error, nextValue) {
    const nextReal = realNumber(nextValue, "Next iterate");
    return error / Math.max(1, Math.abs(nextReal));
  }

  function stepIsStableForConvergence(error, nextValue, stopping) {
    const tolerance = stepTolerance(stopping);
    return error <= tolerance || relativeStepError(error, nextValue) <= tolerance;
  }

  function exactDifferenceIsZero(left, right) {
    return isStrictZeroValue(C.sub(left, right));
  }

  function fixedPointStepIsShrinking(error, previousError) {
    if (previousError == null) {
      return false;
    }
    const scale = Math.max(1, previousError);
    return error < previousError && Math.abs(previousError - error) > C.EPS * scale;
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
    if (valueHasNonFinite(exact)) {
      return { exact, approx: exact };
    }
    const data = C.machineApproxValue(exact, machine.k, machine.mode);
    return { exact, approx: data.approx };
  }

  function runNewtonRaphson(options) {
    if (!options || !options.machine) {
      throw new Error("Newton options require a machine configuration.");
    }
    const machine = options.machine;
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "newton", stoppingValidation);
    }
    const x0Validation = validateAndParseStartingScalar(options.x0, "Starting point x\u2080");
    if (!x0Validation.ok) {
      return buildInvalidInputResult(options, "newton", x0Validation);
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const dfAst = E.parseExpression(String(options.dfExpression || ""), { allowVariable: true });
    const stopping = stoppingValidation.value;
    const x0Value = x0Validation.value;
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);
    let previousError = null;

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fnResult = safeEvaluate(evaluateFn, fAst, xn, machine, options.angleMode);
      if (!fnResult.ok) {
        finalStopReason = fnResult.reason;
        rows.push({ iteration: iter, xn, fxn: null, dfxn: null, xNext: null, error: null, note: fnResult.message });
        break;
      }
      const fn = fnResult.point;

      if (isStrictZeroValue(fn.exact)) {
        finalStopReason = "exact-zero";
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: null, xNext: xn, error: 0, note: "f(x\u2099) is exactly zero" });
        break;
      }

      const dfnResult = safeEvaluate(evaluateFn, dfAst, xn, machine, options.angleMode);
      if (!dfnResult.ok) {
        finalStopReason = dfnResult.reason;
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: null, xNext: null, error: null, note: dfnResult.message });
        break;
      }
      const dfn = dfnResult.point;
      const dfVal = realNumber(dfn.approx, "f'(x\u2099)");

      if (isStrictZeroValue(dfn.exact)) {
        finalStopReason = "derivative-zero";
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext: null, error: null, note: "f\u2032(x) \u2248 0, method cannot continue" });
        break;
      }

      const stepDenominator = Math.abs(dfVal) < C.EPS && !isStrictZeroValue(dfn.exact) ? dfn.exact : dfn.approx;
      let stepExact;
      try {
        stepExact = C.div(fn.approx, stepDenominator);
      } catch (err) {
        finalStopReason = "derivative-zero";
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext: null, error: null, note: "f\u2032(x) \u2248 0, method cannot continue" });
        break;
      }
      const stepStored = machineStore(stepExact, machine);
      const xNextExact = C.sub(xn, stepStored);
      const xNext = machineStore(xNextExact, machine);
      const error = Math.abs(realNumber(C.sub(xNext, xn), "Newton error"));

      rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext, error, note: "" });

      const referenceStep = previousError != null ? previousError : Math.max(Math.abs(realNumber(xn, "x\u2099")), 1);
      if (error > NEWTON_STEP_BLOWUP_RATIO * referenceStep) {
        finalStopReason = "diverged-step";
        rows[rows.length - 1].note = "Newton step grew too quickly to trust convergence.";
        break;
      }

      const fnVal = realNumber(fn.approx, "f(x\u2099)");
      if (Math.abs(fnVal) < C.EPS) {
        if (stepIsStableForConvergence(error, xNext, stopping)) {
          finalStopReason = "machine-zero";
          xn = xNext;
          break;
        }

        rows[rows.length - 1].note = "f(x\u2099) is near zero, but the Newton step is still too large to verify convergence";
      }

      previousError = error;
      xn = xNext;

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        const nextResidualResult = safeEvaluate(evaluateFn, fAst, xNext, machine, options.angleMode);
        if (!nextResidualResult.ok) {
          finalStopReason = nextResidualResult.reason;
          rows[rows.length - 1].note = nextResidualResult.message;
          break;
        }

        const nextResidual = Math.abs(realNumber(nextResidualResult.point.approx, "f(x\u2099₊₁)"));
        const currentResidual = Math.abs(fnVal);
        const residualFloor = NEWTON_RESIDUAL_BOUND * Math.max(1, Math.abs(realNumber(xNext, "x\u2099₊₁")));
        if (nextResidual < currentResidual || nextResidual <= residualFloor) {
          finalStopReason = "tolerance-reached";
          break;
        }

        finalStopReason = "step-small-residual-large";
        rows[rows.length - 1].note = "The Newton step is below epsilon, but the residual is still too large to confirm convergence.";
        break;
      }
    }

    const finalRow = lastRow(rows);
    const approx = finalRow ? (finalRow.xNext != null ? finalRow.xNext : finalRow.xn) : x0Value;
    const finalResidualResult = approx != null ? safeEvaluate(evaluateFn, fAst, approx, machine, options.angleMode) : null;
    const finalResidual = finalResidualResult && finalResidualResult.ok ? finalResidualResult.point.approx : null;
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
    const machine = options.machine;
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "secant", stoppingValidation);
    }
    const x0Validation = validateAndParseStartingScalar(options.x0, "First point x\u2080");
    if (!x0Validation.ok) {
      return buildInvalidInputResult(options, "secant", x0Validation);
    }
    const x1Validation = validateAndParseStartingScalar(options.x1, "Second point x\u2081");
    if (!x1Validation.ok) {
      return buildInvalidInputResult(options, "secant", x1Validation);
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const stopping = stoppingValidation.value;
    const x0Value = x0Validation.value;
    const x1Value = x1Validation.value;

    let xPrev = machineStore(x0Value, machine);
    let xn = machineStore(x1Value, machine);
    const fPrevResult = safeEvaluate(evaluateFn, fAst, xPrev, machine, options.angleMode);
    if (!fPrevResult.ok) {
      return {
        method: "secant",
        expression: options.expression,
        canonical: E.formatExpression(fAst),
        machine,
        stopping: fmtStopResult(stopping, [], fPrevResult.reason),
        summary: summaryPackage(null, null, fPrevResult.reason, {
          residual: null,
          residualBasis: "unavailable",
          error: null,
          stopDetail: fPrevResult.message
        }),
        initial: null,
        decisionBasis: null,
        signDisplay: null,
        rows: []
      };
    }
    let fPrev = fPrevResult.point.approx;

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fnResult = safeEvaluate(evaluateFn, fAst, xn, machine, options.angleMode);
      if (!fnResult.ok) {
        finalStopReason = fnResult.reason;
        rows.push({ iteration: iter, xPrev, xn, fxPrev: fPrev, fxn: null, xNext: null, error: null, note: fnResult.message });
        break;
      }
      const fn = fnResult.point;
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
    const finalResidualResult = approx != null ? safeEvaluate(evaluateFn, fAst, approx, machine, options.angleMode) : null;
    const finalResidual = finalResidualResult && finalResidualResult.ok ? finalResidualResult.point.approx : null;
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
    const machine = options.machine;
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", stoppingValidation);
    }
    const interval = options.interval;
    if (!interval || typeof interval !== "object") {
      return buildInvalidInputResult(options, "falsePosition", {
        ok: false,
        reason: "invalid-input",
        message: "Interval endpoints are required."
      });
    }
    const leftValidation = validateAndParseStartingScalar(interval.a, "Left endpoint a");
    if (!leftValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", leftValidation);
    }
    const rightValidation = validateAndParseStartingScalar(interval.b, "Right endpoint b");
    if (!rightValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", rightValidation);
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const leftInput = leftValidation.value;
    const rightInput = rightValidation.value;
    if (realNumber(leftInput, "Left endpoint a") >= realNumber(rightInput, "Right endpoint b")) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }

    let left = iterationValue(leftInput, machine, basis);
    let right = iterationValue(rightInput, machine, basis);
    const stopping = stoppingValidation.value;
    const leftPointResult = safeEvaluate(evaluatePoint, ast, left, machine, options.angleMode);
    if (!leftPointResult.ok) {
      return earlyResultLikeFalsePosition(options, ast, machine, stopping, null, null, null, leftPointResult.reason, leftPointResult.message, []);
    }
    const leftPoint = leftPointResult.point;
    const rightPointResult = safeEvaluate(evaluatePoint, ast, right, machine, options.angleMode);
    if (!rightPointResult.ok) {
      return earlyResultLikeFalsePosition(options, ast, machine, stopping, leftPoint, null, null, rightPointResult.reason, rightPointResult.message, []);
    }
    const rightPoint = rightPointResult.point;
    const leftSign = decisionSign(leftPoint, basis);
    const rightSign = decisionSign(rightPoint, basis);

    const earlyResult = function(approximation, intervalStatus, stopReason, rows, stopDetail) {
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
          bound: finalBracketRow ? finalBracketRow.bound : null,
          stopDetail: stopDetail || ""
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
    let retainedSide = null;
    let retainedCount = 0;

    for (let iteration = 1; iteration <= stopping.maxIterations; iteration += 1) {
      const aPointResult = safeEvaluate(evaluatePoint, ast, left, machine, options.angleMode);
      if (!aPointResult.ok) {
        return earlyResult(midpointValue(left, right), "valid-bracket", aPointResult.reason, rows, aPointResult.message);
      }
      const aPoint = aPointResult.point;
      const bPointResult = safeEvaluate(evaluatePoint, ast, right, machine, options.angleMode);
      if (!bPointResult.ok) {
        return earlyResult(midpointValue(left, right), "valid-bracket", bPointResult.reason, rows, bPointResult.message);
      }
      const bPoint = bPointResult.point;
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

      const cPointResult = safeEvaluate(evaluatePoint, ast, midpoint, machine, options.angleMode);
      if (!cPointResult.ok) {
        return earlyResult(midpoint, "valid-bracket", cPointResult.reason, rows, cPointResult.message);
      }
      const cPoint = cPointResult.point;
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
      const retainedThisIteration = keepLeftHalf ? "right" : "left";
      if (retainedSide === retainedThisIteration) {
        retainedCount += 1;
      } else {
        retainedSide = retainedThisIteration;
        retainedCount = 1;
      }
      if (retainedCount >= FP_STAGNATION_WINDOW) {
        return earlyResult(midpoint, "valid-bracket", "retained-endpoint-stagnation", rows);
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

  function midpointValue(left, right) {
    return C.div(C.add(left, right), TWO);
  }

  function earlyResultLikeFalsePosition(options, ast, machine, stopping, leftPoint, rightPoint, rows, stopReason, stopDetail, resultRows) {
    const finalRows = resultRows || [];
    const finalBracketRow = lastRow(finalRows);
    return {
      method: "falsePosition",
      expression: options.expression,
      canonical: E.formatExpression(ast),
      machine,
      stopping: fmtStopResult(stopping, finalRows, stopReason),
      summary: summaryPackage(null, "invalid-continuity", stopReason, {
        residual: null,
        residualBasis: "unavailable",
        error: finalBracketRow ? finalBracketRow.error : null,
        bound: finalBracketRow ? finalBracketRow.bound : null,
        stopDetail: stopDetail || ""
      }),
      initial: makeInitial(leftPoint, rightPoint),
      decisionBasis: options.decisionBasis,
      signDisplay: options.signDisplay,
      rows: finalRows
    };
  }

  function runFixedPoint(options) {
    if (!options || !options.machine) {
      throw new Error("Fixed point options require a machine configuration.");
    }
    const machine = options.machine;
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "fixedPoint", stoppingValidation);
    }
    const x0Validation = validateAndParseStartingScalar(options.x0, "Starting point x\u2080");
    if (!x0Validation.ok) {
      return buildInvalidInputResult(options, "fixedPoint", x0Validation);
    }
    const gAst = E.parseExpression(String(options.gExpression || ""), { allowVariable: true });
    const stopping = stoppingValidation.value;

    const x0Value = x0Validation.value;
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);
    const DIVERGE_LIMIT = 1e8;
    let previousError = null;

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const gnResult = safeEvaluate(evaluateFn, gAst, xn, machine, options.angleMode);
      if (!gnResult.ok) {
        finalStopReason = gnResult.reason;
        rows.push({ iteration: iter, xn, gxn: null, error: null, note: gnResult.message });
        break;
      }
      const gn = gnResult.point;
      const xNext = machineStore(gn.approx, machine);
      const xnReal = realNumber(xn, "x\u2099");
      const xNextReal = realNumber(xNext, "g(x\u2099)");
      const error = Math.abs(xNextReal - xnReal);
      const exactFixedPoint = exactDifferenceIsZero(gn.exact, xn);

      rows.push({ iteration: iter, xn, gxn: xNext, error, note: "" });

      if (exactFixedPoint) {
        finalStopReason = "exact-zero";
        rows[rows.length - 1].note = "g(x\u2099) equals x\u2099 exactly";
        break;
      }

      if (Math.abs(xNextReal) > DIVERGE_LIMIT) {
        finalStopReason = "diverged";
        break;
      }

      if (stopping.kind === "epsilon" && error === 0) {
        finalStopReason = "tolerance-reached";
        rows[rows.length - 1].note = "machine iterate is frozen within the epsilon stopping rule";
        xn = xNext;
        break;
      }

      for (const period of FP_CYCLE_PERIODS) {
        if (rows.length < period * 2) {
          continue;
        }

        const priorRow = rows[rows.length - period];
        if (!priorRow || priorRow.xn == null) {
          continue;
        }

        const priorReal = realNumber(priorRow.xn, "Cycle reference");
        const scale = Math.max(1, Math.abs(xNextReal), Math.abs(priorReal));
        const tolerance = stopping.kind === "epsilon"
          ? Math.max(stopping.epsilon, Number.EPSILON * scale)
          : Number.EPSILON * scale;

        if (Math.abs(xNextReal - priorReal) <= tolerance) {
          let hasDistinctInterveningState = false;
          for (let offset = 1; offset < period; offset += 1) {
            const interveningRow = rows[rows.length - offset];
            if (!interveningRow || interveningRow.xn == null) {
              continue;
            }
            const interveningReal = realNumber(interveningRow.xn, "Cycle intervening state");
            if (Math.abs(interveningReal - xNextReal) > tolerance) {
              hasDistinctInterveningState = true;
              break;
            }
          }

          if (!hasDistinctInterveningState) {
            continue;
          }

          let hasStableCycleWindow = true;
          for (let offset = 0; offset < period; offset += 1) {
            const currentWindowRow = rows[rows.length - period + offset];
            const previousWindowRow = rows[rows.length - 2 * period + offset];
            if (
              !currentWindowRow ||
              !previousWindowRow ||
              currentWindowRow.error == null ||
              previousWindowRow.error == null
            ) {
              hasStableCycleWindow = false;
              break;
            }

            const errorScale = Math.max(1, Math.abs(currentWindowRow.error), Math.abs(previousWindowRow.error));
            const errorTolerance = Number.EPSILON * errorScale;
            if (Math.abs(currentWindowRow.error - previousWindowRow.error) > errorTolerance) {
              hasStableCycleWindow = false;
              break;
            }
          }

          if (!hasStableCycleWindow) {
            continue;
          }

          finalStopReason = "cycle-detected";
          rows[rows.length - 1].note = `Cycle detected with period ${period}.`;
          rows[rows.length - 1].cyclePeriod = period;
          xn = xNext;
          break;
        }
      }

      if (finalStopReason === "cycle-detected") {
        break;
      }

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        if (fixedPointStepIsShrinking(error, previousError)) {
          finalStopReason = "tolerance-reached";
          xn = xNext;
          break;
        }
        rows[rows.length - 1].note = previousError == null
          ? "step is below epsilon on the first iteration, but convergence is not verified yet"
          : "step is below epsilon but is not shrinking, so convergence is not verified";
      }

      previousError = error;
      xn = xNext;
    }

    const finalRow = lastRow(rows);
    const approx = finalStopReason === "diverged" ? null
      : (finalRow ? finalRow.gxn : x0Value);
    const finalResidualResult = approx != null ? safeEvaluate(evaluateFn, gAst, approx, machine, options.angleMode) : null;
    const finalResidual = finalResidualResult && finalResidualResult.ok
      ? C.sub(finalResidualResult.point.approx, approx)
      : null;
    const finalError = finalRow && finalRow.error != null ? finalRow.error : null;
    const summaryDiagnostics = {
      residual: finalResidual,
      residualBasis: finalResidual == null ? "unavailable" : "machine",
      error: finalError
    };
    if (finalRow && finalRow.cyclePeriod != null) {
      summaryDiagnostics.cyclePeriod = finalRow.cyclePeriod;
    }

    return {
      method: "fixedPoint",
      expression: options.gExpression,
      canonical: E.formatExpression(gAst),
      machine,
      stopping: fmtStopResult(stopping, rows, finalStopReason),
      summary: summaryPackage(approx, null, finalStopReason, summaryDiagnostics),
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
    const stoppingValidation = validateBisectionStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "bisection", stoppingValidation);
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
