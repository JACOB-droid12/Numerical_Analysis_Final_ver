"use strict";

(function initRootsState(globalScope) {
  const METHOD_CONFIGS = [
    {
      name: "bisection",
      tabId: "root-tab-bisection",
      panelId: "root-inputs-bisection",
      computeId: "root-bis-compute",
      fieldIds: [
        "root-bis-expression", "root-bis-a", "root-bis-b", "root-bis-k",
        "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value",
        "root-bis-tolerance-type", "root-bis-decision-basis", "root-bis-sign-display"
      ],
      presentationFieldIds: ["root-bis-sign-display"]
    },
    {
      name: "newton",
      tabId: "root-tab-newton",
      panelId: "root-inputs-newton",
      computeId: "root-newton-compute",
      fieldIds: [
        "root-newton-expression", "root-newton-df", "root-newton-x0", "root-newton-k",
        "root-newton-mode", "root-newton-stop-kind", "root-newton-stop-value"
      ]
    },
    {
      name: "secant",
      tabId: "root-tab-secant",
      panelId: "root-inputs-secant",
      computeId: "root-secant-compute",
      fieldIds: [
        "root-secant-expression", "root-secant-x0", "root-secant-x1", "root-secant-k",
        "root-secant-mode", "root-secant-stop-kind", "root-secant-stop-value"
      ]
    },
    {
      name: "falsePosition",
      tabId: "root-tab-falseposition",
      panelId: "root-inputs-falseposition",
      computeId: "root-fp-compute",
      fieldIds: [
        "root-fp-expression", "root-fp-a", "root-fp-b", "root-fp-k",
        "root-fp-mode", "root-fp-stop-kind", "root-fp-stop-value",
        "root-fp-decision-basis", "root-fp-sign-display"
      ],
      presentationFieldIds: ["root-fp-sign-display"]
    },
    {
      name: "fixedPoint",
      tabId: "root-tab-fixedpoint",
      panelId: "root-inputs-fixedpoint",
      computeId: "root-fpi-compute",
      fieldIds: [
        "root-fpi-expression", "root-fpi-x0", "root-fpi-k",
        "root-fpi-mode", "root-fpi-stop-kind", "root-fpi-stop-value"
      ]
    }
  ];

  function createState() {
    return {
      activeMethod: "bisection",
      angleMode: "rad",
      runs: Object.create(null),
      methodConfigs: METHOD_CONFIGS,
      emptyTextById: {
        "root-approx": "Not calculated yet",
        "root-stopping-result": "Not calculated yet",
        "root-convergence": "Not calculated yet",
        "root-interval-status": "Not calculated yet",
        "root-sign-summary": "Not calculated yet",
        "root-decision-summary": "Not calculated yet"
      }
    };
  }

  function storeRun(state, method, run) {
    state.runs[method] = run;
  }

  function methodConfig(state, name) {
    return (state.methodConfigs || METHOD_CONFIGS).find(function findConfig(config) {
      return config.name === name;
    });
  }

  function clearRun(state, method) {
    state.runs[method] = null;
  }

  function clearAllRuns(state) {
    Object.keys(state.runs).forEach(function clear(key) {
      state.runs[key] = null;
    });
  }

  function isPresentationField(config, id) {
    return !!(config && config.presentationFieldIds && config.presentationFieldIds.indexOf(id) !== -1);
  }

  globalScope.RootsState = { createState, storeRun, methodConfig, clearRun, clearAllRuns, isPresentationField, METHOD_CONFIGS };
})(window);
