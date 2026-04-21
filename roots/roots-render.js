"use strict";

(function initRootsRender(globalScope) {
  const C = globalScope.CalcEngine;

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function stoppingText(summary) {
    if (summary.approximation == null && summary.intervalStatus) {
      return summary.intervalStatus;
    }
    return summary.stopReason || summary.intervalStatus || "complete";
  }

  function renderBisection(run) {
    const summary = run.summary || {};

    setText("root-approx", summary.approximation == null
      ? "N/A"
      : C.formatReal(C.requireRealNumber(summary.approximation, "root"), 8));
    setText("root-stopping-result", stoppingText(summary));
    setText("root-convergence", run.stopping
      ? (run.stopping.kind === "iterations"
        ? `n = ${run.stopping.input}, epsilon <= ${C.formatReal(run.stopping.epsilonBound, 8)}`
        : `epsilon = ${run.stopping.input}`)
      : "Not calculated yet");
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
