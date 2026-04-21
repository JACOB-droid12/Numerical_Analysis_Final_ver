"use strict";

(function initRootsState(globalScope) {
  function createState() {
    return {
      activeMethod: "bisection",
      angleMode: "deg",
      runs: Object.create(null),
      emptyTextById: {
        "root-approx": "Not calculated yet",
        "root-stopping-result": "Not calculated yet",
        "root-convergence": "Not calculated yet"
      }
    };
  }

  function storeRun(state, method, run) {
    state.runs[method] = run;
  }

  globalScope.RootsState = { createState, storeRun };
})(window);
