# Codebase-Aware Refactor Prompts

Use these prompts when you want an AI assistant to inspect this repository from a target file or folder path before proposing or making refactor changes.

## When To Use Which Prompt

## Minimal Inputs To Provide

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

## UI / Readability Variant

## Resilience / Performance Variant

## Repo-Specific Examples
