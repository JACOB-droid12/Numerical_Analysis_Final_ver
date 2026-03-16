"use strict";

(function initExpressionEngine(globalScope) {
  const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  if (!M || !C) {
    throw new Error("MathEngine and CalcEngine must be loaded before ExpressionEngine.");
  }

  const PRECEDENCE = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "∠": 2.5,
    "^": 3
  };

  function isDigit(ch) {
    return ch >= "0" && ch <= "9";
  }

  function isIdentifierStart(ch) {
    return /[A-Za-z_π]/.test(ch);
  }

  function tokenLabel(token) {
    if (!token) {
      return "<end>";
    }
    return token.value;
  }

  function needsImplicitMultiply(left, right) {
    const leftCanEnd = left.type === "number" || left.type === "ident" || left.type === "rparen";
    const rightCanStart = right.type === "number" || right.type === "ident" || right.type === "lparen";

    if (!leftCanEnd || !rightCanStart) {
      return false;
    }

    if (left.type === "ident" && right.type === "lparen") {
      return false;
    }

    return true;
  }

  function tokenize(expression, options) {
    const config = options || {};
    const allowVariable = config.allowVariable !== false;
    const compact = String(expression)
      .replace(/\s+/g, "")
      .replace(/\u2212/g, "-")
      .replace(/\u03C0/g, "π");

    if (!compact) {
      throw new Error("Expression is empty.");
    }

    const raw = [];
    let i = 0;
    while (i < compact.length) {
      const ch = compact[i];

      if (isDigit(ch) || ch === ".") {
        const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(compact.slice(i));
        if (!match) {
          throw new Error("Invalid number near: " + compact.slice(i));
        }
        raw.push({ type: "number", value: match[0] });
        i += match[0].length;
        continue;
      }

      if (isIdentifierStart(ch)) {
        const match = /^[A-Za-z_π]+/.exec(compact.slice(i));
        const ident = match[0];
        if ((ident === "x" || ident === "X") && !allowVariable) {
          throw new Error("Variables are not allowed in this expression.");
        }
        raw.push({ type: "ident", value: ident });
        i += ident.length;
        continue;
      }

      if (ch === "(") {
        raw.push({ type: "lparen", value: ch });
        i += 1;
        continue;
      }

      if (ch === ")") {
        raw.push({ type: "rparen", value: ch });
        i += 1;
        continue;
      }

      if (ch === ",") {
        raw.push({ type: "comma", value: ch });
        i += 1;
        continue;
      }

      if ("+-*/^∠".includes(ch)) {
        raw.push({ type: "op", value: ch });
        i += 1;
        continue;
      }

      throw new Error("Unsupported character in expression: " + ch);
    }

    const tokens = [];
    for (let index = 0; index < raw.length; index += 1) {
      const current = raw[index];
      const next = raw[index + 1];
      tokens.push(current);
      if (next && needsImplicitMultiply(current, next)) {
        tokens.push({ type: "op", value: "*" });
      }
    }

    return tokens;
  }

  function Parser(tokens, options) {
    this.tokens = tokens;
    this.index = 0;
    this.allowVariable = !(options && options.allowVariable === false);
  }

  Parser.prototype.peek = function peek(offset) {
    return this.tokens[this.index + (offset || 0)] || null;
  };

  Parser.prototype.consume = function consume() {
    const token = this.peek();
    if (!token) {
      throw new Error("Unexpected end of expression.");
    }
    this.index += 1;
    return token;
  };

  Parser.prototype.matchType = function matchType(type) {
    const token = this.peek();
    return Boolean(token && token.type === type);
  };

  Parser.prototype.matchOp = function matchOp(op) {
    const token = this.peek();
    return Boolean(token && token.type === "op" && token.value === op);
  };

  Parser.prototype.expectType = function expectType(type, message) {
    const token = this.peek();
    if (!token || token.type !== type) {
      throw new Error(message + " Found: " + tokenLabel(token));
    }
    return this.consume();
  };

  Parser.prototype.parseExpression = function parseExpression() {
    return this.parseAddSub();
  };

  Parser.prototype.parseAddSub = function parseAddSub() {
    let node = this.parseMulDiv();
    while (this.matchOp("+") || this.matchOp("-")) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      node = {
        kind: "binary",
        op,
        left: node,
        right
      };
    }
    return node;
  };

  Parser.prototype.parseMulDiv = function parseMulDiv() {
    let node = this.parsePolar();
    while (this.matchOp("*") || this.matchOp("/")) {
      const op = this.consume().value;
      const right = this.parsePolar();
      node = {
        kind: "binary",
        op,
        left: node,
        right
      };
    }
    return node;
  };

  Parser.prototype.parsePolar = function parsePolar() {
    let node = this.parsePower();
    while (this.matchOp("∠")) {
      this.consume();
      const angle = this.parsePower();
      node = {
        kind: "polar",
        radius: node,
        angle
      };
    }
    return node;
  };

  Parser.prototype.parsePower = function parsePower() {
    let node = this.parseUnary();
    if (this.matchOp("^")) {
      this.consume();
      const right = this.parsePower();
      node = {
        kind: "binary",
        op: "^",
        left: node,
        right
      };
    }
    return node;
  };

  Parser.prototype.parseUnary = function parseUnary() {
    if (this.matchOp("+") || this.matchOp("-")) {
      const op = this.consume().value;
      return {
        kind: "unary",
        op,
        expr: this.parseUnary()
      };
    }
    return this.parsePrimary();
  };

  Parser.prototype.parsePrimary = function parsePrimary() {
    const token = this.peek();
    if (!token) {
      throw new Error("Unexpected end of expression.");
    }

    if (token.type === "number") {
      this.consume();
      return {
        kind: "number",
        value: token.value
      };
    }

    if (token.type === "ident") {
      const ident = this.consume().value;
      if (this.matchType("lparen")) {
        this.consume();
        const args = [];
        if (!this.matchType("rparen")) {
          do {
            args.push(this.parseExpression());
            if (!this.matchType("comma")) {
              break;
            }
            this.consume();
          } while (true);
        }
        this.expectType("rparen", "Missing closing parenthesis.");
        return {
          kind: "call",
          name: ident,
          args
        };
      }

      if ((ident === "x" || ident === "X") && this.allowVariable) {
        return {
          kind: "var",
          value: "x"
        };
      }

      return {
        kind: "const",
        value: ident
      };
    }

    if (token.type === "lparen") {
      this.consume();
      const expr = this.parseExpression();
      this.expectType("rparen", "Missing closing parenthesis.");
      return expr;
    }

    throw new Error("Unexpected token: " + tokenLabel(token));
  };

  function parseExpression(expression, options) {
    const tokens = tokenize(expression, options);
    const parser = new Parser(tokens, options);
    const ast = parser.parseExpression();
    const trailing = parser.peek();
    if (trailing) {
      throw new Error("Unexpected token after expression: " + tokenLabel(trailing));
    }
    return ast;
  }

  function containsVariable(ast) {
    if (ast.kind === "var") {
      return true;
    }
    if (ast.kind === "unary") {
      return containsVariable(ast.expr);
    }
    if (ast.kind === "binary") {
      return containsVariable(ast.left) || containsVariable(ast.right);
    }
    if (ast.kind === "polar") {
      return containsVariable(ast.radius) || containsVariable(ast.angle);
    }
    if (ast.kind === "call") {
      return ast.args.some(containsVariable);
    }
    return false;
  }

  function precedenceOf(node) {
    if (node.kind === "binary") {
      return PRECEDENCE[node.op];
    }
    if (node.kind === "polar") {
      return PRECEDENCE["∠"];
    }
    if (node.kind === "unary") {
      return 4;
    }
    return 5;
  }

  function needsParens(parent, child, side) {
    if (!["binary", "unary", "polar"].includes(child.kind)) {
      return false;
    }

    if (parent.kind === "unary") {
      return child.kind === "binary" || child.kind === "polar";
    }

    const parentPrec = precedenceOf(parent);
    const childPrec = precedenceOf(child);
    if (childPrec < parentPrec) {
      return true;
    }
    if (parent.kind === "binary" && parent.op === "^" && side === "right" && childPrec <= parentPrec) {
      return true;
    }
    if (parent.kind === "binary" && (parent.op === "-" || parent.op === "/") && side === "right" && childPrec === parentPrec) {
      return true;
    }
    return false;
  }

  function formatExpression(ast, parent, side) {
    let text;
    if (ast.kind === "number") {
      text = ast.value;
    } else if (ast.kind === "var") {
      text = ast.value || "x";
    } else if (ast.kind === "const") {
      text = ast.value;
    } else if (ast.kind === "call") {
      text = ast.name + "(" + ast.args.map(function (arg) {
        return formatExpression(arg);
      }).join(", ") + ")";
    } else if (ast.kind === "polar") {
      text = formatExpression(ast.radius, ast, "left") + " ∠ " + formatExpression(ast.angle, ast, "right");
    } else if (ast.kind === "unary") {
      text = ast.op + formatExpression(ast.expr, ast, "right");
    } else if (ast.kind === "binary") {
      text = formatExpression(ast.left, ast, "left") + " " + ast.op + " " + formatExpression(ast.right, ast, "right");
    } else {
      throw new Error("Unsupported AST node kind: " + ast.kind);
    }

    if (parent && needsParens(parent, ast, side || "left")) {
      return "(" + text + ")";
    }
    return text;
  }

  function resolveConstant(name) {
    const key = String(name).toLowerCase();
    if (key === "pi" || name === "π") {
      return C.makeCalc(Math.PI, 0);
    }
    if (key === "e") {
      return C.makeCalc(Math.E, 0);
    }
    if (key === "i") {
      return C.makeCalc(0, 1);
    }
    throw new Error("Unsupported identifier: " + name);
  }

  function isExactCompatible(ast, context) {
    const env = context || {};
    if (ast.kind === "number") {
      return true;
    }
    if (ast.kind === "var") {
      if (!Object.prototype.hasOwnProperty.call(env, "x")) {
        throw new Error("Value for x is required.");
      }
      return C.isRationalValue(env.x);
    }
    if (ast.kind === "const" || ast.kind === "call" || ast.kind === "polar") {
      return false;
    }
    if (ast.kind === "unary") {
      return isExactCompatible(ast.expr, env);
    }
    if (ast.kind === "binary") {
      return isExactCompatible(ast.left, env) && isExactCompatible(ast.right, env);
    }
    return false;
  }

  function evaluateValue(ast, context) {
    const env = context || {};

    if (ast.kind === "number") {
      return M.parseRational(ast.value);
    }

    if (ast.kind === "var") {
      if (!Object.prototype.hasOwnProperty.call(env, "x")) {
        throw new Error("Value for x is required.");
      }
      return env.x;
    }

    if (ast.kind === "const") {
      return resolveConstant(ast.value);
    }

    if (ast.kind === "call") {
      const name = String(ast.name).toLowerCase();
      if (name === "sqrt") {
        if (ast.args.length !== 1) {
          throw new Error("sqrt() expects exactly one argument.");
        }
        return C.sqrtValue(evaluateValue(ast.args[0], env));
      }
      if (name === "polar") {
        if (ast.args.length !== 2) {
          throw new Error("polar() expects radius and angle.");
        }
        return C.fromPolar(evaluateValue(ast.args[0], env), evaluateValue(ast.args[1], env), env.angleMode || "deg");
      }
      throw new Error("Unsupported function: " + ast.name);
    }

    if (ast.kind === "polar") {
      return C.fromPolar(evaluateValue(ast.radius, env), evaluateValue(ast.angle, env), env.angleMode || "deg");
    }

    if (ast.kind === "unary") {
      const value = evaluateValue(ast.expr, env);
      if (ast.op === "+") {
        return value;
      }
      if (ast.op === "-") {
        return C.negate(value);
      }
      throw new Error("Unsupported unary operator: " + ast.op);
    }

    if (ast.kind === "binary") {
      const left = evaluateValue(ast.left, env);
      const right = evaluateValue(ast.right, env);
      if (ast.op === "+") {
        return C.add(left, right);
      }
      if (ast.op === "-") {
        return C.sub(left, right);
      }
      if (ast.op === "*") {
        return C.mul(left, right);
      }
      if (ast.op === "/") {
        return C.div(left, right);
      }
      if (ast.op === "^") {
        return C.powInt(left, right);
      }
      throw new Error("Unsupported binary operator: " + ast.op);
    }

    throw new Error("Unsupported AST node kind: " + ast.kind);
  }

  function evaluateExact(ast, context) {
    if (!isExactCompatible(ast, context)) {
      throw new Error("This expression uses calculator-only features, so an exact rational value is not available.");
    }
    return evaluateValue(ast, context);
  }

  function recordStep(steps, index, kind, description, exact, data, expression) {
    steps.push({
      index,
      kind,
      description,
      exact,
      approx: data.approx,
      scientific: data.scientific,
      expression
    });
  }

  function applyUnaryStored(op, value) {
    if (op === "+") {
      return value;
    }
    if (op === "-") {
      return C.negate(value);
    }
    throw new Error("Unsupported unary operator: " + op);
  }

  function applyBinaryStored(op, left, right) {
    if (op === "+") {
      return C.add(left, right);
    }
    if (op === "-") {
      return C.sub(left, right);
    }
    if (op === "*") {
      return C.mul(left, right);
    }
    if (op === "/") {
      return C.div(left, right);
    }
    if (op === "^") {
      return C.powInt(left, right);
    }
    throw new Error("Unsupported binary operator: " + op);
  }

  function evaluateStepwise(ast, config, context) {
    if (!config || !Number.isInteger(config.k) || config.k < 1) {
      throw new Error("Machine config requires positive integer k.");
    }
    if (config.mode !== "chop" && config.mode !== "round") {
      throw new Error("Machine config mode must be 'chop' or 'round'.");
    }

    const env = context || {};
    const steps = [];
    let stepIndex = 1;
    let operationCount = 0;

    function visit(node) {
      if (node.kind === "number") {
        const exact = M.parseRational(node.value);
        const data = C.machineApproxValue(exact, config.k, config.mode);
        recordStep(steps, stepIndex, "leaf", "Store literal " + node.value, exact, data, formatExpression(node));
        stepIndex += 1;
        return {
          exactWhole: exact,
          approx: data.approx,
          label: formatExpression(node)
        };
      }

      if (node.kind === "var") {
        if (!Object.prototype.hasOwnProperty.call(env, "x")) {
          throw new Error("Value for x is required.");
        }
        const data = C.machineApproxValue(env.x, config.k, config.mode);
        recordStep(steps, stepIndex, "leaf", "Store x", env.x, data, formatExpression(node));
        stepIndex += 1;
        return {
          exactWhole: env.x,
          approx: data.approx,
          label: formatExpression(node)
        };
      }

      if (node.kind === "const" || node.kind === "call" || node.kind === "polar") {
        const exact = evaluateValue(node, env);
        const data = C.machineApproxValue(exact, config.k, config.mode);
        const label = formatExpression(node);
        recordStep(steps, stepIndex, "leaf", "Store " + label, exact, data, label);
        stepIndex += 1;
        return {
          exactWhole: exact,
          approx: data.approx,
          label
        };
      }

      if (node.kind === "unary") {
        const child = visit(node.expr);
        const exactWhole = applyUnaryStored(node.op, child.exactWhole);
        const exactStored = applyUnaryStored(node.op, child.approx);
        const data = C.machineApproxValue(exactStored, config.k, config.mode);
        recordStep(steps, stepIndex, "unary", "Apply " + node.op + " to " + child.label, exactStored, data, formatExpression(node));
        stepIndex += 1;
        operationCount += 1;
        return {
          exactWhole,
          approx: data.approx,
          label: formatExpression(node)
        };
      }

      if (node.kind === "binary") {
        const left = visit(node.left);
        const right = visit(node.right);
        const exactWhole = applyBinaryStored(node.op, left.exactWhole, right.exactWhole);
        const exactStored = applyBinaryStored(node.op, left.approx, right.approx);
        const data = C.machineApproxValue(exactStored, config.k, config.mode);
        recordStep(steps, stepIndex, "binary", "Evaluate " + formatExpression(node), exactStored, data, formatExpression(node));
        stepIndex += 1;
        operationCount += 1;
        return {
          exactWhole,
          approx: data.approx,
          label: formatExpression(node)
        };
      }

      throw new Error("Unsupported AST node kind: " + node.kind);
    }

    const root = visit(ast);
    return {
      exact: root.exactWhole,
      approx: root.approx,
      steps,
      opCount: operationCount,
      canonical: formatExpression(ast),
      mode: isExactCompatible(ast, env) ? "exact" : "calc"
    };
  }

  function evaluateComparison(ast, config, context, options) {
    if (!config || !Number.isInteger(config.k) || config.k < 1) {
      throw new Error("Machine config requires positive integer k.");
    }
    if (config.mode !== "chop" && config.mode !== "round") {
      throw new Error("Machine config mode must be 'chop' or 'round'.");
    }

    const env = context || {};
    const exactCompatible = isExactCompatible(ast, env);
    const reference = exactCompatible
      ? evaluateExact(ast, env)
      : evaluateValue(ast, env);
    const stepRun = evaluateStepwise(ast, config, env);
    const stepData = C.machineApproxValue(stepRun.approx, config.k, config.mode);
    const finalData = C.machineApproxValue(reference, config.k, config.mode);

    return {
      expression: options && options.expression ? options.expression : formatExpression(ast),
      ast,
      canonical: stepRun.canonical,
      path: exactCompatible ? "exact" : "calc",
      exactCompatible,
      reference,
      exact: reference,
      k: config.k,
      mode: config.mode,
      step: {
        approx: stepData.approx,
        scientific: stepData.scientific,
        normalized: stepData.normalized,
        steps: stepRun.steps,
        opCount: stepRun.opCount
      },
      final: {
        approx: finalData.approx,
        scientific: finalData.scientific,
        normalized: finalData.normalized
      }
    };
  }

  globalScope.ExpressionEngine = {
    parseExpression,
    containsVariable,
    isExactCompatible,
    evaluateExact,
    evaluateValue,
    evaluateStepwise,
    evaluateComparison,
    formatExpression
  };
})(window);
