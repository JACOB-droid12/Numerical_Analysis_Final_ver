/* ==========================================================================
   ACCESSIBILITY-PANEL.JS — Global A11y Toggles
   ========================================================================== */

const AccessibilityPanel = (() => {

    const storageKey = 'quasar_a11y_prefs';

    let prefs = {
        fontSize: 'normal',
        highContrast: false,
        reducedMotion: false,
        dyslexiaFont: false,
        solidBg: false
    };

    let overlayEl = null;

    /**
     * Initialize and load saved prefs from localStorage.
     */
    function init() {
        loadPrefs();
        applyPrefs();
        renderModal();
        bindGlobalToggle();
    }

    function loadPrefs() {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                prefs = { ...prefs, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn("Could not load a11y prefs", e);
        }
    }

    function savePrefs() {
        localStorage.setItem(storageKey, JSON.stringify(prefs));
        applyPrefs();
    }

    /**
     * Injects data-a11y-* attributes directly onto the HTML root node.
     */
    function applyPrefs() {
        const root = document.documentElement;
        root.setAttribute('data-a11y-fontsize', prefs.fontSize);

        if (prefs.highContrast) root.setAttribute('data-a11y-contrast', 'high');
        else root.removeAttribute('data-a11y-contrast');

        if (prefs.reducedMotion) root.setAttribute('data-a11y-motion', 'reduced');
        else root.removeAttribute('data-a11y-motion');

        if (prefs.dyslexiaFont) root.setAttribute('data-a11y-font', 'dyslexic');
        else root.removeAttribute('data-a11y-font');

        if (prefs.solidBg) root.setAttribute('data-a11y-glass', 'off');
        else root.removeAttribute('data-a11y-glass');
    }

    function renderModal() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'modal-overlay';
        overlayEl.id = 'a11y-modal';
        overlayEl.setAttribute('role', 'dialog');
        overlayEl.setAttribute('aria-modal', 'true');
        overlayEl.setAttribute('aria-labelledby', 'a11y-modal-title');

        overlayEl.innerHTML = `
      <div class="modal card">
        <div class="modal__header">
          <span class="card__icon text-accent">⊚</span>
          <h2 class="modal__title" id="a11y-modal-title">Accessibility Options</h2>
          <button class="modal__close" id="a11y-modal-close" type="button" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal__body a11y-modal-body">

          <!-- Font Size -->
          <div class="input-group">
            <label class="input-group__label">Global Text Size</label>
            <div class="ea-radio-group">
              <label class="ea-radio"><input type="radio" name="a11y-size" value="small"><span>Small</span></label>
              <label class="ea-radio"><input type="radio" name="a11y-size" value="normal"><span>Normal</span></label>
              <label class="ea-radio"><input type="radio" name="a11y-size" value="large"><span>Large</span></label>
              <label class="ea-radio"><input type="radio" name="a11y-size" value="xlarge"><span>X-Large</span></label>
            </div>
          </div>

          <hr class="a11y-divider">

          <!-- High Contrast -->
          <label class="ea-toggle-row">
            <input type="checkbox" id="a11y-contrast" class="ea-checkbox">
            <span class="ea-toggle-label">
              <strong>High Contrast Mode</strong><br>
              <span class="a11y-option-desc">Boosts background darkness and text brightness to maximize legibility (WCAG AAA).</span>
            </span>
          </label>

          <!-- Dyslexia Font -->
          <label class="ea-toggle-row">
            <input type="checkbox" id="a11y-dyslexia" class="ea-checkbox">
            <span class="ea-toggle-label">
              <strong>Dyslexia-Friendly Font</strong><br>
              <span class="a11y-option-desc">Replaces primary reading fonts with OpenDyslexic or Comic Sans to prevent letter swapping.</span>
            </span>
          </label>

          <!-- Solid Backgrounds (Glassmorphism off) -->
          <label class="ea-toggle-row">
            <input type="checkbox" id="a11y-solid" class="ea-checkbox">
            <span class="ea-toggle-label">
              <strong>Solid Backgrounds</strong><br>
              <span class="a11y-option-desc">Disables translucent glass blurs for users who find them distracting or have visual processing disorders.</span>
            </span>
          </label>

          <!-- Reduced Motion -->
          <label class="ea-toggle-row">
            <input type="checkbox" id="a11y-motion" class="ea-checkbox">
            <span class="ea-toggle-label">
              <strong>Reduce Motion</strong><br>
              <span class="a11y-option-desc">Disables all non-essential CSS transitions, hover slides, and glowing pulse animations.</span>
            </span>
          </label>

        </div>
      </div>
    `;

        document.body.appendChild(overlayEl);

        // Bind Close Events
        const closeBtn = overlayEl.querySelector('#a11y-modal-close');
        closeBtn.addEventListener('click', closeMenu);

        overlayEl.addEventListener('click', (e) => {
            if (e.target === overlayEl) closeMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlayEl.classList.contains('is-open')) {
                closeMenu();
            }
        });

        // Bind Change Events
        const radios = overlayEl.querySelectorAll('input[name="a11y-size"]');
        radios.forEach(r => r.addEventListener('change', (e) => {
            if (e.target.checked) {
                prefs.fontSize = e.target.value;
                savePrefs();
            }
        }));

        const chkContrast = overlayEl.querySelector('#a11y-contrast');
        chkContrast.addEventListener('change', (e) => { prefs.highContrast = e.target.checked; savePrefs(); });

        const chkDyslexic = overlayEl.querySelector('#a11y-dyslexia');
        chkDyslexic.addEventListener('change', (e) => { prefs.dyslexiaFont = e.target.checked; savePrefs(); });

        const chkSolid = overlayEl.querySelector('#a11y-solid');
        chkSolid.addEventListener('change', (e) => { prefs.solidBg = e.target.checked; savePrefs(); });

        const chkMotion = overlayEl.querySelector('#a11y-motion');
        chkMotion.addEventListener('change', (e) => { prefs.reducedMotion = e.target.checked; savePrefs(); });

        syncDOMToPrefs();
    }

    function syncDOMToPrefs() {
        if (!overlayEl) return;

        const radios = overlayEl.querySelectorAll('input[name="a11y-size"]');
        radios.forEach(r => {
            if (r.value === prefs.fontSize) r.checked = true;
        });

        overlayEl.querySelector('#a11y-contrast').checked = prefs.highContrast;
        overlayEl.querySelector('#a11y-dyslexia').checked = prefs.dyslexiaFont;
        overlayEl.querySelector('#a11y-solid').checked = prefs.solidBg;
        overlayEl.querySelector('#a11y-motion').checked = prefs.reducedMotion;
    }

    function bindGlobalToggle() {
        const toggleBtn = document.getElementById('a11y-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', openMenu);
        }
    }

    function openMenu() {
        syncDOMToPrefs();
        overlayEl.classList.add('is-open');
        const closeBtn = overlayEl.querySelector('#a11y-modal-close');
        closeBtn.focus();
    }

    function closeMenu() {
        overlayEl.classList.remove('is-open');
        const toggleBtn = document.getElementById('a11y-toggle');
        if (toggleBtn) toggleBtn.focus();
    }

    return { init, openMenu };
})();
