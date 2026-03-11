/* ==========================================================================
   UTILS.JS — Shared UI utility functions
   Prevents duplication across module UI files.
   ========================================================================== */

const UIUtils = (() => {

    /**
     * Escape HTML to prevent XSS when injecting user-provided text.
     * @param {string} str
     * @returns {string}
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Hide an element by ID within a container.
     * Sets display to none and clears innerHTML.
     * @param {HTMLElement} container
     * @param {string} selector
     */
    function hideElement(container, selector) {
        const el = container.querySelector(selector);
        if (el) {
            el.style.display = 'none';
            el.innerHTML = '';
        }
    }

    /**
     * Show an element by ID within a container.
     * Sets display to block.
     * @param {HTMLElement} container
     * @param {string} selector
     */
    function showElement(container, selector) {
        const el = container.querySelector(selector);
        if (el) {
            el.style.display = 'block';
        }
    }

    /**
     * Render a standard error card into a target element.
     * @param {HTMLElement} container
     * @param {string} selector - target element selector
     * @param {string} message - error message text
     * @param {string} [title='Error'] - error card title
     */
    function showErrorCard(container, selector, message, title = 'Error') {
        const el = container.querySelector(selector);
        if (!el) return;
        el.innerHTML = `
            <div class="card card--error animate-scale-in">
                <div class="card__header">
                    <span class="card__icon text-error">&#9888;</span>
                    <h3 class="card__title card__title--error">${escapeHTML(title)}</h3>
                </div>
                <div class="card__body">
                    <p class="error-message">${escapeHTML(message)}</p>
                </div>
            </div>
        `;
        el.style.display = 'block';
    }

    return { escapeHTML, hideElement, showElement, showErrorCard };

})();
