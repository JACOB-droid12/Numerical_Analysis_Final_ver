# Calculator Site Content Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, content-only handoff package in a separate folder that explains the calculator without modifying the existing calculator code or embedding any design direction.

**Architecture:** Keep the implementation additive and isolated. Create a new top-level `calculator-site-content/` folder that contains only Markdown and JSON content, and add small Node-based audit scripts under the repo-level `scripts/` folder to validate file presence, JSON shape, and the no-design guardrails. Do not edit `index.html`, `app.js`, `styles.css`, or the calculator engines.

**Tech Stack:** Markdown, JSON, Node.js built-in modules (`fs`, `path`, `assert`), existing repo Git workflow.

---

## File Structure

### Files to create

- `calculator-site-content/README.md`
  - Handoff guide for the future UI/UX agent.
  - Must explicitly state that the package is content-only and contains no design guidance.
- `calculator-site-content/content/site.json`
  - Site-wide framing copy and positioning.
- `calculator-site-content/content/modules.json`
  - Detailed module descriptions for Machine Arithmetic, Error Analysis, Polynomial Methods, and Root Finding.
- `calculator-site-content/content/faqs.json`
  - Common questions and answers for visitors.
- `calculator-site-content/content/glossary.json`
  - Concise terminology support.
- `calculator-site-content/content/workflows.json`
  - Step-by-step learning/use narratives.
- `calculator-site-content/content/use-cases.json`
  - Audience-based scenarios and benefits.
- `scripts/calculator-site-content-audit.js`
  - Structural validation for the content pack.
- `scripts/calculator-site-no-design-audit.js`
  - Guardrail scan that rejects design instructions or UI-specific guidance in the handoff package.

### Files to keep unchanged

- `index.html`
- `app.js`
- `styles.css`
- `calc-engine.js`
- `expression-engine.js`
- `math-engine.js`
- `poly-engine.js`
- `root-engine.js`
- `root-ui.js`

## Task 1: Create the Isolated Folder Skeleton and Presence Audit

**Files:**
- Create: `scripts/calculator-site-content-audit.js`
- Create: `calculator-site-content/README.md`
- Create: `calculator-site-content/content/site.json`
- Create: `calculator-site-content/content/modules.json`
- Create: `calculator-site-content/content/faqs.json`
- Create: `calculator-site-content/content/glossary.json`
- Create: `calculator-site-content/content/workflows.json`
- Create: `calculator-site-content/content/use-cases.json`

- [ ] **Step 1: Write the failing presence audit**

```js
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredFiles = [
  "calculator-site-content/README.md",
  "calculator-site-content/content/site.json",
  "calculator-site-content/content/modules.json",
  "calculator-site-content/content/faqs.json",
  "calculator-site-content/content/glossary.json",
  "calculator-site-content/content/workflows.json",
  "calculator-site-content/content/use-cases.json"
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Missing required file: ${relativePath}`);
}

console.log("Calculator site content presence audit passed.");
```

- [ ] **Step 2: Run the audit to verify it fails before the folder exists**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: FAIL with `Missing required file: calculator-site-content/README.md`.

- [ ] **Step 3: Create the folder and minimal starter files**

```md
# Calculator Site Content Pack

This folder contains content only.
```

```json
{}
```

```json
[]
```

Create:
- `calculator-site-content/README.md` with the Markdown stub above
- `calculator-site-content/content/site.json` with `{}`
- `calculator-site-content/content/modules.json` with `[]`
- `calculator-site-content/content/faqs.json` with `[]`
- `calculator-site-content/content/glossary.json` with `[]`
- `calculator-site-content/content/workflows.json` with `[]`
- `calculator-site-content/content/use-cases.json` with `[]`

- [ ] **Step 4: Run the audit again to verify the isolated scaffold exists**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: PASS with `Calculator site content presence audit passed.`

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-content-audit.js calculator-site-content/README.md calculator-site-content/content/site.json calculator-site-content/content/modules.json calculator-site-content/content/faqs.json calculator-site-content/content/glossary.json calculator-site-content/content/workflows.json calculator-site-content/content/use-cases.json
git commit -m "feat: scaffold calculator site content pack"
```

## Task 2: Add the Handoff README and Site-Level Framing Content

**Files:**
- Modify: `scripts/calculator-site-content-audit.js`
- Modify: `calculator-site-content/README.md`
- Modify: `calculator-site-content/content/site.json`

- [ ] **Step 1: Extend the audit to validate README and `site.json`**

```js
const site = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/site.json"), "utf8")
);

const readme = fs.readFileSync(
  path.join(ROOT, "calculator-site-content/README.md"),
  "utf8"
);

[
  "projectName",
  "tagline",
  "shortDescription",
  "longDescription",
  "audience",
  "valueProposition",
  "tone",
  "highlights",
  "pageIntent"
].forEach((key) => {
  assert.ok(Object.prototype.hasOwnProperty.call(site, key), `site.json is missing key: ${key}`);
});

assert.ok(Array.isArray(site.audience), "site.json audience must be an array.");
assert.ok(Array.isArray(site.highlights), "site.json highlights must be an array.");
assert.ok(
  readme.includes("content-only") && readme.includes("no design guidance"),
  "README must explain that this package is content-only and contains no design guidance."
);
```

- [ ] **Step 2: Run the audit to verify it fails on the empty placeholders**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: FAIL with `site.json is missing key: projectName`.

- [ ] **Step 3: Replace the README and `site.json` with real handoff content**

```md
# Calculator Site Content Pack

This folder is a standalone handoff package for a future companion website about the Numerical Analysis Teaching Lab.

It is intentionally separate from the calculator application in the repo root.

## Important rules

- This package is content-only.
- This package contains no design guidance.
- Do not treat this folder as part of the main calculator runtime.
- Do not modify calculator logic files in order to use this content.
- A future UI/UX-focused agent is expected to decide layout, styling, components, and overall visual direction.

## Files

- `content/site.json` - site-wide framing, positioning, audience, and shared highlights
- `content/modules.json` - detailed descriptions of the calculator's major learning modules
- `content/faqs.json` - practical questions and answers for visitors
- `content/glossary.json` - concise definitions of core numerical-analysis terms
- `content/workflows.json` - stepwise usage stories that explain how someone might use the calculator
- `content/use-cases.json` - audience-based scenarios for students, instructors, and self-learners

Use these files as canonical source material for a future website. They provide content and semantic meaning only, not presentation instructions.
```

```json
{
  "projectName": "Numerical Analysis Teaching Lab",
  "tagline": "A browser-based companion for learning machine arithmetic, error analysis, polynomial evaluation, and root-finding methods.",
  "shortDescription": "The Numerical Analysis Teaching Lab is an interactive calculator for exploring how numerical methods behave under finite precision and structured problem-solving workflows.",
  "longDescription": "This project helps learners move from formulas on paper to worked numerical-analysis results in a browser. It supports finite-precision arithmetic, error analysis, polynomial evaluation, and multiple root-finding approaches, making it useful both for quick checking and for deeper method comparison.",
  "audience": ["students", "instructors", "self-learners"],
  "valueProposition": "It gives users a practical way to inspect intermediate results, compare exact and approximate values, and understand how numerical choices affect outcomes.",
  "tone": "Hybrid: academically credible, accessible, and presentable without sounding overly promotional.",
  "highlights": [
    "Works directly in the browser with no installation required for the calculator itself.",
    "Supports both quick result checking and more detailed numerical-method exploration.",
    "Brings together machine arithmetic, error analysis, polynomial evaluation, and root finding in one environment."
  ],
  "pageIntent": "Provide source content for a future informational website that explains what the calculator does, why it matters, and how different audiences can use it."
}
```

- [ ] **Step 4: Run the audit to verify README and `site.json` now pass**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: PASS on the README/site checks and continue without schema errors for the still-empty array files.

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-content-audit.js calculator-site-content/README.md calculator-site-content/content/site.json
git commit -m "feat: add calculator site framing content"
```

## Task 3: Add Detailed Module Content

**Files:**
- Modify: `scripts/calculator-site-content-audit.js`
- Modify: `calculator-site-content/content/modules.json`

- [ ] **Step 1: Extend the audit to validate module shape and expected module IDs**

```js
const modules = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/modules.json"), "utf8")
);

assert.ok(Array.isArray(modules), "modules.json must be an array.");
assert.deepStrictEqual(
  modules.map((module) => module.id),
  ["machine-arithmetic", "error-analysis", "polynomial-methods", "root-finding"],
  "modules.json must contain the expected module ids in order."
);

for (const module of modules) {
  [
    "id",
    "label",
    "title",
    "summary",
    "whatItDoes",
    "whyItMatters",
    "inputs",
    "outputs",
    "keyConcepts",
    "learnerOutcomes",
    "commonUseCases",
    "limitations",
    "notes"
  ].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(module, key), `Module ${module.id} is missing key: ${key}`);
  });
}
```

- [ ] **Step 2: Run the audit to verify it fails on the empty array**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: FAIL with `modules.json must contain the expected module ids in order.`

- [ ] **Step 3: Add the full module content**

```json
[
  {
    "id": "machine-arithmetic",
    "label": "Module I",
    "title": "Machine Arithmetic",
    "summary": "Explores how finite-precision arithmetic changes results when values are chopped or rounded during computation.",
    "whatItDoes": "Lets users evaluate expressions and arithmetic operations under a chosen significant-digit setting, compare stored machine values against exact references, and inspect how intermediate approximation affects the final answer.",
    "whyItMatters": "Machine arithmetic is the foundation for understanding why digital computations differ from symbolic mathematics or exact hand derivations.",
    "inputs": ["numbers or expressions", "significant digits", "machine rule such as chopping or rounding"],
    "outputs": ["machine result", "exact or reference value", "comparison notes", "stepwise approximation details"],
    "keyConcepts": ["finite precision", "stored machine values", "round-off behavior", "stepwise versus final-only approximation"],
    "learnerOutcomes": ["Recognize when intermediate approximation changes a result.", "Compare exact and machine-computed values.", "Explain the role of chopping and rounding in textbook machine arithmetic."],
    "commonUseCases": ["checking assignment-style machine arithmetic", "comparing exact and stored values", "demonstrating round-off effects during instruction"],
    "limitations": ["Results depend on the chosen precision and machine rule.", "The module is intended for instructional finite-precision scenarios, not as a substitute for arbitrary-precision symbolic software."],
    "notes": ["The calculator emphasizes textbook-style notation and interpretable comparisons rather than opaque one-line output."]
  },
  {
    "id": "error-analysis",
    "label": "Module II",
    "title": "Error Analysis",
    "summary": "Computes and explains common error measures between a true value and an approximation.",
    "whatItDoes": "Takes an exact value and an approximate value, then reports absolute error, relative error when defined, significant-digit style checks, and explanatory notes about the result.",
    "whyItMatters": "Error analysis gives users a disciplined way to judge whether an approximation is acceptable and how much trust to place in a computed value.",
    "inputs": ["true value", "approximate value"],
    "outputs": ["absolute error", "relative error", "significant-digit interpretation", "verdict-style explanations"],
    "keyConcepts": ["absolute error", "relative error", "significant digits", "approximation quality"],
    "learnerOutcomes": ["Distinguish absolute from relative error.", "Interpret whether an approximation preserves a useful number of digits.", "Explain when relative error is undefined and why."],
    "commonUseCases": ["checking numerical-analysis homework", "explaining the meaning of error metrics", "comparing imported results from other calculator modules"],
    "limitations": ["Interpretation depends on the quality and meaning of the supplied reference value.", "Relative error is not defined when the true value is zero."],
    "notes": ["This module is especially useful as a bridge between raw computation and method evaluation."]
  },
  {
    "id": "polynomial-methods",
    "label": "Module III",
    "title": "Polynomial Methods",
    "summary": "Compares ways of evaluating a polynomial, including Horner-style evaluation and direct evaluation.",
    "whatItDoes": "Lets users evaluate a polynomial at a chosen value, compare direct and Horner-style paths, and inspect how operation ordering influences machine-computed results.",
    "whyItMatters": "Polynomial evaluation is a classic setting for seeing how mathematically equivalent expressions can behave differently in finite precision.",
    "inputs": ["polynomial in x", "evaluation point", "significant digits", "machine rule"],
    "outputs": ["exact or reference value", "Horner result", "direct result", "comparison notes", "error-related summaries"],
    "keyConcepts": ["Horner's method", "operation count", "round-off amplification", "equivalent expressions with different numerical behavior"],
    "learnerOutcomes": ["Compare Horner and direct evaluation.", "Explain why evaluation strategy can affect finite-precision output.", "Connect polynomial structure to numerical stability."],
    "commonUseCases": ["assignment comparisons between Horner and direct evaluation", "teaching stability and operation ordering", "testing how a polynomial behaves near sensitive points"],
    "limitations": ["Behavior depends on the input polynomial and evaluation point.", "This module focuses on instructional comparisons rather than full symbolic manipulation."],
    "notes": ["The module is useful when a class wants to discuss why two equivalent forms can produce different machine results."]
  },
  {
    "id": "root-finding",
    "label": "Module IV",
    "title": "Root Finding",
    "summary": "Supports multiple one-variable root-finding methods so users can approximate solutions and compare iterative behavior.",
    "whatItDoes": "Provides root-finding workflows for Bisection, Newton-Raphson, Secant, False Position, and Fixed Point methods, including method inputs, stopping controls, and result summaries.",
    "whyItMatters": "Root-finding methods are central to numerical analysis because they show how iteration, stopping rules, and method assumptions shape approximate solutions.",
    "inputs": ["function definition", "initial bracket or seed values", "significant digits", "machine rule", "stopping settings"],
    "outputs": ["approximate root", "stopping outcome", "iteration details", "method-specific summaries"],
    "keyConcepts": ["iteration", "convergence", "stopping criteria", "method assumptions", "approximate roots"],
    "learnerOutcomes": ["Differentiate among common root-finding methods.", "Interpret stopping rules and approximate-root outputs.", "Understand why starting values and method choice affect convergence behavior."],
    "commonUseCases": ["running lecture examples for iterative methods", "comparing multiple root-finding methods on the same function", "studying how stopping choices affect reported answers"],
    "limitations": ["Some methods require stronger assumptions than others, such as derivative availability or suitable starting points.", "Approximate roots and convergence behavior depend heavily on the chosen function and initial values."],
    "notes": ["The module is best understood as a method-comparison workspace rather than as a black-box root solver."]
  }
]
```

- [ ] **Step 4: Run the audit to verify module structure passes**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: PASS on module validation and continue to later tasks' still-unvalidated files.

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-content-audit.js calculator-site-content/content/modules.json
git commit -m "feat: add calculator module content pack"
```

## Task 4: Add FAQs and Glossary Content

**Files:**
- Modify: `scripts/calculator-site-content-audit.js`
- Modify: `calculator-site-content/content/faqs.json`
- Modify: `calculator-site-content/content/glossary.json`

- [ ] **Step 1: Extend the audit to validate FAQ and glossary structure**

```js
const faqs = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/faqs.json"), "utf8")
);
const glossary = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/glossary.json"), "utf8")
);

assert.ok(Array.isArray(faqs) && faqs.length >= 6, "faqs.json must contain at least 6 items.");
assert.ok(Array.isArray(glossary) && glossary.length >= 8, "glossary.json must contain at least 8 terms.");

for (const faq of faqs) {
  ["id", "question", "answer", "category"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(faq, key), `FAQ item is missing key: ${key}`);
  });
}

for (const term of glossary) {
  ["id", "term", "definition", "plainLanguage", "relatedTerms"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(term, key), `Glossary term is missing key: ${key}`);
  });
}
```

- [ ] **Step 2: Run the audit to verify it fails before these files are populated**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: FAIL with `faqs.json must contain at least 6 items.`

- [ ] **Step 3: Add the FAQ and glossary content**

```json
[
  { "id": "what-is-it", "question": "What is the Numerical Analysis Teaching Lab?", "answer": "It is a browser-based calculator designed to help users work through numerical-analysis topics such as machine arithmetic, error analysis, polynomial evaluation, and root finding.", "category": "getting-started" },
  { "id": "who-is-it-for", "question": "Who is this calculator for?", "answer": "It is useful for students studying numerical analysis, instructors demonstrating computational ideas, and self-learners who want structured numerical-method practice.", "category": "learning-goals" },
  { "id": "needs-install", "question": "Does the calculator require installation?", "answer": "The calculator itself runs in the browser and does not require a backend service or full installation to use locally.", "category": "getting-started" },
  { "id": "exact-vs-machine", "question": "Why does the calculator compare exact and machine values?", "answer": "That comparison helps users see how finite precision changes results and why intermediate approximation matters in numerical computation.", "category": "numerical-methods" },
  { "id": "root-methods", "question": "Which root-finding methods are available?", "answer": "The calculator includes Bisection, Newton-Raphson, Secant, False Position, and Fixed Point workflows for one-variable root approximation.", "category": "numerical-methods" },
  { "id": "limits", "question": "Is this meant to replace advanced mathematical software?", "answer": "No. The calculator is primarily an instructional environment for studying numerical methods and finite-precision behavior, not a general-purpose symbolic mathematics system.", "category": "accuracy-and-limitations" }
]
```

```json
[
  { "id": "machine-number", "term": "Machine number", "definition": "A number represented in finite precision inside a computational system.", "plainLanguage": "It is the stored version of a number after the computer keeps only limited digits.", "relatedTerms": ["finite precision", "rounding", "chopping"] },
  { "id": "chopping", "term": "Chopping", "definition": "A finite-precision rule that discards digits beyond the allowed precision without adjusting the last kept digit.", "plainLanguage": "Keep the allowed digits and drop the rest.", "relatedTerms": ["rounding", "machine number"] },
  { "id": "rounding", "term": "Rounding", "definition": "A finite-precision rule that adjusts the last kept digit based on the first discarded digit.", "plainLanguage": "Keep only some digits, but adjust the last one if the next digit is large enough.", "relatedTerms": ["chopping", "machine number"] },
  { "id": "absolute-error", "term": "Absolute error", "definition": "The magnitude of the difference between the true value and the approximation.", "plainLanguage": "How far the approximation is from the true value in raw units.", "relatedTerms": ["relative error", "approximation"] },
  { "id": "relative-error", "term": "Relative error", "definition": "The absolute error scaled by the size of the true value, when the true value is nonzero.", "plainLanguage": "How large the miss is compared with the size of the true value.", "relatedTerms": ["absolute error", "significant digits"] },
  { "id": "polynomial-evaluation", "term": "Polynomial evaluation", "definition": "The process of computing the value of a polynomial at a chosen input.", "plainLanguage": "Plug in a value for x and compute what the polynomial becomes.", "relatedTerms": ["Horner's method", "direct evaluation"] },
  { "id": "convergence", "term": "Convergence", "definition": "The tendency of an iterative method to move toward a target value such as a root.", "plainLanguage": "Repeated steps are getting closer to the answer.", "relatedTerms": ["iteration", "root approximation"] },
  { "id": "stopping-criterion", "term": "Stopping criterion", "definition": "A rule that tells an iterative method when to stop, such as reaching a tolerance or a fixed number of iterations.", "plainLanguage": "The condition that says the method can stop running.", "relatedTerms": ["tolerance", "iteration"] }
]
```

- [ ] **Step 4: Run the audit to verify FAQ/glossary coverage now passes**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: PASS on FAQ and glossary checks.

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-content-audit.js calculator-site-content/content/faqs.json calculator-site-content/content/glossary.json
git commit -m "feat: add calculator site faqs and glossary"
```

## Task 5: Add Workflows and Audience Use Cases

**Files:**
- Modify: `scripts/calculator-site-content-audit.js`
- Modify: `calculator-site-content/content/workflows.json`
- Modify: `calculator-site-content/content/use-cases.json`

- [ ] **Step 1: Extend the audit to validate workflows and use cases**

```js
const workflows = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/workflows.json"), "utf8")
);
const useCases = JSON.parse(
  fs.readFileSync(path.join(ROOT, "calculator-site-content/content/use-cases.json"), "utf8")
);

assert.ok(Array.isArray(workflows) && workflows.length >= 4, "workflows.json must contain at least 4 workflows.");
assert.ok(Array.isArray(useCases) && useCases.length >= 3, "use-cases.json must contain at least 3 use cases.");

for (const workflow of workflows) {
  ["id", "title", "summary", "audience", "steps"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(workflow, key), `Workflow is missing key: ${key}`);
  });
  assert.ok(Array.isArray(workflow.steps) && workflow.steps.length >= 3, `Workflow ${workflow.id} must contain at least 3 steps.`);
}

for (const useCase of useCases) {
  ["id", "audience", "title", "summary", "benefits", "situations"].forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(useCase, key), `Use case is missing key: ${key}`);
  });
}
```

- [ ] **Step 2: Run the audit to verify it fails before these files are populated**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: FAIL with `workflows.json must contain at least 4 workflows.`

- [ ] **Step 3: Add the workflow and use-case content**

```json
[
  {
    "id": "machine-arithmetic-check",
    "title": "Check a finite-precision arithmetic problem",
    "summary": "Use the calculator to compare an exact expression with a machine-computed result.",
    "audience": "students",
    "steps": [
      { "title": "Enter the expression or numbers", "description": "Provide the arithmetic problem you want to inspect.", "outcome": "The calculator has the full problem setup." },
      { "title": "Choose precision settings", "description": "Select the number of significant digits and whether to chop or round.", "outcome": "The finite-precision rule is defined." },
      { "title": "Compute and compare", "description": "Review the machine result alongside the exact or reference value.", "outcome": "You can see how finite precision changes the answer." }
    ]
  },
  {
    "id": "error-analysis-review",
    "title": "Evaluate approximation quality",
    "summary": "Use error metrics to judge whether an approximation is acceptable.",
    "audience": "students",
    "steps": [
      { "title": "Provide the true and approximate values", "description": "Enter the reference value and the approximation you want to assess.", "outcome": "The calculator has the pair needed for comparison." },
      { "title": "Read the reported metrics", "description": "Inspect absolute error, relative error, and significant-digit style results.", "outcome": "You have quantitative measures of approximation quality." },
      { "title": "Interpret the result", "description": "Use the explanations to decide how trustworthy the approximation is.", "outcome": "You can explain the approximation in numerical-analysis terms." }
    ]
  },
  {
    "id": "polynomial-comparison",
    "title": "Compare polynomial evaluation methods",
    "summary": "Study how Horner and direct evaluation behave on the same polynomial.",
    "audience": "students",
    "steps": [
      { "title": "Enter the polynomial and x-value", "description": "Set up the polynomial problem you want to evaluate.", "outcome": "Both methods will work from the same mathematical input." },
      { "title": "Compute the comparison", "description": "Run the polynomial module to produce the reference, Horner, and direct results.", "outcome": "You get multiple evaluation paths to compare." },
      { "title": "Inspect method differences", "description": "Use the outputs to discuss operation ordering and sensitivity.", "outcome": "You can explain why equivalent forms may behave differently numerically." }
    ]
  },
  {
    "id": "root-finding-session",
    "title": "Approximate a root with an iterative method",
    "summary": "Use one of the root-finding methods to study approximate solutions and stopping behavior.",
    "audience": "students",
    "steps": [
      { "title": "Choose a method and provide starting data", "description": "Select Bisection, Newton-Raphson, Secant, False Position, or Fixed Point and enter the required values.", "outcome": "The method has the function and initial setup it needs." },
      { "title": "Set stopping controls", "description": "Choose a stopping mode and value that fit the exercise.", "outcome": "The iteration has a clear stopping rule." },
      { "title": "Run and interpret the approximation", "description": "Review the approximate root and related method output.", "outcome": "You can discuss convergence and the meaning of the reported answer." }
    ]
  }
]
```

```json
[
  {
    "id": "students",
    "audience": "students",
    "title": "Students can turn formulas into worked numerical results",
    "summary": "The calculator helps students move from lecture formulas and homework instructions to concrete computed outputs they can inspect and explain.",
    "benefits": ["faster checking of manual work", "clearer understanding of approximation effects", "better comparison of multiple methods"],
    "situations": ["reviewing assignments", "studying for quizzes and exams", "checking whether a finite-precision result makes sense"]
  },
  {
    "id": "instructors",
    "audience": "instructors",
    "title": "Instructors can demonstrate numerical ideas with concrete examples",
    "summary": "The calculator provides a practical way to show how numerical-analysis concepts behave during class demonstrations or guided examples.",
    "benefits": ["supports lecture walkthroughs", "helps compare methods in real time", "makes abstract error discussions more concrete"],
    "situations": ["classroom demonstration", "lab or recitation support", "preparing worked examples for discussion"]
  },
  {
    "id": "self-learners",
    "audience": "self-learners",
    "title": "Self-learners can explore method behavior independently",
    "summary": "A self-directed learner can use the calculator to practice interpreting finite precision, error measures, and iterative results without needing a full software stack.",
    "benefits": ["low-friction experimentation", "guided interpretation through structured outputs", "practical reinforcement of textbook material"],
    "situations": ["independent study", "reviewing a numerical-analysis chapter", "testing intuition about approximation and convergence"]
  }
]
```

- [ ] **Step 4: Run the audit to verify workflows and use cases pass**

Run:

```bash
node scripts/calculator-site-content-audit.js
```

Expected: PASS on workflows and use-case checks.

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-content-audit.js calculator-site-content/content/workflows.json calculator-site-content/content/use-cases.json
git commit -m "feat: add calculator site workflows and use cases"
```

## Task 6: Add the No-Design Guardrail Audit and Final Verification

**Files:**
- Create: `scripts/calculator-site-no-design-audit.js`
- Test: `scripts/calculator-site-content-audit.js`

- [ ] **Step 1: Write the failing no-design audit**

```js
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "calculator-site-content");
const forbiddenPatterns = [
  /\bcolor palette\b/i,
  /\btypography\b/i,
  /\blayout instructions?\b/i,
  /\bcomponent recommendations?\b/i,
  /\banimation\b/i,
  /\bwireframe\b/i,
  /\bmockup\b/i,
  /<div/i,
  /<section/i,
  /\.btn-/i,
  /tailwind/i
];

const filesToScan = [
  path.join(CONTENT_ROOT, "README.md"),
  path.join(CONTENT_ROOT, "content", "site.json"),
  path.join(CONTENT_ROOT, "content", "modules.json"),
  path.join(CONTENT_ROOT, "content", "faqs.json"),
  path.join(CONTENT_ROOT, "content", "glossary.json"),
  path.join(CONTENT_ROOT, "content", "workflows.json"),
  path.join(CONTENT_ROOT, "content", "use-cases.json")
];

for (const filePath of filesToScan) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const pattern of forbiddenPatterns) {
    assert.ok(!pattern.test(text), `Forbidden design guidance found in ${path.relative(ROOT, filePath)} via pattern ${pattern}`);
  }
}

console.log("Calculator site no-design audit passed.");
```

- [ ] **Step 2: Run the no-design audit and fix any accidental UI language before proceeding**

Run:

```bash
node scripts/calculator-site-no-design-audit.js
```

Expected: PASS. If it fails, remove the flagged wording from the content pack before moving on.

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
node scripts/calculator-site-content-audit.js
node scripts/calculator-site-no-design-audit.js
git diff --name-only -- calculator-site-content scripts/calculator-site-content-audit.js scripts/calculator-site-no-design-audit.js
git diff --name-only -- . ':(exclude)calculator-site-content' ':(exclude)scripts/calculator-site-content-audit.js' ':(exclude)scripts/calculator-site-no-design-audit.js'
```

Expected:
- both Node audits PASS
- the first `git diff` only lists the content-pack files and the two audit scripts
- the second `git diff` prints nothing related to calculator source files for this task

- [ ] **Step 4: Do a final manual review of content quality**

Checklist:

```text
- The package is separate from calculator runtime files.
- The README clearly says content-only and no design guidance.
- The module descriptions match the actual calculator feature set.
- The root-finding module names include Bisection, Newton-Raphson, Secant, False Position, and Fixed Point.
- No file contains layout, styling, or component instructions.
- The content is strong enough for a future UI/UX model to build from directly.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/calculator-site-no-design-audit.js calculator-site-content/README.md calculator-site-content/content/site.json calculator-site-content/content/modules.json calculator-site-content/content/faqs.json calculator-site-content/content/glossary.json calculator-site-content/content/workflows.json calculator-site-content/content/use-cases.json scripts/calculator-site-content-audit.js
git commit -m "feat: finalize calculator site content handoff pack"
```
