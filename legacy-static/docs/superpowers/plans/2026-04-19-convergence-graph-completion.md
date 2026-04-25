# Convergence Graph Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an f(x) function plot with iterate markers to Module IV's convergence graph, wrap both plots in an accessible tab switcher, and polish the existing error plot with tooltips and screen-reader support.

**Architecture:** Everything stays inside the existing `root-ui.js` IIFE. Three new functions (`renderGraphTabs`, `renderFunctionPlot`, `renderErrorPlot`) replace the single `renderConvergenceGraph`. No new JS files. CSS additions go beside the existing `.root-graph-*` block. The HTML mount point (`#root-convergence-graph`) is unchanged.

**Tech Stack:** Vanilla JS, inline SVG, CSS custom properties — matching the existing codebase.

**Spec:** [`docs/superpowers/specs/2026-04-19-convergence-graph-completion-design.md`](file:///c:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/docs/superpowers/specs/2026-04-19-convergence-graph-completion-design.md)

---

### Task 1: Relocate error plot into `renderErrorPlot` + build tab shell

**Purpose:** Extract the existing `renderConvergenceGraph` body verbatim into a new `renderErrorPlot(run, panelEl)` function, then build `renderGraphTabs(run)` to create the ARIA tab strip + two panels. The error plot is visually unchanged — this is a safe refactor.

**Files:**
- Modify: `root-ui.js:472` (call site in `renderRun`) 
- Modify: `root-ui.js:484–558` (`renderConvergenceGraph` → rename to `renderErrorPlot`, add tab shell)
- Modify: `root-ui.js:879–880` (reset logic for graph)

- [ ] **Step 1: Create `renderErrorPlot(run, panelEl)` by extracting the body of `renderConvergenceGraph`**

In `root-ui.js`, locate the `renderConvergenceGraph` function (line 485). Rename it to `renderErrorPlot` and change its signature to accept `(run, panelEl)` instead of `(run)`. Replace the internal `const container = byId("root-convergence-graph");` line with `const container = panelEl;`. The rest of the body stays verbatim.

Add `<title>` and `<desc>` to the SVG for accessibility. Also wrap any future entry animation in a `prefers-reduced-motion` media check.

```javascript
  function renderErrorPlot(run, panelEl) {
    const container = panelEl;
    if (!container) return;

    const errorPoints = run.rows
      .map(function(r) { return { iteration: r.iteration, error: r.error }; })
      .filter(function(p) { return p.error != null && p.error > 0; });
    if (errorPoints.length < 2) {
      container.innerHTML = "<p class='focus-note root-graph-empty'>Not enough iterations to plot convergence.</p>";
      return;
    }

    const W = 480, H = 200, PL = 52, PR = 16, PT = 16, PB = 36;
    const plotW = W - PL - PR;
    const plotH = H - PT - PB;

    const logErrors = errorPoints.map(function(p) { return Math.log10(Math.max(p.error, 1e-15)); });
    const minLog = Math.floor(Math.min.apply(null, logErrors)) - 0.5;
    const maxLog = Math.ceil(Math.max.apply(null, logErrors)) + 0.5;
    const logRange = maxLog - minLog || 1;
    const minIteration = Math.min.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    const maxIteration = Math.max.apply(null, errorPoints.map(function(p) { return p.iteration; }));
    const iterationRange = maxIteration - minIteration || 1;

    function xCoord(iteration) { return PL + ((iteration - minIteration) / iterationRange) * plotW; }
    function yCoord(v) { return PT + plotH - ((v - minLog) / logRange) * plotH; }

    const points = errorPoints.map(function(p) {
      return xCoord(p.iteration).toFixed(1) + "," + yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1);
    }).join(" ");

    var firstPower = Math.ceil(minLog);
    var lastPower = Math.floor(maxLog);
    var allPowers = [];
    for (var power = firstPower; power <= lastPower; power += 1) {
      allPowers.push(power);
    }
    var tickCount = Math.min(5, allPowers.length);
    var yTicks = [];
    for (var t = 0; t < tickCount; t += 1) {
      var sourceIndex = tickCount === 1
        ? 0
        : Math.round((t / (tickCount - 1)) * (allPowers.length - 1));
      var logVal = allPowers[sourceIndex];
      yTicks.push({ y: yCoord(logVal).toFixed(1), label: "10^" + logVal });
    }
    var yTicksHTML = yTicks.map(function(t) {
      return '<text x="' + (PL - 4) + '" y="' + t.y + '" text-anchor="end" dominant-baseline="middle" class="root-graph-label">' + t.label + '</text>' +
             '<line x1="' + PL + '" y1="' + t.y + '" x2="' + (PL + plotW) + '" y2="' + t.y + '" class="root-graph-grid"/>';
    }).join("");

    var xTicks = errorPoints.map(function(p, i) {
      if (errorPoints.length <= 10 || i % Math.ceil(errorPoints.length / 8) === 0 || i === errorPoints.length - 1) {
        return '<text x="' + xCoord(p.iteration).toFixed(1) + '" y="' + (H - PB + 14) + '" text-anchor="middle" class="root-graph-label">' + p.iteration + '</text>';
      }
      return "";
    }).join("");

    var circles = errorPoints.map(function(p) {
      var cx = xCoord(p.iteration).toFixed(1);
      var cy = yCoord(Math.log10(Math.max(p.error, 1e-15))).toFixed(1);
      return '<circle cx="' + cx + '" cy="' + cy + '" r="3" class="root-graph-dot" tabindex="0" data-i="' + p.iteration + '" data-x="' + C.formatReal(p.error, 8) + '"/>';
    }).join("");

    container.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="root-convergence-svg" role="img" aria-labelledby="root-error-plot-title root-error-plot-desc">' +
      '<title id="root-error-plot-title">Convergence rate</title>' +
      '<desc id="root-error-plot-desc">Log base 10 of the absolute error on each iteration.</desc>' +
      '<rect x="' + PL + '" y="' + PT + '" width="' + plotW + '" height="' + plotH + '" class="root-graph-bg"/>' +
      yTicksHTML +
      '<polyline points="' + points + '" class="root-graph-line"/>' +
      circles +
      xTicks +
      '<text x="' + (PL + plotW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="root-graph-label">Iteration</text>' +
      '<text x="' + (PL - 38) + '" y="' + (PT + plotH / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,' + (PL - 38) + ',' + (PT + plotH / 2) + ')" class="root-graph-label">log\u2081\u2080 |error|</text>' +
      '</svg>';
  }
```

- [ ] **Step 2: Create `renderGraphTabs(run)` — the tab shell**

Add a new function above `renderErrorPlot`. It builds the tab strip and two panels, then calls `renderFunctionPlot` and `renderErrorPlot` for the content. The function tab is selected by default.

```javascript
  function renderGraphTabs(run) {
    var container = byId("root-convergence-graph");
    if (!container) return;

    // Build tab strip
    var tabsHTML =
      '<div class="root-graph-tabs" role="tablist" aria-label="Graph view">' +
        '<button class="root-graph-tab" role="tab" aria-selected="true" aria-controls="root-graph-panel-function" id="root-graph-tab-function" tabindex="0" data-panel="function">Function f(x)</button>' +
        '<button class="root-graph-tab" role="tab" aria-selected="false" aria-controls="root-graph-panel-error" id="root-graph-tab-error" tabindex="-1" data-panel="error">Convergence rate</button>' +
      '</div>' +
      '<div class="root-graph-panel" role="tabpanel" id="root-graph-panel-function" aria-labelledby="root-graph-tab-function"></div>' +
      '<div class="root-graph-panel" role="tabpanel" id="root-graph-panel-error" aria-labelledby="root-graph-tab-error" hidden></div>';

    container.innerHTML = tabsHTML;

    // Render content into panels
    var functionPanel = container.querySelector("#root-graph-panel-function");
    var errorPanel = container.querySelector("#root-graph-panel-error");

    renderFunctionPlot(run, functionPanel);
    renderErrorPlot(run, errorPanel);

    // Wire tab keyboard + click
    var tabs = container.querySelectorAll("[role='tab']");
    var panels = container.querySelectorAll("[role='tabpanel']");

    function activateTab(tab) {
      tabs.forEach(function(t) {
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });
      panels.forEach(function(p) { p.hidden = true; });

      tab.setAttribute("aria-selected", "true");
      tab.setAttribute("tabindex", "0");
      tab.focus();
      var targetId = tab.getAttribute("aria-controls");
      var targetPanel = container.querySelector("#" + targetId);
      if (targetPanel) targetPanel.hidden = false;
    }

    tabs.forEach(function(tab) {
      tab.addEventListener("click", function() { activateTab(tab); });
    });

    container.querySelector("[role='tablist']").addEventListener("keydown", function(e) {
      var tabArr = Array.prototype.slice.call(tabs);
      var currentIndex = tabArr.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      var newIndex = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        newIndex = (currentIndex + 1) % tabArr.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        newIndex = (currentIndex - 1 + tabArr.length) % tabArr.length;
      } else if (e.key === "Home") {
        newIndex = 0;
      } else if (e.key === "End") {
        newIndex = tabArr.length - 1;
      }
      if (newIndex >= 0) {
        e.preventDefault();
        activateTab(tabArr[newIndex]);
      }
    });
  }
```

- [ ] **Step 3: Replace call site and reset logic**

In `renderRun` (line 472), change:

```javascript
    // OLD:
    renderConvergenceGraph(run);
    // NEW:
    renderGraphTabs(run);
```

In `resetResults` (line 879–880), the existing `graphEl.innerHTML = ""` already clears the container — no change needed here.

- [ ] **Step 4: Add stub for `renderFunctionPlot`**

Below `renderGraphTabs`, add a minimal stub so the app doesn't crash. We implement the real function plot in Task 2.

```javascript
  function renderFunctionPlot(run, panelEl) {
    if (!panelEl) return;
    panelEl.innerHTML = "<p class='focus-note root-graph-empty'>Function plot loading…</p>";
  }
```

- [ ] **Step 5: Verify the refactor is visually identical**

Open `index.html` in a browser. Run Bisection on `x^2 - 2` over `[1, 2]` with 4 iterations. Confirm:
- Two tabs appear: "Function f(x)" (selected, shows stub) and "Convergence rate"
- Switching to "Convergence rate" shows the same SVG error plot as before
- Keyboard arrow keys cycle between tabs
- No console errors

- [ ] **Step 6: Commit**

```powershell
git add root-ui.js
git commit -m "refactor: relocate error plot into renderErrorPlot + add graph tab shell"
```

---

### Task 2: Implement `renderFunctionPlot` — core function plot

**Purpose:** The primary f(x) plot with curve, zero line, iterate markers, and root marker.

**Files:**
- Modify: `root-ui.js` (replace the `renderFunctionPlot` stub from Task 1)

- [ ] **Step 1: Add helper `extractIteratePoint(row, method)`**

Place this helper near the other formatting helpers (after `fmtErr`, around line 62). It extracts `{ iteration, x, y }` from a row depending on the method.

```javascript
  function toReal(value) {
    if (value == null) return null;
    try { return C.requireRealNumber(value, "iterate"); } catch (e) { return null; }
  }

  function extractIteratePoint(row, method) {
    var ix = row.iteration;
    var x, y;
    if (method === "newton" || method === "secant") {
      x = toReal(row.xn);
      y = toReal(row.fxn);
    } else if (method === "bisection" || method === "falsePosition") {
      x = toReal(row.c);
      y = row.fc && row.fc.approx != null ? toReal(row.fc.approx) : null;
    } else if (method === "fixedPoint") {
      x = toReal(row.xn);
      var gxn = toReal(row.gxn);
      y = (x != null && gxn != null) ? gxn - x : null;
    } else {
      x = null;
      y = null;
    }
    return { iteration: ix, x: x, y: y };
  }
```

- [ ] **Step 2: Add helper `niceStep(range, targetTicks)`**

This produces "nice" grid spacing (1·10^k, 2·10^k, 5·10^k).

```javascript
  function niceStep(range, targetTicks) {
    if (range <= 0 || !Number.isFinite(range)) return 1;
    var rawStep = range / Math.max(targetTicks, 1);
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var residual = rawStep / mag;
    var nice;
    if (residual <= 1.5) nice = 1;
    else if (residual <= 3.5) nice = 2;
    else if (residual <= 7.5) nice = 5;
    else nice = 10;
    return nice * mag;
  }
```

- [ ] **Step 3: Add helper `safeSampleFn(ast, xVal, isFixedPoint)`**

A local try/catch wrapper for `E.evaluateValue` that returns `null` on any thrown or non-finite result. `isFixedPoint` subtracts `x` from the result when true.

```javascript
  function safeSampleFn(ast, xVal, isFixedPoint) {
    try {
      var result = E.evaluateValue(ast, { x: M.parseRational(String(xVal)), angleMode: "rad" });
      var real = C.requireRealNumber(result, "sample");
      if (!Number.isFinite(real)) return null;
      return isFixedPoint ? real - xVal : real;
    } catch (e) {
      return null;
    }
  }
```

- [ ] **Step 4: Implement the full `renderFunctionPlot(run, panelEl)`**

Replace the stub from Task 1. This is the core of the feature.

```javascript
  function renderFunctionPlot(run, panelEl) {
    if (!panelEl) return;

    // Determine expression source
    var exprSource = run.method === "fixedPoint"
      ? (run.expression || run.gExpression || "")
      : (run.expression || "");
    if (!exprSource) {
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>No expression to plot.</p>";
      return;
    }

    var ast;
    try {
      ast = E.parseExpression(String(exprSource), { allowVariable: true });
    } catch (e) {
      console.warn("renderFunctionPlot: parse failed:", e.message);
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>Could not re-parse expression for plot.</p>";
      return;
    }

    var isFixedPoint = run.method === "fixedPoint";
    var isBracket = run.method === "bisection" || run.method === "falsePosition";

    // Extract iterate points
    var iterates = [];
    for (var ri = 0; ri < run.rows.length; ri++) {
      var pt = extractIteratePoint(run.rows[ri], run.method);
      if (pt.x != null && Number.isFinite(pt.x)) {
        iterates.push(pt);
      }
    }

    // Collect all x-values for window computation
    var allXs = iterates.map(function(p) { return p.x; });
    var approxReal = toReal(run.summary.approximation);
    if (approxReal != null && Number.isFinite(approxReal)) allXs.push(approxReal);
    if (run.initial) {
      if (run.initial.left && run.initial.left.x != null) {
        var lx = toReal(run.initial.left.x);
        if (lx != null && Number.isFinite(lx)) allXs.push(lx);
      }
      if (run.initial.right && run.initial.right.x != null) {
        var rx = toReal(run.initial.right.x);
        if (rx != null && Number.isFinite(rx)) allXs.push(rx);
      }
    }

    allXs = allXs.filter(Number.isFinite);
    if (allXs.length === 0) {
      panelEl.innerHTML = "<p class='focus-note root-graph-empty'>Not enough data to plot.</p>";
      return;
    }

    // Window computation (spec §4)
    allXs.sort(function(a, b) { return a - b; });
    var xMinRaw = allXs[0];
    var xMaxRaw = allXs[allXs.length - 1];
    var span = xMaxRaw - xMinRaw;
    var median = allXs[Math.floor(allXs.length / 2)];
    var floor = Math.max(1e-6, 0.01 * Math.abs(median));
    span = Math.max(span, floor);
    var xMin = xMinRaw - 0.2 * span;
    var xMax = xMaxRaw + 0.2 * span;
    if (xMin === xMax) { xMin -= 0.5; xMax += 0.5; }

    // Sample the curve
    var SAMPLES = 120;
    var dx = (xMax - xMin) / SAMPLES;
    var samples = [];
    for (var si = 0; si <= SAMPLES; si++) {
      var sx = xMin + si * dx;
      var sy = safeSampleFn(ast, sx, isFixedPoint);
      samples.push({ x: sx, y: sy });
    }

    // Y-window from iterates (spec §4)
    var yIterateVals = iterates.map(function(p) { return p.y; }).filter(function(v) { return v != null && Number.isFinite(v); });
    var yAbsMax = yIterateVals.length > 0 ? Math.max.apply(null, yIterateVals.map(Math.abs)) : 1;
    var yMax = Math.max(1, yAbsMax * 1.25);
    var yMin = -yMax;

    // SVG dimensions
    var W = 480, H = 280, PL = 52, PR = 16, PT = 20, PB = 36;
    var plotW = W - PL - PR;
    var plotH = H - PT - PB;

    function xCoord(v) { return PL + ((v - xMin) / (xMax - xMin)) * plotW; }
    function yCoord(v) { return PT + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    // Grid lines
    var xStep = niceStep(xMax - xMin, 5);
    var yStep = niceStep(yMax - yMin, 5);
    var gridHTML = "";

    var xGridStart = Math.ceil(xMin / xStep) * xStep;
    for (var gx = xGridStart; gx <= xMax; gx += xStep) {
      var gxc = xCoord(gx).toFixed(1);
      gridHTML += '<line x1="' + gxc + '" y1="' + PT + '" x2="' + gxc + '" y2="' + (PT + plotH) + '" class="root-graph-grid"/>';
      gridHTML += '<text x="' + gxc + '" y="' + (H - PB + 14) + '" text-anchor="middle" class="root-graph-label">' + C.formatReal(gx, 4) + '</text>';
    }
    var yGridStart = Math.ceil(yMin / yStep) * yStep;
    for (var gy = yGridStart; gy <= yMax; gy += yStep) {
      var gyc = yCoord(gy).toFixed(1);
      gridHTML += '<line x1="' + PL + '" y1="' + gyc + '" x2="' + (PL + plotW) + '" y2="' + gyc + '" class="root-graph-grid"/>';
      gridHTML += '<text x="' + (PL - 4) + '" y="' + gyc + '" text-anchor="end" dominant-baseline="middle" class="root-graph-label">' + C.formatReal(gy, 4) + '</text>';
    }

    // Zero line
    var zeroY = yCoord(0);
    var zeroLineHTML = "";
    if (zeroY >= PT && zeroY <= PT + plotH) {
      zeroLineHTML = '<line x1="' + PL + '" y1="' + zeroY.toFixed(1) + '" x2="' + (PL + plotW) + '" y2="' + zeroY.toFixed(1) + '" class="root-graph-axis"/>';
    }

    // Bracket shading (bracket methods only)
    var bracketHTML = "";
    if (isBracket && run.initial) {
      var bLeft = run.initial.left ? toReal(run.initial.left.x) : null;
      var bRight = run.initial.right ? toReal(run.initial.right.x) : null;
      if (bLeft != null && bRight != null && Number.isFinite(bLeft) && Number.isFinite(bRight)) {
        var bx1 = Math.max(xCoord(bLeft), PL);
        var bx2 = Math.min(xCoord(bRight), PL + plotW);
        if (bx2 > bx1) {
          bracketHTML = '<rect x="' + bx1.toFixed(1) + '" y="' + PT + '" width="' + (bx2 - bx1).toFixed(1) + '" height="' + plotH + '" class="root-graph-bracket"/>';
        }
      }
    }

    // Curve segments (split at breaks)
    var curveHTML = "";
    var segment = [];
    for (var ci = 0; ci <= SAMPLES; ci++) {
      var s = samples[ci];
      if (s.y != null && Number.isFinite(s.y) && Math.abs(s.y) <= yMax) {
        segment.push(xCoord(s.x).toFixed(1) + "," + yCoord(s.y).toFixed(1));
      } else {
        if (segment.length >= 2) {
          curveHTML += '<polyline points="' + segment.join(" ") + '" class="root-graph-line"/>';
        }
        segment = [];
      }
    }
    if (segment.length >= 2) {
      curveHTML += '<polyline points="' + segment.join(" ") + '" class="root-graph-line"/>';
    }

    // Iterate dots with recency fade
    var iterateHTML = "";
    var totalIterates = iterates.length;
    for (var ii = 0; ii < totalIterates; ii++) {
      var ip = iterates[ii];
      if (ip.x == null) continue;
      var recency = totalIterates <= 1 ? 1 : 0.3 + 0.7 * (ii / (totalIterates - 1));
      var ix = ip.x;
      var iy = ip.y != null && Number.isFinite(ip.y) ? ip.y : 0;
      var offscreen = false;

      // Clamp to window
      var drawX = ix;
      var drawY = iy;
      if (drawX < xMin) { drawX = xMin; offscreen = true; }
      if (drawX > xMax) { drawX = xMax; offscreen = true; }
      if (drawY < yMin) { drawY = yMin; offscreen = true; }
      if (drawY > yMax) { drawY = yMax; offscreen = true; }

      var cxStr = xCoord(drawX).toFixed(1);
      var cyStr = yCoord(drawY).toFixed(1);
      iterateHTML += '<circle cx="' + cxStr + '" cy="' + cyStr + '" r="3.5" class="root-graph-iterate" style="--recency:' + recency.toFixed(2) + '" tabindex="0" data-i="' + ip.iteration + '" data-x="' + fmtRunVal(ip.x, run, 10) + '"' + (offscreen ? ' data-offscreen="true"' : '') + '/>';
    }

    // Final root marker
    var rootMarkerHTML = "";
    if (approxReal != null && Number.isFinite(approxReal)) {
      var rmx = xCoord(Math.max(xMin, Math.min(xMax, approxReal)));
      var rmy = yCoord(0);
      if (rmy >= PT && rmy <= PT + plotH) {
        rootMarkerHTML = '<circle cx="' + rmx.toFixed(1) + '" cy="' + rmy.toFixed(1) + '" r="5" class="root-graph-root-marker"/>';
      }
    }

    // Axis titles
    var yAxisLabel = isFixedPoint ? "g(x) \u2212 x" : "f(x)";
    var axisTitles =
      '<text x="' + (PL + plotW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="root-graph-label">x</text>' +
      '<text x="' + (PL - 38) + '" y="' + (PT + plotH / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90,' + (PL - 38) + ',' + (PT + plotH / 2) + ')" class="root-graph-label">' + yAxisLabel + '</text>';

    // Assemble SVG
    var svgTitle = isFixedPoint ? "Fixed-point residual g(x) minus x" : "Function f(x) with iterate markers";
    var svgDesc = isFixedPoint
      ? "Plot of g(x) minus x showing iterates converging toward the fixed point."
      : "Plot of f(x) showing iterates converging toward a root.";

    panelEl.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" class="root-function-svg" role="img" aria-labelledby="root-fn-plot-title root-fn-plot-desc">' +
      '<title id="root-fn-plot-title">' + svgTitle + '</title>' +
      '<desc id="root-fn-plot-desc">' + svgDesc + '</desc>' +
      '<rect x="' + PL + '" y="' + PT + '" width="' + plotW + '" height="' + plotH + '" class="root-graph-bg"/>' +
      gridHTML +
      zeroLineHTML +
      bracketHTML +
      curveHTML +
      iterateHTML +
      rootMarkerHTML +
      axisTitles +
      '</svg>';
  }
```

- [ ] **Step 5: Test the function plot**

Open `index.html`. Run Bisection on `x^2 - 2` over `[1, 2]`, 4 iterations. Confirm:
- "Function f(x)" tab shows a parabola crossing zero near x ≈ 1.414
- Iterate dots appear with fading
- A highlighted root marker sits on the zero line
- A faint bracket-shaded region covers [1, 2]
- Switch to Newton `cos(x) - x`, x₀ = 0.5, 4 iterations — curve visible, dots converge
- Switch to Fixed Point `(x + 2/x)/2`, x₀ = 1, 4 iterations — y-axis reads "g(x) − x"

- [ ] **Step 6: Commit**

```powershell
git add root-ui.js
git commit -m "feat: add f(x) function plot with iterate markers and curve sampling"
```

---

### Task 3: Add tooltip for both plots

**Purpose:** A single tooltip `<div>` per panel, wired via event delegation on each SVG.

**Files:**
- Modify: `root-ui.js` (add `wireGraphTooltip` function, call it from both plot renderers)

- [ ] **Step 1: Add `wireGraphTooltip(svgEl, panelEl, run)` after `renderFunctionPlot`**

```javascript
  function wireGraphTooltip(svgEl, panelEl, run) {
    if (!svgEl || !panelEl) return;

    // Create tooltip div
    var tooltip = document.createElement("div");
    tooltip.className = "root-graph-tooltip";
    tooltip.hidden = true;
    tooltip.setAttribute("role", "tooltip");
    panelEl.style.position = "relative";
    panelEl.appendChild(tooltip);

    function showTip(target) {
      var i = target.getAttribute("data-i");
      var x = target.getAttribute("data-x");
      if (i == null || x == null) return;
      tooltip.textContent = "Iteration " + i + ": x\u2099 = " + x;
      tooltip.hidden = false;

      // Position above dot
      var svgRect = svgEl.getBoundingClientRect();
      var dotRect = target.getBoundingClientRect();
      var tipLeft = dotRect.left - svgRect.left + dotRect.width / 2;
      var tipTop = dotRect.top - svgRect.top - 8;
      tooltip.style.left = tipLeft + "px";
      tooltip.style.top = tipTop + "px";
      tooltip.style.transform = "translate(-50%, -100%)";
    }

    function hideTip() {
      tooltip.hidden = true;
    }

    svgEl.addEventListener("mouseover", function(e) {
      if (e.target.hasAttribute("data-i")) showTip(e.target);
    });
    svgEl.addEventListener("mouseout", function(e) {
      if (e.target.hasAttribute("data-i")) hideTip();
    });
    svgEl.addEventListener("focusin", function(e) {
      if (e.target.hasAttribute("data-i")) showTip(e.target);
    });
    svgEl.addEventListener("focusout", function(e) {
      if (e.target.hasAttribute("data-i")) hideTip();
    });
  }
```

- [ ] **Step 2: Wire tooltips at the end of `renderFunctionPlot` and `renderErrorPlot`**

At the very end of `renderFunctionPlot`, before the closing brace:

```javascript
    var fnSvg = panelEl.querySelector("svg");
    if (fnSvg) wireGraphTooltip(fnSvg, panelEl, run);
```

At the very end of `renderErrorPlot`, before the closing brace:

```javascript
    var errSvg = panelEl.querySelector("svg");
    if (errSvg) wireGraphTooltip(errSvg, panelEl, run);
```

- [ ] **Step 3: Test tooltips**

Run any method. Hover over an iterate dot — tooltip appears with "Iteration N: xₙ = value". Tab through dots with keyboard — tooltip follows focus. Mouse-out hides.

- [ ] **Step 4: Commit**

```powershell
git add root-ui.js
git commit -m "feat: add hover/focus tooltip to function and error plot iterate dots"
```

---

### Task 4: CSS additions for tabs, function plot, and tooltip

**Purpose:** Style the new elements — tab strip, iterate markers, bracket shading, root marker, tooltip.

**Files:**
- Modify: `styles.css` (insert after the existing `.root-graph-label` block, before `.root-rate-summary`)

- [ ] **Step 1: Add CSS rules after line 3408 (after `.root-graph-label` block)**

```css
/* ── Root graph: tab switcher ────────────────────────────────────── */

.root-graph-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  border-bottom: 1px solid var(--line);
  padding-bottom: var(--space-2);
}

.root-graph-tab {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-subtle);
  font: inherit;
  font-size: 0.84rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.root-graph-tab:hover {
  background: var(--surface-raised);
  color: var(--text);
}

.root-graph-tab[aria-selected="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent, #fff);
  font-weight: 600;
}

.root-graph-tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

/* ── Root graph: panels ──────────────────────────────────────────── */

.root-graph-panel {
  min-height: 120px;
}

.root-graph-panel[hidden] {
  display: none;
}

/* ── Root graph: function plot SVG ────────────────────────────────── */

.root-function-svg {
  display: block;
  width: 100%;
  max-width: 560px;
  height: auto;
  overflow: visible;
}

/* ── Root graph: iterate markers ─────────────────────────────────── */

.root-graph-iterate {
  fill: var(--accent, #4a90d9);
  fill-opacity: var(--recency, 1);
  stroke: var(--surface, #fff);
  stroke-width: 1;
  cursor: pointer;
  transition: fill-opacity 0.15s;
}

.root-graph-iterate:hover,
.root-graph-iterate:focus-visible {
  fill-opacity: 1;
  r: 5;
}

.root-graph-iterate:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.root-graph-iterate[data-offscreen="true"] {
  fill-opacity: calc(var(--recency, 1) * 0.4);
}

/* ── Root graph: root marker ─────────────────────────────────────── */

.root-graph-root-marker {
  fill: var(--accent, #4a90d9);
  stroke: var(--surface, #fff);
  stroke-width: 2;
}

/* ── Root graph: bracket shading ─────────────────────────────────── */

.root-graph-bracket {
  fill: var(--accent-soft, rgba(74, 144, 217, 0.08));
  stroke: var(--accent, #4a90d9);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

/* ── Root graph: tooltip ─────────────────────────────────────────── */

.root-graph-tooltip {
  position: absolute;
  z-index: 10;
  padding: 0.3rem 0.55rem;
  border-radius: var(--radius-xs, 4px);
  background: var(--surface-3, #333);
  color: var(--on-accent, #fff);
  font-size: 0.78rem;
  font-family: var(--font-mono, monospace);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.root-graph-tooltip[hidden] {
  display: none;
}

.root-graph-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--surface-3, #333);
}

/* ── Root graph: empty state inside panels ────────────────────────── */

.root-graph-empty {
  text-align: center;
  padding: var(--space-4) var(--space-3);
}

/* Reduced motion: no fade-in transitions */
@media (prefers-reduced-motion: reduce) {
  .root-graph-iterate,
  .root-graph-tab {
    transition: none;
  }
}
```

- [ ] **Step 2: Test visual appearance**

- Light mode: tabs readable, iterate dots have module accent colour, tooltip has dark bg with arrow
- Dark mode: toggle theme, verify no hardcoded `#fff` bleeding
- Narrow viewport (360px): tabs wrap cleanly, SVG viewBox scales
- Bracket shading visible on bisection/false-position runs

- [ ] **Step 3: Commit**

```powershell
git add styles.css
git commit -m "feat: add CSS for graph tabs, function plot, iterate markers, and tooltip"
```

---

### Task 5: Edge-case hardening

**Purpose:** Handle all the error states from spec §6: zero rows, single row, parse failure, non-finite iterates, collapsed window, singularities, offscreen clamping, null approximation.

**Files:**
- Modify: `root-ui.js` (`renderFunctionPlot` and `renderGraphTabs`)

- [ ] **Step 1: Handle 0-row runs in `renderGraphTabs`**

The function already handles this correctly because `renderFunctionPlot` returns early with a "no expression" or "not enough data" message when there are no iterates. The error plot already shows "Not enough iterations to plot convergence." for < 2 error points. Verify this path works by running an invalid bracket (same signs on both sides).

- [ ] **Step 2: Handle single-row runs**

Run Bisection on `x^2 - 2` with a = 1, b = 2, n = 1. Function panel should show curve + one iterate + root marker. Error panel should show "Not enough iterations" since there's only one error point (< 2 required).

- [ ] **Step 3: Verify singularity handling**

Run Bisection on `1/(x - 1.5)` with a = 1, b = 2. The curve should break at the pole (no vertical spike reaching to screen edge). Iterate dots should render normally.

- [ ] **Step 4: Verify offscreen iterate clamping**

Run Newton on `x^3 - x - 1`, starting from x₀ = 100, 4 iterations. Early iterates will be far outside the convergence window. Verify they clamp to the edge with `data-offscreen="true"` and reduced opacity. The tooltip should show the real (no clamped) x value.

- [ ] **Step 5: Verify null approximation**

Run Newton on `x / sin(x)` from x₀ = 0, where the derivative is zero. Should show the plot with whatever iterates ran, but no root marker (since `summary.approximation` may be null).

- [ ] **Step 6: Commit**

```powershell
git add root-ui.js
git commit -m "fix: harden function plot for edge cases (singularities, offscreen, null approx)"
```

---

### Task 6: Fixed-point expression source fix

**Purpose:** Ensure `renderFunctionPlot` correctly reads `run.gExpression` (not `run.expression`) for fixed-point runs, since `RootEngine.runFixedPoint` stores the expression under `gExpression`.

**Files:**
- Modify: `root-ui.js` (`renderFunctionPlot`)

- [ ] **Step 1: Verify expression source logic**

The code in Task 2 already handles this: `var exprSource = run.method === "fixedPoint" ? (run.expression || run.gExpression || "") : (run.expression || "");`. But we need to verify what `runFixedPoint` actually returns.

Check `root-engine.js` — the fixed-point result object does NOT have an `expression` field; it has `gExpression` (set from `options.gExpression` by the compute function in root-ui.js at line 181). So the fallback chain is correct.

However, looking at the actual `runFixedPoint` return (near line 850+ of root-engine.js), the result stores `canonical` (from `E.formatExpression(gAst)`) but uses `gExpression` as the field name for the raw expression. Let me verify the actual field names.

- [ ] **Step 2: Test fixed-point plot**

Run Fixed Point with `g(x) = (x + 2/x)/2`, x₀ = 1, 4 iterations. Confirm:
- Y-axis says "g(x) − x"
- Curve shows `g(x) − x` crossing zero near √2
- Iterate dots converge toward the fixed point

- [ ] **Step 3: Commit (if any fix was needed)**

```powershell
git add root-ui.js
git commit -m "fix: correctly source gExpression for fixed-point function plot"
```

---

### Task 7: Manual visual audit (spec §7 checklist)

**Purpose:** Run through all 10 items in the spec's manual audit checklist.

**Files:** None modified — verification only.

- [ ] **Step 1: Bisection `x² − 2` on `[1, 2]`, tol 1e-6**

Curve crosses zero once; ~20 iterates fade from faint to opaque toward ~1.414. Bracket shading covers [1, 2].

- [ ] **Step 2: Newton `cos(x) − x` from x₀ = 0.5**

Fast convergence; window wide enough to show curvature. Iterate dots clustered near root.

- [ ] **Step 3: Fixed-point `(x + 2/x)/2` from x₀ = 1**

Plot shows `g(x) − x`; iterates converge to ~1.414. Y-axis label correct.

- [ ] **Step 4: Cap-hit run (tight tol + slow method)**

50+ iterates with recency fade keeping dots legible. Error tab shows full log₁₀|error| curve.

- [ ] **Step 5: Singularity: `1/(x − 1.5)` bracket `[1, 2]`**

Curve breaks at the pole. No vertical spike to infinity.

- [ ] **Step 6: Invalid bracket (no sign change)**

Both tabs still render. Message hero explains the stop reason.

- [ ] **Step 7: Dark-mode toggle**

Grid, curve, tabs all read correctly. No hardcoded `#fff` bleeding through.

- [ ] **Step 8: Keyboard only**

Tab into graph, arrow between tabs, Tab through iterate dots, tooltip follows focus. Home/End jump to first/last tab.

- [ ] **Step 9: `prefers-reduced-motion: reduce`**

No fade-in; recency opacity still applies (it's state, not animation). Tab transitions are instant.

- [ ] **Step 10: Narrow viewport (360px)**

Tabs wrap/shrink cleanly. SVG viewBox scales proportionally.

- [ ] **Step 11: Final commit**

```powershell
git add -A
git commit -m "verify: manual visual audit passed for convergence graph completion"
```
