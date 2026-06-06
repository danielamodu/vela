---
target: src/components/Footer.tsx
total_score: 35
p0_count: 0
p1_count: 1
timestamp: 2026-06-06T10-41-18Z
slug: src-components-footer-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 5 | N/A for a static footer. |
| 2 | Match System / Real World | 5 | Standard copyright and social links. |
| 3 | User Control and Freedom | 5 | Social links open in new tabs (`target="_blank"`). |
| 4 | Consistency and Standards | 2 | Uses hardcoded hex colors instead of the design system variables. |
| 5 | Error Prevention | 5 | `rel="noopener noreferrer"` is properly used for external links. |
| 6 | Recognition Rather Than Recall | 5 | Social icons are universally recognizable. |
| 7 | Flexibility and Efficiency | 5 | Responsive layout handles different screen sizes well. |
| 8 | Aesthetic and Minimalist Design | 3 | Hardcoded colors break the brutalist aesthetic and potential theme support. |
| 9 | Error Recovery | 5 | N/A. |
| 10 | Help and Documentation | 5 | N/A. |
| **Total** | | **35/40** | **Functionally perfect, stylistically disconnected.** |

#### Anti-Patterns Verdict

**LLM assessment**: The `Footer` component is a simple, effective piece of UI that handles external link safety perfectly (`noopener noreferrer`). However, it contains a significant styling anti-pattern: it completely bypasses the brutalist CSS variable system established in `globals.css`. By hardcoding `#ffffff`, `#e5e7eb`, and `#979797`, this component breaks theme consistency and becomes a technical debt time-bomb if the color palette ever needs to change.

#### Overall Impression
A clean and functional footer that just needs to be integrated into the actual design system.

#### Priority Issues
- **[P1] Hardcoded Color Values**: The styles object uses hardcoded hex codes (`#ffffff`, `#e5e7eb`, `#979797`).
  - **Why it matters**: This breaks design consistency. If you ever update the brutalist theme (e.g., adding a dark mode), the footer will remain stark white and look broken because it isn't using the dynamic CSS variables.
  - **Fix**: Replace `#ffffff` with `var(--color-pure-white)`, `#e5e7eb` with `var(--color-surface-mist)` (or `var(--color-steel-gray)` for borders), and `#979797` with `var(--color-graphite)`.
