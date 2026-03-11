/* ==========================================================================
   POLYNOMIAL.JS — Polynomial Parsing and Evaluator Engine
   ========================================================================== */

const Polynomial = (() => {

    /**
     * Parses a string like "3x^3 - 2x^2 + x - 5" into an array of term objects.
     * @returns {Array<{coefficient: number, exponent: number}>}
     */
    function parsePolynomial(input) {
        if (!input || !input.trim()) throw new Error("Polynomial string cannot be empty.");

        // Remove spaces and normalize
        let cleaned = input.toLowerCase().replace(/\s+/g, '');
        if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);

        // Replace all '-' with '+-' so we can split easily by '+'
        // But handle exponents that might have negative signs (e.g. x^-2)
        // A simple trick: only replace '-' if it's not preceded by '^'
        cleaned = cleaned.replace(/(?<!\^)-/g, '+-');

        const termStrings = cleaned.split('+').filter(t => t.length > 0);
        const terms = [];

        for (let t of termStrings) {
            let coeff = 1;
            let exp = 0;

            if (t.includes('x')) {
                const [cStr, eStr] = t.split('x');

                // Parse coefficient
                if (cStr === '' || cStr === '+') coeff = 1;
                else if (cStr === '-') coeff = -1;
                else coeff = parseFloat(cStr);

                // Parse exponent
                if (eStr === '') exp = 1;
                else if (eStr.startsWith('^')) exp = parseInt(eStr.substring(1), 10);
                else throw new Error(`Invalid exponent format in term: ${t}`);
            } else {
                // Constant term
                coeff = parseFloat(t);
                exp = 0;
            }

            if (isNaN(coeff)) throw new Error(`Invalid coefficient in term: ${t}`);
            if (isNaN(exp)) throw new Error(`Invalid exponent in term: ${t}`);

            if (coeff !== 0) {
                terms.push({ coefficient: coeff, exponent: exp });
            }
        }

        // Aggregate terms with same exponent and sort descending
        const termMap = {};
        for (const term of terms) {
            termMap[term.exponent] = (termMap[term.exponent] || 0) + term.coefficient;
        }

        const finalTerms = Object.keys(termMap)
            .map(e => ({ exponent: parseInt(e, 10), coefficient: termMap[e] }))
            .filter(t => t.coefficient !== 0)
            .sort((a, b) => b.exponent - a.exponent);

        if (finalTerms.length === 0) return [{ coefficient: 0, exponent: 0 }];

        return finalTerms;
    }

    /**
     * Evaluates a polynomial array at x.
     * Supports applying k-digit chopping/rounding at different stages.
     * @returns {{result: number, steps: Array}}
     */
    function evaluatePolynomial(terms, xValue, applyMode = 'exact', method = 'chop', k = 8) {
        let steps = [];
        let finalResult = 0;

        // Access global Calculator utilities
        if (typeof Calculator === 'undefined') {
            throw new Error("Calculator module is required for precision features.");
        }

        let x = parseFloat(xValue);
        let xStr = Calculator.formatNumber(x);

        const transform = (num) => {
            if (applyMode === 'exact' || applyMode === 'after') return num;
            const str = method === 'chop' ? Calculator.chopToK(num, k) : Calculator.roundToK(num, k);
            return parseFloat(str);
        };
        const formatNum = (num) => Calculator.formatNumber(num);

        if (applyMode === 'before' || applyMode === 'both') {
            x = transform(x);
            xStr = formatNum(x);
        }

        let sum = 0;
        let stepNumber = 1;
        let sumParts = [];

        for (let i = 0; i < terms.length; i++) {
            let { coefficient, exponent } = terms[i];

            // Transform coefficient if mode requires it
            if (applyMode === 'before' || applyMode === 'both') {
                coefficient = transform(coefficient);
            }

            let cStr = formatNum(coefficient);
            let termValue;
            let stepExpr = "";
            let stepMath = "";

            if (exponent === 0) {
                termValue = coefficient;
                stepMath = `${cStr}`;
            } else if (exponent === 1) {
                termValue = coefficient * x;
                stepMath = `${cStr} × (${xStr})`;
            } else {
                const tempX = Math.pow(x, exponent);
                termValue = coefficient * tempX;
                stepMath = `${cStr} × (${xStr})<sup>${exponent}</sup>`;
            }

            if (applyMode === 'both') {
                termValue = transform(termValue);
            }

            sum += termValue;

            if (applyMode === 'both') {
                sum = transform(sum);
            }

            steps.push({
                num: stepNumber,
                exprHTML: stepMath,
                result: formatNum(termValue)
            });

            // Build the final sum string (e.g., 24 - 8 + 2 - 5)
            let tvStr = formatNum(termValue);
            if (i > 0 && termValue >= 0) {
                sumParts.push(`+ ${tvStr}`);
            } else if (termValue < 0) {
                // Formatting negative values clearly
                sumParts.push(`- ${formatNum(Math.abs(termValue))}`);
            } else {
                sumParts.push(tvStr);
            }

            stepNumber++;
        }

        steps.push({
            num: stepNumber,
            exprHTML: `Final Sum: ${sumParts.join(' ')}`,
            result: formatNum(sum)
        });

        finalResult = sum;

        if (applyMode === 'after') {
            const afterStr = method === 'chop' ? Calculator.chopToK(finalResult, k) : Calculator.roundToK(finalResult, k);
            finalResult = parseFloat(afterStr);
        }

        return { result: finalResult, steps, extractedTerms: terms, xUsed: x };
    }

    /**
     * Converts a polynomial term array back into a beautifully formatted string
     * wrapped in basic HTML (using <sup>).
     */
    function formatPolynomialHTML(terms) {
        if (terms.length === 0 || (terms.length === 1 && terms[0].coefficient === 0)) return '0';

        let html = '';
        for (let i = 0; i < terms.length; i++) {
            const t = terms[i];
            let cStr = Calculator.formatNumber(t.coefficient);

            let sign = '';
            if (i > 0) {
                sign = t.coefficient < 0 ? ' − ' : ' + ';
                cStr = Calculator.formatNumber(Math.abs(t.coefficient));
            } else if (t.coefficient < 0) {
                sign = '−'; // Use mathematical minus instead of hyphen
                cStr = Calculator.formatNumber(Math.abs(t.coefficient));
            }

            if (t.exponent === 0) {
                html += `${sign}${cStr}`;
            } else {
                // omit coefficient if it's 1 or -1 unless exponent is 0
                if (cStr === '1') cStr = '';

                let xPart = 'x';
                if (t.exponent !== 1) {
                    xPart = `x<sup>${t.exponent}</sup>`;
                }
                html += `${sign}${cStr}${xPart}`;
            }
        }
        return html;
    }

    return {
        parsePolynomial,
        evaluatePolynomial,
        formatPolynomialHTML
    };

})();
