"use strict";

(function initCalcEngine(globalScope) {
  const M = globalScope.MathEngine;
  if (!M) {
    throw new Error("MathEngine must be loaded before CalcEngine.");
  }

  const EPS = 1e-12;

  function isRationalValue(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "sign") &&
      Object.prototype.hasOwnProperty.call(value, "num") &&
      Object.prototype.hasOwnProperty.call(value, "den")
    );
  }

  function isCalcValue(value) {
    return Boolean(value && typeof value === "object" && value.kind === "calc");
  }

  function cleanNumber(value) {
    if (!Number.isFinite(value)) {
      return value;
    }
    return Object.is(value, -0) ? 0 : value;
  }

  function displayNumber(value) {
    if (!Number.isFinite(value)) {
      return value;
    }
    if (Math.abs(value) < EPS) {
      return 0;
    }
    return Object.is(value, -0) ? 0 : value;
  }

  function makeCalc(re, im) {
    return {
      kind: "calc",
      re: cleanNumber(Number(re)),
      im: cleanNumber(Number(im))
    };
  }

  function toNumber(rational) {
    if (!isRationalValue(rational)) {
      throw new Error("Expected a rational value.");
    }
    if (M.isZero(rational)) {
      return 0;
    }
    return rational.sign * (Number(rational.num) / Number(rational.den));
  }

  function fromRational(rational) {
    return makeCalc(toNumber(rational), 0);
  }

  function ensureCalc(value) {
    if (isCalcValue(value)) {
      return value;
    }
    if (isRationalValue(value)) {
      return fromRational(value);
    }
    throw new Error("Unsupported calculator value.");
  }

  function isZeroValue(value) {
    if (isCalcValue(value)) {
      return Math.abs(value.re) < EPS && Math.abs(value.im) < EPS;
    }
    return M.isZero(value);
  }

  function isRealValue(value) {
    return !isCalcValue(value) || Math.abs(value.im) < EPS;
  }

  function requireRealNumber(value, label) {
    if (isCalcValue(value)) {
      if (Math.abs(value.im) >= EPS) {
        throw new Error(label + " must be real.");
      }
      return value.re;
    }
    return toNumber(value);
  }

  function add(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.add(left, right);
    }
    const a = ensureCalc(left);
    const b = ensureCalc(right);
    return makeCalc(a.re + b.re, a.im + b.im);
  }

  function sub(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.sub(left, right);
    }
    const a = ensureCalc(left);
    const b = ensureCalc(right);
    return makeCalc(a.re - b.re, a.im - b.im);
  }

  function negate(value) {
    if (isRationalValue(value)) {
      return M.negate(value);
    }
    const calc = ensureCalc(value);
    return makeCalc(-calc.re, -calc.im);
  }

  function mul(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.mul(left, right);
    }
    const a = ensureCalc(left);
    const b = ensureCalc(right);
    return makeCalc(
      a.re * b.re - a.im * b.im,
      a.re * b.im + a.im * b.re
    );
  }

  function div(left, right) {
    if (isRationalValue(left) && isRationalValue(right)) {
      return M.div(left, right);
    }
    const a = ensureCalc(left);
    const b = ensureCalc(right);
    const denom = b.re * b.re + b.im * b.im;
    if (Math.abs(denom) < EPS) {
      throw new Error("Division by zero.");
    }
    return makeCalc(
      (a.re * b.re + a.im * b.im) / denom,
      (a.im * b.re - a.re * b.im) / denom
    );
  }

  function nonNegativeIntegerFromValue(value, label) {
    if (isCalcValue(value)) {
      if (Math.abs(value.im) >= EPS) {
        throw new Error(label + " must be a non-negative integer constant.");
      }
      if (!Number.isInteger(value.re) || value.re < 0) {
        throw new Error(label + " must be a non-negative integer constant.");
      }
      return value.re;
    }
    if (value.sign < 0 || value.den !== 1n) {
      throw new Error(label + " must be a non-negative integer constant.");
    }
    const n = Number(value.num);
    if (!Number.isSafeInteger(n)) {
      throw new Error(label + " is too large to evaluate safely.");
    }
    return n;
  }

  function powInt(base, exponent) {
    const n = nonNegativeIntegerFromValue(exponent, "Exponent");
    if (isRationalValue(base) && !isCalcValue(exponent)) {
      return M.powRational(base, n);
    }

    if (n === 0) {
      return isRationalValue(base) ? M.ONE : makeCalc(1, 0);
    }

    let result = makeCalc(1, 0);
    let current = ensureCalc(base);
    let e = n;
    while (e > 0) {
      if (e % 2 === 1) {
        result = mul(result, current);
      }
      e = Math.floor(e / 2);
      if (e > 0) {
        current = mul(current, current);
      }
    }
    return result;
  }

  function isNonNegativeIntegerRational(value) {
    return isRationalValue(value) && value.sign >= 0 && value.den === 1n;
  }

  function isIntegerRational(value) {
    return isRationalValue(value) && value.den === 1n;
  }

  function powRationalInteger(base, exponent) {
    if (!isRationalValue(base) || !isIntegerRational(exponent)) {
      throw new Error("Expected rational integer power arguments.");
    }

    if (M.isZero(base)) {
      if (exponent.sign < 0) {
        throw new Error("Division by zero.");
      }
      if (exponent.sign === 0) {
        return M.ONE;
      }
      return M.ZERO;
    }

    const magnitude = exponent.num;
    if (magnitude > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("Exponent is too large to evaluate safely.");
    }

    const n = Number(magnitude);
    const powered = M.powRational(base, n);
    if (exponent.sign < 0) {
      return M.div(M.ONE, powered);
    }
    return powered;
  }

  function powValue(base, exponent) {
    if (isRationalValue(base) && isIntegerRational(exponent)) {
      return powRationalInteger(base, exponent);
    }

    if (isNonNegativeIntegerRational(exponent)) {
      return powInt(base, exponent);
    }

    const baseReal = requireRealNumber(base, "Base");
    const exponentReal = requireRealNumber(exponent, "Exponent");
    if (baseReal < 0 && !Number.isInteger(exponentReal)) {
      if (isRationalValue(exponent) && exponent.den % 2n === 1n) {
        const numerator = exponent.num;
        if (numerator > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Exponent is too large to evaluate safely.");
        }
        const signedPower = Math.pow(Math.abs(baseReal), Number(numerator) / Number(exponent.den));
        const sign = numerator % 2n === 1n ? -1 : 1;
        const real = exponent.sign < 0
          ? sign / signedPower
          : sign * signedPower;
        return makeCalc(real, 0);
      }
      throw new Error("Fractional powers of negative bases require an odd rational denominator for a real result.");
    }
    return makeCalc(Math.pow(baseReal, exponentReal), 0);
  }

  function cbrtValue(value) {
    return makeCalc(Math.cbrt(requireRealNumber(value, "Cube root input")), 0);
  }

  function sqrtValue(value) {
    const calc = ensureCalc(value);
    if (Math.abs(calc.im) < EPS && calc.re >= 0) {
      return makeCalc(Math.sqrt(calc.re), 0);
    }

    const magnitudeValue = Math.hypot(calc.re, calc.im);
    const real = Math.sqrt((magnitudeValue + calc.re) / 2);
    const imaginarySeed = Math.max((magnitudeValue - calc.re) / 2, 0);
    const imaginary = (calc.im < 0 ? -1 : 1) * Math.sqrt(imaginarySeed);
    return makeCalc(real, imaginary);
  }

  function sinValue(value, angleMode) {
    const theta = toRadians(requireRealNumber(value, "Sine input"), angleMode);
    return makeCalc(Math.sin(theta), 0);
  }

  function cosValue(value, angleMode) {
    const theta = toRadians(requireRealNumber(value, "Cosine input"), angleMode);
    return makeCalc(Math.cos(theta), 0);
  }

  function tanValue(value, angleMode) {
    const theta = toRadians(requireRealNumber(value, "Tangent input"), angleMode);
    if (Math.abs(Math.cos(theta)) < EPS) {
      throw new Error("Tangent is undefined at this angle.");
    }
    return makeCalc(Math.tan(theta), 0);
  }

  function expValue(value) {
    return makeCalc(Math.exp(requireRealNumber(value, "Exponential input")), 0);
  }

  function lnValue(value) {
    const real = requireRealNumber(value, "Natural logarithm input");
    if (real <= 0) {
      throw new Error("Natural logarithm input must be greater than 0.");
    }
    return makeCalc(Math.log(real), 0);
  }

  function toRadians(angle, angleMode) {
    return angleMode === "rad" ? angle : angle * (Math.PI / 180);
  }

  function toDegrees(angle) {
    return angle * (180 / Math.PI);
  }

  function fromPolar(radiusValue, angleValue, angleMode) {
    const radius = requireRealNumber(radiusValue, "Polar radius");
    const angle = requireRealNumber(angleValue, "Polar angle");
    const theta = toRadians(angle, angleMode || "deg");
    return makeCalc(radius * Math.cos(theta), radius * Math.sin(theta));
  }

  function magnitude(value) {
    if (isCalcValue(value)) {
      return Math.hypot(value.re, value.im);
    }
    return Math.abs(toNumber(value));
  }

  function angleOf(value, angleMode) {
    const calc = ensureCalc(value);
    const theta = Math.atan2(calc.im, calc.re);
    return angleMode === "rad" ? theta : toDegrees(theta);
  }

  function trimTrailingZeros(text) {
    if (text.indexOf("e") !== -1 || text.indexOf("E") !== -1) {
      const parts = text.split(/e/i);
      const mantissa = trimTrailingZeros(parts[0]);
      const exponent = parts[1].replace(/\+/, "").replace(/^(-?)0+(\d)/, "$1$2");
      return mantissa + "e" + exponent;
    }
    if (text.indexOf(".") === -1) {
      return text;
    }
    return text.replace(/\.?0+$/, "");
  }

  function formatReal(value, digits) {
    const n = displayNumber(value);
    if (!Number.isFinite(n)) {
      return String(n);
    }
    if (n === 0) {
      return "0";
    }

    const precision = Math.max(3, digits || 12);
    const abs = Math.abs(n);
    if (abs >= 1e8 || abs < 1e-6) {
      return trimTrailingZeros(n.toExponential(Math.min(Math.max(precision - 1, 2), 14)));
    }

    return trimTrailingZeros(n.toPrecision(Math.min(Math.max(precision, 3), 15)));
  }

  function rectString(value, digits) {
    if (!isCalcValue(value)) {
      return M.rationalToDecimalString(value, digits || 16);
    }

    const re = displayNumber(value.re);
    const im = displayNumber(value.im);
    const reText = formatReal(re, digits);
    const imText = formatReal(Math.abs(im), digits);

    if (im === 0) {
      return reText;
    }
    if (re === 0) {
      return (im < 0 ? "-" : "") + (imText === "1" ? "i" : imText + "i");
    }
    return reText + (im < 0 ? " - " : " + ") + (imText === "1" ? "i" : imText + "i");
  }

  function parseableReal(value) {
    const text = formatReal(value, 14);
    return text === "-0" ? "0" : text;
  }

  function inputString(value) {
    if (isRationalValue(value)) {
      return M.rationalToFractionString(value);
    }
    const calc = ensureCalc(value);
    if (Math.abs(calc.im) < EPS) {
      return parseableReal(calc.re);
    }
    if (Math.abs(calc.re) < EPS) {
      const imagOnly = parseableReal(calc.im);
      return imagOnly === "1" ? "i" : imagOnly === "-1" ? "-i" : imagOnly + "i";
    }
    const imagMag = parseableReal(Math.abs(calc.im));
    return parseableReal(calc.re) + (calc.im < 0 ? "-" : "+") + (imagMag === "1" ? "i" : imagMag + "i");
  }

  function polarString(value, angleMode, digits) {
    const calc = ensureCalc(value);
    const radius = formatReal(magnitude(calc), digits || 10);
    const theta = formatReal(angleOf(calc, angleMode || "deg"), digits || 10);
    return radius + " ∠ " + theta + (angleMode === "rad" ? " rad" : "°");
  }

  function normalizedScientificFromDigits(normalized) {
    if (!normalized || normalized.sign === 0) {
      return "0";
    }
    return (normalized.sign < 0 ? "-" : "") + "0." + normalized.digits.join("") + " × 10^" + normalized.exponentN;
  }

  function approximateRealComponent(value, k, mode) {
    if (!Number.isFinite(value)) {
      throw new Error("Value is not finite.");
    }
    if (value === 0) {
      return {
        approx: 0,
        normalized: {
          sign: 0,
          exponentN: 0,
          digits: Array.from({ length: k }, function () { return 0; }),
          guardDigit: 0
        },
        scientific: "0"
      };
    }

    let exponentN = 0;
    let digitsText = "";
    const scientific = Math.abs(value).toExponential(Math.max(k + 8, 20));
    const parts = scientific.split("e");
    const coefficient = parts[0].replace(".", "");
    exponentN = parseInt(parts[1], 10) + 1;
    digitsText = coefficient;
    while (digitsText.length < k + 2) {
      digitsText += "0";
    }

    const kept = digitsText.slice(0, k).split("").map(function toDigit(ch) {
      return Number(ch);
    });
    const guardDigit = Number(digitsText[k] || "0");

    if (mode === "round" && guardDigit >= 5) {
      let carry = 1;
      for (let index = kept.length - 1; index >= 0; index -= 1) {
        const sum = kept[index] + carry;
        if (sum < 10) {
          kept[index] = sum;
          carry = 0;
          break;
        }
        kept[index] = 0;
      }
      if (carry === 1) {
        kept.unshift(1);
        kept.length = k;
        exponentN += 1;
      }
    }

    const digitsInt = Number(kept.join(""));
    const approx = cleanNumber((value < 0 ? -1 : 1) * digitsInt * Math.pow(10, exponentN - k));
    const normalized = {
      sign: value < 0 ? -1 : 1,
      exponentN,
      digits: kept,
      guardDigit
    };

    return {
      approx,
      normalized,
      scientific: normalizedScientificFromDigits(normalized)
    };
  }

  function machineApproxValue(value, k, mode) {
    if (isRationalValue(value)) {
      return M.machineApprox(value, k, mode);
    }

    const calc = ensureCalc(value);
    const reData = approximateRealComponent(calc.re, k, mode);
    const imData = approximateRealComponent(calc.im, k, mode);
    const approx = makeCalc(reData.approx, imData.approx);
    let scientific;

    if (Math.abs(approx.im) < EPS) {
      scientific = reData.scientific;
    } else if (Math.abs(approx.re) < EPS) {
      scientific = "Im: " + imData.scientific;
    } else {
      scientific = "Re: " + reData.scientific + " | Im: " + imData.scientific;
    }

    return {
      approx,
      normalized: {
        re: reData.normalized,
        im: imData.normalized
      },
      scientific
    };
  }

  function machineDecimalFromNormalized(normalized) {
    if (!normalized || normalized.sign === 0) {
      return "0";
    }
    const digits = normalized.digits.join("");
    const exponent = normalized.exponentN;
    let body;
    if (exponent <= 0) {
      body = "0." + "0".repeat(-exponent) + digits;
    } else if (exponent >= digits.length) {
      body = digits + "0".repeat(exponent - digits.length);
    } else {
      body = digits.slice(0, exponent) + "." + digits.slice(exponent);
    }
    return (normalized.sign < 0 ? "-" : "") + body;
  }

  function machineValueString(data, displayMode, angleMode) {
    if (!data) {
      return "";
    }
    if (isRationalValue(data.approx || data)) {
      const source = data.normalized ? data.normalized : M.machineApprox(data.approx || data, 8, "chop").normalized;
      return machineDecimalFromNormalized(source);
    }

    const calc = ensureCalc(data.approx || data);
    const re = displayNumber(calc.re);
    const im = displayNumber(calc.im);
    const reText = machineDecimalFromNormalized(data.normalized ? data.normalized.re : approximateRealComponent(calc.re, 8, "chop").normalized);
    const imText = machineDecimalFromNormalized(data.normalized ? data.normalized.im : approximateRealComponent(calc.im, 8, "chop").normalized);
    if ((displayMode || "rect") === "polar") {
      return polarString(calc, angleMode || "deg", 10);
    }
    if (im === 0) {
      return reText;
    }
    if (re === 0) {
      return (im < 0 ? "-" : "") + (imText.replace(/^-/, "") === "1" ? "i" : imText.replace(/^-/, "") + "i");
    }
    return reText + (im < 0 ? " - " : " + ") + (imText.replace(/^-/, "") === "1" ? "i" : imText.replace(/^-/, "") + "i");
  }

  globalScope.CalcEngine = {
    EPS,
    isRationalValue,
    isCalcValue,
    makeCalc,
    fromRational,
    toNumber,
    ensureCalc,
    isZeroValue,
    isRealValue,
    requireRealNumber,
    add,
    sub,
    negate,
    mul,
    div,
    powInt,
    powValue,
    sinValue,
    cosValue,
    tanValue,
    expValue,
    lnValue,
    cbrtValue,
    sqrtValue,
    fromPolar,
    magnitude,
    angleOf,
    rectString,
    polarString,
    inputString,
    machineApproxValue,
    machineValueString,
    approximateRealComponent,
    normalizedScientificFromDigits,
    machineDecimalFromNormalized,
    formatReal,
    nonNegativeIntegerFromValue
  };
})(window);
