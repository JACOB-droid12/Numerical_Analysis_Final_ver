/* ==========================================================================
   TUTORIAL.JS — Interactive First-Visit Overlays
   Anchors floating instruction cards to specific DOM elements.
   ========================================================================== */

const TutorialUI = (() => {

    const storageKey = 'quasar_tutorial_seen';
    let isRunning = false;
    let currentStep = 0;
    let overlayEl = null;

    // Define the tour steps
    const steps = [
        {
            title: "Welcome to Spatial Quasar",
            text: "This is a premium numerical methods calculator. Let's take a quick tour to see how everything works.",
            target: ".nav__title",
            align: "bottom"
        },
        {
            title: "The Calculator",
            text: "Use this tab to perform arithmetic with dynamic precision controls and see step-by-step PEMDAS breakdowns.",
            target: "#tab-calculator",
            align: "right"
        },
        {
            title: "Precision Transformers",
            text: "Choose your 'k' value and select Chopping or Rounding. You can simulate arithmetic errors seamlessly.",
            target: "#calc-k-stepper",
            align: "top"
        },
        {
            title: "Error Analysis",
            text: "Switch to this module to systematically measure the absolute and relative errors of your computational approximations.",
            target: "#tab-error",
            align: "right"
        },
        {
            title: "Auto-Import",
            text: "Once you compute a true value (p) and an approximation (p*), you can import them here automatically!",
            target: "#ea-import-status",
            align: "bottom"
        },
        {
            title: "Polynomial Evaluator",
            text: "Evaluate standard polynomials with full Horner's method precision simulations.",
            target: "#tab-polynomial",
            align: "right"
        },
        {
            title: "Accessibility Options",
            text: "Need high contrast, a dyslexia-friendly font, or larger text? Access the global settings menu anytime right here.",
            target: "#a11y-toggle",
            align: "bottom"
        }
    ];

    /**
     * Main initializer called by app.js on load.
     */
    function init() {
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) {
            setTimeout(() => startTour(), 800);
        }

        // Bind the "Start Interactive Tour" button inside the How-to-Use modal
        const startTourBtn = document.getElementById('start-tour-btn');
        if (startTourBtn) {
            startTourBtn.addEventListener('click', () => {
                // Close the modal first, then start the tour
                const modalOverlay = document.getElementById('tutorial-modal');
                if (modalOverlay) modalOverlay.classList.remove('is-open');
                startTour();
            });
        }
    }

    function startTour() {
        if (isRunning) return;
        isRunning = true;
        currentStep = 0;

        overlayEl = document.createElement('div');
        overlayEl.className = 'tutorial-overlay animate-fade-in';
        document.body.appendChild(overlayEl);

        const calcTab = document.getElementById('tab-calculator');
        if (calcTab) calcTab.click();

        renderStep();
    }

    function renderStep() {
        if (currentStep >= steps.length) {
            endTour();
            return;
        }

        const step = steps[currentStep];

        // Force tab switches to ensure target elements exist
        if (step.target === '#tab-error' || step.target === '#ea-import-status') {
            const t = document.getElementById('tab-error');
            if (t) t.click();
        } else if (step.target === '#tab-polynomial') {
            const t = document.getElementById('tab-polynomial');
            if (t) t.click();
        } else if (step.target === '#tab-calculator' || step.target === '#calc-k-stepper') {
            const t = document.getElementById('tab-calculator');
            if (t) t.click();
        }

        const targetEl = document.querySelector(step.target);

        overlayEl.innerHTML = `
      <div class="tutorial-card card animate-slide-up" role="dialog" aria-labelledby="tut-title" aria-modal="true">
        <div class="card__header">
          <h3 class="card__title" id="tut-title">${UIUtils.escapeHTML(step.title)}</h3>
          <span class="badge">${currentStep + 1} / ${steps.length}</span>
        </div>
        <div class="card__body pt-3">
          <p class="text-sm lh-relaxed mb-4">${step.text}</p>
          <div class="flex justify-between items-center">
            <button class="btn btn--ghost btn--sm text-tertiary" id="tut-skip" type="button">Skip Tour</button>
            <div class="flex gap-2">
              ${currentStep > 0 ? `<button class="btn btn--ghost btn--sm" id="tut-prev" type="button">Back</button>` : ''}
              <button class="btn btn--primary btn--sm" id="tut-next" type="button">${currentStep === steps.length - 1 ? 'Finish' : 'Next'}</button>
            </div>
          </div>
        </div>
      </div>
    `;

        positionCard(targetEl, step.align);

        const skipBtn = overlayEl.querySelector('#tut-skip');
        const prevBtn = overlayEl.querySelector('#tut-prev');
        const nextBtn = overlayEl.querySelector('#tut-next');

        skipBtn.addEventListener('click', endTour);
        if (prevBtn) prevBtn.addEventListener('click', () => { currentStep--; renderStep(); });
        nextBtn.addEventListener('click', () => { currentStep++; renderStep(); });

        // Focus trap: cycle Tab within the tutorial card buttons
        overlayEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { endTour(); return; }
            if (e.key !== 'Tab') return;

            const focusable = overlayEl.querySelectorAll('button:not([disabled])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        nextBtn.focus();
    }

    function positionCard(targetEl, align) {
        const card = overlayEl.querySelector('.tutorial-card');

        if (!targetEl) {
            card.style.top = '50%';
            card.style.left = '50%';
            card.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const rect = targetEl.getBoundingClientRect();
        const padding = 16;

        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        targetEl.classList.add('tutorial-highlight');

        let top = rect.top + window.scrollY;
        let left = rect.left + window.scrollX;

        if (align === 'bottom') {
            top = rect.bottom + window.scrollY + padding;
            left = rect.left + window.scrollX + (rect.width / 2) - 160;
        } else if (align === 'right') {
            top = rect.top + window.scrollY + (rect.height / 2) - 80;
            left = rect.right + window.scrollX + padding;
        } else if (align === 'top') {
            top = rect.top + window.scrollY - 200;
            left = rect.left + window.scrollX + (rect.width / 2) - 160;
        }

        if (left < 16) left = 16;
        if (left + 320 > window.innerWidth - 16) left = window.innerWidth - 336;
        if (top < 80) top = 80;

        card.style.top = `${top}px`;
        card.style.left = `${left}px`;
    }

    function endTour() {
        isRunning = false;
        if (overlayEl) overlayEl.remove();
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        localStorage.setItem(storageKey, 'true');

        const calcTab = document.getElementById('tab-calculator');
        if (calcTab) calcTab.click();
    }

    return { init, startTour };
})();
