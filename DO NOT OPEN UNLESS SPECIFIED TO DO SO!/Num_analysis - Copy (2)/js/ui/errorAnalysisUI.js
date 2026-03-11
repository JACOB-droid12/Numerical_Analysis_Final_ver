/* ==========================================================================
   ERROR-ANALYSIS-UI.JS — Renders the Error Analysis module panel
   Inputs for p (true value) and p* (approximation), optional chop/round,
   and structured results display with formula annotations.
   ========================================================================== */

const ErrorAnalysisUI = (() => {

  let container = null;
  let cachedCalcResult = null;

  /**
   * Initialize the Error Analysis UI.
   */
  function init(panelEl) {
    container = panelEl;
    render();
    bindEvents();

    if (typeof State !== 'undefined') {
      State.subscribe('CALC_UPDATED', (payload) => {
        cachedCalcResult = payload;
        refresh();
      });
    }
  }

  function hasCalcResult() {
    return cachedCalcResult !== null;
  }

  /**
   * Render the full panel HTML.
   */
  function render() {
    const has = hasCalcResult();

    container.innerHTML = `
      <!-- Module Header Card -->
      <div class="card animate-slide-up">
        <div class="card__header">
          <span class="card__icon animate-glow-pulse">⊘</span>
          <h2 class="card__title">Error Analysis</h2>
        </div>
        <div class="card__body">
          <p>Compute absolute error, relative error, maximum error bound, and significant digits between a true value <em>p</em> and an approximation <em>p*</em>.</p>
        </div>
      </div>

      <!-- Import from Calculator Card -->
      <div class="card animate-slide-up stagger-1" id="ea-import-card">
        <div class="card__header">
          <h3 class="card__title text-base">Import from Calculator</h3>
          <span class="badge" id="ea-import-status">${has ? 'Ready' : 'No result yet'}</span>
        </div>
        <div class="card__body">
          <p class="ea-import-hint mb-3">Run a computation in the Calculator module first, then import the results here.</p>
          <div class="ea-import-buttons">
            <div class="tooltip-wrapper">
              <button class="btn btn--ghost btn--sm" id="ea-use-exact" type="button" ${has ? '' : 'disabled'}>
                ↓ Exact Result → p
              </button>
              ${has ? '' : '<span class="tooltip">Run a calculation first</span>'}
            </div>
            <div class="tooltip-wrapper">
              <button class="btn btn--ghost btn--sm" id="ea-use-approx" type="button" ${has ? '' : 'disabled'}>
                ↓ Approximation → p*
              </button>
              ${has ? '' : '<span class="tooltip">Run a calculation first</span>'}
            </div>
            <div class="tooltip-wrapper">
              <button class="btn btn--primary btn--sm" id="ea-use-all" type="button" ${has ? '' : 'disabled'}>
                ↓ Import Both (Exact → p, Approx → p*)
              </button>
              ${has ? '' : '<span class="tooltip">Run a calculation first</span>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Input Card -->
      <div class="card animate-slide-up stagger-2">
        <div class="card__header">
          <h3 class="card__title text-base">Values</h3>
        </div>
        <div class="card__body">
          <!-- True value p -->
          <div class="input-group mb-4">
            <label class="input-group__label" for="ea-true-value">True Value (p)</label>
            <input
              class="input input--numeric"
              type="text"
              id="ea-true-value"
              placeholder="e.g. 8.10179136"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <!-- Approximation p* -->
          <div class="input-group mb-4">
            <label class="input-group__label" for="ea-approx-value">Approximation (p*)</label>
            <input
              class="input input--numeric"
              type="text"
              id="ea-approx-value"
              placeholder="e.g. 8.1017"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <!-- Chop/Round toggle -->
          <div class="ea-option-group">
            <label class="ea-toggle-row">
              <input type="checkbox" id="ea-apply-transform" class="ea-checkbox">
              <span class="ea-toggle-label">Apply chopping/rounding to <em>p</em> before analysis</span>
            </label>

            <div id="ea-transform-options" class="ea-transform-options" style="display: none;">
              <div class="ea-radio-group">
                <label class="ea-radio">
                  <input type="radio" name="ea-method" value="chop" checked>
                  <span>Chop</span>
                </label>
                <label class="ea-radio">
                  <input type="radio" name="ea-method" value="round">
                  <span>Round</span>
                </label>
              </div>
              <div class="input-group flex-auto">
                <label class="input-group__label" for="ea-k-value">k digits</label>
                <div class="stepper">
                  <button class="stepper__btn" id="ea-k-dec" type="button" aria-label="Decrease k" tabindex="0">−</button>
                  <input
                    class="stepper__input input--numeric"
                    type="number"
                    id="ea-k-value"
                    value="5"
                    min="1"
                    max="15"
                    step="1"
                  >
                  <button class="stepper__btn" id="ea-k-inc" type="button" aria-label="Increase k" tabindex="0">+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="calc-actions mt-4">
            <button class="btn btn--primary" id="ea-compute" type="button">
              <span aria-hidden="true">▶</span> Compute Errors
            </button>
            <button class="btn btn--ghost" id="ea-clear" type="button">Clear</button>
          </div>
        </div>
      </div>

      <!-- Results area -->
      <div id="ea-results" class="mt-4" style="display: none;">
        <!-- Filled dynamically -->
      </div>

      <!-- Error display -->
      <div id="ea-error" class="mt-4" style="display: none;">
        <!-- Filled dynamically -->
      </div>
    `;
  }

  /**
   * Bind events.
   */
  function bindEvents() {
    const useExact = container.querySelector('#ea-use-exact');
    const useApprox = container.querySelector('#ea-use-approx');
    const useAll = container.querySelector('#ea-use-all');
    const applyTransform = container.querySelector('#ea-apply-transform');
    const transformOpts = container.querySelector('#ea-transform-options');
    const kDec = container.querySelector('#ea-k-dec');
    const kInc = container.querySelector('#ea-k-inc');
    const kInput = container.querySelector('#ea-k-value');
    const computeBtn = container.querySelector('#ea-compute');
    const clearBtn = container.querySelector('#ea-clear');
    const trueInput = container.querySelector('#ea-true-value');
    const approxInput = container.querySelector('#ea-approx-value');

    // Import buttons
    useExact.addEventListener('click', () => {
      if (hasCalcResult() && cachedCalcResult.exactStr) {
        trueInput.value = cachedCalcResult.exactStr;
        container.querySelector('#ea-k-value').value = cachedCalcResult.k;
      }
    });

    useApprox.addEventListener('click', () => {
      if (hasCalcResult() && cachedCalcResult.approxStr) {
        approxInput.value = cachedCalcResult.approxStr;
        container.querySelector('#ea-k-value').value = cachedCalcResult.k;
      }
    });

    useAll.addEventListener('click', () => {
      if (hasCalcResult()) {
        if (cachedCalcResult.exactStr) trueInput.value = cachedCalcResult.exactStr;
        if (cachedCalcResult.approxStr) approxInput.value = cachedCalcResult.approxStr;
        container.querySelector('#ea-k-value').value = cachedCalcResult.k;
      }
    });

    // Toggle chop/round options
    applyTransform.addEventListener('change', () => {
      transformOpts.style.display = applyTransform.checked ? 'flex' : 'none';
    });

    // k-stepper
    kDec.addEventListener('click', () => {
      const val = parseInt(kInput.value, 10);
      if (val > 1) kInput.value = val - 1;
    });
    kInc.addEventListener('click', () => {
      const val = parseInt(kInput.value, 10);
      if (val < 15) kInput.value = val + 1;
    });
    kInput.addEventListener('change', () => {
      let val = parseInt(kInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 15) val = 15;
      kInput.value = val;
    });

    // Compute
    computeBtn.addEventListener('click', () => compute());

    // Enter key
    approxInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); compute(); }
    });
    trueInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); compute(); }
    });

    // Clear
    clearBtn.addEventListener('click', () => {
      trueInput.value = '';
      approxInput.value = '';
      applyTransform.checked = false;
      transformOpts.style.display = 'none';
      kInput.value = 5;
      UIUtils.hideElement(container, '#ea-results');
      UIUtils.hideElement(container, '#ea-error');
      trueInput.focus();
    });
  }

  /**
   * Run error analysis.
   */
  function compute() {
    UIUtils.hideElement(container, '#ea-results');
    UIUtils.hideElement(container, '#ea-error');

    const trueStr = container.querySelector('#ea-true-value').value.trim();
    const approxStr = container.querySelector('#ea-approx-value').value.trim();
    const doTransform = container.querySelector('#ea-apply-transform').checked;

    if (!trueStr) { UIUtils.showErrorCard(container, '#ea-error', 'Please enter a true value (p).'); return; }
    if (!approxStr) { UIUtils.showErrorCard(container, '#ea-error', 'Please enter an approximation (p*).'); return; }

    let p = parseFloat(trueStr);
    let pStar = parseFloat(approxStr);

    if (isNaN(p)) { UIUtils.showErrorCard(container, '#ea-error', `Invalid true value: "${trueStr}"`); return; }
    if (isNaN(pStar)) { UIUtils.showErrorCard(container, '#ea-error', `Invalid approximation: "${approxStr}"`); return; }

    // Optionally apply chop/round to p
    let transformedPStr = null;
    let transformMethod = null;
    let transformK = null;
    if (doTransform) {
      transformK = parseInt(container.querySelector('#ea-k-value').value, 10);
      const method = container.querySelector('input[name="ea-method"]:checked').value;
      transformMethod = method;
      if (method === 'chop') {
        transformedPStr = Calculator.chopToK(p, transformK);
      } else {
        transformedPStr = Calculator.roundToK(p, transformK);
      }
      p = parseFloat(transformedPStr);
    }

    // Compute errors
    const absErr = ErrorAnalysis.absoluteError(p, pStar);
    const relErr = ErrorAnalysis.relativeError(p, pStar);
    const sigDig = ErrorAnalysis.significantDigitsCount(p, pStar);
    const kForBound = Calculator.countSignificantDigits(approxStr);
    const maxErr = ErrorAnalysis.maximumErrorBound(pStar, kForBound);

    showResults(p, pStar, absErr, relErr, maxErr, sigDig, kForBound, transformedPStr, transformMethod, transformK, trueStr);
  }

  /**
   * Display results with formula annotations.
   */
  function showResults(p, pStar, absErr, relErr, maxErr, sigDig, kForBound, transformedPStr, transformMethod, transformK, originalPStr) {
    const resultsEl = container.querySelector('#ea-results');
    const fmtP = ErrorAnalysis.formatNum(p);
    const fmtPS = ErrorAnalysis.formatNum(pStar);
    const fmtAbs = ErrorAnalysis.formatNum(absErr);

    // Transform info
    let transformHTML = '';
    if (transformedPStr) {
      const methodLabel = transformMethod === 'chop' ? `${transformK}-Chop` : `${transformK}-Round`;
      transformHTML = `
        <div class="ea-result-row animate-slide-up">
          <div class="ea-result-label">Transformed p</div>
          <div class="ea-result-content">
            <span class="ea-formula">p = ${methodLabel}(${UIUtils.escapeHTML(originalPStr)}) = ${transformedPStr}</span>
            <span class="ea-value">${transformedPStr}</span>
          </div>
        </div>
      `;
    }

    // Calculate LaTeX representations
    const sciAbs = Calculator.formatToScientificHTML(absErr);

    // Relative error display
    let relErrHTML;
    if (relErr === null) {
      relErrHTML = `
        <div class="ea-result-row ea-result-row--warn animate-slide-up stagger-2">
          <div class="ea-result-label">Relative Error</div>
          <div class="ea-result-content">
            <span class="ea-formula">Undefined — true value p = 0</span>
            <span class="ea-value ea-value--warn">N/A</span>
          </div>
        </div>
      `;
    } else {
      const sciRel = Calculator.formatToScientificHTML(relErr.decimal);
      relErrHTML = `
        <div class="ea-result-row animate-slide-up stagger-2">
          <div class="ea-result-label">Relative Error</div>
          <div class="ea-result-content">
            <span class="ea-formula">|${fmtP} − ${fmtPS}| / |${fmtP}| = ${ErrorAnalysis.formatNum(relErr.decimal)}</span>
            <div class="flex items-baseline gap-3 flex-wrap">
              <span class="ea-value">${ErrorAnalysis.formatNum(relErr.decimal)} <span class="result-annotation">(or <span class="math-notation">${sciRel}</span>)</span></span>
              <span class="ea-sub-value">${ErrorAnalysis.formatNum(relErr.percentage)}%</span>
            </div>
          </div>
        </div>
      `;
    }

    // Significant digits
    let sigDigHTML;
    if (sigDig === null) {
      sigDigHTML = `
        <div class="ea-result-row ea-result-row--warn animate-slide-up stagger-3">
          <div class="ea-result-label">Significant Digits</div>
          <div class="ea-result-content">
            <span class="ea-formula">Undefined — true value p = 0</span>
            <span class="ea-value ea-value--warn">N/A</span>
          </div>
        </div>
      `;
    } else if (sigDig === Infinity) {
      sigDigHTML = `
        <div class="ea-result-row ea-result-row--success animate-slide-up stagger-3">
          <div class="ea-result-label">Significant Digits</div>
          <div class="ea-result-content">
            <span class="ea-formula">Exact match (p = p*)</span>
            <span class="ea-value ea-value--success">∞</span>
          </div>
        </div>
      `;
    } else {
      sigDigHTML = `
        <div class="ea-result-row animate-slide-up stagger-3">
          <div class="ea-result-label">Significant Digits</div>
          <div class="ea-result-content">
            <span class="ea-formula">Largest m where |p − p*|/|p| ≤ 5 × 10<sup>−m</sup></span>
            <span class="ea-value">${sigDig}</span>
          </div>
        </div>
      `;
    }

    // Max error bound
    let maxErrHTML = '';
    if (maxErr) {
      const sciMax = Calculator.formatToScientificHTML(maxErr.bound);
      maxErrHTML = `
        <div class="ea-result-row animate-slide-up stagger-4">
          <div class="ea-result-label">Max Error Bound</div>
          <div class="ea-result-content">
            <span class="ea-formula">0.5 × 10<sup>(${maxErr.exponent} − ${kForBound})</sup> = ${ErrorAnalysis.formatNum(maxErr.bound)}</span>
            <span class="ea-value">${ErrorAnalysis.formatNum(maxErr.bound)} <span class="result-annotation">(or <span class="math-notation">${sciMax}</span>)</span></span>
          </div>
        </div>
      `;
    }

    resultsEl.innerHTML = `
      <div class="card animate-slide-up">
        <div class="card__header">
          <h3 class="card__title text-base">Error Metrics</h3>
        </div>
        <div class="card__body">
          <div class="ea-results-list">
            ${transformHTML}

            <div class="ea-result-row animate-slide-up stagger-1">
              <div class="ea-result-label">Absolute Error</div>
              <div class="ea-result-content">
                <span class="ea-formula">|${fmtP} − ${fmtPS}| = ${fmtAbs}</span>
                <span class="ea-value">${fmtAbs} <span class="result-annotation">(or <span class="math-notation">${sciAbs}</span>)</span></span>
              </div>
            </div>

            ${relErrHTML}
            ${sigDigHTML}
            ${maxErrHTML}
          </div>
        </div>
      </div>
    `;

    resultsEl.style.display = 'block';
  }

  /**
   * Refresh the import button states.
   */
  function refresh() {
    if (!container) return;
    const has = hasCalcResult();
    const buttons = ['#ea-use-exact', '#ea-use-approx', '#ea-use-all'];
    buttons.forEach(sel => {
      const btn = container.querySelector(sel);
      if (btn) btn.disabled = !has;
    });
    // Update status badge
    const badge = container.querySelector('#ea-import-status');
    if (badge) {
      badge.textContent = has ? 'Ready' : 'No result yet';
    }
    // Remove tooltips if result is available
    if (has) {
      const tips = container.querySelectorAll('#ea-import-card .tooltip');
      tips.forEach(t => t.remove());
    }
    // Update hint text with actual values
    const hint = container.querySelector('.ea-import-hint');
    if (hint && has) {
      hint.innerHTML = `Last Exact (p): <strong class="text-info">${UIUtils.escapeHTML(cachedCalcResult.exactStr || '?')}</strong> &nbsp;·&nbsp; Last Approx (p*): <strong class="text-accent">${UIUtils.escapeHTML(cachedCalcResult.approxStr || '?')}</strong>`;
    }
  }

  return { init, refresh };

})();
