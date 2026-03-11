/* ==========================================================================
   IEEE754-UI.JS — Renders the IEEE-754 Converter module panel
   ========================================================================== */

const IEEE754UI = (() => {

    let container = null;

    /**
     * Initialize the IEEE-754 Converter UI.
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
          <span class="card__icon animate-glow-pulse text-accent">⑽</span>
          <h2 class="card__title">IEEE-754 Converter</h2>
        </div>
        <div class="card__body">
          <p>Convert between Base-10 Decimals and 64-bit Double-Precision Floating-Point machine numbers. See the precise step-by-step mathematical translation and understand the geometric real number intervals these approximations represent.</p>
        </div>
      </div>

      <div class="results-grid mt-4">
        <!-- Decimal to IEEE Form -->
        <div class="card animate-slide-up stagger-1">
          <div class="card__header">
            <h3 class="card__title text-base">Decimal ➔ IEEE-754 (64-bit)</h3>
          </div>
          <div class="card__body">
            <div class="input-group mb-4">
              <label class="input-group__label" for="ieee-dec-input">Base-10 Decimal Number</label>
              <div class="flex gap-2">
                  <input class="input input--numeric flex-1" type="text" id="ieee-dec-input" placeholder="e.g. 2026.015625">
                  <button class="btn btn--primary" id="ieee-dec-btn" type="button">Convert</button>
              </div>
            </div>
          </div>
        </div>

        <!-- IEEE to Decimal Form -->
        <div class="card animate-slide-up stagger-2">
          <div class="card__header">
            <h3 class="card__title text-base">IEEE-754 (64-bit) ➔ Decimal</h3>
          </div>
          <div class="card__body">
            <div class="input-group mb-4">
              <label class="input-group__label" for="ieee-bin-input">64-bit Binary String</label>
              <div class="flex gap-2">
                  <input class="input input--expr flex-1 font-mono" type="text" id="ieee-bin-input" placeholder="e.g. 010000001001111110101..." maxlength="64">
                  <button class="btn btn--primary" id="ieee-bin-btn" type="button">Convert</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- General Error Display -->
      <div id="ieee-error" class="mt-4" style="display: none;"></div>

      <!-- Results Area -->
      <div id="ieee-results" class="mt-4" style="display: none;"></div>
    `;
    }

    /**
     * Bind events to the inputs and buttons.
     */
    function bindEvents() {
        const decInput = container.querySelector('#ieee-dec-input');
        const decBtn = container.querySelector('#ieee-dec-btn');
        const binInput = container.querySelector('#ieee-bin-input');
        const binBtn = container.querySelector('#ieee-bin-btn');

        decBtn.addEventListener('click', () => handleDecimalToIEEE());
        decInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleDecimalToIEEE(); }
        });

        binBtn.addEventListener('click', () => handleIEEEToDecimal());
        binInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleIEEEToDecimal(); }
        });
    }

    function handleDecimalToIEEE() {
        const input = container.querySelector('#ieee-dec-input').value.trim();
        UIUtils.hideElement(container, '#ieee-error');
        UIUtils.hideElement(container, '#ieee-results');

        if (!input) {
            UIUtils.showErrorCard(container, '#ieee-error', 'Please enter a decimal number.', 'Conversion Error');
            return;
        }

        try {
            const steps = IEEE754.decimalToIEEE(input);
            const interval = IEEE754.getMachineNumberInterval(steps.final64Bit);
            renderDecimalToIEEESteps(steps, interval);
        } catch (e) {
            UIUtils.showErrorCard(container, '#ieee-error', "Failed to convert decimal to IEEE-754. Make sure it's a valid number.", 'Conversion Error');
        }
    }

    function handleIEEEToDecimal() {
        let input = container.querySelector('#ieee-bin-input').value.replace(/\s+/g, '');
        UIUtils.hideElement(container, '#ieee-error');
        UIUtils.hideElement(container, '#ieee-results');

        if (/[^01]/.test(input) && input.length > 0) {
            UIUtils.showErrorCard(container, '#ieee-error', 'Please enter only binary digits (0s and 1s).', 'Conversion Error');
            return;
        }

        if (input.length > 0 && input.length < 64) {
            input = input.padEnd(64, '0');
            container.querySelector('#ieee-bin-input').value = input;
        }

        if (input.length !== 64) {
            UIUtils.showErrorCard(container, '#ieee-error', 'Please enter up to 64 binary digits (0s and 1s).', 'Conversion Error');
            return;
        }

        try {
            const steps = IEEE754.ieeeToDecimal(input);
            const interval = IEEE754.getMachineNumberInterval(input);
            renderIEEEToDecimalSteps(steps, interval);
        } catch (e) {
            UIUtils.showErrorCard(container, '#ieee-error', 'Failed to convert IEEE-754 to decimal.', 'Conversion Error');
        }
    }

    /**
     * Render the detailed math breakdown for Decimal -> IEEE
     */
    function renderDecimalToIEEESteps(steps, interval) {
        const resultsEl = container.querySelector('#ieee-results');

        let intTableRows = steps.integerSteps.map(s => `
            <tr>
                <td>${s.div}</td>
                <td>${s.q}</td>
                <td><strong>${s.r}</strong></td>
            </tr>
        `).join('');

        let intTableHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 1: Integer Part to Binary</h4>
                ${steps.integerSteps.length > 0 ? `
                <table class="ieee-table">
                    <thead><tr><th>Division</th><th>Quotient</th><th>Remainder (Read Bottom-Up)</th></tr></thead>
                    <tbody>${intTableRows}</tbody>
                </table>
                ` : `<p class="text-secondary">Integer is 0, so binary is 0.</p>`}
            </div>
        `;

        let fracTableRows = steps.fractionSteps.map(s => `
            <tr>
                <td>${s.step}</td>
                <td>${s.mult}</td>
                <td><strong>${s.i}</strong></td>
                <td>${s.f}</td>
            </tr>
        `).join('');

        let fracTableHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 2: Fractional Part to Binary</h4>
                ${steps.fractionSteps.length > 0 ? `
                <table class="ieee-table">
                    <thead><tr><th>Operation</th><th>Result</th><th>Integer (Read Top-Down)</th><th>Fraction Kept</th></tr></thead>
                    <tbody>${fracTableRows}</tbody>
                </table>
                ` : `<p class="text-secondary">Fractional part is 0, so binary is 0.</p>`}
            </div>
        `;

        let normHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 3: Normalize</h4>
                <div class="ea-result-row">
                     <span class="ea-formula">Value = ${UIUtils.escapeHTML(steps.normalized)}</span>
                </div>
            </div>
        `;

        let expHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 4: Biased Exponent (c)</h4>
                <p class="mb-2">Double precision uses a bias of 1023.</p>
                <div class="ea-result-row">
                     <span class="ea-formula">c = ${steps.exponent} + 1023 = ${steps.biasedExponent}</span>
                     <span class="ea-value">Binary: ${steps.exponentBinary}</span>
                </div>
            </div>
        `;

        const outputCard = getOutputCardHTML(steps.sign, steps.exponentBinary, steps.mantissaBinary, null, interval);

        resultsEl.innerHTML = `
             <div class="card animate-slide-up">
                 <div class="card__header">
                     <h3 class="card__title">Conversion Steps</h3>
                 </div>
                 <div class="card__body font-mono text-sm">
                     ${!steps.isSpecial ? intTableHTML + fracTableHTML + normHTML + expHTML : `<p class="text-secondary">Special Case: ${UIUtils.escapeHTML(steps.specialReason)}</p>`}
                 </div>
             </div>
             ${outputCard}
        `;

        resultsEl.style.display = 'block';
    }

    /**
     * Render the detailed math breakdown for IEEE -> Decimal
     */
    function renderIEEEToDecimalSteps(steps, interval) {
        const resultsEl = container.querySelector('#ieee-results');

        let signHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 1: Determine Sign</h4>
                <p>Sign bit (s) is ${steps.signBit}.</p>
                <div class="ea-result-row">
                     <span class="ea-formula">Multiplier = (-1)^${steps.signBit} = ${steps.signValue}</span>
                </div>
            </div>
        `;

        let expHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 2: Unbias Exponent</h4>
                <p>Exponent bits are ${steps.expBits} (Binary ${steps.biasedExp}).</p>
                <div class="ea-result-row">
                     <span class="ea-formula">True Exponent (e) = ${steps.biasedExp} - 1023 = ${steps.trueExp}</span>
                </div>
            </div>
        `;

        let mantissaHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 3: Evaluate Mantissa</h4>
                <p class="mb-2" style="word-break: break-all;">Fraction bits: ${steps.mantissaBits}</p>
                <div class="ea-result-row">
                     <span class="ea-formula">Fractional Value (f) = ${steps.mantissaFraction}</span>
                </div>
                <div class="ea-result-row mt-3">
                     <span class="ea-formula">Mantissa (1 + f) = 1 + ${steps.mantissaFraction} = ${1 + steps.mantissaFraction}</span>
                </div>
            </div>
        `;

        let combineHTML = `
            <div class="mb-4">
                <h4 class="text-md mb-2">Step 4: Compute Final Value</h4>
                <div class="ea-result-row">
                     <span class="ea-formula">Value = ${steps.signValue} × 2^{${steps.trueExp}} × (${1 + steps.mantissaFraction})</span>
                     <span class="ea-value text-accent">${steps.finalValue}</span>
                </div>
            </div>
        `;

        const outputCard = getOutputCardHTML(steps.signBit, steps.expBits, steps.mantissaBits, steps.finalValue, interval);

        resultsEl.innerHTML = `
             <div class="card animate-slide-up">
                 <div class="card__header">
                     <h3 class="card__title">Conversion Steps</h3>
                 </div>
                 <div class="card__body font-mono text-sm">
                     ${!steps.isSpecial ? signHTML + expHTML + mantissaHTML + combineHTML : `<p class="text-secondary">Special Case: ${UIUtils.escapeHTML(steps.specialType)}</p>`}
                 </div>
             </div>
             ${outputCard}
        `;

        resultsEl.style.display = 'block';
    }

    /**
     * Shared helper to render the final stylized 64-bit sequence and geometric interval.
     */
    function getOutputCardHTML(sign, exp, mantissa, decimalVal, interval) {
        return `
        <div class="card animate-slide-up stagger-1">
             <div class="card__header">
                 <h3 class="card__title">64-bit IEEE Representation</h3>
                 ${decimalVal !== null ? `<span class="badge">Dec: ${decimalVal}</span>` : ''}
             </div>
             <div class="card__body">
                 <!-- 64-bit styling -->
                 <div class="ieee-bits-display">
                     <div class="ieee-bit-group">
                         <span class="text-error">${sign}</span>
                         <span class="ieee-bit-label">Sign</span>
                     </div>
                     <div class="ieee-bit-group">
                         <span class="text-info">${exp}</span>
                         <span class="ieee-bit-label">Exponent (11-bit)</span>
                     </div>
                     <div class="ieee-bit-group">
                         <span class="text-accent" style="word-break: break-all;">${mantissa}</span>
                         <span class="ieee-bit-label">Mantissa (52-bit Fraction)</span>
                     </div>
                 </div>

                 <div class="ea-result-row">
                     <span class="ea-result-label">Represented Real Number Interval</span>
                     ${interval ? `
                         <div class="math-notation text-md mb-2">
                             ${UIUtils.escapeHTML(interval.equation)}
                         </div>
                         <div class="text-sm text-secondary">
                             Distance to next machine number (Gap Δ): <strong class="text-primary">${interval.gapDelta}</strong> <br>
                             Numeric Length: ${interval.gapNumeric}
                         </div>
                     ` : '<span class="ea-value">N/A</span>'}
                 </div>
             </div>
         </div>
        `;
    }

    return { init };

})();
