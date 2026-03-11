/* ==========================================================================
   CALCULATOR-UI.JS — Renders the Calculator module panel
   Provides expression input, transformation mode selection, and results display.
   ========================================================================== */

const CalculatorUI = (() => {

  let container = null;

  /**
   * Initialize the Calculator UI into the given DOM container.
   */
  function init(panelEl) {
    container = panelEl;
    render();
    bindEvents();
  }

  /**
   * Render the full calculator panel HTML.
   */
  function render() {
    container.innerHTML = `
      <!-- Module Header Card -->
      <div class="card animate-slide-up">
        <div class="card__header">
          <span class="card__icon animate-glow-pulse">⊞</span>
          <h2 class="card__title">Calculator</h2>
        </div>
        <div class="card__body">
          <p>Enter an arithmetic expression and choose transformation modes for exact and finite-digit arithmetic. Supports <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, parentheses, and implicit multiplication.</p>
        </div>
      </div>

      <!-- Input Card -->
      <div class="card animate-slide-up stagger-1">
        <div class="card__header">
          <h3 class="card__title text-base">Expression Input</h3>
        </div>
        <div class="card__body">
          <!-- Expression input -->
          <div class="input-group mb-4">
            <label class="input-group__label" for="calc-expression">Arithmetic Expression</label>
            <input
              class="input input--numeric"
              type="text"
              id="calc-expression"
              placeholder="e.g. (2.1892)(3.7008) or 2+3*4"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <!-- Configuration Controls -->
          <div class="ea-option-group mb-4">
            <div class="flex gap-4 flex-wrap items-end">
              <!-- k-digit stepper -->
              <div class="input-group flex-auto">
                <label class="input-group__label" for="calc-k-value">Significant Digits (k)</label>
                <div class="stepper" id="calc-k-stepper">
                  <button class="stepper__btn" id="calc-k-dec" type="button" aria-label="Decrease k" tabindex="0">−</button>
                  <input
                    class="stepper__input input--numeric"
                    type="number"
                    id="calc-k-value"
                    value="5"
                    min="1"
                    max="15"
                    step="1"
                  >
                  <button class="stepper__btn" id="calc-k-inc" type="button" aria-label="Increase k" tabindex="0">+</button>
                </div>
              </div>

              <!-- Method -->
              <div class="input-group">
                <label class="input-group__label">Transformation Method</label>
                <div class="ea-radio-group">
                  <label class="ea-radio">
                    <input type="radio" name="calc-method" value="chop" checked>
                    <span>Chop</span>
                  </label>
                  <label class="ea-radio">
                    <input type="radio" name="calc-method" value="round">
                    <span>Round</span>
                  </label>
                </div>
              </div>

              <!-- Apply Mode -->
              <div class="input-group">
                <label class="input-group__label">Apply Transformation to</label>
                <div class="ea-radio-group">
                  <label class="ea-radio">
                    <input type="radio" name="calc-apply" value="after">
                    <span>After (Final Result)</span>
                  </label>
                  <label class="ea-radio">
                    <input type="radio" name="calc-apply" value="before">
                    <span>Before (Inputs)</span>
                  </label>
                  <label class="ea-radio">
                    <input type="radio" name="calc-apply" value="both" checked>
                    <span>Both (Inputs & Steps)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="calc-actions mt-4">
            <button class="btn btn--primary" id="calc-compute" type="button">
              <span aria-hidden="true">▶</span> Compute
            </button>
            <button class="btn btn--ghost" id="calc-clear" type="button">Clear</button>
          </div>
        </div>
      </div>

      <!-- Results area (hidden until computed) -->
      <div id="calc-results" class="calc-results mt-4" style="display: none;">
        <!-- Filled dynamically -->
      </div>

      <!-- Error display -->
      <div id="calc-error" class="calc-error mt-4" style="display: none;">
        <!-- Filled dynamically -->
      </div>
    `;
  }

  /**
   * Bind all event listeners.
   */
  function bindEvents() {
    const exprInput = container.querySelector('#calc-expression');
    const kInput = container.querySelector('#calc-k-value');
    const kDec = container.querySelector('#calc-k-dec');
    const kInc = container.querySelector('#calc-k-inc');
    const computeBtn = container.querySelector('#calc-compute');
    const clearBtn = container.querySelector('#calc-clear');

    // Stepper controls
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

    // Enter key computes
    exprInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        compute();
      }
    });

    // Clear
    clearBtn.addEventListener('click', () => {
      exprInput.value = '';
      kInput.value = 5;
      container.querySelector('input[name="calc-method"][value="chop"]').checked = true;
      container.querySelector('input[name="calc-apply"][value="both"]').checked = true;
      UIUtils.hideElement(container, '#calc-results');
      UIUtils.hideElement(container, '#calc-error');
      exprInput.focus();
    });
  }

  /**
   * Run computation and display results.
   */
  function compute() {
    const exprInput = container.querySelector('#calc-expression');
    const kInput = container.querySelector('#calc-k-value');
    const methodInput = container.querySelector('input[name="calc-method"]:checked');
    const applyInput = container.querySelector('input[name="calc-apply"]:checked');

    const expr = exprInput.value.trim();
    const k = parseInt(kInput.value, 10);
    const method = methodInput ? methodInput.value : 'chop';
    const applyMode = applyInput ? applyInput.value : 'both';

    UIUtils.hideElement(container, '#calc-error');
    UIUtils.hideElement(container, '#calc-results');

    try {
      // 1. Evaluate EXACT result (true value p)
      const exactOutcome = Calculator.parseAndEvaluate(expr, 'exact', '', k);
      const exactStr = Calculator.formatNumber(exactOutcome.result);

      // 2. Evaluate APPROXIMATION (p*) based on user settings
      let approxStr;
      let stepsToDisplay = [];

      if (applyMode === 'after') {
        const approxRawStr = method === 'chop' ? Calculator.chopToK(exactOutcome.result, k) : Calculator.roundToK(exactOutcome.result, k);
        approxStr = approxRawStr;
        stepsToDisplay = exactOutcome.steps;
      } else {
        const approxOutcome = Calculator.parseAndEvaluate(expr, applyMode, method, k);
        approxStr = Calculator.formatNumber(approxOutcome.result);
        stepsToDisplay = approxOutcome.steps;
      }

      // 3. Store for Error Analysis integration
      CalculatorUI.lastExactStr = exactStr;
      CalculatorUI.lastApproxStr = approxStr;
      CalculatorUI.lastK = k;

      if (typeof State !== 'undefined') {
        State.publish('CALC_UPDATED', {
          exactStr: exactStr,
          approxStr: approxStr,
          k: k
        });
      }

      showResults(exactStr, approxStr, k, applyMode, method, stepsToDisplay);
    } catch (err) {
      UIUtils.showErrorCard(container, '#calc-error', err.message, 'Syntax Error');
    }
  }

  /**
   * Display the results card with Exact vs Approximation.
   */
  function showResults(exactStr, approxStr, k, applyMode, method, steps) {
    const resultsEl = container.querySelector('#calc-results');

    // Build PEMDAS steps HTML
    let stepsHTML = '';
    if (steps.length > 0) {
      stepsHTML = `
        <div class="card animate-slide-up">
          <div class="card__header">
            <h3 class="card__title text-base">Step-by-Step Breakdown</h3>
          </div>
          <div class="card__body">
            <div class="steps-list">
              ${steps.map((step, i) => `
                <div class="step-item animate-slide-up stagger-${Math.min(i + 1, 5)}">
                  <span class="step-number">Step ${i + 1}</span>
                  <span class="step-expr">
                    <span class="step-operand">${formatStepNum(step.left)}</span>
                    <span class="step-op">${step.operator}</span>
                    <span class="step-operand">${formatStepNum(step.right)}</span>
                    <span class="step-eq">=</span>
                    <span class="step-result">${step.result}</span>
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Determine descriptive mode label
    let modeLabel = '';
    const methodCased = method === 'chop' ? 'Chop' : 'Round';
    if (applyMode === 'after') modeLabel = `${k}-Digit ${methodCased} (Applied safely to final result)`;
    if (applyMode === 'before') modeLabel = `${k}-Digit ${methodCased} (Applied to inputs only)`;
    if (applyMode === 'both') modeLabel = `${k}-Digit ${methodCased} Simulator (Inputs & every step)`;

    const exactSciHTML = Calculator.formatToScientificHTML(exactStr);

    resultsEl.innerHTML = `
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
        </div>
      </div>

      ${stepsHTML}
    `;

    resultsEl.style.display = 'block';
  }

  /**
   * Internal formatting for steps display.
   */
  function formatStepNum(num) {
    if (Number.isInteger(num)) return num.toString();
    let s = num.toPrecision(15);
    s = s.replace(/(\.[0-9]*[1-9])0+$/, '$1');
    s = s.replace(/\.0+$/, '');
    return s;
  }

  return { init };
})();
