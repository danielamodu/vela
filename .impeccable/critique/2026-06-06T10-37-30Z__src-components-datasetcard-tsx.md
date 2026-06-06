---
target: src/components/DatasetCard.tsx
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-06-06T10-37-30Z
slug: src-components-datasetcard-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | "Signing..." and "Confirming..." transaction states are crystal clear. |
| 2 | Match System / Real World | 4 | "Free" instead of "0 SUI", truncated addresses. |
| 3 | User Control and Freedom | 4 | Ability for owners to edit and cancel price updates. |
| 4 | Consistency and Standards | 1 | Uses invalid HTML structure (nested interactive elements). |
| 5 | Error Prevention | 2 | Fails to validate numerical inputs before triggering blockchain transactions. |
| 6 | Recognition Rather Than Recall | 4 | Clear category and quality score tags. |
| 7 | Flexibility and Efficiency | 4 | Inline price editing is highly efficient. |
| 8 | Aesthetic and Minimalist Design | 3 | Minor CSS variable hallucination (`--radius-md`). |
| 9 | Error Recovery | 2 | Uses blocking native `alert()` on transaction failures instead of an inline error message. |
| 10 | Help and Documentation | 4 | Hovering over the price explains the SUI to MIST conversion. |
| **Total** | | **32/40** | **Good UX, but dangerous underlying mechanics** |

#### Anti-Patterns Verdict

**LLM assessment**: The `DatasetCard` looks nice and functions well on the surface, but it suffers from a major structural anti-pattern and a significant error-prevention flaw. Nesting inputs and buttons inside an anchor tag is fundamentally broken HTML that damages accessibility. Furthermore, passing raw user input directly to math functions without `NaN` validation before triggering a blockchain wallet signature is a recipe for silent failures.

#### Overall Impression
A highly ambitious and feature-rich card component that needs structural refactoring to be safe and accessible.

#### Priority Issues
- **[P1] Invalid HTML Structure**: The entire `DatasetCard` is wrapped in a Next.js `<Link>` component (which renders as an `<a>` tag). Inside of it, there are interactive `<input>` fields and `<button>` elements for editing the price.
  - **Why it matters**: Nesting interactive elements inside an anchor tag is invalid HTML. It breaks screen readers, causes unpredictable click behavior across different browsers, and is a strict W3C violation. 
  - **Fix**: Replace the wrapper `<Link>` with a standard `<div>`. Handle the card click via an `onClick` event that calls `router.push()`, but strictly ignore the click if it originated from the edit controls (using `e.stopPropagation()`).
- **[P1] Unsafe Number Parsing**: `parseFloat(newPrice)` is used without checking if the result is `NaN` before calling the API.
  - **Why it matters**: If a user clears the input field or enters invalid text, it will pass `NaN` to the backend, likely causing a confusing error or a failed signature request.
  - **Fix**: Validate that `newPrice` is a valid number greater than or equal to 0 before attempting the transaction.
- **[P2] Blocking Alerts**: The component uses `alert("Failed to update price.")`.
  - **Fix**: Catch errors silently or use a non-blocking toast/inline error message.
- **[P2] Hallucinated CSS Variable**: The quality score tag uses `borderRadius: "var(--radius-md)"`, which does not exist.
  - **Fix**: Change it to `var(--radius-buttons)` or `var(--radius-tags)`.
