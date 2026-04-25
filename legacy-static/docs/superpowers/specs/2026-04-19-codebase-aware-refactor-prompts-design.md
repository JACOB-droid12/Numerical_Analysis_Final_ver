# Codebase-Aware Refactor Prompts Design

Date: 2026-04-19
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

Create a reusable prompt set for this repository that is codebase-first rather
than paste-first. The default prompt should start from a target file or folder,
inspect the surrounding project context, identify correctness-sensitive
behavior, and only then refactor. The prompt set should be tailored to this
repository's structure: static browser app, numerics-heavy engines, UI wiring
modules, standalone test files, and audit scripts under `scripts/`.

The default prompt will be path-scoped and repo-aware. It will require only a
small amount of user input, then direct the model to discover the relevant
modules, tests, docs, and verification commands from the repository itself.

## Goals

- Provide one canonical refactor prompt that works across engine files, UI
  files, and small folder-level refactors in this repository.
- Make the prompt inspect the codebase before proposing or applying changes.
- Preserve observable behavior, public APIs, browser-visible outputs, and
  numerical correctness.
- Make the prompt explicitly verify against the repository's existing checks
  instead of relying on informal confidence.
- Keep the prompt lightweight for the user: target path, refactor goal, and
  optional hard constraints should be enough.
- Encode repository-specific guardrails so future refactors do not ignore the
  audit scripts or the coupling between engine and UI modules.

## Non-Goals

- This design does not change application code, tests, or audit scripts.
- This design does not define a new architecture for the calculator itself.
- This design does not replace targeted debugging or feature-planning prompts.
- This design does not require every refactor to scan the entire repository.
  The default flow is path-scoped, with wider inspection only when the local
  dependency graph requires it.

## Current Problem

The existing "big refactor prompt" pattern assumes the user will paste a
module into the chat and ask for cleanup. That pattern is a poor fit for this
repository because correctness often depends on nearby context:

- `root-engine.js` behavior is constrained by audit scripts and method-specific
  tests, not by the file alone.
- `root-ui.js` depends on helper injection, DOM ids, shared formatting
  utilities, and status/error rendering conventions.
- Large files such as `app.js`, `root-engine.js`, and `root-ui.js` carry
  hidden coupling that a paste-only review can miss.
- Numerical-analysis code has correctness risks that are not obvious from
  readability alone. A refactor that "looks cleaner" can still break stopping
  rules, precision handling, sign logic, or browser-visible summaries.

Because of this, the prompt should force repository inspection before analysis
or modification.

## Decision

Adopt a hybrid prompt set with one default prompt and a small number of
targeted variants:

1. A canonical, codebase-aware, path-scoped refactor prompt for everyday use.
2. A math-engine correctness variant for numerics-heavy modules.
3. A UI/readability variant for browser wiring and rendering modules.
4. A resilience/performance variant for error handling, duplication, and hot
   paths.

The canonical prompt is the default recommendation. The targeted variants are
shorter overlays that sharpen the review for common refactor modes in this
repository.

## Inputs

The canonical prompt should ask the user for only:

- `Target path`
- `Refactor goal`
- `Optional hard constraints`

Everything else should come from repository inspection. The prompt should not
ask for pasted code by default. If the user pastes code anyway, the model may
use it as a hint, but the repository remains the source of truth.

## Required Repository Inspection

Before proposing or applying changes, the prompt must tell the model to inspect
the most relevant context around the target path. The baseline inspection set
is:

- `README.md`
- The target file or the files inside the target folder
- Nearby sibling modules that the target imports, depends on, or coordinates
  with
- Matching test files such as `*_tests.js` when they exist
- Relevant audit scripts in `scripts/`

The prompt should also steer the model toward repo-specific checks when they
apply:

- `scripts/engine-correctness-audit.js`
- `scripts/root-engine-audit.js`

For engine refactors, the prompt should inspect both neighboring engine files
and matching audits/tests. For UI refactors, it should inspect the related DOM
markup in `index.html`, shared helpers in `app.js`, and any formatting or
state modules the target depends on.

## Canonical Prompt Workflow

The canonical prompt should instruct the model to work in this order:

1. Inspect the repository around the target path before making proposals.
2. Identify the module's responsibilities, current structure, duplicated logic,
   complexity, and correctness-critical behavior.
3. List the behaviors and outputs that must not change.
4. Refactor for readability, naming, modularity, and testability while keeping
   the same public API and observable behavior.
5. Verify with the most relevant existing tests or audit scripts.
6. Report what changed, why it was safe, and what manual edge cases still
   deserve attention.

This ordering is mandatory because it prevents the model from doing generic
"cleanups" that silently break numerical or UI behavior.

## Canonical Prompt Content

The default prompt should contain the following instruction blocks:

### Role

Frame the model as a senior software engineer doing a careful,
behavior-preserving refactor in an existing repository.

### Discovery

Tell the model to inspect the codebase around the target path first. Require it
to read the relevant docs, neighboring modules, tests, and audit scripts before
suggesting changes.

### Analysis Output

Require a brief analysis that covers:

- Main responsibilities and current structure
- Code smells, duplication, complexity, and weak boundaries
- The most correctness-critical behaviors to preserve
- The files it inspected and why they matter

### Refactor Constraints

Require:

- No change to external behavior or observable outputs
- No change to public API or function signatures unless explicitly asked
- Repository style consistency
- No speculative rewrites outside the scope of the target path
- Minimal, explainable changes over broad churn

### Verification

Require running the most relevant existing checks after refactoring and
reporting the results. The prompt should prefer the repository's own tests and
audit scripts over ad hoc assurances.

### Final Report

Require a concise summary of:

- What changed and why
- Why the refactor is expected to preserve behavior
- What risks or edge cases should still be manually tested

## Targeted Variants

### Math-Engine Correctness Variant

Use when the target path is in calculation or root-finding logic. This variant
adds stronger emphasis on:

- Numerical correctness
- Stopping conditions and convergence behavior
- Precision/chop/round semantics
- Sign logic, domain restrictions, and edge-case handling
- Verification through the relevant audit script plus any nearby tests

### UI / Readability Variant

Use when the target path is a UI controller or rendering module such as
`app.js` or `root-ui.js`. This variant adds emphasis on:

- DOM wiring clarity
- Smaller helpers and clearer naming
- Stable status/error messages and rendered output
- Preserving existing ids, event semantics, and visible summaries
- Inspecting `index.html` and shared UI helpers before editing

### Resilience / Performance Variant

Use when the goal is to reduce duplication, improve error handling, or clean up
hot paths without changing behavior. This variant adds emphasis on:

- Guard clauses and invalid-state handling
- Avoiding repeated computation
- Consistent error surfacing
- Performance observations tied to actual code paths, not guesses

## Proposed Deliverable Shape

Implementation should produce a prompt pack in Markdown with:

- One canonical prompt
- Three short targeted variants
- A short "when to use which prompt" section
- A short "minimal inputs to provide" section

The prompts should be copy-paste ready and should mention repository paths
using this project's actual structure.

## Acceptance Criteria

- The default prompt does not ask the user to paste a module.
- The default prompt explicitly starts from a file or folder path.
- The default prompt explicitly tells the model to inspect repository context
  before refactoring.
- The default prompt explicitly protects public behavior, outputs, and
  signatures.
- The default prompt explicitly verifies with existing tests or audit scripts.
- The prompt set includes targeted variants for engine correctness, UI
  readability, and resilience/performance.
- The prompt text is short enough to reuse regularly and specific enough to be
  meaningfully better than a generic refactor prompt.

## Risks

- If the prompt is too broad, the model may over-scan the repository and waste
  time.
- If the prompt is too narrow, the model may miss the context that protects
  correctness.
- If repository-specific checks are named too rigidly, the prompt may feel less
  reusable when the target is outside the root-finding area.

The implementation should manage these trade-offs by using a path-scoped
default and repo-specific verification guidance that activates only when
relevant.

## Open Questions Resolved

- Paste-first vs codebase-first: codebase-first.
- Whole-repo scan vs target-path inspection: target-path inspection by default.
- Single prompt vs prompt pack: hybrid prompt set with one default plus three
  targeted variants.

## Implementation Notes

- Name the eventual artifact something obvious such as
  `docs/refactor-prompts.md` or `docs/superpowers/refactor-prompts.md`.
- Keep the canonical prompt first and the variants below it.
- Include repo-specific examples using files such as `root-engine.js`,
  `root-ui.js`, and `app.js` so the prompt feels grounded in this project.
