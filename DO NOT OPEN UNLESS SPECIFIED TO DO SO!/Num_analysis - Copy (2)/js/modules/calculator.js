/* ==========================================================================
   CALCULATOR.JS — Arithmetic engine with chopping & rounding
   - Shunting-yard expression parser (NO eval)
   - Supports +, -, *, /, parentheses, implicit multiplication
   - PEMDAS step-by-step trace
   - k-digit chopping and rounding
   ========================================================================== */

const Calculator = (() => {

    // ────────────────────────────────────────────────────────
    // TOKENIZER
    // Converts expression string into token array.
    // Handles implicit multiplication: )(, number(, )number
    // ────────────────────────────────────────────────────────
    function tokenize(expr) {
        const tokens = [];
        let i = 0;
        const s = expr.replace(/\s+/g, ''); // strip whitespace

        while (i < s.length) {
            const ch = s[i];

            // Number (integer or decimal)
            if (ch >= '0' && ch <= '9' || ch === '.') {
                let num = '';
                while (i < s.length && (s[i] >= '0' && s[i] <= '9' || s[i] === '.')) {
                    num += s[i];
                    i++;
                }
                // Validate: no double dots
                if ((num.match(/\./g) || []).length > 1) {
                    throw new Error(`Invalid number: "${num}"`);
                }
                // Insert implicit * if previous token is ) or a number
                if (tokens.length > 0) {
                    const prev = tokens[tokens.length - 1];
                    if (prev.type === 'number' || prev.type === 'rparen') {
                        tokens.push({ type: 'operator', value: '*' });
                    }
                }
                tokens.push({ type: 'number', value: parseFloat(num), raw: num });
                continue;
            }

            // Operators
            if ('+-*/'.includes(ch)) {
                // Handle unary minus/plus at start or after ( or operator
                if ((ch === '-' || ch === '+') &&
                    (tokens.length === 0 ||
                        tokens[tokens.length - 1].type === 'lparen' ||
                        tokens[tokens.length - 1].type === 'operator')) {
                    // Unary: read the sign and consume following number
                    const sign = ch;
                    i++;
                    if (i < s.length && (s[i] >= '0' && s[i] <= '9' || s[i] === '.')) {
                        let num = '';
                        while (i < s.length && (s[i] >= '0' && s[i] <= '9' || s[i] === '.')) {
                            num += s[i];
                            i++;
                        }
                        const val = parseFloat(num) * (sign === '-' ? -1 : 1);
                        tokens.push({ type: 'number', value: val, raw: sign + num });
                    } else if (i < s.length && s[i] === '(') {
                        // Handle -(expr): push -1 * (
                        tokens.push({ type: 'number', value: sign === '-' ? -1 : 1, raw: sign === '-' ? '-1' : '1' });
                        tokens.push({ type: 'operator', value: '*' });
                    } else {
                        throw new Error(`Unexpected character after "${sign}"`);
                    }
                    continue;
                }
                tokens.push({ type: 'operator', value: ch });
                i++;
                continue;
            }

            // Left paren
            if (ch === '(') {
                // Implicit multiplication: 5(, )(
                if (tokens.length > 0) {
                    const prev = tokens[tokens.length - 1];
                    if (prev.type === 'number' || prev.type === 'rparen') {
                        tokens.push({ type: 'operator', value: '*' });
                    }
                }
                tokens.push({ type: 'lparen', value: '(' });
                i++;
                continue;
            }

            // Right paren
            if (ch === ')') {
                tokens.push({ type: 'rparen', value: ')' });
                i++;
                continue;
            }

            throw new Error(`Unexpected character: "${ch}" at position ${i + 1}`);
        }

        if (tokens.length === 0) {
            throw new Error('Empty expression');
        }

        return tokens;
    }

    // ────────────────────────────────────────────────────────
    // SHUNTING-YARD → RPN (Reverse Polish Notation)
    // ────────────────────────────────────────────────────────
    const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const LEFT_ASSOC = { '+': true, '-': true, '*': true, '/': true };

    function toRPN(tokens) {
        const output = [];
        const opStack = [];

        for (const tok of tokens) {
            if (tok.type === 'number') {
                output.push(tok);
            } else if (tok.type === 'operator') {
                while (
                    opStack.length > 0 &&
                    opStack[opStack.length - 1].type === 'operator' &&
                    (PRECEDENCE[opStack[opStack.length - 1].value] > PRECEDENCE[tok.value] ||
                        (PRECEDENCE[opStack[opStack.length - 1].value] === PRECEDENCE[tok.value] && LEFT_ASSOC[tok.value]))
                ) {
                    output.push(opStack.pop());
                }
                opStack.push(tok);
            } else if (tok.type === 'lparen') {
                opStack.push(tok);
            } else if (tok.type === 'rparen') {
                while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'lparen') {
                    output.push(opStack.pop());
                }
                if (opStack.length === 0) {
                    throw new Error('Mismatched parentheses: extra ")"');
                }
                opStack.pop(); // discard the '('
            }
        }

        while (opStack.length > 0) {
            const top = opStack.pop();
            if (top.type === 'lparen') {
                throw new Error('Mismatched parentheses: extra "("');
            }
            output.push(top);
        }

        return output;
    }

    // ────────────────────────────────────────────────────────
    // EVALUATE RPN with step-by-step PEMDAS trace
    // Returns { result, steps }
    // ────────────────────────────────────────────────────────
    const OP_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    function evaluateRPN(rpn, applyMode, method, k) {
        const stack = [];
        const steps = [];

        for (const tok of rpn) {
            if (tok.type === 'number') {
                stack.push(tok.value);
            } else if (tok.type === 'operator') {
                if (stack.length < 2) {
                    throw new Error('Invalid expression: not enough operands');
                }
                const b = stack.pop();
                const a = stack.pop();
                let result;

                switch (tok.value) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '*': result = a * b; break;
                    case '/':
                        if (b === 0) throw new Error('Division by zero');
                        result = a / b;
                        break;
                }

                let resultStr = formatNumber(result);
                if (applyMode === 'both') {
                    resultStr = method === 'chop' ? chopToK(result, k) : roundToK(result, k);
                    result = parseFloat(resultStr);
                }

                steps.push({
                    left: a,
                    operator: OP_SYMBOLS[tok.value],
                    right: b,
                    result: resultStr
                });

                stack.push(result);
            }
        }

        if (stack.length !== 1) {
            throw new Error('Invalid expression: too many values');
        }

        let finalResult = stack[0];
        if (applyMode === 'after') {
            const finalStr = method === 'chop' ? chopToK(finalResult, k) : roundToK(finalResult, k);
            finalResult = parseFloat(finalStr);
        }

        return { result: finalResult, steps };
    }

    // ────────────────────────────────────────────────────────
    // PUBLIC: parseAndEvaluate(expression, applyMode, method, k)
    // Modes: 'exact' (none), 'after' (final only), 'before' (inputs only), 'both' (inputs & steps)
    // Returns { result, steps } or throws Error
    // ────────────────────────────────────────────────────────
    function parseAndEvaluate(expression, applyMode = 'exact', method = 'chop', k = 8) {
        if (!expression || !expression.trim()) {
            throw new Error('Please enter an expression');
        }
        const tokens = tokenize(expression);

        if (applyMode === 'before' || applyMode === 'both') {
            for (const tok of tokens) {
                if (tok.type === 'number') {
                    const transformedStr = method === 'chop' ? chopToK(tok.value, k) : roundToK(tok.value, k);
                    tok.value = parseFloat(transformedStr);
                    tok.raw = transformedStr; // Use transformed string in visual trace
                }
            }
        }

        const rpn = toRPN(tokens);
        return evaluateRPN(rpn, applyMode, method, k);
    }

    // ────────────────────────────────────────────────────────
    // SIGNIFICANT DIGIT UTILITIES
    // ────────────────────────────────────────────────────────

    /**
     * Format a number to its full-precision string.
     * Uses toPrecision(15) to stay within float64's reliable range
     * and avoid floating-point noise artifacts.
     */
    function toFullPrecision(num) {
        if (num === 0) return '0';
        // 15 significant digits is the safe limit for float64
        let s = num.toPrecision(15);
        // Remove trailing zeros after decimal point
        if (s.includes('.')) {
            s = s.replace(/0+$/, '');
            if (s.endsWith('.')) s = s.slice(0, -1);
        }
        return s;
    }

    /**
     * Count significant digits in a number string.
     * Rules:
     * - Leading zeros don't count
     * - Trailing zeros after decimal DO count
     * - Zeros between non-zero digits count
     */
    function countSignificantDigits(numStr) {
        if (typeof numStr === 'number') numStr = toFullPrecision(numStr);
        // Remove sign
        let s = numStr.replace(/^[+-]/, '');
        // Remove leading zeros and decimal point for counting
        // Find the first significant (non-zero) digit
        let inSigDigits = false;
        let count = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '.') continue;
            if (!inSigDigits && ch === '0') continue; // leading zero
            inSigDigits = true;
            count++;
        }
        return Math.max(count, 0);
    }

    /**
     * k-digit CHOPPING
     * Truncate to k significant digits by dropping all digits after the k-th.
     * Works on the string representation to avoid floating-point rounding.
     */
    function chopToK(number, k) {
        if (k < 1 || k > 15) throw new Error('k must be between 1 and 15');
        if (number === 0) return '0';

        const isNegative = number < 0;
        const absNum = Math.abs(number);

        // Get a clean string representation — toPrecision(15) avoids float64 noise
        let fullStr = absNum.toPrecision(15);
        // Remove trailing zeros after decimal for clean processing
        if (fullStr.includes('.')) {
            fullStr = fullStr.replace(/0+$/, '');
            if (fullStr.endsWith('.')) fullStr += '0';
        }

        // Separate into parts: integer and fractional
        let parts = fullStr.split('.');
        let intPart = parts[0];
        let fracPart = parts[1] || '';

        // Build array of all digits (without the dot)
        let allDigits = intPart + fracPart;

        // Find first significant digit position
        let firstSigIdx = 0;
        while (firstSigIdx < allDigits.length && allDigits[firstSigIdx] === '0') {
            firstSigIdx++;
        }

        if (firstSigIdx >= allDigits.length) return isNegative ? '-0' : '0';

        // Take exactly k significant digits (chop = just take first k, ignore rest)
        let sigDigits = allDigits.substring(firstSigIdx, firstSigIdx + k);

        // Pad with zeros if we don't have enough digits
        while (sigDigits.length < k) {
            sigDigits += '0';
        }

        // Reconstruct the number string
        // The total number of digits before the decimal is intPart.length
        // The significant digits start at firstSigIdx in the combined digit string
        let result;
        const intLen = intPart.length;

        if (firstSigIdx < intLen) {
            // First sig digit is in integer part
            const digitsInInt = intLen - firstSigIdx; // how many digits from first sig to decimal point

            if (k <= digitsInInt) {
                // All k sig digits fit in integer part
                // Rebuild: sig digits + trailing zeros to fill integer part
                let intResult = allDigits.substring(0, firstSigIdx) + sigDigits;
                // Pad the rest of the integer part with zeros
                const remainingIntZeros = intLen - intResult.length;
                for (let i = 0; i < remainingIntZeros; i++) intResult += '0';
                result = intResult;
            } else {
                // Some sig digits are in the fractional part
                let combined = allDigits.substring(0, firstSigIdx) + sigDigits;
                let intResultPart = combined.substring(0, intLen);
                let fracResultPart = combined.substring(intLen);
                result = fracResultPart.length > 0 ? intResultPart + '.' + fracResultPart : intResultPart;
            }
        } else {
            // First sig digit is in fractional part (number < 1, like 0.00456)
            let leadingFracZeros = firstSigIdx - intLen; // zeros after decimal before first sig digit
            let fracResult = '';
            for (let i = 0; i < leadingFracZeros; i++) fracResult += '0';
            fracResult += sigDigits;
            result = '0.' + fracResult;
        }

        // Remove trailing zeros ONLY from decimal part if they go beyond k sig digits
        // (Actually, for chopping, we keep exactly k sig digits — trailing zeros count)

        return isNegative ? '-' + result : result;
    }

    /**
     * k-digit ROUNDING
     * Round to k significant digits using standard rounding (round half up).
     */
    function roundToK(number, k) {
        if (k < 1 || k > 15) throw new Error('k must be between 1 and 15');
        if (number === 0) return '0';

        const isNegative = number < 0;
        const absNum = Math.abs(number);

        // Use the magnitude to determine the rounding position
        // Number of digits before decimal = floor(log10(absNum)) + 1
        const magnitude = Math.floor(Math.log10(absNum));
        // Shift so that k significant digits are to the left of the decimal
        const factor = Math.pow(10, k - 1 - magnitude);

        // Round
        const shifted = Math.round(absNum * factor);
        // Shift back
        let resultNum = shifted / factor;

        // Format to k significant digits
        let result = resultNum.toPrecision(k);

        // Clean up: remove trailing zeros only if they exceed k sig digits
        // toPrecision already gives us exactly k sig digits, so we keep as-is
        // But remove unnecessary trailing zeros beyond k sig digits
        // Actually toPrecision(k) already handles this perfectly

        return isNegative ? '-' + result : result;
    }

    /**
     * Format a number for display — show all meaningful digits.
     */
    function formatNumber(num) {
        if (Number.isInteger(num) && Math.abs(num) < 1e15) {
            return num.toString();
        }
        return toFullPrecision(num);
    }

    /**
     * Convert a numeric string (or number) into LaTeX scientific notation
     * e.g. "0.00000864" -> "8.64 \times 10^{-6}"
     * Cleans up floating point artifacts (e.g. 00000001 or 9999999 at the end)
     */
    function formatToScientificLaTeX(numStr) {
        const num = parseFloat(numStr);
        if (isNaN(num) || num === 0) return '0';

        // Convert to exponential notation (e.g. "8.640000000000001e-6")
        let [coeff, exp] = num.toExponential(15).split('e');

        // Remove trailing floating point noise (00000... or 99999...)
        // This regex looks for 4 or more 0s or 9s towards the end of the decimal string
        coeff = coeff.replace(/0{5,}\d*$/, '');

        // If it was a string of 9s, we need to round up the last remaining digit
        if (/9{5,}\d*$/.test(coeff)) {
            coeff = coeff.replace(/9{5,}\d*$/, '');
            let lastChar = coeff[coeff.length - 1];
            if (lastChar === '.') {
                coeff = coeff.slice(0, -1);
                // Need to round the integer part up
                const intPart = parseInt(coeff, 10) + 1;
                // Since coefficient is always 1.xxx to 9.xxx, rounding 9 up gives 10
                if (intPart === 10) {
                    coeff = "1";
                    exp = (parseInt(exp, 10) + 1).toString();
                } else {
                    coeff = intPart.toString();
                }
            } else {
                let roundedDigit = parseInt(lastChar, 10) + 1;
                if (roundedDigit === 10) {
                    // Carry over logic would go here, but since we are just cleaning noise, 
                    // simple parsing with toPrecision is safer.
                    // Fallback to simpler robust clean:
                    coeff = parseFloat(num.toPrecision(14)).toExponential().split('e')[0];
                } else {
                    coeff = coeff.slice(0, -1) + roundedDigit;
                }
            }
        }

        // Clean up any surviving trailing zeros
        if (coeff.includes('.')) {
            coeff = coeff.replace(/0+$/, '');
            if (coeff.endsWith('.')) coeff = coeff.slice(0, -1);
        }

        // Clean up the exponent (remove + sign, remove leading zeros)
        exp = parseInt(exp, 10).toString();

        return `${coeff} \\times 10^{${exp}}`;
    }

    /**
     * Convert a numeric string (or number) into HTML scientific notation
     * e.g. "0.00000864" -> "8.64 × 10<sup>-6</sup>"
     * Uses the same cleaning logic as formatToScientificLaTeX.
     */
    function formatToScientificHTML(numStr) {
        const latex = formatToScientificLaTeX(numStr);
        if (latex === '0') return '0';
        // Convert LaTeX "coeff \times 10^{exp}" to HTML "coeff × 10<sup>exp</sup>"
        return latex
            .replace(/\\times/g, '×')
            .replace(/10\^{([^}]+)}/g, '10<sup>$1</sup>');
    }

    // ────────────────────────────────────────────────────────
    // PUBLIC API
    // ────────────────────────────────────────────────────────
    return {
        parseAndEvaluate,
        chopToK,
        roundToK,
        countSignificantDigits,
        formatNumber,
        toFullPrecision,
        formatToScientificLaTeX,
        formatToScientificHTML
    };

})();
