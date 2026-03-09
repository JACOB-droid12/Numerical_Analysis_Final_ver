"use strict";

(function initPolyEngine(globalScope) {
  const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  const E = globalScope.ExpressionEngine;
  if (!M || !C || !E) {
    throw new Error("MathEngine, CalcEngine, and ExpressionEngine must be loaded before PolyEngine.");
  }

  const MAX_POLY_DEGREE = 120;

  function parseExpressionToAst(expression) {
    return E.parseExpression(expression, { allowVariable: true });
  }

  function clonePoly(poly) {
    const out = new Map();
    for (const entry of poly.entries()) {
      out.set(entry[0], entry[1]);
    }
    return out;
  }

  function polyFromConstant(value) {
    if (M.isZero(value)) {
      return new Map();
    }
    return new Map([[0, value]]);
  }

  function polyFromVariable() {
    return new Map([[1, M.ONE]]);
  }

  function polyAdd(a, b) {
    const out = clonePoly(a);
    for (const [exp, coeff] of b.entries()) {
      const current = out.get(exp) || M.ZERO;
      const next = M.add(current, coeff);
      if (M.isZero(next)) {
        out.delete(exp);
      } else {
        out.set(exp, next);
      }
    }
    return out;
  }

  function polyNegate(poly) {
    const out = new Map();
    for (const [exp, coeff] of poly.entries()) {
      const neg = M.negate(coeff);
      if (!M.isZero(neg)) {
        out.set(exp, neg);
      }
    }
    return out;
  }

  function polySub(a, b) {
    return polyAdd(a, polyNegate(b));
  }

  function polyMul(a, b) {
    if (a.size === 0 || b.size === 0) {
      return new Map();
    }

    const out = new Map();
    for (const [expA, coeffA] of a.entries()) {
      for (const [expB, coeffB] of b.entries()) {
        const exp = expA + expB;
        if (exp > MAX_POLY_DEGREE) {
          throw new Error("Polynomial degree exceeds max supported degree " + MAX_POLY_DEGREE + ".");
        }
        const product = M.mul(coeffA, coeffB);
        const current = out.get(exp) || M.ZERO;
        const next = M.add(current, product);
        if (M.isZero(next)) {
          out.delete(exp);
        } else {
          out.set(exp, next);
        }
      }
    }
    return out;
  }

  function isConstantPoly(poly) {
    if (poly.size === 0) {
      return true;
    }
    return poly.size === 1 && poly.has(0);
  }

  function constantFromPoly(poly) {
    if (poly.size === 0) {
      return M.ZERO;
    }
    return poly.get(0) || M.ZERO;
  }

  function polyDiv(a, b) {
    if (!isConstantPoly(b)) {
      throw new Error("Division by expressions containing x is not supported.");
    }

    const denominator = constantFromPoly(b);
    if (M.isZero(denominator)) {
      throw new Error("Division by zero in polynomial expression.");
    }

    if (a.size === 0) {
      return new Map();
    }

    const out = new Map();
    for (const [exp, coeff] of a.entries()) {
      const next = M.div(coeff, denominator);
      if (!M.isZero(next)) {
        out.set(exp, next);
      }
    }
    return out;
  }

  function polyDegree(poly) {
    let degree = 0;
    for (const exp of poly.keys()) {
      if (exp > degree) {
        degree = exp;
      }
    }
    return degree;
  }

  function nonNegativeIntegerFromRational(r, contextLabel) {
    if (r.sign < 0) {
      throw new Error(contextLabel + " must be a non-negative integer.");
    }
    if (r.den !== 1n) {
      throw new Error(contextLabel + " must be an integer.");
    }
    const n = r.num;
    if (n > BigInt(MAX_POLY_DEGREE)) {
      throw new Error(contextLabel + " is too large (max " + MAX_POLY_DEGREE + ").");
    }
    return Number(n);
  }

  function polyPow(base, exponentPoly) {
    if (!isConstantPoly(exponentPoly)) {
      throw new Error("Exponent must be a non-negative integer constant.");
    }

    const exponent = nonNegativeIntegerFromRational(constantFromPoly(exponentPoly), "Exponent");

    if (exponent === 0) {
      return polyFromConstant(M.ONE);
    }
    if (base.size === 0) {
      return new Map();
    }

    if (!isConstantPoly(base) && polyDegree(base) * exponent > MAX_POLY_DEGREE) {
      throw new Error("Resulting polynomial degree exceeds max supported degree " + MAX_POLY_DEGREE + ".");
    }

    let result = polyFromConstant(M.ONE);
    let current = base;
    let e = exponent;
    while (e > 0) {
      if (e % 2 === 1) {
        result = polyMul(result, current);
      }
      e = Math.floor(e / 2);
      if (e > 0) {
        current = polyMul(current, current);
      }
    }
    return result;
  }

  function astToPolynomial(ast) {
    if (ast.kind === "number") {
      return polyFromConstant(M.parseRational(ast.value));
    }

    if (ast.kind === "var") {
      return polyFromVariable();
    }

    if (ast.kind === "const" || ast.kind === "call" || ast.kind === "polar") {
      throw new Error("Polynomial coefficients must stay real numeric values; calculator symbols and functions are only allowed in x.");
    }

    if (ast.kind === "unary") {
      const expr = astToPolynomial(ast.expr);
      if (ast.op === "+") {
        return expr;
      }
      if (ast.op === "-") {
        return polyNegate(expr);
      }
      throw new Error("Unsupported unary operator: " + ast.op);
    }

    if (ast.kind === "binary") {
      const left = astToPolynomial(ast.left);
      const right = astToPolynomial(ast.right);
      if (ast.op === "+") {
        return polyAdd(left, right);
      }
      if (ast.op === "-") {
        return polySub(left, right);
      }
      if (ast.op === "*") {
        return polyMul(left, right);
      }
      if (ast.op === "/") {
        return polyDiv(left, right);
      }
      if (ast.op === "^") {
        return polyPow(left, right);
      }
      throw new Error("Unsupported binary operator: " + ast.op);
    }

    throw new Error("Unsupported AST node kind: " + ast.kind);
  }

  function normalizePolynomial(poly) {
    const out = new Map();
    for (const [exp, coeff] of poly.entries()) {
      if (!Number.isInteger(exp) || exp < 0) {
        throw new Error("Polynomial exponent must be a non-negative integer.");
      }
      if (exp > MAX_POLY_DEGREE) {
        throw new Error("Polynomial degree exceeds max supported degree " + MAX_POLY_DEGREE + ".");
      }
      if (!M.isZero(coeff)) {
        out.set(exp, coeff);
      }
    }
    return out;
  }

  function parsePolynomial(expression) {
    const ast = parseExpressionToAst(expression);
    const reduced = normalizePolynomial(astToPolynomial(ast));

    if (reduced.size === 0) {
      return {
        coeffs: new Map([[0, M.ZERO]]),
        degree: 0
      };
    }

    return {
      coeffs: reduced,
      degree: polyDegree(reduced)
    };
  }

  function denseCoefficients(poly) {
    const dense = [];
    for (let exp = 0; exp <= poly.degree; exp += 1) {
      dense[exp] = poly.coeffs.get(exp) || M.ZERO;
    }
    return dense;
  }

  function evaluateExact(poly, xValue) {
    let sum = M.ZERO;
    for (const [exp, coeff] of poly.coeffs.entries()) {
      const xPow = C.powInt(xValue, M.makeRational(1, BigInt(exp), 1n));
      const term = C.mul(coeff, xPow);
      sum = C.add(sum, term);
    }
    return sum;
  }

  function validateMachineConfig(config) {
    if (!config || !Number.isInteger(config.k) || config.k < 1) {
      throw new Error("Machine config requires positive integer k.");
    }
    if (config.mode !== "chop" && config.mode !== "round") {
      throw new Error("Machine config mode must be 'chop' or 'round'.");
    }
  }

  function recordStep(steps, stepIndex, description, exactResult, approxData) {
    steps.push({
      index: stepIndex,
      description,
      exact: exactResult,
      approx: approxData.approx,
      scientific: approxData.scientific
    });
  }

  function evaluateApprox(poly, xValue, config, method) {
    validateMachineConfig(config);

    const xApproxData = C.machineApproxValue(xValue, config.k, config.mode);
    const xApprox = xApproxData.approx;
    const steps = [];
    let stepCounter = 1;

    if (method === "horner") {
      const dense = denseCoefficients(poly);
      let accData = C.machineApproxValue(dense[poly.degree], config.k, config.mode);
      let acc = accData.approx;
      recordStep(steps, stepCounter, "Initialize accumulator with leading coefficient a_" + poly.degree, dense[poly.degree], accData);
      stepCounter += 1;

      for (let exp = poly.degree - 1; exp >= 0; exp -= 1) {
        const mulExact = C.mul(acc, xApprox);
        const mulData = C.machineApproxValue(mulExact, config.k, config.mode);
        recordStep(steps, stepCounter, "Multiply accumulator by x*", mulExact, mulData);
        stepCounter += 1;

        const coeffData = C.machineApproxValue(dense[exp], config.k, config.mode);
        recordStep(steps, stepCounter, "Machine coefficient a_" + exp, dense[exp], coeffData);
        stepCounter += 1;

        const addExact = C.add(mulData.approx, coeffData.approx);
        const addData = C.machineApproxValue(addExact, config.k, config.mode);
        recordStep(steps, stepCounter, "Add coefficient a_" + exp, addExact, addData);
        stepCounter += 1;

        acc = addData.approx;
      }

      return {
        approx: acc,
        xApprox,
        xApproxScientific: xApproxData.scientific,
        steps
      };
    }

    if (method !== "direct") {
      throw new Error("Polynomial method must be 'horner' or 'direct'.");
    }

    const sortedExps = Array.from(poly.coeffs.keys()).sort(function (a, b) {
      return b - a;
    });
    let sum = M.ZERO;

    for (const exp of sortedExps) {
      const coeff = poly.coeffs.get(exp) || M.ZERO;
      const coeffData = C.machineApproxValue(coeff, config.k, config.mode);
      recordStep(steps, stepCounter, "Machine coefficient for x^" + exp, coeff, coeffData);
      stepCounter += 1;

      let termApprox;
      if (exp === 0) {
        termApprox = coeffData.approx;
      } else if (exp === 1) {
        const termExact = C.mul(coeffData.approx, xApprox);
        const termData = C.machineApproxValue(termExact, config.k, config.mode);
        recordStep(steps, stepCounter, "Compute term coefficient * x", termExact, termData);
        stepCounter += 1;
        termApprox = termData.approx;
      } else {
        let powerApprox = xApprox;
        for (let i = 2; i <= exp; i += 1) {
          const powExact = C.mul(powerApprox, xApprox);
          const powData = C.machineApproxValue(powExact, config.k, config.mode);
          recordStep(steps, stepCounter, "Power step x^" + (i - 1) + " * x", powExact, powData);
          stepCounter += 1;
          powerApprox = powData.approx;
        }

        const termExact = C.mul(coeffData.approx, powerApprox);
        const termData = C.machineApproxValue(termExact, config.k, config.mode);
        recordStep(steps, stepCounter, "Compute term coefficient * x^" + exp, termExact, termData);
        stepCounter += 1;
        termApprox = termData.approx;
      }

      const sumExact = C.add(sum, termApprox);
      const sumData = C.machineApproxValue(sumExact, config.k, config.mode);
      recordStep(steps, stepCounter, "Accumulate term x^" + exp, sumExact, sumData);
      stepCounter += 1;
      sum = sumData.approx;
    }

    return {
      approx: sum,
      xApprox,
      xApproxScientific: xApproxData.scientific,
      steps
    };
  }

  function evaluateApproxFinal(poly, xValue, config) {
    validateMachineConfig(config);
    const exact = evaluateExact(poly, xValue);
    const approxData = C.machineApproxValue(exact, config.k, config.mode);
    return {
      exact,
      approx: approxData.approx,
      scientific: approxData.scientific,
      normalized: approxData.normalized
    };
  }

  function formatPolynomial(poly) {
    const exps = Array.from(poly.coeffs.keys()).sort(function (a, b) {
      return b - a;
    });
    if (exps.length === 1 && exps[0] === 0 && M.isZero(poly.coeffs.get(0))) {
      return "0";
    }

    const parts = [];
    for (const exp of exps) {
      const coeff = poly.coeffs.get(exp);
      if (!coeff || M.isZero(coeff)) {
        continue;
      }

      const sign = coeff.sign < 0 ? "-" : "+";
      const absCoeff = M.absRational(coeff);
      const absCoeffStr = M.rationalToFractionString(absCoeff);

      let core;
      if (exp === 0) {
        core = absCoeffStr;
      } else if (exp === 1) {
        core = absCoeffStr === "1" ? "x" : absCoeffStr + "x";
      } else {
        core = absCoeffStr === "1" ? "x^" + exp : absCoeffStr + "x^" + exp;
      }

      parts.push({ sign, core });
    }

    if (parts.length === 0) {
      return "0";
    }

    let output = "";
    for (let i = 0; i < parts.length; i += 1) {
      const piece = parts[i];
      if (i === 0) {
        output += piece.sign === "-" ? "-" + piece.core : piece.core;
      } else {
        output += " " + piece.sign + " " + piece.core;
      }
    }
    return output;
  }

  globalScope.PolyEngine = {
    parsePolynomial,
    evaluateExact,
    evaluateApprox,
    evaluateApproxFinal,
    formatPolynomial
  };
})(window);
