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

  function convergenceText(run, summary) {
    if (!run.stopping) {
      return "Not calculated yet";
    }
    if (run.stopping.kind === "iterations") {
      if (run.stopping.epsilonBound == null) {
        return summary.stopDetail || "N/A";
      }
      return `n = ${run.stopping.input}, epsilon <= ${C.formatReal(run.stopping.epsilonBound, 8)}`;
    }
    return `epsilon = ${run.stopping.input}`;
  }

  function renderBisection(run) {
    const summary = run.summary || {};

    setText("root-approx", summary.approximation == null
      ? "N/A"
      : C.formatReal(C.requireRealNumber(summary.approximation, "root"), 8));
    setText("root-stopping-result", stoppingText(summary));
    setText("root-convergence", convergenceText(run, summary));
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
