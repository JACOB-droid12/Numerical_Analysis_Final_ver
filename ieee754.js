"use strict";

// IEEE-754 teaching helper used by the dedicated double-precision module.
(function initIEEE754(globalScope) {
  const IEEE754 = (() => {
    /**
     * Convert a decimal number (string or number) into its IEEE-754 64-bit binary representation.
     * Returns the final 64-bit string and the intermediate teaching steps used by the UI.
     */
    function decimalToIEEE(decimalInput) {
      const rawInput = typeof decimalInput === "string" ? decimalInput.trim() : decimalInput;
      if (rawInput === "NaN" || (typeof rawInput === "number" && Number.isNaN(rawInput))) {
        return {
          original: Number.NaN,
          sign: 0,
          integerSteps: [],
          fractionSteps: [],
          normalized: "NaN",
          exponent: 0,
          biasedExponent: 2047,
          exponentBinary: "11111111111",
          mantissaBinary: "1000000000000000000000000000000000000000000000000000",
          final64Bit: "0111111111111000000000000000000000000000000000000000000000000000",
          isSpecial: true,
          specialReason: "NaN"
        };
      }

      let num = parseFloat(rawInput);
      if (Number.isNaN(num)) {
        throw new Error("Invalid decimal input.");
      }

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

      if (num === 0) {
        steps.isSpecial = true;
        steps.specialReason = "Zero";
        steps.exponentBinary = "00000000000";
        steps.mantissaBinary = "0".repeat(52);
        steps.final64Bit = String(steps.sign) + steps.exponentBinary + steps.mantissaBinary;
        return steps;
      }

      if (!Number.isFinite(num)) {
        steps.isSpecial = true;
        steps.specialReason = "Infinity";
        steps.exponentBinary = "11111111111";
        steps.mantissaBinary = "0".repeat(52);
        steps.final64Bit = String(steps.sign) + steps.exponentBinary + steps.mantissaBinary;
        return steps;
      }

      const absNum = Math.abs(num);
      const intPart = Math.floor(absNum);
      const fracPart = absNum - intPart;

      let intBinary = "";
      if (intPart === 0) {
        intBinary = "0";
        steps.integerSteps.push({ div: "0 / 2", q: 0, r: 0 });
      } else {
        let tempInt = intPart;
        while (tempInt > 0) {
          const quotient = Math.floor(tempInt / 2);
          const remainder = tempInt % 2;
          steps.integerSteps.push({
            div: `${tempInt} / 2`,
            q: quotient,
            r: remainder
          });
          intBinary = remainder.toString() + intBinary;
          tempInt = quotient;
        }
      }

      let fracBinary = "";
      let tempFrac = fracPart;
      const maxBits = 60;

      while (tempFrac > 0 && fracBinary.length < maxBits + (intPart === 0 ? 10 : 0)) {
        const mult = tempFrac * 2;
        const iPart = Math.floor(mult);
        const fPart = mult - iPart;
        steps.fractionSteps.push({
          step: `0.${tempFrac.toString().split(".")[1] || "0"} x 2`,
          mult: Number(mult.toPrecision(15)),
          i: iPart,
          f: Number(fPart.toPrecision(15))
        });
        fracBinary += iPart.toString();
        tempFrac = fPart;
      }
      if (fracBinary === "") {
        fracBinary = "0";
      }

      let exp = 0;

      if (intPart > 0) {
        exp = intBinary.length - 1;
      } else {
        const firstOneIdx = fracBinary.indexOf("1");
        if (firstOneIdx !== -1) {
          exp = -(firstOneIdx + 1);
        }
      }

      steps.exponent = exp;

      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, num, false);

      let binary64 = "";
      for (let i = 0; i < 8; i += 1) {
        binary64 += view.getUint8(i).toString(2).padStart(8, "0");
      }

      steps.final64Bit = binary64;
      steps.sign = parseInt(binary64.substring(0, 1), 2);
      steps.exponentBinary = binary64.substring(1, 12);
      steps.mantissaBinary = binary64.substring(12, 64);
      steps.biasedExponent = parseInt(steps.exponentBinary, 2);
      steps.normalized = `(-1)^${steps.sign} x 2^{${steps.biasedExponent - 1023}} x (1.${steps.mantissaBinary})`;

      return steps;
    }

    /**
     * Convert a 64-bit IEEE-754 binary string back into a decimal number and explanatory fields.
     */
    function ieeeToDecimal(binaryString) {
      const cleanBin = binaryString.replace(/[^01]/g, "");
      if (cleanBin.length !== 64) {
        throw new Error("Input must be exactly 64 bits.");
      }

      const signBit = cleanBin.substring(0, 1);
      const expBits = cleanBin.substring(1, 12);
      const mantissaBits = cleanBin.substring(12, 64);

      const steps = {
        original: binaryString,
        cleanBin,
        signBit,
        signValue: signBit === "1" ? -1 : 1,
        expBits,
        biasedExp: parseInt(expBits, 2),
        trueExp: 0,
        mantissaBits,
        mantissaFraction: 0,
        isSpecial: false,
        specialType: "",
        finalValue: 0
      };

      if (steps.biasedExp === 2047) {
        steps.isSpecial = true;
        if (mantissaBits.includes("1")) {
          steps.specialType = "NaN";
          steps.finalValue = Number.NaN;
        } else {
          steps.specialType = "Infinity";
          steps.finalValue = steps.signValue * Number.POSITIVE_INFINITY;
        }
        return steps;
      }

      if (steps.biasedExp === 0) {
        if (!mantissaBits.includes("1")) {
          steps.isSpecial = true;
          steps.specialType = "Zero";
          steps.finalValue = steps.signValue === -1 ? -0 : 0;
          return steps;
        }

        steps.trueExp = -1022;
      } else {
        steps.trueExp = steps.biasedExp - 1023;
      }

      let fraction = 0;
      for (let i = 0; i < mantissaBits.length; i += 1) {
        if (mantissaBits[i] === "1") {
          fraction += Math.pow(2, -(i + 1));
        }
      }
      steps.mantissaFraction = fraction;

      const mantissaMultiplier = steps.biasedExp === 0 && steps.mantissaFraction > 0
        ? fraction
        : 1 + fraction;
      steps.finalValue = steps.signValue * Math.pow(2, steps.trueExp) * mantissaMultiplier;

      return steps;
    }

    /**
     * Given a 64-bit IEEE-754 string, determine the geometric interval [a, b) it represents.
     */
    function getMachineNumberInterval(binaryString) {
      const cleanBin = binaryString.replace(/[^01]/g, "");
      if (cleanBin.length !== 64) {
        return null;
      }

      const p = 53;
      const expBits = cleanBin.substring(1, 12);
      const biasedExp = parseInt(expBits, 2);

      if (biasedExp === 2047) {
        return {
          lower: "N/A",
          upper: "N/A",
          equation: "Infinity/NaN cannot form standard geometric intervals."
        };
      }

      const trueExp = biasedExp === 0 ? -1022 : biasedExp - 1023;
      const powerStr = `${trueExp} - ${p}`;
      const computedExp = trueExp - p;

      return {
        equation: `[ x - 2^(${powerStr}), x + 2^(${powerStr}) )`,
        gapDelta: `2^(${computedExp})`,
        gapNumeric: Math.pow(2, computedExp)
      };
    }

    return {
      decimalToIEEE,
      ieeeToDecimal,
      getMachineNumberInterval
    };
  })();

  globalScope.IEEE754 = IEEE754;
})(window);
