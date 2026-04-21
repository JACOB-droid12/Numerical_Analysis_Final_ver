"use strict";

(function initRootsState(globalScope) {
  function createState() {
    return {
      activeMethod: "bisection",
      angleMode: "deg",
      runs: Object.create(null)
    };
  }

  globalScope.RootsState = { createState };
})(window);
