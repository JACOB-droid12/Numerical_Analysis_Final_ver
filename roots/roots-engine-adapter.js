"use strict";

(function initRootsEngineAdapter(globalScope) {
  const R = globalScope.RootEngine;

  function runBisection(fields, angleMode) {
    return R.runBisection({
      expression: fields["root-bis-expression"],
      interval: { a: fields["root-bis-a"], b: fields["root-bis-b"] },
      machine: { k: Number(fields["root-bis-k"]), mode: fields["root-bis-mode"] },
      stopping: {
        kind: fields["root-bis-stop-kind"],
        value: fields["root-bis-stop-value"],
        toleranceType: fields["root-bis-tolerance-type"] || "absolute"
      },
      decisionBasis: fields["root-bis-decision-basis"] || "machine",
      signDisplay: fields["root-bis-sign-display"] || "both",
      angleMode
    });
  }

  function runNewton(fields, angleMode) {
    return R.runNewtonRaphson({
      expression: fields["root-newton-expression"],
      dfExpression: fields["root-newton-df"],
      x0: fields["root-newton-x0"],
      machine: { k: Number(fields["root-newton-k"]), mode: fields["root-newton-mode"] },
      stopping: { kind: fields["root-newton-stop-kind"], value: fields["root-newton-stop-value"] },
      angleMode
    });
  }

  function runSecant(fields, angleMode) {
    return R.runSecant({
      expression: fields["root-secant-expression"],
      x0: fields["root-secant-x0"],
      x1: fields["root-secant-x1"],
      machine: { k: Number(fields["root-secant-k"]), mode: fields["root-secant-mode"] },
      stopping: { kind: fields["root-secant-stop-kind"], value: fields["root-secant-stop-value"] },
      angleMode
    });
  }

  function runFalsePosition(fields, angleMode) {
    return R.runFalsePosition({
      expression: fields["root-fp-expression"],
      interval: { a: fields["root-fp-a"], b: fields["root-fp-b"] },
      machine: { k: Number(fields["root-fp-k"]), mode: fields["root-fp-mode"] },
      stopping: { kind: fields["root-fp-stop-kind"], value: fields["root-fp-stop-value"] },
      decisionBasis: fields["root-fp-decision-basis"] || "machine",
      signDisplay: fields["root-fp-sign-display"] || "both",
      angleMode
    });
  }

  function runFixedPoint(fields, angleMode) {
    return R.runFixedPoint({
      gExpression: fields["root-fpi-expression"],
      x0: fields["root-fpi-x0"],
      machine: { k: Number(fields["root-fpi-k"]), mode: fields["root-fpi-mode"] },
      stopping: { kind: fields["root-fpi-stop-kind"], value: fields["root-fpi-stop-value"] },
      angleMode
    });
  }

  const RUNNERS = {
    bisection: runBisection,
    newton: runNewton,
    secant: runSecant,
    falsePosition: runFalsePosition,
    fixedPoint: runFixedPoint
  };

  function runMethod(method, fields, angleMode) {
    if (!RUNNERS[method]) {
      throw new Error("Unsupported root method: " + method);
    }
    return RUNNERS[method](fields, angleMode);
  }

  globalScope.RootsEngineAdapter = { runMethod };
})(window);
