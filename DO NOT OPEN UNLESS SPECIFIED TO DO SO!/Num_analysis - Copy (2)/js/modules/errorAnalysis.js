/* ==========================================================================
   ERROR-ANALYSIS.JS — Error measurement functions
   Absolute error, relative error, maximum error bound, significant digits.
   ========================================================================== */

const ErrorAnalysis = (() => {

    /**
     * Absolute Error = |p − p*|
     * @param {number} p   — true value
     * @param {number} pStar — approximation
     * @returns {number}
     */
    function absoluteError(p, pStar) {
        return Math.abs(p - pStar);
    }

    /**
     * Relative Error = |p − p*| / |p|
     * Returns { decimal, percentage } or null if p = 0.
     * @param {number} p
     * @param {number} pStar
     * @returns {{ decimal: number, percentage: number } | null}
     */
    function relativeError(p, pStar) {
        if (p === 0) return null; // undefined when true value is zero
        const absErr = Math.abs(p - pStar);
        const rel = absErr / Math.abs(p);
        return {
            decimal: rel,
            percentage: rel * 100
        };
    }

    /**
     * Maximum Error Bound = 0.5 × 10^(c − k)
     * where c is the exponent when p* is in normalized scientific notation
     * (p* = d.ddd × 10^c) and k is the number of significant digits.
     *
     * @param {number} pStar — the approximation
     * @param {number} k     — number of significant digits
     * @returns {{ bound: number, exponent: number } | null}
     */
    function maximumErrorBound(pStar, k) {
        if (pStar === 0) return { bound: 0, exponent: 0 };
        // c = floor(log10(|p*|))
        const c = Math.floor(Math.log10(Math.abs(pStar)));
        const bound = 0.5 * Math.pow(10, c - k);
        return { bound, exponent: c };
    }

    /**
     * Number of Significant Digits of p* approximating p.
     * Largest integer m such that |p − p*| / |p| ≤ 5 × 10^(−m).
     * If p = p* (exact), returns Infinity.
     * If p = 0, returns null (undefined).
     *
     * @param {number} p
     * @param {number} pStar
     * @returns {number | null}
     */
    function significantDigitsCount(p, pStar) {
        if (p === 0) return null;
        const absErr = Math.abs(p - pStar);
        if (absErr === 0) return Infinity;
        const relErr = absErr / Math.abs(p);
        // Find largest m: relErr ≤ 5 × 10^(−m)
        // relErr ≤ 5 × 10^(−m)
        // relErr / 5 ≤ 10^(−m)
        // −m ≥ log10(relErr / 5)
        // m ≤ −log10(relErr / 5)
        // m = floor(−log10(relErr / 5))
        const m = Math.floor(-Math.log10(relErr / 5));
        return Math.max(m, 0);
    }

    /**
     * Format a number for display in formulas.
     */
    function formatNum(num) {
        if (num === 0) return '0';
        if (Number.isInteger(num) && Math.abs(num) < 1e15) return num.toString();
        // Use toPrecision(15) and trim
        let s = num.toPrecision(15);
        if (s.includes('.')) {
            s = s.replace(/0+$/, '');
            if (s.endsWith('.')) s = s.slice(0, -1);
        }
        return s;
    }

    // Public API
    return {
        absoluteError,
        relativeError,
        maximumErrorBound,
        significantDigitsCount,
        formatNum
    };

})();
