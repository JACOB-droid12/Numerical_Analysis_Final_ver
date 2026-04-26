from __future__ import annotations

"""Generate checked-in high-precision root-method fixtures.

Install dependencies with:
    pip install -r scripts/requirements-golden.txt

Regenerate fixtures with:
    npm run generate:golden
"""

import json
from pathlib import Path
from typing import Callable, TypedDict

import mpmath as mp

mp.mp.dps = 80

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "lib" / "methods" / "golden" / "root-method-cases.json"


class Case(TypedDict, total=False):
    name: str
    method: str
    expression: str
    derivativeExpression: str
    derivativeMode: str
    lower: float
    upper: float
    x0: float
    x1: float
    tolerance: float
    functionTolerance: float
    maxIterations: int
    angleMode: str
    residualExpression: str
    expectedRoot: str
    expectedResidual: str


def as_decimal(value: mp.mpf, digits: int = 50) -> str:
    return mp.nstr(value, digits, strip_zeros=False)


def bisection_root(fn: Callable[[mp.mpf], mp.mpf], lower: mp.mpf, upper: mp.mpf) -> mp.mpf:
    left = mp.mpf(lower)
    right = mp.mpf(upper)
    f_left = fn(left)
    f_right = fn(right)
    if f_left == 0:
        return left
    if f_right == 0:
        return right
    if mp.sign(f_left) == mp.sign(f_right):
        raise ValueError("Bisection fixture requires a sign-changing bracket.")

    for _ in range(400):
        midpoint = (left + right) / 2
        f_midpoint = fn(midpoint)
        if f_midpoint == 0 or abs(right - left) < mp.mpf("1e-70"):
            return midpoint
        if mp.sign(f_left) == mp.sign(f_midpoint):
            left = midpoint
            f_left = f_midpoint
        else:
            right = midpoint
            f_right = f_midpoint

    return (left + right) / 2


def make_case(
    *,
    name: str,
    method: str,
    expression: str,
    fn: Callable[[mp.mpf], mp.mpf],
    root: mp.mpf,
    residual_expression: str | None = None,
    derivative_expression: str | None = None,
    derivative_mode: str | None = None,
    lower: float | None = None,
    upper: float | None = None,
    x0: float | None = None,
    x1: float | None = None,
    tolerance: float = 1e-10,
    function_tolerance: float | None = None,
    max_iterations: int = 100,
    angle_mode: str = "rad",
) -> Case:
    case: Case = {
        "name": name,
        "method": method,
        "expression": expression,
        "tolerance": tolerance,
        "maxIterations": max_iterations,
        "angleMode": angle_mode,
        "expectedRoot": as_decimal(root),
        "expectedResidual": as_decimal(abs(fn(root))),
    }
    if derivative_expression is not None:
        case["derivativeExpression"] = derivative_expression
    if derivative_mode is not None:
        case["derivativeMode"] = derivative_mode
    if residual_expression is not None:
        case["residualExpression"] = residual_expression
    if lower is not None:
        case["lower"] = lower
    if upper is not None:
        case["upper"] = upper
    if x0 is not None:
        case["x0"] = x0
    if x1 is not None:
        case["x1"] = x1
    if function_tolerance is not None:
        case["functionTolerance"] = function_tolerance
    return case


def main() -> None:
    plastic_fn = lambda x: x**3 - x - 1
    quadratic_fn = lambda x: x**2 - 4
    cosine_fn = lambda x: mp.cos(x) - x
    golden_ratio_fn = lambda x: x**2 - x - 1
    exp_minus_x_fn = lambda x: mp.e**(-x) - x
    trig_half_fn = lambda x: mp.sin(x) - x / 2
    log_minus_one_fn = lambda x: mp.log(x) - 1
    large_scale_fn = lambda x: x**2 - mp.mpf("1000000")
    small_scale_fn = lambda x: x - mp.mpf("0.000001")
    flat_cubic_fn = lambda x: (x - 1) ** 3
    degree_cos_fn = lambda x: mp.cos(mp.pi * x / 180)
    tan_minus_x_fn = lambda x: mp.tan(x) - x
    sin_minus_half_fn = lambda x: mp.sin(x) - mp.mpf("0.5")
    cos_minus_quarter_fn = lambda x: mp.cos(x) - mp.mpf("0.25")
    exp_minus_three_fn = lambda x: mp.e**x - 3
    log_minus_two_fn = lambda x: mp.log(x) - 2
    x_log_x_minus_one_fn = lambda x: x * mp.log(x) - 1
    quintic_fn = lambda x: x**5 - x - 1
    quartic_root_one_fn = lambda x: x**4 - 10 * x**2 + 9
    quartic_root_three_fn = quartic_root_one_fn
    cubic_at_two_fn = lambda x: (x - 2) ** 3
    tiny_square_fn = lambda x: x**2 - mp.mpf("1e-12")
    huge_square_fn = lambda x: x**2 - mp.mpf("1e12")
    scaled_linear_fn = lambda x: mp.mpf("1e6") * x - 1
    heron_sqrt_two_residual_fn = lambda x: x**2 - 2

    plastic_root = bisection_root(plastic_fn, mp.mpf(1), mp.mpf(2))
    quadratic_root = mp.mpf(2)
    cosine_root = mp.findroot(cosine_fn, (mp.mpf(0), mp.mpf(1)))
    golden_ratio_root = (1 + mp.sqrt(5)) / 2
    exp_minus_x_root = mp.findroot(exp_minus_x_fn, (mp.mpf(0), mp.mpf(1)))
    trig_half_root = bisection_root(trig_half_fn, mp.mpf(1), mp.mpf(3))
    log_minus_one_root = mp.e
    large_scale_root = mp.mpf(1000)
    small_scale_root = mp.mpf("0.000001")
    flat_cubic_root = mp.mpf(1)
    degree_cos_root = mp.mpf(90)
    tan_minus_x_root = bisection_root(tan_minus_x_fn, mp.mpf("4.4"), mp.mpf("4.6"))
    sin_minus_half_root = mp.pi / 6
    cos_minus_quarter_root = mp.acos(mp.mpf("0.25"))
    exp_minus_three_root = mp.log(3)
    log_minus_two_root = mp.e**2
    x_log_x_minus_one_root = mp.e ** mp.lambertw(1)
    quintic_root = bisection_root(quintic_fn, mp.mpf(1), mp.mpf(2))
    quartic_root_one = mp.mpf(1)
    quartic_root_three = mp.mpf(3)
    cubic_at_two_root = mp.mpf(2)
    tiny_square_root = mp.mpf("0.000001")
    huge_square_root = mp.mpf("1000000")
    scaled_linear_root = mp.mpf("0.000001")
    heron_sqrt_two_root = mp.sqrt(2)

    cases: list[Case] = [
        make_case(
            name="plastic-constant-bisection",
            method="bisection",
            expression="x^3 - x - 1",
            fn=plastic_fn,
            root=plastic_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="quadratic-bisection",
            method="bisection",
            expression="x^2 - 4",
            fn=quadratic_fn,
            root=quadratic_root,
            lower=0,
            upper=3,
        ),
        make_case(
            name="cosine-minus-x-bisection",
            method="bisection",
            expression="cos(x) - x",
            fn=cosine_fn,
            root=cosine_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="exp-minus-x-bisection",
            method="bisection",
            expression="exp(-x) - x",
            fn=exp_minus_x_fn,
            root=exp_minus_x_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="sin-minus-half-x-bisection",
            method="bisection",
            expression="sin(x) - x / 2",
            fn=trig_half_fn,
            root=trig_half_root,
            lower=1,
            upper=3,
        ),
        make_case(
            name="log-minus-one-bisection",
            method="bisection",
            expression="ln(x) - 1",
            fn=log_minus_one_fn,
            root=log_minus_one_root,
            lower=2,
            upper=4,
        ),
        make_case(
            name="degree-cosine-bisection",
            method="bisection",
            expression="cos(x)",
            fn=degree_cos_fn,
            root=degree_cos_root,
            lower=0,
            upper=180,
            angle_mode="deg",
        ),
        make_case(
            name="large-scale-bisection",
            method="bisection",
            expression="x^2 - 1000000",
            fn=large_scale_fn,
            root=large_scale_root,
            lower=0,
            upper=2000,
            tolerance=1e-7,
            max_iterations=120,
        ),
        make_case(
            name="small-scale-bisection",
            method="bisection",
            expression="x - 0.000001",
            fn=small_scale_fn,
            root=small_scale_root,
            lower=0,
            upper=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="flat-cubic-bisection",
            method="bisection",
            expression="(x - 1)^3",
            fn=flat_cubic_fn,
            root=flat_cubic_root,
            lower=0,
            upper=2,
        ),
        make_case(
            name="tan-minus-x-bisection",
            method="bisection",
            expression="tan(x) - x",
            fn=tan_minus_x_fn,
            root=tan_minus_x_root,
            lower=4.4,
            upper=4.6,
            tolerance=1e-9,
            max_iterations=120,
        ),
        make_case(
            name="sin-minus-half-bisection",
            method="bisection",
            expression="sin(x) - 0.5",
            fn=sin_minus_half_fn,
            root=sin_minus_half_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="cos-minus-quarter-bisection",
            method="bisection",
            expression="cos(x) - 0.25",
            fn=cos_minus_quarter_fn,
            root=cos_minus_quarter_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="exp-minus-three-bisection",
            method="bisection",
            expression="exp(x) - 3",
            fn=exp_minus_three_fn,
            root=exp_minus_three_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="log-minus-two-bisection",
            method="bisection",
            expression="ln(x) - 2",
            fn=log_minus_two_fn,
            root=log_minus_two_root,
            lower=7,
            upper=8,
        ),
        make_case(
            name="x-log-x-minus-one-bisection",
            method="bisection",
            expression="x * ln(x) - 1",
            fn=x_log_x_minus_one_fn,
            root=x_log_x_minus_one_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="quintic-bisection",
            method="bisection",
            expression="x^5 - x - 1",
            fn=quintic_fn,
            root=quintic_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="quartic-root-one-bisection",
            method="bisection",
            expression="x^4 - 10*x^2 + 9",
            fn=quartic_root_one_fn,
            root=quartic_root_one,
            lower=0,
            upper=2,
        ),
        make_case(
            name="quartic-root-three-bisection",
            method="bisection",
            expression="x^4 - 10*x^2 + 9",
            fn=quartic_root_three_fn,
            root=quartic_root_three,
            lower=2,
            upper=4,
        ),
        make_case(
            name="cubic-at-two-bisection",
            method="bisection",
            expression="(x - 2)^3",
            fn=cubic_at_two_fn,
            root=cubic_at_two_root,
            lower=1,
            upper=3,
        ),
        make_case(
            name="tiny-square-bisection",
            method="bisection",
            expression="x^2 - 1e-12",
            fn=tiny_square_fn,
            root=tiny_square_root,
            lower=0,
            upper=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="huge-square-bisection",
            method="bisection",
            expression="x^2 - 1e12",
            fn=huge_square_fn,
            root=huge_square_root,
            lower=0,
            upper=2000000,
            tolerance=1e-5,
            max_iterations=120,
        ),
        make_case(
            name="scaled-linear-bisection",
            method="bisection",
            expression="1e6*x - 1",
            fn=scaled_linear_fn,
            root=scaled_linear_root,
            lower=0,
            upper=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="plastic-constant-false-position",
            method="false-position",
            expression="x^3 - x - 1",
            fn=plastic_fn,
            root=plastic_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="quadratic-false-position",
            method="false-position",
            expression="x^2 - 4",
            fn=quadratic_fn,
            root=quadratic_root,
            lower=0,
            upper=3,
            max_iterations=120,
        ),
        make_case(
            name="cosine-minus-x-false-position",
            method="false-position",
            expression="cos(x) - x",
            fn=cosine_fn,
            root=cosine_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="exp-minus-x-false-position",
            method="false-position",
            expression="exp(-x) - x",
            fn=exp_minus_x_fn,
            root=exp_minus_x_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="sin-minus-half-x-false-position",
            method="false-position",
            expression="sin(x) - x / 2",
            fn=trig_half_fn,
            root=trig_half_root,
            lower=1,
            upper=3,
        ),
        make_case(
            name="log-minus-one-false-position",
            method="false-position",
            expression="ln(x) - 1",
            fn=log_minus_one_fn,
            root=log_minus_one_root,
            lower=2,
            upper=4,
        ),
        make_case(
            name="degree-cosine-false-position",
            method="false-position",
            expression="cos(x)",
            fn=degree_cos_fn,
            root=degree_cos_root,
            lower=0,
            upper=180,
            angle_mode="deg",
        ),
        make_case(
            name="small-scale-false-position",
            method="false-position",
            expression="x - 0.000001",
            fn=small_scale_fn,
            root=small_scale_root,
            lower=0,
            upper=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="flat-cubic-false-position",
            method="false-position",
            expression="(x - 1)^3",
            fn=flat_cubic_fn,
            root=flat_cubic_root,
            lower=0,
            upper=2,
        ),
        make_case(
            name="sin-minus-half-false-position",
            method="false-position",
            expression="sin(x) - 0.5",
            fn=sin_minus_half_fn,
            root=sin_minus_half_root,
            lower=0,
            upper=1,
        ),
        make_case(
            name="cos-minus-quarter-false-position",
            method="false-position",
            expression="cos(x) - 0.25",
            fn=cos_minus_quarter_fn,
            root=cos_minus_quarter_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="exp-minus-three-false-position",
            method="false-position",
            expression="exp(x) - 3",
            fn=exp_minus_three_fn,
            root=exp_minus_three_root,
            lower=1,
            upper=2,
        ),
        make_case(
            name="log-minus-two-false-position",
            method="false-position",
            expression="ln(x) - 2",
            fn=log_minus_two_fn,
            root=log_minus_two_root,
            lower=7,
            upper=8,
        ),
        make_case(
            name="quartic-root-one-false-position",
            method="false-position",
            expression="x^4 - 10*x^2 + 9",
            fn=quartic_root_one_fn,
            root=quartic_root_one,
            lower=0,
            upper=2,
            max_iterations=120,
        ),
        make_case(
            name="cubic-at-two-false-position",
            method="false-position",
            expression="(x - 2)^3",
            fn=cubic_at_two_fn,
            root=cubic_at_two_root,
            lower=1,
            upper=3,
        ),
        make_case(
            name="scaled-linear-false-position",
            method="false-position",
            expression="1e6*x - 1",
            fn=scaled_linear_fn,
            root=scaled_linear_root,
            lower=0,
            upper=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="plastic-constant-secant",
            method="secant",
            expression="x^3 - x - 1",
            fn=plastic_fn,
            root=plastic_root,
            x0=1,
            x1=2,
        ),
        make_case(
            name="quadratic-secant",
            method="secant",
            expression="x^2 - 4",
            fn=quadratic_fn,
            root=quadratic_root,
            x0=0,
            x1=3,
        ),
        make_case(
            name="cosine-minus-x-secant",
            method="secant",
            expression="cos(x) - x",
            fn=cosine_fn,
            root=cosine_root,
            x0=0,
            x1=1,
        ),
        make_case(
            name="exp-minus-x-secant",
            method="secant",
            expression="exp(-x) - x",
            fn=exp_minus_x_fn,
            root=exp_minus_x_root,
            x0=0,
            x1=1,
        ),
        make_case(
            name="sin-minus-half-x-secant",
            method="secant",
            expression="sin(x) - x / 2",
            fn=trig_half_fn,
            root=trig_half_root,
            x0=1,
            x1=3,
        ),
        make_case(
            name="log-minus-one-secant",
            method="secant",
            expression="ln(x) - 1",
            fn=log_minus_one_fn,
            root=log_minus_one_root,
            x0=2,
            x1=4,
        ),
        make_case(
            name="large-scale-secant",
            method="secant",
            expression="x^2 - 1000000",
            fn=large_scale_fn,
            root=large_scale_root,
            x0=500,
            x1=2000,
            tolerance=1e-7,
        ),
        make_case(
            name="small-scale-secant",
            method="secant",
            expression="x - 0.000001",
            fn=small_scale_fn,
            root=small_scale_root,
            x0=0,
            x1=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="flat-cubic-secant",
            method="secant",
            expression="(x - 1)^3",
            fn=flat_cubic_fn,
            root=flat_cubic_root,
            x0=0,
            x1=2,
        ),
        make_case(
            name="tan-minus-x-secant",
            method="secant",
            expression="tan(x) - x",
            fn=tan_minus_x_fn,
            root=tan_minus_x_root,
            x0=4.4,
            x1=4.6,
            tolerance=1e-9,
        ),
        make_case(
            name="sin-minus-half-secant",
            method="secant",
            expression="sin(x) - 0.5",
            fn=sin_minus_half_fn,
            root=sin_minus_half_root,
            x0=0,
            x1=1,
        ),
        make_case(
            name="cos-minus-quarter-secant",
            method="secant",
            expression="cos(x) - 0.25",
            fn=cos_minus_quarter_fn,
            root=cos_minus_quarter_root,
            x0=1,
            x1=2,
        ),
        make_case(
            name="exp-minus-three-secant",
            method="secant",
            expression="exp(x) - 3",
            fn=exp_minus_three_fn,
            root=exp_minus_three_root,
            x0=1,
            x1=2,
        ),
        make_case(
            name="log-minus-two-secant",
            method="secant",
            expression="ln(x) - 2",
            fn=log_minus_two_fn,
            root=log_minus_two_root,
            x0=7,
            x1=8,
        ),
        make_case(
            name="x-log-x-minus-one-secant",
            method="secant",
            expression="x * ln(x) - 1",
            fn=x_log_x_minus_one_fn,
            root=x_log_x_minus_one_root,
            x0=1,
            x1=2,
        ),
        make_case(
            name="quintic-secant",
            method="secant",
            expression="x^5 - x - 1",
            fn=quintic_fn,
            root=quintic_root,
            x0=1,
            x1=2,
        ),
        make_case(
            name="quartic-root-three-secant",
            method="secant",
            expression="x^4 - 10*x^2 + 9",
            fn=quartic_root_three_fn,
            root=quartic_root_three,
            x0=2,
            x1=4,
        ),
        make_case(
            name="scaled-linear-secant",
            method="secant",
            expression="1e6*x - 1",
            fn=scaled_linear_fn,
            root=scaled_linear_root,
            x0=0,
            x1=0.000002,
            tolerance=1e-14,
        ),
        make_case(
            name="cosine-fixed-point",
            method="fixed-point",
            expression="cos(x)",
            residual_expression="x - cos(x)",
            fn=cosine_fn,
            root=cosine_root,
            x0=1,
        ),
        make_case(
            name="golden-ratio-fixed-point",
            method="fixed-point",
            expression="sqrt(x + 1)",
            residual_expression="x^2 - x - 1",
            fn=golden_ratio_fn,
            root=golden_ratio_root,
            x0=1,
        ),
        make_case(
            name="heron-sqrt-two-fixed-point",
            method="fixed-point",
            expression="0.5 * (x + 2 / x)",
            residual_expression="x^2 - 2",
            fn=heron_sqrt_two_residual_fn,
            root=heron_sqrt_two_root,
            x0=1,
        ),
        make_case(
            name="reciprocal-golden-ratio-fixed-point",
            method="fixed-point",
            expression="1 + 1 / x",
            residual_expression="x^2 - x - 1",
            fn=golden_ratio_fn,
            root=golden_ratio_root,
            x0=1.5,
        ),
        make_case(
            name="plastic-constant-newton",
            method="newton-raphson",
            expression="x^3 - x - 1",
            derivative_expression="3*x^2 - 1",
            fn=plastic_fn,
            root=plastic_root,
            x0=1.5,
        ),
        make_case(
            name="quadratic-newton",
            method="newton-raphson",
            expression="x^2 - 4",
            derivative_expression="2*x",
            fn=quadratic_fn,
            root=quadratic_root,
            x0=3,
        ),
        make_case(
            name="cosine-minus-x-newton",
            method="newton-raphson",
            expression="cos(x) - x",
            derivative_expression="-sin(x) - 1",
            fn=cosine_fn,
            root=cosine_root,
            x0=0.5,
        ),
        make_case(
            name="exp-minus-x-newton",
            method="newton-raphson",
            expression="exp(-x) - x",
            derivative_expression="-exp(-x) - 1",
            fn=exp_minus_x_fn,
            root=exp_minus_x_root,
            x0=0.5,
        ),
        make_case(
            name="sin-minus-half-x-newton",
            method="newton-raphson",
            expression="sin(x) - x / 2",
            derivative_expression="cos(x) - 1 / 2",
            fn=trig_half_fn,
            root=trig_half_root,
            x0=2,
        ),
        make_case(
            name="log-minus-one-newton",
            method="newton-raphson",
            expression="ln(x) - 1",
            derivative_expression="1 / x",
            fn=log_minus_one_fn,
            root=log_minus_one_root,
            x0=3,
        ),
        make_case(
            name="large-scale-newton",
            method="newton-raphson",
            expression="x^2 - 1000000",
            derivative_expression="2*x",
            fn=large_scale_fn,
            root=large_scale_root,
            x0=1200,
            tolerance=1e-7,
        ),
        make_case(
            name="small-scale-newton",
            method="newton-raphson",
            expression="x - 0.000001",
            derivative_expression="1",
            fn=small_scale_fn,
            root=small_scale_root,
            x0=0,
            tolerance=1e-14,
        ),
        make_case(
            name="exp-minus-three-newton",
            method="newton-raphson",
            expression="exp(x) - 3",
            derivative_expression="exp(x)",
            fn=exp_minus_three_fn,
            root=exp_minus_three_root,
            x0=1,
        ),
        make_case(
            name="log-minus-two-newton",
            method="newton-raphson",
            expression="ln(x) - 2",
            derivative_expression="1 / x",
            fn=log_minus_two_fn,
            root=log_minus_two_root,
            x0=7,
        ),
        make_case(
            name="quintic-newton",
            method="newton-raphson",
            expression="x^5 - x - 1",
            derivative_expression="5*x^4 - 1",
            fn=quintic_fn,
            root=quintic_root,
            x0=1.2,
        ),
        make_case(
            name="tan-minus-x-newton",
            method="newton-raphson",
            expression="tan(x) - x",
            derivative_expression="tan(x)^2",
            fn=tan_minus_x_fn,
            root=tan_minus_x_root,
            x0=4.5,
            tolerance=1e-9,
        ),
        make_case(
            name="exp-minus-three-newton-numeric",
            method="newton-raphson",
            expression="exp(x) - 3",
            derivative_mode="numeric",
            fn=exp_minus_three_fn,
            root=exp_minus_three_root,
            x0=1,
        ),
        make_case(
            name="log-minus-two-newton-numeric",
            method="newton-raphson",
            expression="ln(x) - 2",
            derivative_mode="numeric",
            fn=log_minus_two_fn,
            root=log_minus_two_root,
            x0=7,
        ),
        make_case(
            name="quintic-newton-numeric",
            method="newton-raphson",
            expression="x^5 - x - 1",
            derivative_mode="numeric",
            fn=quintic_fn,
            root=quintic_root,
            x0=1.2,
        ),
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(cases)} golden root-method cases to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
