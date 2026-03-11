/* ==========================================================================
   APP.JS — Entry point for Spatial Quasar · Numerical Methods
   Theme toggle + tab/module switching — logic modules come later.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ────────────────────────────────────────────────────────
    // Theme Toggle
    // Reads saved preference from localStorage, defaults to dark.
    // ────────────────────────────────────────────────────────
    const html = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Apply saved theme or default to dark
    const savedTheme = localStorage.getItem('sq-theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('sq-theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        // Sun for dark mode (click to go light), Moon for light mode (click to go dark)
        themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
        themeToggleBtn.setAttribute(
            'aria-label',
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
    }

    // ────────────────────────────────────────────────────────
    // Tab / Module Switching
    // Both sidebar tabs and mobile tab bar control the same panels.
    // Uses roving tabindex and arrow key navigation (WAI-ARIA tabs pattern).
    // ────────────────────────────────────────────────────────
    const sidebarTablist = document.getElementById('sidebar-tablist');
    const mobileTablist = document.getElementById('mobile-tablist');
    const sidebarNav = document.getElementById('sidebar-nav');
    const allTabs = document.querySelectorAll('[data-tab]');
    const allPanels = document.querySelectorAll('.module-panel');

    // Viewport-aware aria-hidden: hide the inactive tablist from screen readers
    function syncTablistVisibility() {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (sidebarNav) sidebarNav.setAttribute('aria-hidden', isDesktop ? 'false' : 'true');
        if (mobileTablist) mobileTablist.setAttribute('aria-hidden', isDesktop ? 'true' : 'false');

        // Update tabindex for the active tablist only
        const activeTablist = isDesktop ? sidebarTablist : mobileTablist;
        const inactiveTablist = isDesktop ? mobileTablist : sidebarTablist;

        if (activeTablist) {
            activeTablist.querySelectorAll('[role="tab"]').forEach(tab => {
                tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
            });
        }
        if (inactiveTablist) {
            inactiveTablist.querySelectorAll('[role="tab"]').forEach(tab => {
                tab.tabIndex = -1;
            });
        }
    }

    syncTablistVisibility();
    window.matchMedia('(min-width: 768px)').addEventListener('change', syncTablistVisibility);

    function activateModule(moduleId, focusTab) {
        // Update tabs
        allTabs.forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === moduleId;
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.classList.toggle('is-active', isActive);
        });

        // Update roving tabindex for the visible tablist
        syncTablistVisibility();

        // Update panels — animate the incoming one
        allPanels.forEach(panel => {
            const isTarget = panel.id === moduleId;
            panel.classList.toggle('is-active', isTarget);
            if (isTarget) {
                panel.classList.remove('animate-slide-up');
                // Force reflow to restart animation
                void panel.offsetWidth;
                panel.classList.add('animate-slide-up');
            }
        });

        // Focus the newly activated tab if requested (keyboard navigation)
        if (focusTab) focusTab.focus();

        // Refresh modules that need state updates on activation
        if (moduleId === 'module-error' && typeof ErrorAnalysisUI !== 'undefined') {
            ErrorAnalysisUI.refresh();
        }
    }

    // Get sibling tabs within the same tablist
    function getTabSiblings(tab) {
        const tablist = tab.closest('[role="tablist"]');
        if (!tablist) return [];
        return Array.from(tablist.querySelectorAll('[role="tab"]'));
    }

    allTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activateModule(tab.getAttribute('data-tab'));
        });

        // Keyboard: Arrow keys for roving tabindex, Enter/Space activates
        tab.addEventListener('keydown', (e) => {
            const siblings = getTabSiblings(tab);
            const idx = siblings.indexOf(tab);

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = siblings[(idx + 1) % siblings.length];
                activateModule(next.getAttribute('data-tab'), next);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
                activateModule(prev.getAttribute('data-tab'), prev);
            } else if (e.key === 'Home') {
                e.preventDefault();
                activateModule(siblings[0].getAttribute('data-tab'), siblings[0]);
            } else if (e.key === 'End') {
                e.preventDefault();
                const last = siblings[siblings.length - 1];
                activateModule(last.getAttribute('data-tab'), last);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateModule(tab.getAttribute('data-tab'));
            }
        });
    });

    // ────────────────────────────────────────────────────────
    // Tutorial / "How to Use" Modal
    // ────────────────────────────────────────────────────────
    const tutorialBtn = document.getElementById('tutorial-btn');
    const modalOverlay = document.getElementById('tutorial-modal');
    const modalCloseBtn = document.getElementById('modal-close');

    if (tutorialBtn && modalOverlay) {
        tutorialBtn.addEventListener('click', () => {
            modalOverlay.classList.add('is-open');
            // Trap focus inside modal
            modalCloseBtn.focus();
        });

        modalCloseBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('is-open');
            tutorialBtn.focus();
        });

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('is-open');
                tutorialBtn.focus();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
                modalOverlay.classList.remove('is-open');
                tutorialBtn.focus();
            }
        });
    }

    // ────────────────────────────────────────────────────────
    // Entrance animations — stagger cards on load
    // ────────────────────────────────────────────────────────
    const animatedEls = document.querySelectorAll('.animate-on-load');
    animatedEls.forEach((el, i) => {
        el.style.animationDelay = `${i * 100 + 100}ms`;
        el.classList.add('animate-slide-up');
    });

    // ────────────────────────────────────────────────────────
    // ────────────────────────────────────────────────────────
    // Global & Overlay Initialization
    // ────────────────────────────────────────────────────────
    if (typeof AccessibilityPanel !== 'undefined') {
        AccessibilityPanel.init();
    }
    if (typeof TutorialUI !== 'undefined') {
        TutorialUI.init();
    }

    // Initialize each module's UI into its panel container.
    // ────────────────────────────────────────────────────────
    const calcPanel = document.getElementById('module-calculator');
    if (calcPanel && typeof CalculatorUI !== 'undefined') {
        CalculatorUI.init(calcPanel);
    }

    const errorPanel = document.getElementById('module-error');
    if (errorPanel && typeof ErrorAnalysisUI !== 'undefined') {
        ErrorAnalysisUI.init(errorPanel);
    }

    const polyPanel = document.getElementById('module-polynomial');
    if (polyPanel && typeof PolynomialUI !== 'undefined') {
        PolynomialUI.init(polyPanel);
    }

    const ieee754Panel = document.getElementById('module-ieee754');
    if (ieee754Panel && typeof IEEE754UI !== 'undefined') {
        IEEE754UI.init(ieee754Panel);
    }

});
