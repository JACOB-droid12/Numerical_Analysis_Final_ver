"use strict";

(function initMathEngine(globalScope) {
  /**
   * @typedef {Object} Rational
   * @property {-1|0|1} sign
   * @property {bigint} num
   * @property {bigint} den
   */

  /**
   * @typedef {Object} MachineConfig
   * @property {number} k
   * @property {"chop"|"round"} mode
   */

  /**
   * @typedef {Object} NormalizedDigits
   * @property {-1|0|1} sign
   * @property {number} exponentN
   * @property {number[]} digits
   * @property {number} [guardDigit]
   */

  const POW10_CACHE = [1n];
  const ZERO = Object.freeze({ sign: 0, num: 0n, den: 1n });
  const ONE = Object.freeze({ sign: 1, num: 1n, den: 1n });

  function assertNonNegativeInteger(value, name) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(name + " must be a non-negative integer.");
    }
  }

  function gcd(a, b) {
    let x = a < 0n ? -a : a;
    let y = b < 0n ? -b : b;
    while (y !== 0n) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  function pow10(exp) {
    assertNonNegativeInteger(exp, "Power");
    for (let i = POW10_CACHE.length; i <= exp; i += 1) {
      POW10_CACHE.push(POW10_CACHE[i - 1] * 10n);
    }
    return POW10_CACHE[exp];
  }

  function fromSignedNumerator(signedNum, den) {
    if (den === 0n) {
      throw new Error("Denominator cannot be zero.");
    }
    let actualDen = den;
    let actualSignedNum = signedNum;
    if (actualDen < 0n) {
      actualDen = -actualDen;
      actualSignedNum = -actualSignedNum;
    }
    if (actualSignedNum === 0n) {
      return ZERO;
    }

    const sign = actualSignedNum < 0n ? -1 : 1;
    const absNum = actualSignedNum < 0n ? -actualSignedNum : actualSignedNum;
    const d = gcd(absNum, actualDen);
    return {
      sign: /** @type {-1|1} */ (sign),
      num: absNum / d,
      den: actualDen / d
    };
  }

  function makeRational(sign, num, den) {
    if (![-1, 0, 1].includes(sign)) {
      throw new Error("Invalid sign.");
    }
    if (num < 0n) {
      throw new Error("Numerator magnitude must be non-negative.");
    }
    if (den <= 0n) {
      throw new Error("Denominator must be positive.");
    }
    if (sign === 0 || num === 0n) {
      return ZERO;
    }
    const signed = sign < 0 ? -num : num;
    return fromSignedNumerator(signed, den);
  }

  function isZero(r) {
    return r.sign === 0 || r.num === 0n;
  }

  function negate(r) {
    if (isZero(r)) {
      return ZERO;
    }
    return {
      sign: /** @type {-1|1} */ (-r.sign),
      num: r.num,
      den: r.den
    };
  }

  function absRational(r) {
    if (isZero(r)) {
      return ZERO;
    }
    return {
      sign: 1,
      num: r.num,
      den: r.den
    };
  }

  function add(a, b) {
    if (isZero(a)) {
      return b;
    }
    if (isZero(b)) {
      return a;
    }
    const signedA = BigInt(a.sign) * a.num * b.den;
    const signedB = BigInt(b.sign) * b.num * a.den;
    return fromSignedNumerator(signedA + signedB, a.den * b.den);
  }

  function sub(a, b) {
    return add(a, negate(b));
  }

  function mul(a, b) {
    if (isZero(a) || isZero(b)) {
      return ZERO;
    }
    return makeRational(
      /** @type {-1|1} */ (a.sign * b.sign),
      a.num * b.num,
      a.den * b.den
    );
  }

  function div(a, b) {
    if (isZero(b)) {
      throw new Error("Division by zero.");
    }
    if (isZero(a)) {
      return ZERO;
    }
    return makeRational(
      /** @type {-1|1} */ (a.sign * b.sign),
      a.num * b.den,
      a.den * b.num
    );
  }

  function cmp(a, b) {
    if (a.sign !== b.sign) {
      return a.sign < b.sign ? -1 : 1;
    }
    if (a.sign === 0) {
      return 0;
    }
    const left = a.num * b.den;
    const right = b.num * a.den;
    if (left === right) {
      return 0;
    }
    const normalCmp = left < right ? -1 : 1;
    return a.sign > 0 ? normalCmp : -normalCmp;
  }

  function eq(a, b) {
    return cmp(a, b) === 0;
  }

  function parseFraction(input) {
    const text = input.trim();
    if (!text.includes("/")) {
      return null;
    }

    const slashMatches = text.match(/\//g);
    if (!slashMatches || slashMatches.length !== 1) {
      return null;
    }

    const slashIndex = text.indexOf("/");
    const leftRaw = text.slice(0, slashIndex).trim();
    const rightRaw = text.slice(slashIndex + 1).trim();
    if (!leftRaw || !rightRaw) {
      return null;
    }

    const numerator = parseDecimalScientific(leftRaw);
    const denominator = parseDecimalScientific(rightRaw);
    if (isZero(denominator)) {
      throw new Error("Denominator cannot be zero.");
    }
    return div(numerator, denominator);
  }
  function parseDecimalScientific(input) {
    const text = input.trim();
    const regex = /^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;
    const match = regex.exec(text);
    if (!match) {
      throw new Error("Invalid number format: " + input);
    }

    const signChar = match[1] || "+";
    const intPart = match[2] || "0";
    const fracPart = typeof match[3] === "string" ? match[3] : (match[4] || "");
    const expPart = match[5] ? parseInt(match[5], 10) : 0;

    const rawDigits = (intPart + fracPart).replace(/^0+/, "");
    if (rawDigits.length === 0) {
      return ZERO;
    }

    const digits = BigInt(rawDigits);
    const totalExp = expPart - fracPart.length;

    if (totalExp >= 0) {
      const num = digits * pow10(totalExp);
      return makeRational(signChar === "-" ? -1 : 1, num, 1n);
    }

    return makeRational(signChar === "-" ? -1 : 1, digits, pow10(-totalExp));
  }

  function parseRational(input) {
    const text = String(input).trim();
    if (!text) {
      throw new Error("Input is empty.");
    }
    if (text.includes("/")) {
      const fraction = parseFraction(text);
      if (fraction) {
        return fraction;
      }
    }
    return parseDecimalScientific(text);
  }

  function rationalToFractionString(r) {
    if (isZero(r)) {
      return "0";
    }
    const sign = r.sign < 0 ? "-" : "";
    if (r.den === 1n) {
      return sign + r.num.toString();
    }
    return sign + r.num.toString() + "/" + r.den.toString();
  }

  function rationalToDecimalString(r, maxDigits = 40) {
    if (!Number.isInteger(maxDigits) || maxDigits < 1) {
      throw new Error("maxDigits must be a positive integer.");
    }
    if (isZero(r)) {
      return "0";
    }

    const sign = r.sign < 0 ? "-" : "";
    const integerPart = r.num / r.den;
    let remainder = r.num % r.den;

    if (remainder === 0n) {
      return sign + integerPart.toString();
    }

    let frac = "";
    let i = 0;
    while (remainder !== 0n && i < maxDigits) {
      remainder *= 10n;
      const digit = remainder / r.den;
      remainder %= r.den;
      frac += digit.toString();
      i += 1;
    }

    const suffix = remainder === 0n ? "" : "...";
    return sign + integerPart.toString() + "." + frac + suffix;
  }

  function normalizedExponentForAbs(abs) {
    if (isZero(abs)) {
      throw new Error("Zero has no normalized exponent.");
    }
    if (abs.num >= abs.den) {
      const integerPart = abs.num / abs.den;
      return integerPart.toString().length;
    }

    let scaledNum = abs.num;
    let shifts = 0;
    while (scaledNum < abs.den) {
      scaledNum *= 10n;
      shifts += 1;
      if (shifts > 100000) {
        throw new Error("Too many leading zeros for normalization.");
      }
    }
    return 1 - shifts;
  }

  function extractNormalizedDigits(abs, digitCount) {
    assertNonNegativeInteger(digitCount, "Digit count");
    if (digitCount < 1) {
      throw new Error("Digit count must be at least 1.");
    }
    if (isZero(abs)) {
      return {
        sign: 0,
        exponentN: 0,
        digits: Array(digitCount).fill(0),
        guardDigit: 0
      };
    }

    const exponentN = normalizedExponentForAbs(abs);
    let scaledNum = abs.num;
    let scaledDen = abs.den;
    if (exponentN >= 0) {
      scaledDen *= pow10(exponentN);
    } else {
      scaledNum *= pow10(-exponentN);
    }

    const digits = [];
    let remainder = scaledNum;
    for (let i = 0; i < digitCount; i += 1) {
      remainder *= 10n;
      const digit = remainder / scaledDen;
      remainder %= scaledDen;
      digits.push(Number(digit));
    }

    return {
      sign: 1,
      exponentN,
      digits,
      guardDigit: 0
    };
  }

  function toScientificString(r, digitCount = 16) {
    if (isZero(r)) {
      return "0";
    }
    const abs = absRational(r);
    const norm = extractNormalizedDigits(abs, digitCount);
    const sign = r.sign < 0 ? "-" : "";
    return sign + "0." + norm.digits.join("") + " * 10^" + norm.exponentN;
  }

  function machineApprox(value, k, mode) {
    if (!Number.isInteger(k) || k < 1) {
      throw new Error("k must be a positive integer.");
    }
    if (mode !== "chop" && mode !== "round") {
      throw new Error("mode must be 'chop' or 'round'.");
    }

    if (isZero(value)) {
      return {
        approx: ZERO,
        normalized: {
          sign: 0,
          exponentN: 0,
          digits: Array(k).fill(0),
          guardDigit: 0
        },
        scientific: "0"
      };
    }

    const abs = absRational(value);
    const source = extractNormalizedDigits(abs, k + 1);
    let exponentN = source.exponentN;
    let digits = source.digits.slice(0, k);
    const guardDigit = source.digits[k] || 0;

    if (mode === "round" && guardDigit >= 5) {
      let carry = 1;
      for (let i = k - 1; i >= 0; i -= 1) {
        const next = digits[i] + carry;
        if (next >= 10) {
          digits[i] = 0;
          carry = 1;
        } else {
          digits[i] = next;
          carry = 0;
          break;
        }
      }
      if (carry === 1) {
        exponentN += 1;
        digits = [1];
        while (digits.length < k) {
          digits.push(0);
        }
      }
    }

    const mantissaText = digits.join("");
    const mantissaInt = BigInt(mantissaText);
    const shift = exponentN - k;

    let approxAbs;
    if (mantissaInt === 0n) {
      approxAbs = ZERO;
    } else if (shift >= 0) {
      approxAbs = makeRational(1, mantissaInt * pow10(shift), 1n);
    } else {
      approxAbs = makeRational(1, mantissaInt, pow10(-shift));
    }

    const approx = value.sign < 0 ? negate(approxAbs) : approxAbs;
    const normalized = {
      sign: value.sign,
      exponentN,
      digits,
      guardDigit
    };

    return {
      approx,
      normalized,
      scientific: (value.sign < 0 ? "-" : "") + "0." + digits.join("") + " * 10^" + exponentN
    };
  }

  function absoluteError(exact, approx) {
    return absRational(sub(exact, approx));
  }

  function relativeError(exact, approx) {
    if (isZero(exact)) {
      return null;
    }
    return div(absoluteError(exact, approx), absRational(exact));
  }

  function significantDigits(exact, approx) {
    if (isZero(exact)) {
      return null;
    }
    const rel = relativeError(exact, approx);
    if (!rel || isZero(rel)) {
      return Infinity;
    }

    let lhs = rel.num;
    const rhs = 5n * rel.den;
    let t = 0;
    while (lhs <= rhs) {
      t += 1;
      lhs *= 10n;
      if (t > 100000) {
        break;
      }
    }
    return Math.max(t - 1, 0);
  }

  function maxAbsoluteError(exact, t) {
    if (t === null) {
      return null;
    }
    if (t === Infinity) {
      return ZERO;
    }
    if (!Number.isInteger(t) || t < 0) {
      throw new Error("t must be a non-negative integer, Infinity, or null.");
    }
    const factor = makeRational(1, 5n, pow10(t));
    return mul(absRational(exact), factor);
  }

  function maxRelativeErrorBound(k, mode) {
    if (!Number.isInteger(k) || k < 1) {
      throw new Error("k must be a positive integer.");
    }
    if (mode === "chop") {
      return makeRational(1, 1n, pow10(k - 1));
    }
    if (mode === "round") {
      return makeRational(1, 5n, pow10(k));
    }
    throw new Error("mode must be 'chop' or 'round'.");
  }

  function powRational(base, exponent) {
    assertNonNegativeInteger(exponent, "Exponent");
    if (exponent === 0) {
      return ONE;
    }
    if (isZero(base)) {
      return ZERO;
    }

    let result = ONE;
    let current = base;
    let e = exponent;
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

  function describeRational(r, previewDigits = 40) {
    return {
      fraction: rationalToFractionString(r),
      decimal: rationalToDecimalString(r, previewDigits),
      scientific: toScientificString(r, 16)
    };
  }

  globalScope.MathEngine = {
    ZERO,
    ONE,
    pow10,
    makeRational,
    fromSignedNumerator,
    parseRational,
    add,
    sub,
    mul,
    div,
    absRational,
    negate,
    cmp,
    eq,
    isZero,
    rationalToFractionString,
    rationalToDecimalString,
    toScientificString,
    extractNormalizedDigits,
    machineApprox,
    absoluteError,
    relativeError,
    significantDigits,
    maxAbsoluteError,
    maxRelativeErrorBound,
    powRational,
    describeRational
  };
})(window);

