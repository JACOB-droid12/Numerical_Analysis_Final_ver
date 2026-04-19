# Codebase-Aware Refactor Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable, repo-specific prompt pack that tells an AI refactoring assistant to inspect this codebase from a target file or folder path before analyzing or refactoring.

**Architecture:** The deliverable is a single Markdown document at `docs/superpowers/refactor-prompts.md`. It contains one canonical prompt, three targeted variants, usage guidance, minimal-input guidance, and repo-grounded examples. Verification is content-based: each task checks for required headings and required repo-specific phrases so the final document can be reviewed against the approved spec without guessing.

**Tech Stack:** Markdown documentation, PowerShell verification commands, Git

---

## File Structure

**Create:**
- `docs/superpowers/refactor-prompts.md` — The final prompt pack. Contains the canonical prompt, targeted variants, usage notes, and repo-specific examples.

**Modify:**
- `docs/superpowers/plans/2026-04-19-codebase-aware-refactor-prompts.md` — This plan file only if execution discovers a necessary correction while following the tasks.

**Reference only:**
- `docs/superpowers/specs/2026-04-19-codebase-aware-refactor-prompts-design.md` — Approved design spec and acceptance criteria.
- `README.md` — Repo structure and audit command references that should be echoed in the prompt pack.
- `root-engine.js`, `root-ui.js`, `app.js`, `index.html` — Example files used in the prompt pack so the guidance feels grounded in this project.

**Not modified unless the user explicitly expands scope:**
- Application code under the project root
- Existing tests and audit scripts

---

### Task 1: Create the Prompt-Pack Skeleton

**Files:**
- Create: `docs/superpowers/refactor-prompts.md`
- Reference: `docs/superpowers/specs/2026-04-19-codebase-aware-refactor-prompts-design.md`

- [ ] **Step 1: Verify the prompt-pack file does not already exist**

Run:

```powershell
Test-Path 'docs\superpowers\refactor-prompts.md'
```

Expected: `False`

- [ ] **Step 2: Create the Markdown skeleton with the required top-level sections**

Create `docs/superpowers/refactor-prompts.md` with exactly this initial content:

```md
# Codebase-Aware Refactor Prompts

Use these prompts when you want an AI assistant to inspect this repository from a target file or folder path before proposing or making refactor changes.

## When To Use Which Prompt

## Minimal Inputs To Provide

## Canonical Prompt

## Math-Engine Correctness Variant

## UI / Readability Variant

## Resilience / Performance Variant

## Repo-Specific Examples
```

- [ ] **Step 3: Verify the skeleton headings exist**

Run:

```powershell
$path = 'docs\superpowers\refactor-prompts.md'
Select-String -Path $path -Pattern '^## When To Use Which Prompt$', '^## Minimal Inputs To Provide$', '^## Canonical Prompt$', '^## Math-Engine Correctness Variant$', '^## UI / Readability Variant$', '^## Resilience / Performance Variant$', '^## Repo-Specific Examples$'
```

Expected: seven matches, one for each section heading.

- [ ] **Step 4: Commit the scaffold**

Run:

```powershell
git add -- 'docs/superpowers/refactor-prompts.md'
git commit -m "docs: scaffold codebase-aware refactor prompts"
```

Expected: commit succeeds and includes only the new prompt-pack file.

---

### Task 2: Draft the Canonical Path-Scoped Prompt

**Files:**
- Modify: `docs/superpowers/refactor-prompts.md`
- Reference: `docs/superpowers/specs/2026-04-19-codebase-aware-refactor-prompts-design.md`
- Reference: `README.md`

- [ ] **Step 1: Verify the canonical prompt body is still missing**

Run:

```powershell
Select-String -Path 'docs\superpowers\refactor-prompts.md' -Pattern 'Target path', 'scripts/root-engine-audit.js', 'Do not ask me to paste code by default'
```

Expected: no matches.

- [ ] **Step 2: Replace the empty canonical section with the full default prompt**

Replace the `## Canonical Prompt` section with this content:

````md
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
````

- [ ] **Step 3: Verify the canonical prompt includes the required repo-aware guardrails**

Run:

```powershell
$path = 'docs\superpowers\refactor-prompts.md'
Select-String -Path $path -Pattern 'Target path:', 'README.md', 'scripts/engine-correctness-audit.js', 'scripts/root-engine-audit.js', 'index.html', 'app.js', 'Do not ask me to paste code by default', 'Preserve numerical correctness'
```

Expected: matches for all eight phrases.

- [ ] **Step 4: Commit the canonical prompt**

Run:

```powershell
git add -- 'docs/superpowers/refactor-prompts.md'
git commit -m "docs: add canonical codebase-aware refactor prompt"
```

Expected: commit succeeds and includes only the prompt-pack file.

---

### Task 3: Add the Three Targeted Variants

**Files:**
- Modify: `docs/superpowers/refactor-prompts.md`
- Reference: `root-engine.js`
- Reference: `root-ui.js`
- Reference: `app.js`

- [ ] **Step 1: Verify the variant sections still have no body text**

Run:

```powershell
Select-String -Path 'docs\superpowers\refactor-prompts.md' -Pattern 'Use this when the target is in calculation or root-finding logic', 'Use this when the target is a UI controller or rendering module', 'Use this when the goal is to improve resilience or performance'
```

Expected: no matches.

- [ ] **Step 2: Add the math, UI, and resilience variants**

Insert this content under the three variant headings:

````md
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
````

- [ ] **Step 3: Verify all three variants and their key phrases exist**

Run:

```powershell
$path = 'docs\superpowers\refactor-prompts.md'
Select-String -Path $path -Pattern '^## Math-Engine Correctness Variant$', '^## UI / Readability Variant$', '^## Resilience / Performance Variant$', 'Treat numerical correctness as a hard constraint', 'Preserve existing ids, event semantics', 'Do not claim a performance improvement unless you can point to the specific code path'
```

Expected: six matches, one for each heading and one for each key phrase.

- [ ] **Step 4: Commit the variant set**

Run:

```powershell
git add -- 'docs/superpowers/refactor-prompts.md'
git commit -m "docs: add targeted refactor prompt variants"
```

Expected: commit succeeds and includes only the prompt-pack file.

---

### Task 4: Add Usage Guidance, Minimal Inputs, and Repo Examples

**Files:**
- Modify: `docs/superpowers/refactor-prompts.md`
- Reference: `docs/superpowers/specs/2026-04-19-codebase-aware-refactor-prompts-design.md`
- Reference: `README.md`
- Reference: `root-engine.js`
- Reference: `root-ui.js`
- Reference: `app.js`

- [ ] **Step 1: Verify the guidance sections still have no useful body text**

Run:

```powershell
Select-String -Path 'docs\superpowers\refactor-prompts.md' -Pattern 'Use the canonical prompt for most refactors in this repo', 'Keep your request lightweight', 'Example: refactor root-engine.js', 'Example: refactor root-ui.js', 'Example: refactor app.js'
```

Expected: no matches.

- [ ] **Step 2: Fill in the usage, minimal-input, and example sections**

Replace the empty sections with this content:

````md
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
````

- [ ] **Step 3: Run the final acceptance check against the spec**

Run:

```powershell
$path = 'docs\superpowers\refactor-prompts.md'
Select-String -Path $path -Pattern '^## When To Use Which Prompt$', '^## Minimal Inputs To Provide$', '^## Canonical Prompt$', '^## Math-Engine Correctness Variant$', '^## UI / Readability Variant$', '^## Resilience / Performance Variant$', '^## Repo-Specific Examples$', 'Do not ask me to paste code by default', 'Target path:', 'scripts/root-engine-audit.js', 'Preserve numerical correctness', 'Use the canonical prompt for most refactors in this repo', 'Example: refactor `root-engine.js`', 'Example: refactor `root-ui.js`', 'Example: refactor `app.js`'
```

Expected: matches for every heading and every required phrase above.

- [ ] **Step 4: Read the final file end-to-end and fix any awkward wording**

Run:

```powershell
Get-Content -Path 'docs\superpowers\refactor-prompts.md'
```

Expected: the document reads cleanly from top to bottom, the canonical prompt comes first among the prompts, the targeted variants are shorter than the canonical prompt, and the examples use real repo paths.

- [ ] **Step 5: Commit the completed prompt pack**

Run:

```powershell
git add -- 'docs/superpowers/refactor-prompts.md'
git commit -m "docs: add codebase-aware refactor prompt pack"
```

Expected: commit succeeds and includes only the prompt-pack file.

---

## Self-Review

### Spec coverage

- Canonical prompt: covered by Task 2.
- Three targeted variants: covered by Task 3.
- Usage guidance, minimal inputs, and repo-grounded examples: covered by Task 4.
- Path-scoped, codebase-first behavior and no pasted-code dependency: covered by Tasks 2 and 4.
- Repo-specific audit/test guidance: covered by Tasks 2 and 3.

No gaps found against `docs/superpowers/specs/2026-04-19-codebase-aware-refactor-prompts-design.md`.

### Placeholder scan

This plan contains no `TODO`, `TBD`, or "implement later" placeholders. Every content-writing step includes exact Markdown to insert and every verification step includes exact commands.

### Type consistency

The final artifact path is consistently `docs/superpowers/refactor-prompts.md` throughout the plan. The section names are consistent across all tasks and match the scaffold introduced in Task 1.
