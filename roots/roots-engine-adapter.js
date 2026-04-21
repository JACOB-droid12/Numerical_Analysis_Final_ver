"use strict";

(function initRootsEngineAdapter(globalScope) {
  const R = globalScope.RootEngine;

  function runMethod(method, fields, angleMode) {
    if (method !== "bisection") {
      throw new Error(`Unsupported method in Task 2: ${method}`);
    }

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

  globalScope.RootsEngineAdapter = { runMethod };
})(window);
