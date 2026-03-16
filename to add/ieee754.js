/* ==========================================================================
   IEEE754.JS — Core math logic for 64-bit Floating-Point conversions.
   ========================================================================== */

const IEEE754 = (() => {

    /**
     * Convert a decimal number (string or number) into its IEEE-754 64-bit binary representation.
     * Returns an object containing the final 64-bit string AND all the mathematical steps for UI display.
     */
    function decimalToIEEE(decimalInput) {
        let num = parseFloat(decimalInput);
        if (isNaN(num)) throw new Error("Invalid decimal input.");

        const steps = {
            original: num,
            sign: num < 0 || (num === 0 && 1 / num === -Infinity) ? 1 : 0,
            integerSteps: [],
            fractionSteps: [],
            normalized: "",
            exponent: 0,
            biasedExponent: 0,
            exponentBinary: "",
            mantissaBinary: "",
            final64Bit: "",
            isSpecial: false,
            specialReason: ""
        };

        // Handle Special Cases (0, Infinity, NaN)
        if (num === 0) {
            steps.isSpecial = true;
            steps.specialReason = "Zero";
            steps.exponentBinary = "00000000000";
            steps.mantissaBinary = "0".repeat(52);
            steps.final64Bit = steps.sign + steps.exponentBinary + steps.mantissaBinary;
            return steps;
        }

        if (!isFinite(num)) {
            steps.isSpecial = true;
            steps.specialReason = "Infinity";
            steps.exponentBinary = "11111111111";
            steps.mantissaBinary = "0".repeat(52);
            steps.final64Bit = steps.sign + steps.exponentBinary + steps.mantissaBinary;
            return steps;
        }

        // Work with absolute value for binary conversion
        let absNum = Math.abs(num);

        // Split into Integer and Fractional parts
        let intPart = Math.floor(absNum);
        let fracPart = absNum - intPart;

        // 1. Convert Integer Part (Repeated Division by 2)
        let intBinary = "";
        if (intPart === 0) {
            intBinary = "0";
            steps.integerSteps.push({ div: "0 / 2", q: 0, r: 0 });
        } else {
            let tempInt = intPart;
            while (tempInt > 0) {
                let quotient = Math.floor(tempInt / 2);
                let remainder = tempInt % 2;
                steps.integerSteps.push({
                    div: `${tempInt} / 2`,
                    q: quotient,
                    r: remainder
                });
                intBinary = remainder.toString() + intBinary;
                tempInt = quotient;
            }
        }

        // 2. Convert Fractional Part (Repeated Multiplication by 2)
        // We calculate enough bits for 52-bit mantissa + exponent shift. Max ~1074 bits for subnormals, but we cap reasonably.
        let fracBinary = "";
        let tempFrac = fracPart;
        let maxBits = 60; // Calculate a bit extra to handle normalization shift

        while (tempFrac > 0 && fracBinary.length < maxBits + (intPart === 0 ? 10 : 0)) {
            let mult = tempFrac * 2;
            let iPart = Math.floor(mult);
            let fPart = mult - iPart;
            steps.fractionSteps.push({
                step: `0.${tempFrac.toString().split('.')[1] || '0'} × 2`, // attempt clean string display
                mult: Number(mult.toPrecision(15)),
                i: iPart,
                f: Number(fPart.toPrecision(15))
            });
            fracBinary += iPart.toString();
            tempFrac = fPart;
        }
        if (fracBinary === "") fracBinary = "0";

        // Combine
        let fullBinary = intBinary + "." + fracBinary;

        // 3. Normalize
        let exp = 0;
        let mantissa = "";

        if (intPart > 0) {
            // Shift decimal left
            exp = intBinary.length - 1;
            mantissa = intBinary.substring(1) + fracBinary;
        } else {
            // Shift decimal right
            let firstOneIdx = fracBinary.indexOf("1");
            if (firstOneIdx !== -1) {
                exp = -(firstOneIdx + 1);
                mantissa = fracBinary.substring(firstOneIdx + 1);
            } else {
                // If it's literally 0, handled above, but fallback
                exp = 0;
                mantissa = "0";
            }
        }

        steps.exponent = exp;

        // Mantissa truncation/padding to exactly 52 bits
        // In true IEEE-754 we'd apply round-to-nearest-even here if the 53rd bit is 1.
        // For educational simulation, we simulate the JS engine's native parsing via DataView to guarantee correctness of the final string,
        // but we show the textbook steps alongside it.

        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, num, false); // false = big-endian

        let binary64 = "";
        for (let i = 0; i < 8; i++) {
            binary64 += view.getUint8(i).toString(2).padStart(8, '0');
        }

        steps.final64Bit = binary64;
        steps.sign = parseInt(binary64.substring(0, 1), 2);
        steps.exponentBinary = binary64.substring(1, 12);
        steps.mantissaBinary = binary64.substring(12, 64);

        steps.biasedExponent = parseInt(steps.exponentBinary, 2);
        steps.normalized = `(-1)^${steps.sign} × 2^{${steps.biasedExponent - 1023}} × (1.${steps.mantissaBinary})`;

        return steps;
    }

    /**
     * Convert an arbitrary 64-bit IEEE-754 binary string back into a decimal number.
     * Returns an object containing the final number and mathematical breakdown steps.
     */
    function ieeeToDecimal(binaryString) {
        const cleanBin = binaryString.replace(/[^01]/g, '');
        if (cleanBin.length !== 64) throw new Error("Input must be exactly 64 bits.");

        const signBit = cleanBin.substring(0, 1);
        const expBits = cleanBin.substring(1, 12);
        const mantissaBits = cleanBin.substring(12, 64);

        const steps = {
            original: binaryString,
            cleanBin: cleanBin,
            signBit: signBit,
            signValue: signBit === "1" ? -1 : 1,
            expBits: expBits,
            biasedExp: parseInt(expBits, 2),
            trueExp: 0,
            mantissaBits: mantissaBits,
            mantissaFraction: 0,
            isSpecial: false,
            specialType: "",
            finalValue: 0
        };

        // Determine special cases (0, Subnormal, Infinity, NaN)
        if (steps.biasedExp === 2047) {
            steps.isSpecial = true;
            if (mantissaBits.includes("1")) {
                steps.specialType = "NaN";
                steps.finalValue = NaN;
            } else {
                steps.specialType = "Infinity";
                steps.finalValue = steps.signValue * Infinity;
            }
            return steps;
        }

        if (steps.biasedExp === 0) {
            if (!mantissaBits.includes("1")) {
                steps.isSpecial = true;
                steps.specialType = "Zero";
                steps.finalValue = steps.signValue === -1 ? -0 : 0;
                return steps;
            } else {
                // Subnormal
                steps.trueExp = -1022; // Subnormals have exponent -1022, not -1023
                // Mantissa does NOT have implicit leading 1
            }
        } else {
            // Normalized
            steps.trueExp = steps.biasedExp - 1023;
        }

        // Calculate Mantissa fraction value
        let fraction = 0;
        for (let i = 0; i < mantissaBits.length; i++) {
            if (mantissaBits[i] === '1') {
                fraction += Math.pow(2, -(i + 1));
            }
        }
        steps.mantissaFraction = fraction;

        // Calculate final value
        let mantissaMultiplier = (steps.biasedExp === 0 && steps.mantissaFraction > 0) ? fraction : (1 + fraction);
        steps.finalValue = steps.signValue * Math.pow(2, steps.trueExp) * mantissaMultiplier;

        return steps;
    }

    /**
     * Given an IEEE-754 64-bit string, determine the geometric interval [a, b) it represents.
     */
    function getMachineNumberInterval(binaryString) {
        const cleanBin = binaryString.replace(/[^01]/g, '');
        // Validate briefly
        if (cleanBin.length !== 64) return null;

        const p = 53; // Double precision has 53 bits of precision (52 stored + 1 implicit)
        const expBits = cleanBin.substring(1, 12);
        const biasedExp = parseInt(expBits, 2);

        // Subnormals or Specials don't have standard intervals in the same way, but mathematically:
        if (biasedExp === 2047) return { lower: "N/A", upper: "N/A", equation: "Infinity/NaN cannot form standard geometric intervals." };

        let trueExp = biasedExp === 0 ? -1022 : biasedExp - 1023;

        // Machine epsilon scaled to the exponent
        // The distance between two adjacent machine numbers at exponent e is 2^{e - (p-1)}
        // The interval around x is [x - 0.5 * gap, x + 0.5 * gap) = [x - 2^{e - p}, x + 2^{e - p})
        const powerStr = `${trueExp} - ${p}`;
        const computedExp = trueExp - p;

        return {
            equation: `[ x - 2^{${powerStr}}, x + 2^{${powerStr}} )`,
            gapDelta: `2^{${computedExp}}`,
            gapNumeric: Math.pow(2, computedExp)
        };
    }

    return {
        decimalToIEEE,
        ieeeToDecimal,
        getMachineNumberInterval
    };

})();
