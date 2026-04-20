# Calculator Site Content Pack Design

Date: 2026-04-20

## Summary

Create a standalone content pack for a future companion website that explains the Numerical Analysis Teaching Lab without modifying the existing calculator. This pass produces structured, reusable content only. It does not introduce UI, styling, layout direction, components, page templates, or any other design elements. The output is intended as a clean handoff for a separate UI/UX-focused coding model that will build the visual website later.

## Goals

- Keep all new work in a separate folder that does not touch the main calculator code.
- Produce a full content pack for a future website about the calculator.
- Use structured files that a later UI/UX agent can consume in any frontend stack.
- Cover both high-level positioning and detailed educational material.
- Keep the tone hybrid: clear and instructional, but still presentable and modern.
- Make the content easy to edit without changing application logic.

## Non-Goals

- No edits to the existing calculator files such as `index.html`, `app.js`, `styles.css`, or the calculation engines.
- No server, API, CMS, or backend runtime.
- No UI implementation, component scaffolding, wireframes, or mockups.
- No visual direction, design tokens, color choices, typography choices, layout advice, or interaction design.
- No attempt to merge the content pack into the current calculator experience.

## Constraints

- The content pack must live in its own top-level folder.
- The folder must be self-contained and understandable on its own.
- The pack must be useful as source material for another AI model, not just for human reading.
- The structure must be predictable enough that another model can map it to routes and sections without guessing.
- The content must describe the calculator as it exists, without inventing unsupported features.

## Recommended Folder Structure

Create a new folder at the repo root:

- `calculator-site-content/README.md`
- `calculator-site-content/content/site.json`
- `calculator-site-content/content/modules.json`
- `calculator-site-content/content/faqs.json`
- `calculator-site-content/content/glossary.json`
- `calculator-site-content/content/workflows.json`
- `calculator-site-content/content/use-cases.json`

This structure keeps the handoff simple:

- one README that explains purpose and usage
- one site-level file for shared framing and positioning
- one file per major content domain

## Content Strategy

The package should support a future site that answers three kinds of questions:

1. What is this calculator?
2. What can it help someone learn or do?
3. How would a student, instructor, or self-learner actually use it?

To support that, the content should include both concise marketing-style summaries and richer educational explanations. The copy should be informative first, polished second. It should avoid sales-heavy exaggeration while still giving the future UI/UX model enough strong material to design around.

## Content Model

### `site.json`

Purpose: site-wide framing and reusable top-level copy.

Recommended fields:

- `projectName`
- `tagline`
- `shortDescription`
- `longDescription`
- `audience`
- `valueProposition`
- `tone`
- `highlights`
- `pageIntent`

This file is the canonical source for the overall identity of the future site.

### `modules.json`

Purpose: detailed explanations for each major calculator area.

Represent the calculator as a collection of modules, each with predictable fields.

Recommended fields per module:

- `id`
- `label`
- `title`
- `summary`
- `whatItDoes`
- `whyItMatters`
- `inputs`
- `outputs`
- `keyConcepts`
- `learnerOutcomes`
- `commonUseCases`
- `limitations`
- `notes`

Expected module coverage:

- machine arithmetic / calculator-style finite precision
- error analysis
- polynomial evaluation
- one-variable root approximation and root-finding methods

If the existing calculator groups related functionality differently, the content should reflect the actual product structure rather than force new categories.

### `faqs.json`

Purpose: support practical questions a visitor may ask before using the calculator.

Recommended fields per FAQ item:

- `id`
- `question`
- `answer`
- `category`

Suggested categories:

- getting started
- learning goals
- numerical methods
- accuracy and limitations
- classroom usage

### `glossary.json`

Purpose: support educational comprehension without requiring the UI/UX model to invent terminology support later.

Recommended fields per glossary term:

- `id`
- `term`
- `definition`
- `plainLanguage`
- `relatedTerms`

Suggested term coverage includes ideas such as:

- machine number
- chopping
- rounding
- relative error
- absolute error
- polynomial evaluation
- root approximation
- convergence
- stopping criterion

### `workflows.json`

Purpose: provide stepwise narratives that can later become “How it works” or “Typical flow” sections.

Recommended fields per workflow:

- `id`
- `title`
- `summary`
- `audience`
- `steps`

Recommended fields per step:

- `title`
- `description`
- `outcome`

Suggested workflows:

- checking a machine arithmetic expression
- comparing exact versus machine results
- evaluating a polynomial at a chosen value
- approximating a root with a selected method

### `use-cases.json`

Purpose: make the content immediately useful for future page sections aimed at different visitors.

Recommended fields per use case:

- `id`
- `audience`
- `title`
- `summary`
- `benefits`
- `situations`

Suggested audiences:

- students
- instructors
- self-learners

## Handoff Rules For The Future UI/UX Build

The content pack must explicitly document the following:

- it is a content-only package
- it is not part of the main calculator runtime
- it should not require edits to calculator logic files
- it intentionally contains no design system guidance
- the future UI/UX model is expected to decide layout, styling, motion, components, and visual hierarchy independently

This rule is important enough to repeat in both the spec and the package README. The later model should treat the content as source material, not as a visual prescription.

## No-Design Guardrails

The implementation must avoid embedding design decisions into the content files or README.

Do not include:

- suggested color palettes
- typography guidance
- page layout instructions
- component recommendations
- section order justified by visual hierarchy
- animation or interaction suggestions
- mock markup or sample HTML structure

Allowed guidance is limited to semantic intent, such as which file is canonical for module descriptions or which dataset is meant for glossary terms.

## Writing Direction

The copy should read as:

- academically credible
- accessible to non-experts
- clear enough for students
- respectable enough for instructors
- polished enough for a public-facing informational site

The tone should not become overly promotional, casual, or decorative. The content should describe what the calculator helps users explore, compare, and understand.

## Validation Rules

Even without a server, the content pack should follow simple structure discipline:

- every array item gets a stable `id`
- repeated object shapes stay consistent within a file
- headings and labels should avoid overlap where one field can serve as the canonical title
- module descriptions should not contradict existing calculator capabilities
- glossary definitions should stay concise and non-circular
- workflows should describe realistic use, not invented screens or features

## Documentation Requirements

`calculator-site-content/README.md` should explain:

- the purpose of the folder
- that it is separate from the calculator application
- the purpose of each content file
- that the package contains no design guidance
- that a later UI/UX model is expected to build the visual experience from these files

The README should help another model understand how to consume the content without dictating how to present it.

## Testing And Review

This content-oriented pass should be reviewed against the following checks:

- the new folder is fully separate from calculator code
- no existing calculator files are modified
- each content file has a clear purpose
- the package covers core overview, detailed modules, FAQs, glossary, workflows, and use cases
- the copy stays aligned with the actual calculator
- no design instructions slip into the handoff material

## Implementation Outline

When implementation begins, it should proceed in this order:

1. create the standalone `calculator-site-content/` folder
2. add the README with handoff rules
3. draft `site.json`
4. draft detailed `modules.json`
5. draft `faqs.json`, `glossary.json`, `workflows.json`, and `use-cases.json`
6. run a consistency pass to remove contradictions, filler, and accidental design language

## Success Criteria

This work is successful when:

- a future UI/UX agent can build a website from the new folder without needing calculator code changes
- the package stands alone as a clear content source
- the materials are rich enough to support a polished informational website
- the package remains intentionally silent on design decisions
