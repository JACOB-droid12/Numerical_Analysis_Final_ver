## 1. Expression Parsing — Syntax Torture
| # | Input Expression | What It Tests | Expected Behavior |
|---|---|---|---|
| 1.1 | `""` (empty string) | Empty input handling | Should throw "Expression is empty" |
| 1.2 | `"   "` (whitespace only) | Whitespace-only input | Should throw "Expression is empty" |
| 1.3 | `"+"` | Lone operator | Should throw parse error |
| 1.4 | `"()"` | Empty parentheses | Should throw parse error |
| 1.5 | `"((((((((x))))))))"` | 8 levels of nesting | Should parse correctly as `x` |
| 1.6 | `"2x"` | Implicit multiplication | Should parse as `2 * x` |
| 1.7 | `"x2"` | Implicit multiplication (reversed) | Should parse as `x * 2` — verify it's not `x^2` |
| 1.8 | `"2(3+x)"` | Implicit multiply before paren | Should parse as `2 * (3 + x)` |
| 1.9 | `"(3+x)2"` | Implicit multiply after paren | Should parse as `(3 + x) * 2` |
| 1.10 | `"(3+x)(2-x)"` | Paren-to-paren implicit multiply | Should parse as `(3 + x) * (2 - x)` |
| 1.11 | `"sin(x)cos(x)"` | Function-to-function implicit multiply | Should parse as `sin(x) * cos(x)` |
| 1.12 | `"2sin(x)"` | Number-to-function implicit multiply | Should parse as `2 * sin(x)` |
| 1.13 | `"---x"` | Triple unary negation | Should parse as `-(-(-x))` = `-x` |
| 1.14 | `"x^-2"` | Negative exponent | Should parse as `x^(-2)` |
| 1.15 | `"x^^2"` | Double caret | Should throw parse error |
| 1.16 | `"2+*3"` | Adjacent operators | Should throw parse error |
| 1.17 | `"sin(cos(tan(x)))"` | Triple nested functions | Should parse and evaluate correctly |
| 1.18 | `"x^2^3"` | Right-associative tower: `x^(2^3)` = x^8 | Verify right-associativity: result should be x⁸ not x⁶ |
| 1.19 | `"1/2/3"` | Left-associative division: `(1/2)/3` = 1/6 | Must be `1/6`, not `1/(2/3)` = 3/2 |
| 1.20 | `"1-2-3"` | Left-associative subtraction: `(1-2)-3` = -4 | Must be `-4`, not `1-(2-3)` = 2 |
| 1.21 | `"πx"` | Pi with implicit multiply | Should parse as `π * x` |
| 1.22 | `"ex"` | Ambiguity: `e*x` or identifier `ex`? | Check if parsed as `e * x` or throws |
| 1.23 | `"sin()"` | Function with no arguments | Should throw "sin() expects exactly one argument" |
| 1.24 | `"sin(x, 2)"` | Function with extra arguments | Should throw "sin() expects exactly one argument" |
| 1.25 | `"unknown(x)"` | Unsupported function name | Should throw "Unsupported function: unknown" |
| 1.26 | `"1e999"` | Scientific notation overflow | Should parse — check if it becomes Infinity |
| 1.27 | `"1e-999"` | Scientific notation underflow | Should parse — check if it becomes 0 |
| 1.28 | `".5"` | Leading decimal point | Should parse as 0.5 |
| 1.29 | `"5."` | Trailing decimal point | Should parse as 5.0 |
| 1.30 | `"."` | Bare decimal point | Depends on implementation — should either parse as 0 or throw |

## 2. Arithmetic Precision — Catastrophic Cancellation
| # | Computation | Ground Truth | What to Watch For |
|---|---|---|---|
| 2.1 | `(1 + 1e-15) - 1` | `1e-15` | With k=4 chop: does machine arithmetic lose the `1e-15` entirely? |
| 2.2 | `(10000001 - 10000000)` | `1` | Exact subtraction — should be perfect in rational mode |
| 2.3 | `sqrt(10001) - sqrt(10000)` | `≈ 0.0049998...` | CalcEngine uses floats for sqrt. Check precision loss. |
| 2.4 | `(1/3) * 3 - 1` | `0` exactly | Rational path should give exact 0. Float path: check residual. |
| 2.5 | `(1/7 + 1/7 + 1/7 + 1/7 + 1/7 + 1/7 + 1/7) - 1` | `0` exactly | Seven additions of 1/7 in rational should cancel to 0 |
| 2.6 | `(x^2 - 1)` at x = `1.00000001` | `≈ 2e-8` | Near-root evaluation: massive relative error if done in machine arithmetic |
| 2.7 | `x^10 - 1` at x = `1.0000001` | `≈ 1e-6` | Accumulated multiplication error vs exact rational |
| 2.8 | `1/3 - 0.333333333333333` | `≈ 3.33e-16` | Rational vs decimal comparison — check significant digits |
| 2.9 | `(2^53 + 1) - 2^53` | `1` | Beyond Number.MAX_SAFE_INTEGER — rational should handle, float will give 0 |
| 2.10 | `(1e15 + 1) - 1e15` | `1` | Catastrophic cancellation at scale |
| 2.11 | Compute `x^2 - 2` at x = `99999999999/70710678118` | Near 0 | This rational approximates √2. How close does the engine get? |
| 2.12 | `(x - 1)^6` at x = `1.0001` | `1e-24` | Repeated near-1 multiplication: precision graveyard |
| 2.13 | `exp(ln(x))` at x = `12345.6789` | `12345.6789` | Round-trip through transcendentals: how much drift? |
| 2.14 | `sin(π)` | `0` exactly | `Math.sin(Math.PI)` ≈ 1.22e-16, NOT 0. Does the engine report this? |
| 2.15 | `cos(π/2)` | `0` exactly | `Math.cos(Math.PI/2)` ≈ 6.12e-17. Same trap. |

## 3. Machine Arithmetic — Chop vs Round
| # | Value | k | Mode | Expected Machine Value | What It Tests |
|---|---|---|---|---|---|
| 3.1 | `1/3` | 4 | chop | `0.3333` | Basic chop behavior |
| 3.2 | `1/3` | 4 | round | `0.3333` | Guard digit is 3, no rounding up |
| 3.3 | `2/3` | 4 | chop | `0.6666` | Basic chop |
| 3.4 | `2/3` | 4 | round | `0.6667` | Guard digit is 6 ≥ 5, round up |
| 3.5 | `0.99995` | 4 | round | `1.000` | Rounding cascades to carry into new digit — exponent must shift! |
| 3.6 | `0.99994` | 4 | round | `0.9999` | Guard digit is 4, no carry |
| 3.7 | `9999.5` | 4 | round | `10000` | Cascading carry changes the exponent |
| 3.8 | `0.00099995` | 4 | round | `0.001000` | Carry in small numbers |
| 3.9 | `1/6` | 1 | chop | `0.1` | Minimum k=1 |
| 3.10 | `1/6` | 1 | round | `0.2` | k=1 round: guard digit is 6 ≥ 5 |
| 3.11 | `0` | 4 | chop | `0` | Zero handling |
| 3.12 | `0` | 4 | round | `0` | Zero handling |
| 3.13 | `-1/3` | 4 | chop | `-0.3333` | Negative chop |
| 3.14 | `-2/3` | 4 | round | `-0.6667` | Negative round |
| 3.15 | `1e-100` | 3 | chop | `0.100 × 10^-99` | Very small number normalization |
| 3.16 | `9.999e99` | 3 | round | `0.100 × 10^101` | Very large number with carry |
| 3.17 | `1e308` | 4 | chop | Near max double range | Does it crash? |
| 3.18 | `5e-324` | 4 | chop | Subnormal territory | Does it handle correctly or crash? |
| 3.19 | `1/7` | 7 | chop vs round | chop: `0.1428571`, round: `0.1428571` | Guard digit is 4, same result |
| 3.20 | `1/7` | 6 | chop vs round | chop: `0.142857`, round: `0.142857` | Guard digit is 1, same result |

## 4. Bisection — Bracketing Nightmares
| # | f(x) | Interval [a,b] | Machine | Stopping | What It Tests |
|---|---|---|---|---|---|
| 4.1 | `x^2 - 4` | [0, 3] | k=6, round | ε = 0.0001 | Standard case: root = 2, verify accuracy |
| 4.2 | `x^2 - 4` | [0, 2] | k=6, round | ε = 0.0001 | Root AT endpoint b. Should detect immediately. |
| 4.3 | `x^2 - 4` | [-2, 0] | k=6, round | ε = 0.0001 | Root AT endpoint a. Should detect immediately. |
| 4.4 | `x^2 - 4` | [3, 5] | k=6, round | ε = 0.0001 | **Invalid bracket** (same sign). Should report error gracefully. |
| 4.5 | `x^2 - 4` | [5, 3] | k=6, round | ε = 0.0001 | **Reversed interval** (a > b). Should throw. |
| 4.6 | `x^2 - 4` | [2, 2] | k=6, round | ε = 0.0001 | **Zero-width interval**. Should throw. |
| 4.7 | `x^3 - x` | [-0.5, 0.5] | k=6, round | ε = 0.0001 | Root at x=0. Tests odd function behavior. |
| 4.8 | `x^3 - x` | [-2, 2] | k=6, round | ε = 0.0001 | **Three roots** in interval! Which does it find? |
| 4.9 | `sin(x)` | [3, 4] | k=6, round | ε = 1e-8 | Root at π ≈ 3.14159... High precision demand. |
| 4.10 | `sin(x)` | [0, 6.3] | k=6, round | ε = 0.0001 | **Two roots** (π, 2π). Multiple root warning? |
| 4.11 | `1/x` | [-1, 1] | k=6, round | ε = 0.0001 | **Discontinuity at x=0** but sign change exists. Bisection is deceived! |
| 4.12 | `tan(x)` | [1, 2] | k=6, round | ε = 0.0001 | **Discontinuity** at x=π/2 ≈ 1.57. False sign change. |
| 4.13 | `x^2` | [-1, 1] | k=6, round | ε = 0.0001 | **Double root** at x=0. f doesn't change sign → invalid bracket |
| 4.14 | `x^2 - x` | [0, 1] | k=6, round | ε = 0.0001 | Roots at BOTH endpoints (0 and 1). Which does it report? |
| 4.15 | `x^2 - 2` | [1, 2] | k=3, chop | 5 iterations | √2 with very low precision k=3. How much error accumulates? |
| 4.16 | `x^2 - 2` | [1, 2] | k=3, chop | ε = 1e-12 | **ε smaller than machine capacity at k=3**. Does it hit iteration cap? |
| 4.17 | `x^2 - 2` | [0, 1e10] | k=6, round | ε = 0.0001 | **Enormous interval**. Requires many iterations. |
| 4.18 | `x^2 - 2` | [1.414, 1.415] | k=6, round | ε = 0.0001 | **Microscopic interval** already brackets √2. Fast convergence. |
| 4.19 | `x - 1/3` | [0, 1] | k=4, chop | ε = 0.0001 | Root is irrational-looking in decimal but rational. Exact path test. |
| 4.20 | `x^10 - 1` | [0.9, 1.1] | k=6, round | ε = 1e-8 | High-degree polynomial near root: very flat near x=1. |
| 4.21 | `exp(x) - 2` | [0, 1] | k=6, round | ε = 0.0001 | Transcendental root: ln(2). Not exact-compatible. |
| 4.22 | `x^2 - 2` | [1, 2] | k=6, round | ε = 0, using epsilon | **Zero epsilon**. Should throw "greater than 0". |
| 4.23 | `x^2 - 2` | [1, 2] | k=6, round | ε = -0.001 | **Negative epsilon**. Should throw. |
| 4.24 | `x^2 - 2` | [1, 2] | k=6, round | iterations = 0 | **Zero iterations**. Should throw or handle gracefully. |
| 4.25 | `x^2 - 2` | [1, 2] | k=6, round | iterations = 1000 | **Excessive iterations**. Performance/timeout test. |
| 4.26 | `x^2 - 2` | [1, 2] | k=6, round | ε = 0.0001, relative | **Relative tolerance** mode. Watch for divide-by-near-zero. |
| 4.27 | `x^2 - 2` | [-2, -1] | k=6, round | ε = 0.0001, relative | **Negative bracket with relative tolerance**. Denominator = min(|a|,|b|). |
| 4.28 | `x^2 - 2` | [0, 2] | k=6, round | ε = 0.0001, relative | **Zero in bracket with relative tolerance**. min(|a|,|b|) = 0 → divide by zero! |
| 4.29 | `x` | [-1, 1] | k=6, round | ε = 0.0001 | **Trivial function** f(x) = x. Root exactly at midpoint on first iteration. |
| 4.30 | `x^2 - 2` | [1, 2] | decision basis: machine vs exact | 10 iters | Compare machine vs exact decision basis. Do they ever disagree? |

## 5. Newton-Raphson — Convergence Pathologies
| # | f(x) | f'(x) | x₀ | Stopping | What It Tests |
|---|---|---|---|---|---|
| 5.1 | `x^2 - 4` | `2*x` | 3 | ε = 0.0001 | Standard case. Should converge to 2. |
| 5.2 | `x^2 - 4` | `2*x` | 0 | ε = 0.0001 | **f'(0) = 0!** Derivative-zero trap. Should halt. |
| 5.3 | `x^3 - 2*x + 2` | `3*x^2 - 2` | 0 | ε = 0.0001 | Newton converges, but slowly. Root ≈ -1.769. |
| 5.4 | `x^3 - 2*x + 2` | `3*x^2 - 2` | 1 | ε = 0.0001 | **Classic cycling!** Newton oscillates between 0 and 1 forever. |
| 5.5 | `x^2` | `2*x` | 1 | ε = 0.0001 | **Double root** at 0. Convergence is only linear, not quadratic. Very slow. |
| 5.6 | `x^3` | `3*x^2` | 0.1 | ε = 0.0001 | **Triple root** at 0. Even slower convergence. |
| 5.7 | `x^2 - 4` | `2*x + 1` | 3 | ε = 0.0001 | **WRONG derivative given!** Will it converge to something wrong silently? |
| 5.8 | `x^2 - 4` | `0` | 3 | ε = 0.0001 | **Zero derivative** (constant 0). Should halt immediately. |
| 5.9 | `exp(x)` | `exp(x)` | -100 | ε = 0.0001 | **No real root!** exp(x) > 0 always. What happens? |
| 5.10 | `x^2 + 1` | `2*x` | 1 | ε = 0.0001 | **No real root!** x² + 1 > 0 always. Oscillation? |
| 5.11 | `sin(x)` | `cos(x)` | 3 | ε = 1e-10 | Root at π. High precision. But sin/cos are not exact-compatible. |
| 5.12 | `sin(x)` | `cos(x)` | 1.5708 | ε = 0.0001 | Starting near π/2 where **cos(x) ≈ 0**. Derivative-zero risk! |
| 5.13 | `x^3 - x` | `3*x^2 - 1` | 0.5 | ε = 0.0001 | Three roots: -1, 0, 1. Which does Newton find from x₀=0.5? |
| 5.14 | `x^3 - x` | `3*x^2 - 1` | `1/sqrt(3)` | ε = 0.0001 | Starting at inflection: f'(x₀) = 0! |
| 5.15 | `ln(x)` | `1/x` | 0.5 | ε = 0.0001 | Root at x=1. But ln is only defined for x>0. If Newton steps to x<0? |
| 5.16 | `x^2 - 4` | `2*x` | 1e10 | ε = 0.0001 | **Far-from-root start**. Convergence should still happen but slowly. |
| 5.17 | `x^2 - 4` | `2*x` | 2 | ε = 0.0001 | **Starting AT the root**. Should detect immediately. |
| 5.18 | `x^2 - 4` | `2*x` | 3 | 1 iteration | Verify xNext = 3 - (9-4)/(6) = 3 - 5/6 ≈ 2.1667 exactly |
| 5.19 | `x^2 - 2` | `2*x` | 1 | ε = 1e-12 | High-precision √2 hunt. Verify quadratic convergence rate. |
| 5.20 | `x^2 - 2` | `2*x` | 1 | k=3, chop, ε = 0.0001 | Newton with aggressive chopping. Does low precision break convergence? |

## 6. Secant Method — Denominator Attacks
| # | f(x) | x₀ | x₁ | Stopping | What It Tests |
|---|---|---|---|---|---|
| 6.1 | `x^2 - 4` | 1 | 3 | ε = 0.0001 | Standard case. Root = 2. |
| 6.2 | `x^2 - 4` | 1 | 1 | ε = 0.0001 | **x₀ = x₁!** f(x₀) = f(x₁) → denominator = 0. Should stall. |
| 6.3 | `x^2 - 4` | -3 | 3 | ε = 0.0001 | **f(x₀) = f(x₁)** since both give 5. Denominator = 0! |
| 6.4 | `x^2` | 0.5 | -0.5 | ε = 0.0001 | Double root at 0 + symmetric start → f(x₀) = f(x₁) = 0.25. Stalls. |
| 6.5 | `x^3 - x` | 0.5 | 0.6 | ε = 0.0001 | Three roots. Which does Secant find? |
| 6.6 | `exp(x) - 1` | -1 | 2 | ε = 0.0001 | Root at 0. Asymmetric exponential behavior. |
| 6.7 | `sin(x)` | 3 | 3.5 | ε = 1e-10 | Root at π. High precision with non-exact function. |
| 6.8 | `x^2 + 1` | 0 | 1 | ε = 0.0001 | **No real root.** Does Secant diverge or stall? |
| 6.9 | `1/x - 1` | 0.5 | 2 | ε = 0.0001 | Root at x=1 but f has a pole at x=0. If Secant overshoots to x≤0? |
| 6.10 | `x^10 - 1` | 0.5 | 1.5 | ε = 0.0001 | Very flat near root. Slow superlinear convergence. |
| 6.11 | `x^2 - 4` | 2 | 3 | ε = 0.0001 | **x₀ is the root.** First evaluation gives f(x₀) = 0. How does it handle? |
| 6.12 | `x^2 - 4` | 1e8 | 1e8 + 1 | ε = 0.0001 | **Very far from root** with close starting points. Numerical instability? |
| 6.13 | `x - 1e-15` | 0 | 1 | ε = 1e-16 | Root near machine epsilon. Can Secant resolve it? |
| 6.14 | `x^2 - 4` | 1 | 3 | k=2, chop, ε = 0.0001 | Ultra-low precision k=2. How badly does it degrade? |
| 6.15 | `x^2 - 4` | 1 | 3 | 100 iterations | Force many iterations. Does it converge or stagnate? |

## 7. False Position — One-Sided Starvation
| # | f(x) | Interval [a,b] | Stopping | What It Tests |
|---|---|---|---|---|
| 7.1 | `x^2 - 4` | [0, 3] | ε = 0.0001 | Standard case. Root = 2. |
| 7.2 | `x^5 - 1` | [0, 2] | ε = 0.0001 | **Highly curved.** False position will keep one endpoint fixed for many iterations. |
| 7.3 | `x^10 - 1` | [0, 2] | ε = 0.0001 | **Extreme one-sided convergence.** The `a` endpoint will barely move. |
| 7.4 | `exp(x) - 10` | [0, 5] | ε = 0.0001 | Root ≈ ln(10) ≈ 2.302. Exponential curvature punishes false position. |
| 7.5 | `tan(x) - 1` | [0, 1] | ε = 0.0001 | Root at π/4 ≈ 0.785. Moderate curvature. |
| 7.6 | `x^2 - 4` | [0, 2] | ε = 0.0001 | Root AT endpoint b. |
| 7.7 | `x^2 - 4` | [3, 5] | ε = 0.0001 | **Invalid bracket.** Same sign. |
| 7.8 | `1/x` | [-1, 1] | ε = 0.0001 | **Discontinuity at 0.** False sign change. |
| 7.9 | `x^2 - 4` | [0, 3] | k=3, chop, 50 iterations | Low precision + many iterations. Convergence degradation? |
| 7.10 | `x^3 - x` | [-2, 2] | ε = 0.0001 | Multiple roots. |
| 7.11 | `x^2 - 4` | [0, 3] | ε = 0.0001, machine decision | Machine vs exact decision basis comparison. |
| 7.12 | `x^3 - 0.001` | [0, 1] | ε = 1e-8 | Root = 0.1. Very small f-values near root. Denominator destabilization? |
| 7.13 | `x - 1e-10` | [0, 1] | ε = 1e-12 | Root at 1e-10. False position interpolation quality near zero. |
| 7.14 | `x^2 - 4` | [0, 1e8] | ε = 0.0001 | **Enormous interval.** Linear interpolation quality test. |
| 7.15 | `sin(x)` | [3, 4] | ε = 1e-10, angle mode: rad | Standard trig root finding. |

## 8. Fixed Point — Divergence Traps
| # | g(x) | x₀ | Stopping | What It Tests |
|---|---|---|---|---|
| 8.1 | `(x + 2/x) / 2` | 1 | ε = 0.0001 | Babylonian method for √2. Classic convergent case. |
| 8.2 | `2/x` | 1 | ε = 0.0001 | **2-cycle!** Oscillates between 1 and 2 forever. Never converges. |
| 8.3 | `x^2` | 0.5 | ε = 0.0001 | Converges to fixed point 0. (|g'(0)| = 0 < 1, superlinear) |
| 8.4 | `x^2` | 2 | ε = 0.0001 | **Diverges to infinity!** |g'(2)| = 4 > 1. Hits DIVERGE_LIMIT? |
| 8.5 | `x^2` | 1 | ε = 0.0001 | Fixed point at x=1. But |g'(1)| = 2 > 1. Unstable! First iteration gives 1 → stays. |
| 8.6 | `2*x` | 0.5 | ε = 0.0001 | Diverges linearly. Hits 1e8 quickly. |
| 8.7 | `-x` | 1 | 10 iterations | **Period-2 oscillation**: 1, -1, 1, -1... Error never decreases! |
| 8.8 | `cos(x)` | 1 | ε = 1e-8 | Classic fixed point: cos(x) = x at ≈ 0.7390851. Slow convergence. |
| 8.9 | `exp(x)` | 0 | ε = 0.0001 | **No fixed point!** exp(x) > x for all real x. Diverges. |
| 8.10 | `x + 1` | 0 | 10 iterations | Diverges linearly: 1, 2, 3, 4... Never converges. |
| 8.11 | `sqrt(x)` | 100 | ε = 0.0001 | Converges to fixed point 1. Very slow. |
| 8.12 | `x` | 5 | ε = 0.0001 | **Identity function.** g(x) = x. Error = 0 immediately. Fixed point at any x. |
| 8.13 | `1/x` | 0.5 | ε = 0.0001 | Alternates: 0.5 → 2 → 0.5 → 2. Period-2 cycle. |
| 8.14 | `x^2 - x + 1` | 0.5 | ε = 0.0001 | Fixed points are complex. Diverges or oscillates. |
| 8.15 | `(x + 2/x) / 2` | 0 | ε = 0.0001 | **Division by zero in g(x)!** g(0) = (0 + 2/0)/2. Should crash. |
| 8.16 | `sin(x) + x` | 0 | ε = 0.0001 | g(0.0) = sin(0) + 0 = 0. Fixed point found immediately. |
| 8.17 | `x^3` | 0.9 | ε = 0.0001 | Converges slowly to 0. |g'(0)| = 0, but |g'(0.9)| ≈ 2.43. Initially divergent then converges? |
| 8.18 | `(x + 3/x) / 2` | 1 | ε = 1e-10, k=3, chop | √3 via Babylonian with poor machine precision. Accuracy limit test. |
| 8.19 | `x^2` | 1.0000001 | 100 iterations | Barely above fixed point. How many iterations before divergence? |
| 8.20 | `x - sin(x)` | 0.5 | ε = 0.0001 | g'(x) = 1 - cos(x). Near x=0, g'≈0 (superconvergent to 0). |

## 9. Polynomial Engine — Horner vs Direct Warfare
| # | Polynomial | x | k | Mode | What It Tests |
|---|---|---|---|---|---|
| 9.1 | `x^2 - 2` | `1.414` | 4 | chop | Simple evaluation. Both methods should agree. |
| 9.2 | `x^3 - 6*x^2 + 11*x - 6` | `1` | 4 | chop | Exact root at x=1. Both should give 0. |
| 9.3 | `x^3 - 6*x^2 + 11*x - 6` | `1.0001` | 4 | chop | Near-root: catastrophic cancellation. Do Horner and Direct differ? |
| 9.4 | `x^10` | `2` | 3 | chop | `2^10 = 1024`. Direct method: 10 multiplications of error. Horner: fewer. |
| 9.5 | `x^10 - 1` | `1.0001` | 4 | chop | Near-root of high-degree poly. Cancellation test. |
| 9.6 | `x^4 - 4*x^3 + 6*x^2 - 4*x + 1` | `1.0001` | 4 | chop | This is `(x-1)^4`. Near root with cancellation. |
| 9.7 | `1000000*x^2 - 1000001*x + 1` | `0.000001` | 4 | chop | Huge coefficients + small x. Balancing act. |
| 9.8 | `x^120` | `1.001` | 4 | chop | **Maximum degree** poly. Accumulated error? |
| 9.9 | `x^121` | `2` | 4 | chop | **Exceeds MAX_POLY_DEGREE = 120.** Should throw. |
| 9.10 | `x/x` | `5` | 4 | chop | Division by expression containing x. Should throw. |
| 9.11 | `0` | `999` | 4 | chop | Zero polynomial. Both methods should return 0. |
| 9.12 | `42` | `999` | 4 | chop | Constant polynomial. Both methods return 42. |
| 9.13 | `x` | `0` | 4 | chop | Linear polynomial at zero. Trivial but verify. |
| 9.14 | `x^2 + x + 1` | `0` | 4 | chop | Evaluate at zero: should be 1. |
| 9.15 | `x^10 + x^9 + x^8 + x^7 + x^6 + x^5 + x^4 + x^3 + x^2 + x + 1` | `0.9999` | 3 | chop | Geometric series near x=1. Sum ≈ 10. Many cancellations in direct. |
| 9.16 | `x^2 - 2*x + 1` | `0.99999` | 4 | chop | `(x-1)^2` near root. Machine precision limit. |
| 9.17 | `x^3 + 0*x^2 + 0*x + 0` | `2` | 4 | chop | Polynomial with zero coefficients. Parsing of `0*x^2`. |
| 9.18 | `-x^3 + x` | `0.5` | 4 | chop | Negative leading coefficient. Sign handling. |
| 9.19 | `(x+1)^10` | `0.001` | 4 | chop | Expanded polynomial with binomial coefficients. |
| 9.20 | `x^2` | `1/3` | 4 | chop | Rational input for x. Exact vs approximate comparison. |

## 10. IEEE-754 — Bit-Level Precision
| # | Input | Direction | Expected Output / What to Verify |
|---|---|---|---|
| 10.1 | `0` | Decimal → IEEE | All zeros: `0 00000000000 0000...0`  |
| 10.2 | `-0` | Decimal → IEEE | Sign bit = 1, rest zeros: `1 00000000000 0000...0` |
| 10.3 | `1` | Decimal → IEEE | `0 01111111111 0000...0` (biased exp = 1023) |
| 10.4 | `-1` | Decimal → IEEE | `1 01111111111 0000...0` |
| 10.5 | `0.1` | Decimal → IEEE | Non-terminating binary. Verify 64-bit output matches `3FB999999999999A` |
| 10.6 | `Infinity` | Decimal → IEEE | `0 11111111111 0000...0` |
| 10.7 | `-Infinity` | Decimal → IEEE | `1 11111111111 0000...0` |
| 10.8 | `NaN` | Decimal → IEEE | Exponent all 1s, mantissa non-zero |
| 10.9 | `2.2250738585072014e-308` | Decimal → IEEE | **Smallest normal double.** Biased exp = 1. |
| 10.10 | `5e-324` | Decimal → IEEE | **Smallest subnormal.** Biased exp = 0, mantissa = 000...1 |
| 10.11 | `1.7976931348623157e+308` | Decimal → IEEE | **Largest finite double.** |
| 10.12 | `1.7976931348623158e+308` | Decimal → IEEE | **Just above max.** Should be Infinity! |
| 10.13 | `0 01111111111 0000...0` (64 bits) | IEEE → Decimal | Should give exactly 1.0 |
| 10.14 | `0 00000000000 0000...0` (64 bits) | IEEE → Decimal | Should give exactly 0 |
| 10.15 | `0 10000000000 1001001000011111101101010100010001000010111...` | IEEE → Decimal | Should give π ≈ 3.14159... |
| 10.16 | A string of 63 bits | IEEE → Decimal | **Wrong length!** Should throw. |
| 10.17 | A string of 65 bits | IEEE → Decimal | **Wrong length!** Should throw. |
| 10.18 | `"abc"` | IEEE → Decimal | Non-binary input. Should throw or produce error. |
| 10.19 | `2.2204460492503131e-16` | Decimal → IEEE | **Machine epsilon** (2⁻⁵²). |
| 10.20 | Round-trip: `42.5` → IEEE → Decimal | Both | Should return exactly `42.5` (exact in binary). |
| 10.21 | Round-trip: `0.1` → IEEE → Decimal | Both | Will NOT return exactly `0.1` — verify the actual stored value. |
| 10.22 | Round-trip: `-17.75` → IEEE → Decimal | Both | Exact in binary. Should round-trip perfectly. |

## 11. Trigonometric & Transcendental Gauntlet
| # | Expression | Angle Mode | Expected | What It Tests |
|---|---|---|---|---|
| 11.1 | `sin(0)` | rad | `0` exactly | Zero input |
| 11.2 | `sin(pi)` | rad | Should be 0 but `Math.sin(Math.PI) ≈ 1.22e-16` | **The big lie.** Does the engine report this as 0 or the true machine value? |
| 11.3 | `cos(0)` | rad | `1` exactly | Basic case |
| 11.4 | `cos(pi)` | rad | `-1` exactly | `Math.cos(Math.PI)` = -1 exactly in JS |
| 11.5 | `tan(pi/2)` | rad | **Undefined!** | `Math.cos(Math.PI/2) ≈ 6.12e-17`, not exactly 0. Does tan throw or return huge number? |
| 11.6 | `sin(90)` | deg | `1` | Angle mode: degrees. Verify conversion works. |
| 11.7 | `sin(90)` | rad | `sin(90 radians)` ≈ 0.894 | Same input, different mode. Must give different answer! |
| 11.8 | `cos(360)` | deg | `1` | Full revolution in degrees. |
| 11.9 | `tan(45)` | deg | `1` | Classic 45-degree tangent. |
| 11.10 | `sin(1e10)` | rad | Some value | **Argument reduction error.** For huge angles, sin/cos lose all precision. |
| 11.11 | `ln(0)` | — | **Undefined!** | Should throw "must be greater than 0" |
| 11.12 | `ln(-1)` | — | **Undefined (real)!** | Should throw error. Complex ln not supported. |
| 11.13 | `ln(1)` | — | `0` exactly | `Math.log(1) = 0` |
| 11.14 | `exp(0)` | — | `1` exactly | `Math.exp(0) = 1` |
| 11.15 | `exp(710)` | — | **Overflow → Infinity** | `Math.exp(710)` = Infinity. Does the engine handle it? |
| 11.16 | `exp(-750)` | — | **Underflow → 0** | Below subnormal range. |
| 11.17 | `exp(ln(1))` | — | `1` | Composition: should be identity. |
| 11.18 | `sin(x)^2 + cos(x)^2` at x = `1.23456` | rad | `1` by Pythagorean identity | Machine arithmetic **will not** give exactly 1. How close? |
| 11.19 | `sqrt(-1)` | — | **`i`** (complex!) | CalcEngine supports complex sqrt. Verify correct complex result. |
| 11.20 | `sqrt(0)` | — | `0` | Zero input to sqrt. |
| 11.21 | `ln(exp(100))` | — | `100` | Round-trip at large scale. |
| 11.22 | `tan(89.9999999)` | deg | Very large number | Near-singularity tangent. |

## 12. Cross-Module Integration — The Final Boss
| # | Test Scenario | What It Tests |
|---|---|---|
| 12.1 | **Bisection on polynomial** `x^3 - 6*x^2 + 11*x - 6` over [0.5, 1.5], k=4, chop, ε=0.001. Then evaluate the same polynomial via PolyEngine at the returned root approximation. | Does the bisection root match the polynomial evaluation? Does Horner vs Direct give same residual at bisection's answer? |
| 12.2 | **Newton on transcendental** `sin(x) - 0.5`, f'(x) = `cos(x)`, x₀ = 0.5, rad mode, k=6, round, ε=1e-8. Evaluate `sin(result) - 0.5` at the final approximation. | Root should be π/6 ≈ 0.5236. Is the residual close to zero? |
| 12.3 | **Machine arithmetic → Root finding** `x^2 - 2` bisection, [1, 2], k=3, chop, ε=0.001. Then take the root approximation and run it through `machineApprox(result, 3, "chop")`. | Does the result survive re-approximation? Does machine arithmetic introduce additional error? |
| 12.4 | **Expression parsing → Evaluation → Comparison** Parse `x^2 - 1`, evaluate stepwise at x=1.0001 with k=4, chop. Compare step-by-step accumulation vs final approximation. | Do the step and final approaches give different machine values? Quantify the round-off error accumulation. |
| 12.5 | **Polynomial → IEEE-754** Evaluate `x^10 - 1024` at x=2 (should be 0), convert exact result to IEEE-754. Then evaluate at x=1.9999 (≈ -0.01) and convert that to IEEE-754. | Verify correct 64-bit representation of zero and near-zero results. |
| 12.6 | **Fixed Point → Exact arithmetic path** `g(x) = (x + 2/x)/2` with x₀ = `1/1` (rational input), k=8, round, ε=1e-10. | Does the engine use exact rational path or float path for this? If rational, verify arbitrary precision convergence to √2. |
| 12.7 | **Angle mode propagation** Bisection on `sin(x) - 0.5`, [0, 2], one run in rad mode, one with same interval in deg mode. | **Completely different roots!** rad: x ≈ 0.5236 (π/6). deg: x ≈ near 0 since sin(0°) = 0, sin(2°) ≈ 0.035 < 0.5, so **no root in [0,2] degrees**. Does it handle this? |
| 12.8 | **Error accumulation across methods** Find root of `x^3 - 2` using ALL five methods (bisection, Newton, Secant, False Position, Fixed Point) with same tolerance. Compare final approximations. | All methods should converge to ∛2 ≈ 1.2599. But do they give the SAME answer to l decimal places? |
| 12.9 | **Huge rational in root finding** Bisection on `x - 1/99999999999999999`, [0, 1], k=6, round, ε=1e-18. | Rational root with huge denominator. Does the engine handle BigInt arithmetic correctly? |
| 12.10 | **Sign disagreement cascade** Bisection on `x^3 - 0.001*x`, [-0.1, 0.1], k=3, chop, exact vs machine decision basis. | Machine and exact signs may disagree at boundary. Does the warning system fire? Which basis gives better answer? |
| 12.11 | **Relative tolerance + near-zero bracket** Bisection on `x^3`, [-1, 1], relative tolerance ε=0.01. Midpoint converges to 0 but relative bound involves `min(|a|,|b|)` → 0 → division by zero! | Does the relative tolerance mode crash when the bracket shrinks to contain 0? |
| 12.12 | **Polynomial Horner vs Direct + Machine Arithmetic** Evaluate `x^5 - 5*x^4 + 10*x^3 - 10*x^2 + 5*x - 1` at x=0.9999 with k=3, chop. This is `(x-1)^5`. | Compare Horner vs Direct. At k=3, catastrophic cancellation should make them dramatically disagree. Which is closer to exact? (Horner should win.) |
| 12.13 | **Secant + tiny machine k** Secant on `x^2 - 2`, x₀=1, x₁=2, k=2, chop, ε=0.01. | k=2 means only 2 significant digits. Can Secant converge at all? Or does it stagnate due to insufficient precision? |
| 12.14 | **Newton with wrong angle mode** Newton on `sin(x)`, f'(x) = `cos(x)`, x₀=3, claiming angle mode is "deg" instead of "rad". | sin(3°) ≈ 0.052, not sin(3 rad) ≈ 0.141. Newton will converge to a completely different root. The answer will be mathematically correct for degrees but the user might expect radians. Does the system warn? |
| 12.15 | **Stress: Run bisection with 1000 iterations on a fast function** `x` over [-1, 1], 1000 iterations. | Pure performance stress. 1000 midpoint computations with rational or machine arithmetic. Does it complete in reasonable time? |
