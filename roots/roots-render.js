"use strict";

(function initRootsRender(globalScope) {
  const C = globalScope.CalcEngine;

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderBisection(run) {
    setText("root-approx", C.formatReal(C.requireRealNumber(run.summary.approximation, "root"), 8));
    setText("root-stopping-result", run.summary.stopReason || run.summary.intervalStatus || "complete");
    setText("root-convergence", run.stopping.kind === "iterations"
      ? `n = ${run.stopping.input}, epsilon <= ${C.formatReal(run.stopping.epsilonBound, 8)}`
      : `epsilon = ${run.stopping.input}`);
    document.getElementById("root-empty").hidden = true;
    document.getElementById("root-result-stage").hidden = false;
  }

  function resetResults(state) {
    Object.keys(state.emptyTextById).forEach((id) => setText(id, state.emptyTextById[id]));
    document.getElementById("root-empty").hidden = false;
    document.getElementById("root-result-stage").hidden = true;
  }

  globalScope.RootsRender = { renderBisection, resetResults };
})(window);
