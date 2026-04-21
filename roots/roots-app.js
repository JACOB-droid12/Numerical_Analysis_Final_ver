"use strict";

(function initRootsApp(globalScope) {
  function byId(id) {
    return document.getElementById(id);
  }

  function fieldsForBisection() {
    return {
      "root-bis-expression": byId("root-bis-expression").value,
      "root-bis-a": byId("root-bis-a").value,
      "root-bis-b": byId("root-bis-b").value,
      "root-bis-k": byId("root-bis-k").value,
      "root-bis-mode": byId("root-bis-mode").value,
      "root-bis-stop-kind": byId("root-bis-stop-kind").value,
      "root-bis-stop-value": byId("root-bis-stop-value").value,
      "root-bis-tolerance-type": byId("root-bis-tolerance-type").value,
      "root-bis-decision-basis": byId("root-bis-decision-basis").value,
      "root-bis-sign-display": byId("root-bis-sign-display").value
    };
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    const state = globalScope.RootsState.createState();
    globalScope.RootsRender.resetResults(state);

    byId("root-bis-compute").addEventListener("click", function onBisectionCompute() {
      const run = globalScope.RootsEngineAdapter.runMethod("bisection", fieldsForBisection(), state.angleMode);
      globalScope.RootsState.storeRun(state, "bisection", run);
      globalScope.RootsRender.renderBisection(run);
    });

    byId("angle-toggle").addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      byId("status-angle").textContent = state.angleMode.toUpperCase();
      byId("angle-toggle").textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
    });
  });
})(window);
