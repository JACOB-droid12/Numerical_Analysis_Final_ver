# Display Fidelity Pass

## Summary
- Improve the calculator's math display where students read it most: live previews and primary answer surfaces.
- Keep parsing, arithmetic, imports, and results unchanged.
- Use semantic HTML + CSS for cleaner fractions, grouped exponents, roots, and parentheses.

## Scope
- Module I expression preview and source/reference answer
- Module II input previews
- Module III polynomial preview and source/reference answer
- No trace/detail-table rendering changes in this pass

## Acceptance
- Decimal/scientific remains primary for exact/reference answers
- Exact fraction remains visible as secondary exact form
- Fractions, grouped powers, roots, and delimiters read more clearly on desktop and narrow widths
- Existing regression values remain unchanged
