"use strict";

(function initMathDisplay(globalScope) {
  const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  const E = globalScope.ExpressionEngine;
  if (!M || !C || !E) {
    throw new Error("MathEngine, CalcEngine, and ExpressionEngine must be loaded before MathDisplay.");
  }

  const PRECEDENCE = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "∠": 2.5,
    "^": 3,
    unary: 4,
    atom: 5
  };

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function token(text, className) {
    return '<span class="' + (className || 'math-token') + '">' + esc(text) + '</span>';
  }

  function joined(parts) {
    return parts.filter(Boolean).join("");
  }

  function nodePrecedence(node) {
    if (!node) {
      return PRECEDENCE.atom;
    }
    if (node.kind === "binary") {
      return PRECEDENCE[node.op] || PRECEDENCE.atom;
    }
    if (node.kind === "polar") {
      return PRECEDENCE["∠"];
    }
    if (node.kind === "unary") {
      return PRECEDENCE.unary;
    }
    return PRECEDENCE.atom;
  }

  function wrapParens(inner) {
    return '<span class="math-group">' +
      '<span class="math-paren math-paren-open" aria-hidden="true"></span>' +
      '<span class="math-group-body">' + inner + '</span>' +
      '<span class="math-paren math-paren-close" aria-hidden="true"></span>' +
      '</span>';
  }

  function needsParens(child, parent, side) {
    if (!parent || !child) {
      return false;
    }

    if (child.kind === "number" || child.kind === "const" || child.kind === "var" || child.kind === "call") {
      return false;
    }

    if (parent.kind === "unary") {
      return child.kind === "binary" || child.kind === "polar";
    }

    const childPrec = nodePrecedence(child);
    const parentPrec = nodePrecedence(parent);

    if (parent.kind === "binary" && parent.op === "^") {
      if (side === "left") {
        return child.kind === "binary" && child.op !== "^";
      }
      return childPrec <= parentPrec;
    }

    if (parent.kind === "polar") {
      return child.kind === "binary";
    }

    if (childPrec < parentPrec) {
      return true;
    }

    if (parent.kind === "binary" && child.kind === "binary") {
      if ((parent.op === "-" || parent.op === "/") && side === "right" && childPrec === parentPrec) {
        return true;
      }
    }

    return false;
  }

  function maybeWrap(node, html, parent, side) {
    return needsParens(node, parent, side) ? wrapParens(html) : html;
  }

  function constantLabel(name) {
    const key = String(name || "").toLowerCase();
    if (key === "pi" || name === "π") {
      return "π";
    }
    if (key === "e") {
      return "e";
    }
    if (key === "i") {
      return "i";
    }
    return String(name);
  }

  function preferImplicitMultiply(left, right) {
    if (!left || !right) {
      return false;
    }
    const rightKinds = ["var", "const", "call", "polar"];
    const leftKinds = ["number", "const", "var", "call", "polar"];
    if (rightKinds.includes(right.kind) && leftKinds.includes(left.kind)) {
      return true;
    }
    if (rightKinds.includes(right.kind) && left.kind === "binary" && (left.op === "/" || left.op === "^")) {
      return true;
    }
    return false;
  }

  function renderAst(node, parent, side) {
    if (!node) {
      return token("?", "math-token");
    }

    if (node.kind === "number") {
      return token(node.value, "math-number");
    }

    if (node.kind === "var") {
      return token(node.value || "x", "math-var");
    }

    if (node.kind === "const") {
      return token(constantLabel(node.value), node.value === "i" ? "math-const math-imag" : "math-const");
    }

    if (node.kind === "call") {
      const name = String(node.name || "").toLowerCase();
      if (name === "sqrt" && node.args.length === 1) {
        return '<span class="math-radical"><span class="math-radical-glyph">√</span><span class="math-radical-body">' + renderAst(node.args[0]) + '</span></span>';
      }
      if (name === "polar" && node.args.length === 2) {
        const radius = renderAst(node.args[0], node, "left");
        const angle = renderAst(node.args[1], node, "right");
        return '<span class="math-inline math-inline-polar">' + radius + '<span class="math-op">∠</span>' + angle + '</span>';
      }
      return '<span class="math-inline">' + token(node.name, "math-fn") + wrapParens(node.args.map(function (arg) {
        return renderAst(arg);
      }).join('<span class="math-op">,</span>')) + '</span>';
    }

    if (node.kind === "polar") {
      const radius = renderAst(node.radius, node, "left");
      const angle = renderAst(node.angle, node, "right");
      return maybeWrap(node, '<span class="math-inline math-inline-polar">' + radius + '<span class="math-op">∠</span>' + angle + '</span>', parent, side);
    }

    if (node.kind === "unary") {
      const inner = renderAst(node.expr, node, "right");
      const op = node.op === "-" ? "−" : node.op;
      return maybeWrap(node, '<span class="math-inline math-inline-signed"><span class="math-sign">' + op + '</span>' + inner + '</span>', parent, side);
    }

    if (node.kind === "binary") {
      if (node.op === "/") {
        const numerator = renderAst(node.left, node, "left");
        const denominator = renderAst(node.right, node, "right");
        const frac = '<span class="math-frac"><span class="math-frac-num">' + numerator + '</span><span class="math-frac-bar"></span><span class="math-frac-den">' + denominator + '</span></span>';
        return maybeWrap(node, frac, parent, side);
      }

      if (node.op === "^") {
        const base = renderAst(node.left, node, "left");
        const exponent = renderAst(node.right, node, "right");
        const power = '<span class="math-power"><span class="math-power-base">' + base + '</span><span class="math-sup"><span class="math-sup-inner">' + exponent + '</span></span></span>';
        return maybeWrap(node, power, parent, side);
      }

      const left = renderAst(node.left, node, "left");
      const right = renderAst(node.right, node, "right");
      let operator = node.op;
      if (operator === "*") {
        operator = preferImplicitMultiply(node.left, node.right)
          ? '<span class="math-op math-op-implicit"></span>'
          : '<span class="math-op">×</span>';
      } else if (operator === "+") {
        operator = '<span class="math-op">+</span>';
      } else if (operator === "-") {
        operator = '<span class="math-op">−</span>';
      }
      const binaryContent = left + operator + right;
      const shouldFlatten = parent && parent.kind === "binary" && parent.op !== "/" && parent.op !== "^";
      const binary = shouldFlatten
        ? binaryContent
        : '<span class="math-inline math-inline-binary">' + binaryContent + '</span>';
      return maybeWrap(node, binary, parent, side);
    }

    return token(String(node.kind), "math-token");
  }

  function renderRationalFraction(value) {
    if (M.isZero(value)) {
      return token("0", "math-number");
    }
    const sign = value.sign < 0 ? '<span class="math-sign">−</span>' : '';
    const numerator = String(value.num);
    const denominator = String(value.den);
    if (value.den === 1n) {
      return '<span class="math-inline">' + sign + token(numerator, "math-number") + '</span>';
    }
    return '<span class="math-inline math-inline-rational">' + sign + '<span class="math-frac"><span class="math-frac-num">' + token(numerator, "math-number") + '</span><span class="math-frac-bar"></span><span class="math-frac-den">' + token(denominator, "math-number") + '</span></span></span>';
  }

  function renderRationalDecimalPrimary(value, previewDigits, scientificDigits) {
    const decimal = M.rationalToDecimalString(value, previewDigits || 18);
    const scientific = M.toScientificString(value, scientificDigits || 12);
    let companion = '';
    if (scientific !== decimal) {
      companion = '<span class="math-primary-companion">' + esc(scientific) + '</span>';
    }
    return '<span class="math-inline math-inline-primary">' + token(decimal, "math-number") + companion + '</span>';
  }

  function renderRealNumber(value, digits) {
    return token(C.formatReal(value, digits || 12), "math-number");
  }

  function renderRectPrimary(value, digits) {
    if (C.isRationalValue(value)) {
      return renderRationalFraction(value);
    }
    const calc = C.ensureCalc(value);
    const re = calc.re;
    const im = calc.im;
    if (Math.abs(im) < C.EPS) {
      return renderRealNumber(re, digits);
    }
    if (Math.abs(re) < C.EPS) {
      const imagText = C.formatReal(Math.abs(im), digits || 10);
      return '<span class="math-inline math-inline-complex">' + (im < 0 ? '<span class="math-sign">−</span>' : '') + (imagText === '1' ? '' : token(imagText, 'math-number')) + token('i', 'math-imag') + '</span>';
    }
    const imagText = C.formatReal(Math.abs(im), digits || 10);
    return '<span class="math-inline math-inline-complex">' + renderRealNumber(re, digits) + '<span class="math-op">' + (im < 0 ? '−' : '+') + '</span>' + (imagText === '1' ? '' : token(imagText, 'math-number')) + token('i', 'math-imag') + '</span>';
  }

  function renderPolarPrimary(value, angleMode, digits) {
    const calc = C.ensureCalc(value);
    const radius = C.formatReal(C.magnitude(calc), digits || 10);
    const theta = C.formatReal(C.angleOf(calc, angleMode || 'deg'), digits || 10);
    return '<span class="math-inline math-inline-polar">' + token(radius, 'math-number') + '<span class="math-op">∠</span>' + token(theta, 'math-number') + token(angleMode === 'rad' ? ' rad' : '°', 'math-unit') + '</span>';
  }

  function secondaryPartsForValue(value, options) {
    const opts = options || {};
    if (C.isRationalValue(value)) {
      if (opts.decimalFirst) {
        if (value.den === 1n) {
          return [];
        }
        return [{
          kind: 'exact-form',
          label: 'Exact form',
          html: renderRationalFraction(value)
        }];
      }
      if (value.den === 1n) {
        return [];
      }
      const decimal = M.rationalToDecimalString(value, opts.previewDigits || 18);
      const scientific = M.toScientificString(value, opts.scientificDigits || 12);
      const parts = [];
      if (decimal !== M.rationalToFractionString(value)) {
        parts.push(decimal);
      }
      if (scientific !== decimal) {
        parts.push(scientific);
      }
      return Array.from(new Set(parts)).map(function (part) {
        return { kind: 'text', text: part };
      });
    }
    if (C.isCalcValue(value)) {
      const rect = C.rectString(value, opts.previewDigits || 12);
      const polar = C.polarString(value, opts.angleMode || 'deg', opts.previewDigits || 10);
      if ((opts.displayMode || 'rect') === 'polar') {
        return rect !== polar ? [{ kind: 'text', text: rect }] : [];
      }
      return rect !== polar ? [{ kind: 'text', text: polar }] : [];
    }
    return [];
  }

  function renderExpressionHTML(ast) {
    return '<span class="math-display-line">' + renderAst(ast) + '</span>';
  }

  function renderValueDisplay(value, options) {
    const opts = options || {};
    let primary = '';
    if (C.isRationalValue(value)) {
      primary = opts.decimalFirst
        ? renderRationalDecimalPrimary(value, opts.previewDigits, opts.scientificDigits)
        : renderRationalFraction(value);
    } else if (opts.displayMode === 'polar' && C.isCalcValue(value)) {
      primary = renderPolarPrimary(value, opts.angleMode, opts.previewDigits || 10);
    } else {
      primary = renderRectPrimary(value, opts.previewDigits || 12);
    }

    const secondary = secondaryPartsForValue(value, opts);
    const secondaryHtml = secondary.length
      ? '<div class="math-display-secondary">' + secondary.map(function (part) {
        if (part.kind === 'exact-form') {
          return '<div class="math-secondary-block"><span class="math-secondary-label">' + esc(part.label) + '</span><span class="math-secondary-math">' + part.html + '</span></div>';
        }
        return '<span class="math-secondary-chip">' + esc(part.text) + '</span>';
      }).join('') + '</div>'
      : '';

    return '<div class="math-display">' +
      '<div class="math-display-primary">' + primary + '</div>' +
      secondaryHtml +
      '</div>';
  }

  globalScope.MathDisplay = {
    renderExpressionHTML,
    renderValueDisplay,
    renderAstHTML: renderAst
  };
})(window);
