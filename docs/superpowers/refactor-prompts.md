# Codebase-Aware Refactor Prompts

Use these prompts when you want an AI assistant to inspect this repository from a target file or folder path before proposing or making refactor changes.

## When To Use Which Prompt

- Use the canonical prompt for most refactors in this repo.
- Use the math-engine correctness variant when the target is in `calc-engine.js`, `expression-engine.js`, `math-engine.js`, `poly-engine.js`, or `root-engine.js`, or when numerical correctness is the main risk.
- Use the UI / readability variant when the target is in `app.js`, `root-ui.js`, `index.html`, or related UI formatting/wiring code.
- Use the resilience / performance variant when the refactor is mainly about duplication, error handling, or hot-path cleanup and you do not want behavior changes.

## Minimal Inputs To Provide

Keep your request lightweight. In most cases, this is enough:

- Target path
- Refactor goal
- Optional hard constraints

Example:

```text
Target path: root-ui.js
Refactor goal: improve readability and reduce duplicated DOM wiring without changing UI behavior
Optional hard constraints: keep all ids, status copy, and rendered summaries unchanged
```

## Canonical Prompt

Use this as the default prompt for refactors in this repository.

```text
You are a senior software engineer doing a careful, behavior-preserving refactor in an existing repository.

Work from the codebase itself, not from pasted code by default.

Inputs:
- Target path: <file-or-folder>
- Refactor goal: <what you want improved>
- Optional hard constraints: <anything that must or must not change>

Before you refactor anything:
1. Inspect the repository around the target path first.
2. Read the most relevant context, including:
   - README.md
   - the target file or folder
   - nearby sibling modules that the target depends on or coordinates with
   - matching test files such as *_tests.js when they exist
   - relevant audit scripts in scripts/
3. If the target touches engine or root-finding logic, inspect the relevant checks such as:
   - scripts/engine-correctness-audit.js
   - scripts/root-engine-audit.js
4. If the target touches UI/controller logic, inspect the relevant markup and helpers such as:
   - index.html
   - app.js
   - related formatting/state modules

First, briefly analyze:
- the module's main responsibilities and current structure
- code smells, duplication, complexity, or weak boundaries
- the behaviors, outputs, and correctness-sensitive logic that must not change
- which files you inspected and why they matter

Then refactor with these goals:
- improve readability, naming, modularity, and maintainability
- reduce duplication and unnecessary complexity
- make the code easier to test and extend

Constraints:
- Do not change external behavior or observable outputs.
- Keep the same public API and function signatures unless I explicitly ask for API changes.
- Preserve browser-visible summaries, status messages, and result semantics.
- Preserve numerical correctness, stopping behavior, precision semantics, and edge-case handling where relevant.
- Stay consistent with the repository's existing style and patterns.
- Avoid speculative rewrites outside the scope of the target path.

After refactoring:
1. Run the most relevant existing tests, audits, or verification commands.
2. Report exactly what you changed and why.
3. Call out any risks or edge cases I should manually test.

Do not ask me to paste code by default. Start by inspecting the repository from the target path I provide.
```

## Math-Engine Correctness Variant

Use this when the target is in calculation or root-finding logic.

```text
Use the canonical prompt above, and add these priorities:
- Treat numerical correctness as a hard constraint, not a nice-to-have.
- Inspect stopping conditions, convergence behavior, sign logic, domain restrictions, and precision/chop/round semantics before editing.
- Prefer existing audits and math-focused tests over informal reasoning.
- If the target is in or near root-solving logic, verify with the most relevant commands such as node scripts/engine-correctness-audit.js and node scripts/root-engine-audit.js when applicable.
- Call out any mathematically sensitive edge cases that should be manually rechecked after the refactor.
```

## UI / Readability Variant

Use this when the target is a UI controller or rendering module.

```text
Use the canonical prompt above, and add these priorities:
- Optimize for clearer DOM wiring, smaller helpers, simpler control flow, and more descriptive names.
- Preserve existing ids, event semantics, rendered summaries, status messages, and error messages unless I explicitly ask for UI copy changes.
- Inspect index.html, app.js, and any shared formatting or state helpers before refactoring.
- Prefer narrow structural cleanup over visual or behavioral redesign.
- Call out any browser flows I should manually click through after the refactor.
```

## Resilience / Performance Variant

Use this when the goal is to improve resilience or performance without changing behavior.

```text
Use the canonical prompt above, and add these priorities:
- Focus on guard clauses, invalid-state handling, repeated computation, avoidable branching, and error-surfacing consistency.
- Do not claim a performance improvement unless you can point to the specific code path that improved.
- Preserve success-path behavior and existing outputs for valid inputs.
- Prefer small, explainable improvements over broad rewrites.
- Report any benchmark, profiling, or regression checks that would be worth running next if deeper validation is needed.
```

## Repo-Specific Examples

Example: refactor `root-engine.js`

```text
Use the canonical prompt plus the Math-Engine Correctness Variant.
Target path: root-engine.js
Refactor goal: improve readability and helper boundaries without changing solver behavior
Optional hard constraints: preserve stop reasons, convergence behavior, and audit-script expectations
```

Example: refactor `root-ui.js`

```text
Use the canonical prompt plus the UI / Readability Variant.
Target path: root-ui.js
Refactor goal: simplify rendering helpers and reduce repeated UI wiring
Optional hard constraints: keep DOM ids, status/error messages, and visible outputs unchanged
```

Example: refactor `app.js`

```text
Use the canonical prompt plus the Resilience / Performance Variant.
Target path: app.js
Refactor goal: reduce duplication in event/setup logic and make error handling more consistent
Optional hard constraints: no behavior changes and no redesign of the UI flow
```
