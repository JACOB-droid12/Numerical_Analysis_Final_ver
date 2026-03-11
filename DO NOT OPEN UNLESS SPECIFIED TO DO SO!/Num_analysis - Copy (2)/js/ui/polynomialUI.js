/* ==========================================================================
   POLYNOMIAL-UI.JS — Renders the Polynomial Evaluator module panel
   ========================================================================== */

const PolynomialUI = (() => {

  let container = null;
  let lastExactStr = null;
  let lastApproxStr = null;

  /**
   * Initialize into the given DOM container.
   */
  function init(panelEl) {
    container = panelEl;
    render();
    bindEvents();
  }

  /**
   * Render the full panel HTML.
   */
  function render() {
    container.innerHTML = `
      <!-- Header -->
      <div class="card animate-slide-up">
        <div class="card__header">
          <span class="card__icon animate-glow-pulse text-accent">&#402;</span>
          <h2 class="card__title">Polynomial Evaluator</h2>
        </div>
        <div class="card__body">
          <p>Input a polynomial function and a value for <em>x</em>. Apply floating-point k-digit chopping or rounding at configurable stages to simulate finite precision arithmetic.</p>
        </div>
      </div>

      <!-- Input Form -->
      <div class="card animate-slide-up stagger-1">
        <div class="card__header">
          <h3 class="card__title text-base">Function & Variable Input</h3>
        </div>
        <div class="card__body">
          <div class="input-group mb-4">
            <label class="input-group__label" for="poly-expr">Polynomial Expression <em>f(x)</em></label>
            <input
              class="input input--expr"
              type="text"
              id="poly-expr"
              placeholder="e.g. 3x^3 - 2x^2 + x - 5"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <div class="input-group mb-4">
            <label class="input-group__label" for="poly-x">Evaluate at <em>x = </em></label>
            <input
              class="input input--numeric"
              type="text"
              id="poly-x"
              placeholder="e.g. 2.5"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <!-- Precision Controls -->
          <div class="calc-options mb-4 pt-4 border-top-subtle">
            <div class="input-group mb-4">
              <label class="input-group__label" for="poly-apply-mode">Apply Transformation to...</label>
              <select class="input" id="poly-apply-mode">
                <option value="exact">None (Exact Calculation)</option>
                <option value="before">Before (Inputs Only)</option>
                <option value="after">After (Final Result Only)</option>
                <option value="both">Both (Inputs & Every Step)</option>
              </select>
            </div>

            <div id="poly-transform-options" class="ea-transform-options" style="display: none;">
              <div class="ea-radio-group">
                <label class="ea-radio">
                  <input type="radio" name="poly-method" value="chop" checked>
                  <span>Chop</span>
                </label>
                <label class="ea-radio">
                  <input type="radio" name="poly-method" value="round">
                  <span>Round</span>
                </label>
              </div>
              <div class="input-group flex-auto">
                <label class="input-group__label" for="poly-k-value">Significant Digits (k)</label>
                <div class="stepper">
                  <button class="stepper__btn" id="poly-k-dec" type="button" aria-label="Decrease k" tabindex="0">−</button>
                  <input class="stepper__input input--numeric" type="number" id="poly-k-value" value="5" min="1" max="15" step="1">
                  <button class="stepper__btn" id="poly-k-inc" type="button" aria-label="Increase k" tabindex="0">+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="calc-actions">
            <button class="btn btn--primary" id="poly-compute" type="button">
              <span aria-hidden="true">▶</span> Evaluate <em>f(x)</em>
            </button>
            <button class="btn btn--ghost" id="poly-clear" type="button">Clear</button>
          </div>
        </div>
      </div>

      <!-- Results Area -->
      <div id="poly-results" class="mt-4" style="display: none;"></div>

      <!-- Error Area -->
      <div id="poly-error" class="mt-4" style="display: none;"></div>
    `;
  }

  function bindEvents() {
    const applyMode = container.querySelector('#poly-apply-mode');
    const transformOpts = container.querySelector('#poly-transform-options');
    const kDec = container.querySelector('#poly-k-dec');
    const kInc = container.querySelector('#poly-k-inc');
    const kInput = container.querySelector('#poly-k-value');
    const computeBtn = container.querySelector('#poly-compute');
    const clearBtn = container.querySelector('#poly-clear');
    const exprInput = container.querySelector('#poly-expr');
    const xInput = container.querySelector('#poly-x');

    applyMode.addEventListener('change', () => {
      transformOpts.style.display = applyMode.value === 'exact' ? 'none' : 'flex';
    });

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

    computeBtn.addEventListener('click', () => compute());

    exprInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); xInput.focus(); }
    });

    xInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); compute(); }
    });

    clearBtn.addEventListener('click', () => {
      exprInput.value = '';
      xInput.value = '';
      applyMode.value = 'exact';
      transformOpts.style.display = 'none';
      UIUtils.hideElement(container, '#poly-results');
      UIUtils.hideElement(container, '#poly-error');
      exprInput.focus();
    });
  }

  function compute() {
    const exprInput = container.querySelector('#poly-expr').value.trim();
    const xInput = container.querySelector('#poly-x').value.trim();
    const applyMode = container.querySelector('#poly-apply-mode').value;
    const method = container.querySelector('input[name="poly-method"]:checked').value;
    const kStr = container.querySelector('#poly-k-value').value;
    const k = parseInt(kStr, 10);

    UIUtils.hideElement(container, '#poly-error');
    UIUtils.hideElement(container, '#poly-results');

    try {
      if (!exprInput) throw new Error("Please enter a polynomial expression.");
      if (!xInput || isNaN(parseFloat(xInput))) throw new Error("Please enter a valid numeric value for x.");

      const originalTerms = Polynomial.parsePolynomial(exprInput);
      const polyHTML = Polynomial.formatPolynomialHTML(originalTerms);

      // 1. Evaluate EXACT result
      const exactOutcome = Polynomial.evaluatePolynomial(originalTerms, xInput, 'exact', '', k);
      const exactStr = Calculator.formatNumber(exactOutcome.result);

      // 2. Evaluate APPROXIMATION
      let approxStr;
      let stepsToDisplay = [];

      if (applyMode === 'after') {
        const approxRawStr = method === 'chop' ? Calculator.chopToK(exactOutcome.result, k) : Calculator.roundToK(exactOutcome.result, k);
        approxStr = approxRawStr;
        stepsToDisplay = exactOutcome.steps;
      } else {
        const approxOutcome = Polynomial.evaluatePolynomial(originalTerms, xInput, applyMode, method, k);
        approxStr = Calculator.formatNumber(approxOutcome.result);
        stepsToDisplay = approxOutcome.steps;
      }

      lastExactStr = exactStr;
      lastApproxStr = approxStr;

      if (typeof CalculatorUI !== 'undefined') {
        CalculatorUI.lastExactStr = exactStr;
        CalculatorUI.lastApproxStr = approxStr;
      }

      if (typeof State !== 'undefined') {
        State.publish('CALC_UPDATED', {
          exactStr: exactStr,
          approxStr: approxStr,
          k: k
        });
      }

      showResults(exactStr, approxStr, k, applyMode, method, stepsToDisplay, polyHTML, xInput);
    } catch (err) {
      UIUtils.showErrorCard(container, '#poly-error', err.message, 'Evaluation Error');
    }
  }

  function showResults(exactStr, approxStr, k, applyMode, method, steps, polyHTML, xValue) {
    const resultsEl = container.querySelector('#poly-results');

    // Build steps HTML
    let stepsHTML = '';
    if (steps.length > 0) {
      stepsHTML = `
        <div class="card animate-slide-up">
          <div class="card__header">
            <h3 class="card__title text-base">Evaluation Trace</h3>
          </div>
          <div class="card__body">
            <div class="steps-list font-mono text-sm">
              ${steps.map((step, i) => `
                <div class="step-item step-item--poly animate-slide-up stagger-${Math.min(i + 1, 5)}">
                  <strong class="text-secondary">Step ${step.num}:</strong>
                  <span class="text-primary ml-2">${step.exprHTML}</span>
                  <span class="text-accent ml-2"> = ${step.result}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    let modeLabel = '';
    const methodCased = method === 'chop' ? 'Chop' : 'Round';
    if (applyMode === 'exact') modeLabel = 'Exact';
    if (applyMode === 'after') modeLabel = `${k}-Digit ${methodCased} (Applied safely to final result)`;
    if (applyMode === 'before') modeLabel = `${k}-Digit ${methodCased} (Applied to inputs only)`;
    if (applyMode === 'both') modeLabel = `${k}-Digit ${methodCased} Simulator (Inputs & every step)`;

    const exactSciHTML = typeof Calculator !== 'undefined' ? Calculator.formatToScientificHTML(exactStr) : exactStr;

    resultsEl.innerHTML = `
      <!-- Function display card -->
      <div class="card animate-slide-up results-card mb-4">
        <div class="card__body text-center p-4">
          <div class="poly-display">
             f(x) = ${polyHTML}
          </div>
          <div class="text-secondary text-sm">
             Evaluated at x = ${UIUtils.escapeHTML(xValue)}
          </div>
        </div>
      </div>

      <!-- Results comparison card -->
      <div class="card animate-slide-up results-card">
        <div class="card__header">
          <h3 class="card__title text-base">Final Answers</h3>
          <span class="badge">${UIUtils.escapeHTML(modeLabel)}</span>
        </div>
        <div class="card__body">

          <!-- Explicit Exact Mathematical Breakdown -->
          <div class="exact-formats-box">
            <div class="ea-result-label mb-2 font-medium">Exact Value (p) Formats</div>
            <div class="ea-result-content gap-2">
               <div class="exact-formats-row">
                 <span class="text-secondary text-sm">Standard Notation</span>
                 <span class="result-value result-value--full text-base">${exactStr}</span>
               </div>
               <div class="exact-formats-row">
                 <span class="text-secondary text-sm">Scientific / LaTeX</span>
                 <span class="math-notation">${exactSciHTML}</span>
               </div>
            </div>
          </div>

          <div class="results-grid results-grid--2col">
            <div class="result-item">
              <span class="result-label">Exact Value (p)</span>
              <span class="result-value result-value--full">${exactStr}</span>
            </div>
            <div class="result-item result-item--highlight">
              <span class="result-label">Approximation (p*)</span>
              <span class="result-value ${method === 'chop' ? 'result-value--chop' : 'result-value--round'}">${approxStr}</span>
            </div>
          </div>

          <!-- Export to Error Analysis Box -->
          <div class="export-section">
             <p class="text-sm text-secondary mb-3">Need to compute relative or absolute errors?</p>
             <button class="btn btn--primary inline-flex" id="poly-export-ea" type="button">
               ⊘ Send Output to Error Analysis
             </button>
          </div>
        </div>
      </div>

      ${stepsHTML}
    `;

    resultsEl.style.display = 'block';

    // Bind Export Button
    container.querySelector('#poly-export-ea').addEventListener('click', () => {
      const trueEl = document.getElementById('ea-true-value');
      const approxEl = document.getElementById('ea-approx-value');
      if (trueEl) trueEl.value = lastExactStr;
      if (approxEl) approxEl.value = lastApproxStr;

      const eaTab = document.querySelector('button[aria-controls="panel-error-analysis"]');
      if (eaTab) eaTab.click();
    });
  }

  return { init };
})();
