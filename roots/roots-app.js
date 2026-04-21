"use strict";

(function initRootsApp(globalScope) {
  function byId(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    const state = globalScope.RootsState.createState();
    byId("angle-toggle").addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      byId("status-angle").textContent = state.angleMode.toUpperCase();
      byId("angle-toggle").textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
    });
  });
})(window);
