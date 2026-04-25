# Simple Bisection Sign Mode Design

## Context

The current root solver explains exact signs and machine signs, but the panel still feels too advanced for the main classroom workflow. The professor's example appears to follow the standard textbook bisection method: enter a function, choose an interval, check the sign change, compute midpoints, update the interval, and stop by tolerance or iteration count.

The interface should therefore make the normal path feel one-click and textbook-first. Finite-precision sign controls should remain available only for cases where the instructor explicitly asks for chopped or rounded sign decisions.

## Goal

Simplify the root solver so most users do not need to touch exact-versus-machine sign settings.

The default experience should:

- Use the usual textbook sign-change rule automatically.
- Show the bisection table without asking the user to choose sign behavior first.
- Still show enough sign information to satisfy the requirement about identifying signs of function values.
- Preserve the existing advanced exact/machine sign controls behind a clearly optional advanced disclosure.

## Proposed UI

Replace the current open-feeling sign guidance panel with a compact default note and a collapsed advanced panel.

Main note:

> Textbook default: the next interval is chosen using the usual sign-change rule. The table shows the function signs so you can check each bisection step.

Advanced panel title:

> Finite-precision sign options (advanced)

Advanced explanation:

> Only change these if your professor asks bisection decisions to follow chopped or rounded signs. Otherwise, keep the textbook default.

Advanced controls:

- `Signs shown in the table`
- `Signs used to choose the next interval`

Default values remain:

- `root-sign-display = both`
- `root-decision-basis = exact`

## Behavior

No root-engine behavior changes are required. The feature should keep the existing dropdown IDs and option values so the current JavaScript event handlers and audit coverage remain valid.

The implementation should make the advanced panel collapsed by default and remove the long exact-versus-machine explanation from the default visible area. The simplified visible copy should avoid the phrase "machine signs" unless the user opens the advanced panel.

## Testing

Run:

- `node scripts\engine-correctness-audit.js`
- `node scripts\root-engine-audit.js`

Also source-check that the main visible panel copy uses "Textbook default" and that the advanced title uses "Finite-precision sign options (advanced)".

## Self-Review

- No placeholders remain.
- The normal bisection workflow is prioritized.
- Advanced finite-precision sign controls are preserved for project requirements.
- The scope is limited to copy, markup hierarchy, and small CSS spacing changes.
