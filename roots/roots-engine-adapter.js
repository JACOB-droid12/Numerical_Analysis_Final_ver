"use strict";

(function initRootsEngineAdapter(globalScope) {
  function runMethod() {
    throw new Error("RootsEngineAdapter.runMethod() is not implemented yet.");
  }

  globalScope.RootsEngineAdapter = { runMethod };
})(window);
